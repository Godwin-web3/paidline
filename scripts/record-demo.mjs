#!/usr/bin/env node
/**
 * Timed browser walkthrough of the live Paidline app.
 *
 * Scenes are locked to absolute voiceover timestamps (VO t=0 after the title
 * card), not proportional weights. Slow RPC pages are covered with the previous
 * frame until real copy is on screen — never hold a skeleton as the shot.
 *
 *   DEMO_BASE=https://paidline.vercel.app node scripts/record-demo.mjs
 */
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.DEMO_BASE ?? "https://paidline.vercel.app";
const GATE_BASE = process.env.DEMO_GATE_BASE ?? "https://paidline.vercel.app";
const AUDIO = process.env.DEMO_AUDIO ?? join(ROOT, "public/demo.mp3");
const OUT_DIR = process.env.DEMO_OUT_DIR ?? "/tmp/paidline-demo-rec";
const OUT_MP4 = process.env.DEMO_MP4 ?? join(ROOT, "public/demo.mp4");

/** Silent title card, then VO begins. Times below are relative to VO start. */
const TITLE_MS = 3000;

/**
 * Absolute VO windows (ms). `until` is when the next topic must be on screen.
 *
 * Visuals lead the VO on purpose: hero is only a few seconds, then we scroll
 * the landing and cut to #how well before the “four steps” line (~47–66s).
 * Video timeline = TITLE_MS + VO, so #how lands ~27s into the file.
 */
const BEATS = {
  landingProblem: 8_000,
  landingProduct: 16_000,
  landingBoard: 24_000,
  how: 68_000,
  checker: 80_000,
  marketplace: 100_000,
  create: 124_000,
  unpaid: 142_000,
  paid: 168_000,
  receipt: 180_000,
  gate200: 192_000,
  gate402: 201_000,
  docs: 211_000,
};

let voZero = 0;
/** Recording tab — always the host for mouse / cursor, even when acting in an iframe. */
let filmPage = null;

function paintTitleOverlay() {
  const el = document.createElement("div");
  el.id = "pl-title";
  el.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;background:#14110e;color:#f4efe8;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Georgia,serif";
  el.innerHTML =
    '<p style="font-size:64px;margin:0">Paidline</p>' +
    '<p style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:22px;color:#c9bfb3;margin:18px 0 0">Public marketplace. On-chain paid.</p>' +
    '<p style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;color:#8a8178;margin:72px 0 0">BUIDL CTC 2026 · Creditcoin · Attestcoin</p>';
  document.documentElement.appendChild(el);
}

function audioDurationMs(path) {
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path],
    { encoding: "utf8" },
  );
  const sec = Number.parseFloat(probe.stdout.trim());
  if (!Number.isFinite(sec) || sec < 30) {
    throw new Error(`Could not read narration duration from ${path}`);
  }
  return Math.round(sec * 1000);
}

function voNow() {
  return Date.now() - voZero;
}

function remaining(untilVoMs) {
  return untilVoMs - voNow();
}

function sleep(page, ms) {
  return page.waitForTimeout(ms);
}

async function holdUntil(page, untilVoMs) {
  const remain = remaining(untilVoMs);
  if (remain > 40) await sleep(page, remain);
}

async function caption(page, text) {
  await page.evaluate((t) => {
    let el = document.getElementById("paidline-demo-cap");
    if (!el) {
      el = document.createElement("div");
      el.id = "paidline-demo-cap";
      el.style.cssText = [
        "position:fixed",
        "z-index:2147483647",
        "right:24px",
        "bottom:22px",
        "left:auto",
        "max-width:min(72vw, 640px)",
        "padding:8px 14px",
        "border-radius:999px",
        "background:rgba(20,17,14,.9)",
        "border:1px solid rgba(244,239,232,.14)",
        "color:#f4efe8",
        "font:500 13px/1.25 ui-sans-serif,system-ui,sans-serif",
        "letter-spacing:.02em",
        "pointer-events:none",
        "box-shadow:0 8px 24px rgba(0,0,0,.35)",
      ].join(";");
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
}

async function injectCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById("pl-cursor")) return;
    const c = document.createElement("div");
    c.id = "pl-cursor";
    c.style.cssText = [
      "position:fixed",
      "z-index:2147483646",
      "left:640px",
      "top:360px",
      "width:22px",
      "height:22px",
      "margin:-2px 0 0 -2px",
      "border-radius:50%",
      "border:2px solid #f4efe8",
      "background:rgba(244,239,232,.28)",
      "box-shadow:0 0 0 1px rgba(20,17,14,.55), 0 8px 18px rgba(0,0,0,.35)",
      "pointer-events:none",
      "transition:left .08s linear, top .08s linear",
    ].join(";");
    document.documentElement.appendChild(c);
    document.addEventListener(
      "mousemove",
      (e) => {
        c.style.left = `${e.clientX}px`;
        c.style.top = `${e.clientY}px`;
      },
      true,
    );
  });
}

async function jumpY(page, y) {
  await page.evaluate((top) => {
    window.scrollTo({ top, behavior: "instant" });
  }, y);
}

async function smoothScroll(page, y, ms) {
  const budget = Math.max(80, Math.min(ms, 3200));
  await page.evaluate(
    async ({ y, ms }) => {
      const start = window.scrollY;
      const dist = y - start;
      if (Math.abs(dist) < 4 || ms < 40) {
        window.scrollTo(0, y);
        return;
      }
      const t0 = performance.now();
      await new Promise((resolve) => {
        function frame(now) {
          const p = Math.min(1, (now - t0) / ms);
          const e = 1 - (1 - p) ** 3;
          window.scrollTo(0, start + dist * e);
          if (p < 1) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
    },
    { y, ms: budget },
  );
}

async function waitText(page, needle, timeout = 25000) {
  await page.waitForFunction(
    (n) => document.body.innerText.toLowerCase().includes(n.toLowerCase()),
    needle,
    { timeout },
  );
}

let swapSeq = 0;

async function startFrame(page, url) {
  swapSeq += 1;
  const id = `pl-swap-${swapSeq}`;
  await page.evaluate(
    ({ href, id }) => {
      const f = document.createElement("iframe");
      f.id = id;
      f.src = href;
      f.style.cssText =
        "position:fixed;inset:0;width:100%;height:100%;border:0;opacity:0;pointer-events:none;z-index:1";
      document.documentElement.appendChild(f);
    },
    { href: url, id },
  );
  return id;
}

async function revealFrame(page, id, needle, captionText) {
  const frame = page.frameLocator(`#${id}`);
  await frame.getByText(needle, { exact: false }).first().waitFor({ state: "visible", timeout: 35000 });
  await page.evaluate((keep) => {
    const f = document.getElementById(keep);
    if (f) {
      f.style.opacity = "1";
      f.style.pointerEvents = "auto";
      f.style.zIndex = "2147483645";
    }
    document.querySelectorAll("iframe[id^='pl-swap-']").forEach((old) => {
      if (old.id !== keep && old.dataset.shown === "1") old.remove();
    });
    if (f) f.dataset.shown = "1";
  }, id);
  if (captionText) await caption(page, captionText);
  return frame;
}

async function swapFrame(page, url, needle, captionText) {
  const id = await startFrame(page, url);
  return revealFrame(page, id, needle, captionText);
}

async function hoverText(page, text) {
  const loc = page.getByText(text, { exact: false }).first();
  if ((await loc.count()) === 0) return;
  const box = await loc.boundingBox().catch(() => null);
  if (box) {
    await move(page, box.x + box.width * 0.45, box.y + box.height * 0.55, 12);
  }
  await loc.hover({ timeout: 2500 }).catch(() => {});
}

async function move(_target, x, y, steps = 16) {
  const host = filmPage ?? _target;
  if (!host?.mouse) return;
  await host.mouse.move(x, y, { steps });
}

async function breathe(page, ms, untilVoMs) {
  const cap = untilVoMs !== undefined ? Math.min(ms, Math.max(0, remaining(untilVoMs) - 80)) : ms;
  if (cap < 120) return;
  const t0 = Date.now();
  let toggle = 0;
  while (Date.now() - t0 < cap - 60) {
    const left = cap - (Date.now() - t0);
    const x = 360 + (toggle % 3) * 160;
    const y = 240 + (toggle % 2) * 90;
    await page.mouse.move(x, y, { steps: 10 });
    toggle += 1;
    await sleep(page, Math.min(700, left));
  }
}

async function typeInto(page, placeholder, text, delay, untilVoMs) {
  const field = page.getByPlaceholder(placeholder).first();
  await field.click();
  const remain = remaining(untilVoMs);
  if (remain < 700) {
    await field.fill(text);
    return;
  }
  const per = Math.max(8, Math.min(delay, Math.floor((remain - 500) / Math.max(text.length, 1))));
  await field.fill("");
  await field.pressSequentially(text, { delay: per });
}

async function warmup(context) {
  const p = await context.newPage();
  p.setDefaultTimeout(20000);
  const targets = [
    [BASE + "/", "list work"],
    [BASE + "/pay", "usdc"],
    [BASE + "/pay/1", "locked"],
    [BASE + "/new", "create a listing"],
    [BASE + "/docs", "ispai"],
    [BASE + "/receipt/9", "10.000247"],
    [GATE_BASE + "/gate/9", "access granted"],
    [GATE_BASE + "/gate/1", "402"],
    [BASE + "/pay/9", "get the work"],
    [BASE + "/", "already paid"],
  ];
  for (const [url, needle] of targets) {
    try {
      await p.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      await p.waitForFunction((n) => document.body.innerText.toLowerCase().includes(n), needle, {
        timeout: 20000,
      });
    } catch {
      /* still film; covers hide a cold first paint */
    }
  }
  return p;
}

async function rewarm(warmPage, url, needle) {
  try {
    await warmPage.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    if (needle) {
      await warmPage.waitForFunction((n) => document.body.innerText.toLowerCase().includes(n), needle, {
        timeout: 20000,
      });
    }
  } catch {
    /* recording page waits again under a cover */
  }
}

function mux(webmPath, audioPath, destPath, delaySec) {
  const staged = destPath + ".partial.mp4";
  const args = [
    "-y",
    "-i",
    webmPath,
    "-itsoffset",
    String(delaySec),
    "-i",
    audioPath,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "libx264",
    "-profile:v",
    "main",
    "-level",
    "4.0",
    "-pix_fmt",
    "yuv420p",
    "-bf",
    "0",
    "-g",
    "30",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-c:a",
    "aac",
    "-profile:a",
    "aac_low",
    "-ar",
    "44100",
    "-ac",
    "2",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    "-shortest",
    staged,
  ];
  const run = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (run.status !== 0) {
    throw new Error(`ffmpeg mux failed:\n${run.stderr}`);
  }
  copyFileSync(staged, destPath);
  spawnSync("rm", ["-f", staged]);
}

async function main() {
  if (!existsSync(AUDIO)) {
    throw new Error(`Narration missing: ${AUDIO}`);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const voiceMs = audioDurationMs(AUDIO);
  console.log("voiceover_ms", voiceMs);
  console.log("title_ms", TITLE_MS);
  console.log("beats", BEATS);
  console.log("base", BASE);

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--disable-dev-shm-usage"],
  });

  const darkInit = () => {
    try {
      localStorage.setItem("paidline-theme", "dark");
    } catch {
      /* ignore */
    }
    document.documentElement.classList.add("dark");
    document.documentElement.dataset.theme = "dark";
  };

  const warmContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    locale: "en-US",
  });
  await warmContext.addInitScript(darkInit);
  const warmPage = await warmup(warmContext);

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
    locale: "en-US",
  });
  await context.addInitScript(darkInit);

  const page = await context.newPage();
  filmPage = page;
  page.setDefaultTimeout(25000);
  page.setDefaultNavigationTimeout(30000);

  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitText(page, "List work", 15000);
  await page.evaluate(paintTitleOverlay);
  await sleep(page, TITLE_MS);
  await page.evaluate(() => document.getElementById("pl-title")?.remove());
  await injectCursor(page);
  const actualTitleMs = TITLE_MS;
  voZero = Date.now();
  console.log("vo_zero", { actualTitleMs });

  // VO 0–8s / video ~3–11s — hero only, pointer + CTAs (never a freeze)
  await caption(page, "The problem");
  console.log("beat landing-problem", voNow());
  await waitText(page, "Already paid", 2500).catch(() => {});
  await move(page, 260, 190, 16);
  await hoverText(page, "Browse marketplace");
  await sleep(page, 280);
  await hoverText(page, "Create a listing");
  await move(page, 420, 300, 14);
  await hoverText(page, "Already paid");
  await breathe(page, 900, BEATS.landingProblem);
  await holdUntil(page, BEATS.landingProblem);

  // VO 8–16s / video ~11–19s — still landing, scroll + value props (clear jump ~15s)
  await caption(page, "What Paidline is");
  console.log("beat landing-product", voNow());
  await hoverText(page, "Anyone can buy it");
  await smoothScroll(page, 260, 1200);
  await move(page, 520, 400, 12);
  await page.evaluate(() => document.getElementById("how")?.scrollIntoView({ behavior: "instant", block: "start" }));
  await hoverText(page, "How it works");
  await move(page, 300, 280, 10);
  await hoverText(page, "Four steps. Then");
  await breathe(page, 800, BEATS.landingProduct);
  await holdUntil(page, BEATS.landingProduct);

  // VO 16–24s — board highlight, then leave the landing
  await caption(page, "Live board");
  console.log("beat landing-board", voNow());
  await jumpY(page, 80);
  await hoverText(page, "Live listings");
  await sleep(page, 280);
  await hoverText(page, "Already paid");
  const openCard = page.locator("a[href^='/pay/']").nth(1);
  if ((await openCard.count()) > 0) {
    const box = await openCard.boundingBox().catch(() => null);
    if (box) await move(page, box.x + 80, box.y + 36, 14);
    await openCard.hover().catch(() => {});
  } else {
    await move(page, 1020, 340, 14);
  }
  await breathe(page, 700, BEATS.landingBoard);
  await holdUntil(page, BEATS.landingBoard);

  // VO ~24s / video ~27s — #how. Stay here through the four-steps paragraph.
  await caption(page, "Four steps");
  console.log("beat how", voNow());
  await page.evaluate(() => document.getElementById("how")?.scrollIntoView({ behavior: "instant", block: "start" }));
  await waitText(page, "Four steps");
  const stepNames = ["List", "Pay", "Prove", "Confirm"];
  for (const name of stepNames) {
    if (remaining(BEATS.how) < 1200) break;
    const step = page.locator("#how").getByRole("heading", { name, exact: true }).first();
    if ((await step.count()) > 0) {
      const box = await step.boundingBox().catch(() => null);
      if (box) await move(page, box.x + 40, box.y + 16, 12);
      await step.hover().catch(() => {});
    }
    await sleep(page, Math.min(2800, Math.max(500, remaining(BEATS.how) / 6)));
  }
  await hoverText(page, "isPaid");
  await breathe(page, 1600, BEATS.how);
  await holdUntil(page, BEATS.how);

  // checker — start marketplace fetch under this frame
  await caption(page, "A checker. Not a custodian.");
  console.log("beat checker", voNow());
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("h2")].find((n) => /not a custodian/i.test(n.textContent || ""));
    el?.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await hoverText(page, "Not a bridge");
  await sleep(page, 500);
  await hoverText(page, "Not escrow");
  void rewarm(warmPage, BASE + "/pay", "usdc");
  const marketId = await startFrame(page, BASE + "/pay");
  await holdUntil(page, BEATS.checker);

  // Marketplace onward loads in an offscreen iframe and swaps in when ready
  console.log("beat marketplace", voNow());
  let view = await revealFrame(page, marketId, "open", "Marketplace");
  await hoverText(view, "InvoicePaid listener");
  await sleep(page, 700);
  await hoverText(view, "September retainer");
  await breathe(page, 2800, BEATS.marketplace);
  await holdUntil(page, BEATS.marketplace);

  console.log("beat create", voNow());
  view = await swapFrame(page, BASE + "/new", "Create a listing", "Create a listing");
  await typeInto(view, "September retainer", "September research brief", 18, BEATS.create);
  await typeInto(view, "250.00", "250", 36, BEATS.create);
  await typeInto(view, "Delivery of the work", "Sealed brief, unlocked on payment", 14, BEATS.create);
  if (remaining(BEATS.create) > 2500) {
    const workField = view.getByPlaceholder("Paste the deliverable or a link to it.");
    await workField.click();
    await workField.pressSequentially("Delivery notes. Buyers only see this after isPaid is true.", {
      delay: remaining(BEATS.create) > 8000 ? 12 : 6,
    });
  }
  if (remaining(BEATS.create) > 1500) {
    await typeInto(view, "0.01", "0.01", 32, BEATS.create);
    await view.getByRole("button", { name: "7 days" }).click().catch(() => {});
  }
  if (remaining(BEATS.create) > 800) await hoverText(view, "Buyer preview");
  void rewarm(warmPage, BASE + "/pay/1", "locked");
  const unpaidId = await startFrame(page, BASE + "/pay/1");
  await holdUntil(page, BEATS.create);

  console.log("beat unpaid", voNow());
  void rewarm(warmPage, BASE + "/pay/9", "get the work");
  view = await revealFrame(page, unpaidId, "Locked. It unlocks here", "Unpaid checkout · listing 1");
  await hoverText(view, "Amount");
  await sleep(page, 500);
  await hoverText(view, "Send to");
  await hoverText(view, "You receive");
  const paidId = await startFrame(page, BASE + "/pay/9");
  await holdUntil(page, BEATS.unpaid);

  console.log("beat paid-preload", voNow());
  view = await revealFrame(page, paidId, "Get the work", "Paid · listing 9");
  console.log("beat paid-ready", voNow());
  await holdUntil(page, 154_000);
  await hoverText(view, "Amount");
  await sleep(page, Math.min(1800, Math.max(400, remaining(BEATS.paid) / 3)));
  const work = view.getByText("Get the work").first();
  await work.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
  await work.hover().catch(() => {});
  void rewarm(warmPage, BASE + "/receipt/9", "10.000247");
  const receiptId = await startFrame(page, BASE + "/receipt/9");
  const gate9Id = await startFrame(page, GATE_BASE + "/gate/9");
  await holdUntil(page, BEATS.paid);

  console.log("beat receipt", voNow());
  view = await revealFrame(page, receiptId, "10.000247", "Receipt · on-chain paid");
  await hoverText(view, "Ethereum transfer");
  await hoverText(view, "Creditcoin stamp");
  void rewarm(warmPage, GATE_BASE + "/gate/1", "402");
  const gate1Id = await startFrame(page, GATE_BASE + "/gate/1");
  await holdUntil(page, BEATS.receipt);

  console.log("beat gate200", voNow());
  view = await revealFrame(page, gate9Id, "Access granted", "GET /api/gate/9  →  200");
  const docsId = await startFrame(page, BASE + "/docs");
  await holdUntil(page, BEATS.gate200);

  console.log("beat gate402", voNow());
  view = await revealFrame(page, gate1Id, "402 Payment Required", "GET /api/gate/1  →  402");
  await holdUntil(page, BEATS.gate402);

  console.log("beat docs", voNow());
  view = await revealFrame(page, docsId, "isPaid", "Other contracts call isPaid");
  await view.locator("#ispai").evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "start" })).catch(() => {});
  await caption(page, "Remote proof. Local unlock.");
  await hoverText(view, "isPaid");
  await holdUntil(page, Math.max(BEATS.docs, voiceMs + 400));

  const video = page.video();
  await page.close();
  const videoPath = video ? await video.path() : "";
  await context.close();
  await warmContext.close();
  await browser.close();
  if (!videoPath) throw new Error("Playwright did not write a video");
  console.log("video", videoPath);

  mux(videoPath, AUDIO, OUT_MP4, actualTitleMs / 1000);
  const destMs = audioDurationMs(OUT_MP4);
  console.log("mp4", OUT_MP4, destMs);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
