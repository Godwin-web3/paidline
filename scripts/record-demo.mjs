#!/usr/bin/env node
/**
 * Timed browser walkthrough of the live Paidline app.
 *
 * Beats are Whisper-locked to public/demo.mp3 (208.056s). Times are VO-relative
 * after a silent TITLE_MS title card. The landing is a real walk (scroll/hover)
 * and #how / /pay / /new must not appear while VO is still on problem/product/board.
 *
 *   DEMO_BASE=https://paidline.vercel.app node scripts/record-demo.mjs
 */
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, copyFileSync, appendFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.DEMO_BASE ?? "https://paidline.vercel.app";
const GATE_BASE = process.env.DEMO_GATE_BASE ?? "https://paidline.vercel.app";
const AUDIO = process.env.DEMO_AUDIO ?? join(ROOT, "public/demo.mp3");
const OUT_DIR = process.env.DEMO_OUT_DIR ?? "/tmp/paidline-demo-rec";
const OUT_MP4 = process.env.DEMO_MP4 ?? join(ROOT, "public/demo.mp4");
const SCENE_LOG = join(OUT_DIR, "scene.jsonl");

/** Silent title card, then VO begins. Times below are relative to VO start. */
const TITLE_MS = 3000;

/**
 * Absolute VO windows (ms). `until` is when the NEXT topic must already be
 * on screen. Arrive 0.5–1s early is OK; late is not.
 */
const BEATS = {
  landingProblem: 23_680,
  landingProduct: 46_320,
  landingBoard: 64_000,
  how: 77_680,
  marketplace: 97_600,
  create: 119_760,
  unpaid: 136_640,
  paid: 162_720,
  receipt: 176_800,
  gate200: 185_440,
  gate402: 197_840,
  docs: 208_056,
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

function logScene(event, extra = {}) {
  const row = { t: voNow(), event, ...extra };
  console.log("scene", JSON.stringify(row));
  try {
    appendFileSync(SCENE_LOG, JSON.stringify(row) + "\n");
  } catch {
    /* ignore */
  }
}

async function holdUntil(page, untilVoMs) {
  const remain = remaining(untilVoMs);
  if (remain > 40) await sleep(page, remain);
}

/** Wait until `beatMs - earlyMs` so the next cut can land ~0.5–1s early. */
async function waitToArrive(page, beatMs, earlyMs = 800) {
  const target = beatMs - earlyMs;
  const remain = remaining(target);
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
    el.dataset.scene = t;
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

async function jumpId(page, id, block = "start") {
  await page.evaluate(
    ({ id, block }) => {
      document.getElementById(id)?.scrollIntoView({ behavior: "instant", block });
    },
    { id, block },
  );
}

async function smoothScroll(page, y, ms) {
  const budget = Math.max(80, Math.min(ms, 4200));
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

async function landingMetrics(page) {
  return page.evaluate(() => {
    const how = document.getElementById("how");
    const howTop = how?.offsetTop ?? 99999;
    const maxScroll = Math.max(0, howTop - window.innerHeight - 32);
    const rect = how?.getBoundingClientRect();
    const howVisible = Boolean(
      rect && rect.top < window.innerHeight - 48 && rect.bottom > 72,
    );
    const h = document.querySelector("h1, h2");
    return {
      howTop,
      maxScroll,
      howVisible,
      scrollY: window.scrollY,
      heading: (h?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 80),
    };
  });
}

/** Snap back to the hero if #how accidentally entered the viewport. */
async function keepHowOffscreen(page, label) {
  const m = await landingMetrics(page);
  if (m.howVisible) {
    logScene("how-peek-blocked", { label, ...m });
    await jumpY(page, 0);
  }
  return m;
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
  logScene("frame-start", { id, url });
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
  logScene("frame-reveal", { id, needle, caption: captionText, vo: voNow() });
  return frame;
}

async function revealByBeat(page, id, needle, captionText, beatMs) {
  const frame = page.frameLocator(`#${id}`);
  await frame.getByText(needle, { exact: false }).first().waitFor({ state: "visible", timeout: 35000 });
  await waitToArrive(page, beatMs, 800);
  if (voNow() > beatMs + 400) {
    logScene("LATE-REVEAL", { id, needle, vo: voNow(), beatMs });
  }
  return revealFrame(page, id, needle, captionText);
}

async function move(_target, x, y, steps = 16) {
  const host = filmPage ?? _target;
  if (!host?.mouse) return;
  await host.mouse.move(x, y, { steps });
}

/**
 * Point the filmed cursor at visible copy. `mayScroll` is off on the landing
 * so Playwright hover cannot drag #how into view (PR #4 failure mode).
 */
async function hoverText(root, text, { mayScroll = false } = {}) {
  const loc = root.getByText(text, { exact: false }).first();
  if ((await loc.count()) === 0) return false;
  if (mayScroll) {
    await loc.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => {});
  }
  const box = await loc.boundingBox().catch(() => null);
  if (!box || box.width < 2 || box.height < 2) return false;
  if (box.y > 720 || box.y + box.height < 0) return false;
  await move(filmPage, box.x + Math.min(box.width * 0.45, 180), box.y + box.height * 0.55, 14);
  if (mayScroll) await loc.hover({ timeout: 1500 }).catch(() => {});
  return true;
}

async function hoverHref(page, href) {
  const loc = page.locator(`a[href="${href}"]`).first();
  if ((await loc.count()) === 0) return false;
  const box = await loc.boundingBox().catch(() => null);
  if (!box || box.y > 700 || box.y + box.height < 8) return false;
  await move(page, box.x + Math.min(box.width * 0.42, 160), box.y + Math.min(40, box.height * 0.45), 16);
  return true;
}

async function breathe(page, ms, untilVoMs) {
  const cap = untilVoMs !== undefined ? Math.min(ms, Math.max(0, remaining(untilVoMs) - 80)) : ms;
  if (cap < 120) return;
  const t0 = Date.now();
  let toggle = 0;
  while (Date.now() - t0 < cap - 60) {
    const left = cap - (Date.now() - t0);
    const x = 300 + (toggle % 4) * 140;
    const y = 200 + (toggle % 3) * 80;
    await page.mouse.move(x, y, { steps: 12 });
    toggle += 1;
    await sleep(page, Math.min(640, left));
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
    [BASE + "/", "already paid"],
    [BASE + "/pay", "open"],
    [BASE + "/pay/1", "locked"],
    [BASE + "/new", "create a listing"],
    [BASE + "/docs", "ispai"],
    [BASE + "/receipt/9", "10.000247"],
    [GATE_BASE + "/gate/9", "access granted"],
    [GATE_BASE + "/gate/1", "402"],
    [BASE + "/pay/9", "get the work"],
    [BASE + "/", "live listing"],
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

async function walkLandingHero(page) {
  // VO 0–8s: headline + CTAs. Do not leave the hero.
  await caption(page, "The problem");
  logScene("landing-hero", await keepHowOffscreen(page, "hero-start"));
  await jumpY(page, 0);
  await move(page, 280, 170, 18);
  await hoverText(page, "List work");
  await sleep(page, 280);
  await hoverText(page, "Anyone can buy it");
  await sleep(page, 240);
  await hoverText(page, "Browse marketplace");
  await sleep(page, 320);
  await hoverText(page, "Create a listing");
  await sleep(page, 240);
  await hoverText(page, "public board of things for sale");
  await keepHowOffscreen(page, "hero-ctas");
  await breathe(page, 700, 8_000);
  await holdUntil(page, 8_000);

  // VO 8–23.68s: slow walk through problem/value copy. Hero is ~one viewport;
  // only a few dozen px of scroll are safe before #how. Cursor does the walk.
  logScene("landing-problem-scroll", await landingMetrics(page));
  const { maxScroll } = await landingMetrics(page);
  const problemScroll = Math.max(0, Math.min(maxScroll, 40));
  const scrollMs = Math.min(3800, Math.max(900, remaining(BEATS.landingProblem) - 10_000));
  await smoothScroll(page, problemScroll, scrollMs);
  await keepHowOffscreen(page, "after-problem-scroll");
  await hoverText(page, "A public board");
  await sleep(page, 360);
  await hoverText(page, "Buyers send USDC");
  await sleep(page, 280);
  await hoverText(page, "Already paid");
  await hoverHref(page, "/pay/9");
  await sleep(page, 300);
  await hoverText(page, "Looking is free");
  await keepHowOffscreen(page, "problem-copy");
  if (remaining(BEATS.landingProblem) > 1800) {
    await hoverText(page, "Browse marketplace");
    await hoverText(page, "Create a listing");
  }
  await breathe(page, 900, BEATS.landingProblem);
  await keepHowOffscreen(page, "problem-hold");
  await holdUntil(page, BEATS.landingProblem);
}

async function walkLandingProduct(page) {
  // VO 23.68–40s: product nouns on the hero, then #paid claims (instant jump —
  // a smooth scroll would drag #how across the frame).
  await caption(page, "What Paidline is");
  logScene("landing-product", await keepHowOffscreen(page, "product-start"));
  await jumpY(page, 0);
  await hoverText(page, "Attestcoin proves");
  await sleep(page, 360);
  await hoverText(page, "Creditcoin contract");
  await sleep(page, 280);
  await hoverText(page, "Creditcoin CC3");
  await sleep(page, 240);
  await hoverText(page, "USDC on Ethereum");
  await keepHowOffscreen(page, "hero-badges");
  await breathe(page, 1600, 32_000);
  if (remaining(32_000) > 200) await holdUntil(page, 32_000);

  // Instant jump to the confirmation / Attestcoin section — #how stays offscreen.
  await caption(page, "Attestcoin · Creditcoin");
  await jumpId(page, "paid");
  await sleep(page, 200);
  logScene("landing-paid-section", await keepHowOffscreen(page, "paid-section"));
  await hoverText(page, "Attestcoin verifies");
  await sleep(page, 360);
  await hoverText(page, "Creditcoin");
  await sleep(page, 280);
  await hoverText(page, "They call isPaid");
  await hoverText(page, "Unlocked on checkout");
  await keepHowOffscreen(page, "paid-claims");
  await breathe(page, 800, 40_000);
  await holdUntil(page, 40_000);

  // VO ~40–45s: board must be in view BEFORE 46.3 (“This is the live board”).
  await caption(page, "Live board");
  await jumpY(page, 0);
  await sleep(page, 180);
  logScene("landing-board-early", await keepHowOffscreen(page, "board-early"));
  await hoverText(page, "Live listings");
  await hoverHref(page, "/pay/8");
  await keepHowOffscreen(page, "board-pre");
  await breathe(page, 2000, BEATS.landingProduct);
  await holdUntil(page, BEATS.landingProduct);
}

async function walkLandingBoard(page) {
  // VO 46.32–64s: listing 9 (paid) + open cards on the right. Stay off #how.
  await caption(page, "Live board");
  logScene("landing-board", await keepHowOffscreen(page, "board-start"));
  await jumpY(page, 0);
  await hoverText(page, "Live listings");
  await sleep(page, 280);
  await hoverHref(page, "/pay/9");
  await hoverText(page, "Already paid");
  await sleep(page, 400);
  await hoverText(page, "Judge walkthrough");
  await sleep(page, 300);

  const openHrefs = ["/pay/8", "/pay/7", "/pay/6", "/pay/5"];
  for (const href of openHrefs) {
    if (remaining(62_000) < 900) break;
    const ok = await hoverHref(page, href);
    if (ok) await sleep(page, 700);
  }
  if (remaining(62_000) > 800) {
    await hoverText(page, "live listing");
  }
  await keepHowOffscreen(page, "board-cards");
  await breathe(page, 700, 63_200);
  await holdUntil(page, 63_200);
}

async function walkHow(page) {
  // Exactly ~64s — first time #how is allowed on screen.
  await caption(page, "Four steps");
  await waitToArrive(page, BEATS.landingBoard, 700);
  await jumpId(page, "how");
  await waitText(page, "Four steps", 8000);
  logScene("how", { vo: voNow(), ...(await landingMetrics(page)) });

  const hoverHowStep = async (name) => {
    const step = page.locator("#how").getByRole("heading", { name, exact: true }).first();
    if ((await step.count()) === 0) return;
    const box = await step.boundingBox().catch(() => null);
    if (box) await move(page, box.x + 40, box.y + 16, 12);
  };

  // Whisper silences in this window land near List / Pay / Prove / Confirm.
  const steps = [
    ["List", 67_200],
    ["Pay", 70_300],
    ["Prove", 73_100],
    ["Confirm", 75_200],
  ];
  for (const [name, until] of steps) {
    if (remaining(until) < 80) continue;
    await page.evaluate(() => document.getElementById("how")?.scrollIntoView({ behavior: "instant", block: "start" }));
    await hoverHowStep(name);
    await sleep(page, Math.min(remaining(until) - 60, 2600));
    await holdUntil(page, until);
  }

  await caption(page, "A checker. Not a custodian.");
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("h2")].find((n) => /not a custodian/i.test(n.textContent || ""));
    el?.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await hoverText(page, "Not a bridge", { mayScroll: true });
  await sleep(page, 280);
  await hoverText(page, "Not escrow", { mayScroll: true });
  logScene("checker", { vo: voNow() });
}

async function main() {
  if (!existsSync(AUDIO)) {
    throw new Error(`Narration missing: ${AUDIO}`);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(SCENE_LOG, "");
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
  await waitText(page, "#9", 20000).catch(() => {});
  await waitText(page, "live listing", 15000).catch(() => {});
  await page.evaluate(paintTitleOverlay);
  await sleep(page, TITLE_MS);
  await page.evaluate(() => document.getElementById("pl-title")?.remove());
  await injectCursor(page);
  const actualTitleMs = TITLE_MS;
  voZero = Date.now();
  logScene("vo-zero", { actualTitleMs });

  await walkLandingHero(page);
  await walkLandingProduct(page);
  await walkLandingBoard(page);

  // #how at ~64s — never earlier. Preload /pay under a hidden iframe so the
  // marketplace cut is on time (listings need a couple of seconds after header).
  void rewarm(warmPage, BASE + "/pay", "open");
  const marketId = await startFrame(page, BASE + "/pay");
  await walkHow(page);
  await holdUntil(page, BEATS.how - 800);

  let view = await revealByBeat(page, marketId, "open", "Marketplace", BEATS.how);
  logScene("marketplace", { vo: voNow() });
  await hoverText(view, "Marketplace", { mayScroll: true });
  await sleep(page, 400);
  await hoverText(view, "open", { mayScroll: true });
  await sleep(page, 500);
  await hoverText(view, "InvoicePaid listener", { mayScroll: true });
  await sleep(page, 500);
  await hoverText(view, "September retainer", { mayScroll: true });
  void rewarm(warmPage, BASE + "/new", "create a listing");
  const createId = await startFrame(page, BASE + "/new");
  await breathe(page, 2400, BEATS.marketplace);
  await holdUntil(page, BEATS.marketplace - 800);

  view = await revealByBeat(page, createId, "Create a listing", "Create a listing", BEATS.marketplace);
  logScene("create", { vo: voNow() });
  await typeInto(view, "September retainer", "September research brief", 18, 106_000);
  await typeInto(view, "250.00", "250", 36, 108_200);
  await typeInto(view, "Delivery of the work", "Sealed brief, unlocked on payment", 14, 111_400);
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
  if (remaining(BEATS.create) > 800) await hoverText(view, "Buyer preview", { mayScroll: true });
  // /pay/9 is the slow RPC page — start it during publish, not after unpaid.
  void rewarm(warmPage, BASE + "/pay/9", "get the work");
  const paidId = await startFrame(page, BASE + "/pay/9");
  void rewarm(warmPage, BASE + "/pay/1", "locked");
  const unpaidId = await startFrame(page, BASE + "/pay/1");
  await holdUntil(page, BEATS.create - 800);

  view = await revealByBeat(page, unpaidId, "Locked. It unlocks here", "Unpaid checkout · listing 1", BEATS.create);
  logScene("unpaid", { vo: voNow() });
  await hoverText(view, "Amount", { mayScroll: true });
  await sleep(page, 400);
  await hoverText(view, "Send to", { mayScroll: true });
  await hoverText(view, "You receive", { mayScroll: true });
  await hoverText(view, "Locked", { mayScroll: true });
  await holdUntil(page, BEATS.unpaid - 800);

  view = await revealByBeat(page, paidId, "Get the work", "Paid · listing 9", BEATS.unpaid);
  logScene("paid", { vo: voNow() });
  await hoverText(view, "Amount", { mayScroll: true });
  await sleep(page, 500);
  await hoverText(view, "Listing #9", { mayScroll: true });
  // Brief / Get the work must be visible by VO ~159s.
  await holdUntil(page, 154_000);
  const work = view.getByText("Get the work").first();
  await work.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
  await work.hover().catch(() => {});
  await hoverText(view, "Get the work", { mayScroll: true });
  logScene("paid-work-visible", { vo: voNow() });
  void rewarm(warmPage, BASE + "/receipt/9", "10.000247");
  const receiptId = await startFrame(page, BASE + "/receipt/9");
  const gate9Id = await startFrame(page, GATE_BASE + "/gate/9");
  await holdUntil(page, BEATS.paid - 800);

  view = await revealByBeat(page, receiptId, "10.000247", "Receipt · on-chain paid", BEATS.paid);
  logScene("receipt", { vo: voNow() });
  await hoverText(view, "Ethereum transfer", { mayScroll: true });
  await hoverText(view, "Creditcoin stamp", { mayScroll: true });
  void rewarm(warmPage, GATE_BASE + "/gate/1", "402");
  const gate1Id = await startFrame(page, GATE_BASE + "/gate/1");
  await holdUntil(page, BEATS.receipt - 800);

  view = await revealByBeat(page, gate9Id, "Access granted", "GET /api/gate/9  →  200", BEATS.receipt);
  logScene("gate200", { vo: voNow() });
  const docsId = await startFrame(page, BASE + "/docs");
  await holdUntil(page, BEATS.gate200 - 800);

  view = await revealByBeat(page, gate1Id, "402 Payment Required", "GET /api/gate/1  →  402", BEATS.gate200);
  logScene("gate402", { vo: voNow() });
  await holdUntil(page, BEATS.gate402 - 800);

  view = await revealByBeat(page, docsId, "isPaid", "Other contracts call isPaid", BEATS.gate402);
  logScene("docs", { vo: voNow() });
  await view
    .locator("#ispai")
    .evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "start" }))
    .catch(() => {});
  await caption(page, "Remote proof. Local unlock.");
  await hoverText(view, "isPaid", { mayScroll: true });
  if (remaining(Math.max(BEATS.docs, voiceMs)) > 1200) {
    await hoverText(view, "Paidline", { mayScroll: true });
  }
  await holdUntil(page, Math.max(BEATS.docs, voiceMs + 400));
  logScene("end", { vo: voNow() });

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
