#!/usr/bin/env node
/**
 * Timed browser walkthrough of the live Paidline app.
 *
 * Scenes are locked to absolute voiceover timestamps (VO t=0 after the title
 * card), not proportional weights. Mux title + public/demo.mp3 at the end.
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
 * First 50s of video ≈ title + problem/product/board; how-it-works is up by ~0:53.
 */
const BEATS = {
  landingProblem: 24_000,
  landingProduct: 44_000,
  landingBoard: 50_000,
  how: 80_000,
  checker: 95_000,
  marketplace: 115_000,
  create: 140_000,
  unpaid: 160_000,
  paid: 185_000,
  receipt: 196_000,
  gate200: 202_000,
  gate402: 206_000,
  docs: 210_000,
};

let voZero = 0;

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

async function smoothScroll(page, y, ms) {
  const budget = Math.max(80, Math.min(ms, 1800));
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

async function scrollSelector(page, selector, block = "center") {
  const loc = page.locator(selector).first();
  if ((await loc.count()) === 0) return;
  await loc.evaluate((el, blk) => {
    el.scrollIntoView({ behavior: "smooth", block: blk });
  }, block);
}

async function waitText(page, needle, timeout = 25000) {
  await page.waitForFunction(
    (n) => document.body.innerText.toLowerCase().includes(n.toLowerCase()),
    needle,
    { timeout },
  );
}

async function gotoReady(page, url, needle, captionText) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (needle) await waitText(page, needle);
  if (captionText) await caption(page, captionText);
}

async function hoverText(page, text) {
  const loc = page.getByText(text, { exact: false }).first();
  if ((await loc.count()) === 0) return;
  await loc.hover({ timeout: 2500 }).catch(() => {});
}

async function move(page, x, y, steps = 16) {
  await page.mouse.move(x, y, { steps });
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
    BASE + "/",
    BASE + "/pay",
    BASE + "/pay/1",
    BASE + "/new",
    BASE + "/docs",
    BASE + "/receipt/9",
    GATE_BASE + "/gate/9",
    GATE_BASE + "/gate/1",
    BASE + "/pay/9",
  ];
  for (const url of targets) {
    try {
      await p.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      if (url.endsWith("/pay/9")) {
        await p.waitForFunction(
          () => document.body.innerText.toLowerCase().includes("get the work"),
          null,
          { timeout: 20000 },
        );
      } else {
        await p.waitForTimeout(500);
      }
    } catch {
      /* still film against a cold page if warmup misses */
    }
  }
  return p;
}

async function rewarmPaid(warmPage) {
  try {
    await warmPage.goto(BASE + "/pay/9", { waitUntil: "domcontentloaded", timeout: 20000 });
    await warmPage.waitForFunction(
      () => document.body.innerText.toLowerCase().includes("get the work"),
      null,
      { timeout: 20000 },
    );
  } catch {
    /* recording page will wait again */
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
  page.setDefaultTimeout(25000);
  page.setDefaultNavigationTimeout(30000);

  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;background:#14110e;color:#f4efe8;font-family:Georgia,serif;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center">
    <p style="font-size:64px;margin:0">Paidline</p>
    <p style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:22px;color:#c9bfb3;margin:18px 0 0">Public marketplace. On-chain paid.</p>
    <p style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;color:#8a8178;margin:72px 0 0">BUIDL CTC 2026 · Creditcoin · Attestcoin</p>
  </body></html>`);
  await sleep(page, TITLE_MS);
  voZero = Date.now();
  console.log("vo_zero");

  // 0:00–0:24 landing — problem framing
  await gotoReady(page, BASE + "/", "judge walkthrough", "The problem");
  await waitText(page, "Live listings");
  console.log("beat landing-problem", voNow());
  await move(page, 300, 220, 18);
  await sleep(page, Math.min(1800, Math.max(200, remaining(BEATS.landingProblem) / 4)));
  await hoverText(page, "Browse marketplace");
  await breathe(page, 4000, BEATS.landingProblem);
  await holdUntil(page, BEATS.landingProblem);

  // 0:24–0:44 still landing — what Paidline is
  await caption(page, "What Paidline is");
  console.log("beat landing-product", voNow());
  await hoverText(page, "Already paid");
  await sleep(page, 900);
  await move(page, 980, 280, 20);
  await hoverText(page, "Live listings");
  await breathe(page, 5000, BEATS.landingProduct);
  await holdUntil(page, BEATS.landingProduct);

  // 0:44–0:50 hover paid listing 9 + open cards (then cut to #how)
  await caption(page, "Live board");
  console.log("beat landing-board", voNow());
  await hoverText(page, "Already paid");
  await sleep(page, 900);
  const openCard = page.locator("a[href^='/pay/']").nth(1);
  if ((await openCard.count()) > 0) {
    await openCard.hover().catch(() => {});
  } else {
    await move(page, 1000, 360, 14);
  }
  await sleep(page, 700);
  await hoverText(page, "live listing");
  await holdUntil(page, BEATS.landingBoard);

  // 0:50–1:20 #how four steps
  await caption(page, "Four steps");
  console.log("beat how", voNow());
  await page.evaluate(() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  await sleep(page, 900);
  await waitText(page, "Four steps");
  const stepNames = ["List", "Pay", "Prove", "Confirm"];
  for (const name of stepNames) {
    if (remaining(BEATS.how) < 1200) break;
    const step = page.locator("#how").getByRole("heading", { name, exact: true }).first();
    if ((await step.count()) > 0) await step.hover().catch(() => {});
    await sleep(page, Math.min(2200, Math.max(400, remaining(BEATS.how) / 5)));
  }
  await holdUntil(page, BEATS.how);

  // 1:20–1:35 checker, not custodian
  await caption(page, "A checker. Not a custodian.");
  console.log("beat checker", voNow());
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("h2")].find((n) => /not a custodian/i.test(n.textContent || ""));
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  await sleep(page, 800);
  await hoverText(page, "Not a bridge");
  await sleep(page, 700);
  await hoverText(page, "Not escrow");
  await holdUntil(page, BEATS.checker);

  // 1:35–1:55 marketplace
  console.log("beat marketplace", voNow());
  await gotoReady(page, BASE + "/pay", "Marketplace", "Marketplace");
  await waitText(page, "USDC");
  await sleep(page, 600);
  await hoverText(page, "InvoicePaid listener");
  await sleep(page, 800);
  await smoothScroll(page, 280, 800);
  await hoverText(page, "September retainer");
  if (remaining(BEATS.marketplace) > 2500) {
    await sleep(page, 700);
    await smoothScroll(page, 520, 900);
  }
  await breathe(page, 3000, BEATS.marketplace);
  await holdUntil(page, BEATS.marketplace);

  // 1:55–2:20 create listing
  console.log("beat create", voNow());
  await gotoReady(page, BASE + "/new", "Create a listing", "Create a listing");
  await typeInto(page, "September retainer", "September research brief", 18, BEATS.create);
  await typeInto(page, "250.00", "250", 36, BEATS.create);
  await typeInto(page, "Delivery of the work", "Sealed brief, unlocked on payment", 14, BEATS.create);
  if (remaining(BEATS.create) > 2500) {
    const workField = page.getByPlaceholder("Paste the deliverable or a link to it.");
    await workField.click();
    await workField.pressSequentially("Delivery notes. Buyers only see this after isPaid is true.", {
      delay: remaining(BEATS.create) > 8000 ? 12 : 6,
    });
  }
  if (remaining(BEATS.create) > 1500) {
    await typeInto(page, "0.01", "0.01", 32, BEATS.create);
    await page.getByRole("button", { name: "7 days" }).click().catch(() => {});
  }
  if (remaining(BEATS.create) > 800) {
    await hoverText(page, "Buyer preview");
  }
  await holdUntil(page, BEATS.create);

  // 2:20–2:40 unpaid checkout — rewarm paid listing in the background
  console.log("beat unpaid", voNow());
  void rewarmPaid(warmPage);
  await gotoReady(page, BASE + "/pay/1", "Locked. It unlocks here", "Unpaid checkout · listing 1");
  await waitText(page, "250");
  await sleep(page, 800);
  await hoverText(page, "Amount");
  await sleep(page, 600);
  await hoverText(page, "Send to");
  await smoothScroll(page, 280, 700);
  await hoverText(page, "You receive");
  if (remaining(BEATS.unpaid) > 2000) {
    await scrollSelector(page, "text=Locked. It unlocks here");
  }
  await breathe(page, 3000, BEATS.unpaid);
  await holdUntil(page, BEATS.unpaid);

  // 2:40–3:05 paid listing 9 — wait for real work, not the skeleton
  console.log("beat paid", voNow());
  await page.goto(BASE + "/pay/9", { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitText(page, "Get the work", 30000);
  await caption(page, "Paid · listing 9");
  await waitText(page, "10.000247");
  await sleep(page, 900);
  await hoverText(page, "Amount");
  await sleep(page, Math.min(2800, Math.max(600, remaining(BEATS.paid) / 3)));
  const work = page.getByText("Get the work").first();
  await work.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
  await sleep(page, 500);
  await work.hover().catch(() => {});
  await breathe(page, 2500, BEATS.paid);
  await holdUntil(page, BEATS.paid);

  // 3:05–3:16 receipt
  console.log("beat receipt", voNow());
  await gotoReady(page, BASE + "/receipt/9", "10.000247", "Receipt · on-chain paid");
  await sleep(page, 700);
  await hoverText(page, "Ethereum transfer");
  await sleep(page, 500);
  await smoothScroll(page, 220, 600);
  await hoverText(page, "Creditcoin stamp");
  await holdUntil(page, BEATS.receipt);

  // 3:16–3:22 gate 200
  console.log("beat gate200", voNow());
  await gotoReady(page, GATE_BASE + "/gate/9", "Access granted", "GET /api/gate/9  →  200");
  await sleep(page, 400);
  await smoothScroll(page, 180, 400);
  await holdUntil(page, BEATS.gate200);

  // 3:22–3:26 gate 402
  console.log("beat gate402", voNow());
  await gotoReady(page, GATE_BASE + "/gate/1", "402 Payment Required", "GET /api/gate/1  →  402");
  await holdUntil(page, BEATS.gate402);

  // 3:26–end docs isPaid
  console.log("beat docs", voNow());
  await gotoReady(page, BASE + "/docs", "Docs", "Other contracts call isPaid");
  await page.evaluate(() => document.getElementById("ispai")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  await sleep(page, 700);
  await caption(page, "Remote proof. Local unlock.");
  await hoverText(page, "isPaid");
  await holdUntil(page, Math.max(BEATS.docs, voiceMs + 400));

  const video = page.video();
  await page.close();
  const videoPath = video ? await video.path() : "";
  await context.close();
  await warmContext.close();
  await browser.close();
  if (!videoPath) throw new Error("Playwright did not write a video");
  console.log("video", videoPath);

  mux(videoPath, AUDIO, OUT_MP4, TITLE_MS / 1000);
  const destMs = audioDurationMs(OUT_MP4);
  console.log("mp4", OUT_MP4, destMs);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
