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

/** Stay still on the last target. Laser pointer — no idle wander. */
async function holdOn(page, untilVoMs) {
  await holdUntil(page, untilVoMs);
}

/** Move to one proving noun, then rest there until the next beat. */
async function pointAndHold(root, text, untilVoMs, opts = {}) {
  await hoverText(root, text, opts);
  await holdOn(filmPage ?? root, untilVoMs);
  return true;
}

async function typeInto(page, placeholder, text, delay, untilVoMs) {
  const field = page.getByPlaceholder(placeholder).first();
  await field.click();
  const remain = remaining(untilVoMs);
  // Snappy: fill when the window is tight; otherwise a short sequential pass.
  if (remain < 1400) {
    await field.fill(text);
    return;
  }
  const per = Math.max(4, Math.min(delay, Math.floor((remain - 400) / Math.max(text.length, 1))));
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

function mux(webmPath, audioPath, destPath, delaySec, trimSec = 0) {
  const staged = destPath + ".partial.mp4";
  const args = [
    "-y",
    ...(trimSec > 0.05 ? ["-ss", trimSec.toFixed(3)] : []),
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
  // VO 0–8s: one proving line — the headline. Do not tour CTAs/nav.
  await caption(page, "The problem");
  logScene("landing-hero", await keepHowOffscreen(page, "hero-start"));
  await jumpY(page, 0);
  await hoverText(page, "Anyone can buy it");
  await keepHowOffscreen(page, "hero-headline");
  await holdOn(page, 8_000);

  // VO 8–23.68s: rest on the problem sentence (USDC / public board).
  logScene("landing-problem-scroll", await landingMetrics(page));
  const { maxScroll } = await landingMetrics(page);
  const problemScroll = Math.max(0, Math.min(maxScroll, 40));
  await smoothScroll(page, problemScroll, Math.min(1600, remaining(16_000)));
  await keepHowOffscreen(page, "after-problem-scroll");
  await hoverText(page, "Buyers send USDC");
  await keepHowOffscreen(page, "problem-copy");
  await holdOn(page, BEATS.landingProblem);
}

async function walkLandingProduct(page) {
  // VO 23.68–32s: Attestcoin / Creditcoin on the hero — one noun at a time.
  await caption(page, "What Paidline is");
  logScene("landing-product", await keepHowOffscreen(page, "product-start"));
  await jumpY(page, 0);
  await hoverText(page, "Attestcoin proves");
  await keepHowOffscreen(page, "hero-attestcoin");
  await holdOn(page, 28_000);
  await hoverText(page, "Creditcoin CC3");
  await keepHowOffscreen(page, "hero-badges");
  await holdOn(page, 32_000);

  // Instant jump to #paid — a smooth scroll would drag #how across the frame.
  await caption(page, "Attestcoin · Creditcoin");
  await jumpId(page, "paid");
  await sleep(page, 160);
  logScene("landing-paid-section", await keepHowOffscreen(page, "paid-section"));
  await hoverText(page, "Attestcoin verifies");
  await keepHowOffscreen(page, "paid-claims");
  await holdOn(page, 40_000);

  // Board in view BEFORE 46.3. Cursor parks on Live listings, not chrome.
  await caption(page, "Live board");
  await jumpY(page, 0);
  await sleep(page, 120);
  logScene("landing-board-early", await keepHowOffscreen(page, "board-early"));
  await hoverText(page, "Live listings");
  await keepHowOffscreen(page, "board-pre");
  await holdOn(page, BEATS.landingProduct);
}

async function walkLandingBoard(page) {
  // VO 46.32–64s: listing nine, then one open card. No card-hopping tour.
  await caption(page, "Live board");
  logScene("landing-board", await keepHowOffscreen(page, "board-start"));
  await jumpY(page, 0);
  await hoverHref(page, "/pay/9");
  await keepHowOffscreen(page, "listing-9");
  await holdOn(page, 54_000);
  await hoverHref(page, "/pay/8");
  await keepHowOffscreen(page, "open-card");
  await holdOn(page, 63_200);
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
  await hoverText(page, "Not escrow of the dollars", { mayScroll: true });
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
  const recStart = Date.now();

  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitText(page, "List work", 15000);
  // Wait for the board under the not-yet-shown title, then paint the card.
  // That wait is trimmed from the mp4 (trimSec) so TITLE_MS stays 3s and
  // VO does not start over a skeleton board.
  await waitText(page, "#9", 20000).catch(() => {});
  await page.evaluate(paintTitleOverlay);
  const titleAt = Date.now();
  await sleep(page, TITLE_MS);
  await page.evaluate(() => document.getElementById("pl-title")?.remove());
  await injectCursor(page);
  voZero = Date.now();
  const trimSec = Math.max(0, (titleAt - recStart) / 1000);
  const actualTitleMs = voZero - titleAt;
  logScene("vo-zero", { actualTitleMs, trimSec, recLeadMs: titleAt - recStart });

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
  await hoverText(view, "open", { mayScroll: true });
  void rewarm(warmPage, BASE + "/new", "create a listing");
  const createId = await startFrame(page, BASE + "/new");
  await holdOn(page, BEATS.marketplace - 800);

  view = await revealByBeat(page, createId, "Create a listing", "Create a listing", BEATS.marketplace);
  logScene("create", { vo: voNow() });
  await typeInto(view, "September retainer", "September research brief", 8, 104_000);
  await typeInto(view, "250.00", "250", 16, 107_000);
  await typeInto(view, "Delivery of the work", "Sealed brief, unlocked on payment", 6, 110_500);
  if (remaining(BEATS.create) > 1800) {
    const workField = view.getByPlaceholder("Paste the deliverable or a link to it.");
    await workField.click();
    await workField.fill("Delivery notes. Buyers only see this after isPaid is true.");
  }
  if (remaining(BEATS.create) > 900) {
    await typeInto(view, "0.01", "0.01", 16, BEATS.create);
  }
  // /pay/9 is the slow RPC page — start it during publish, not after unpaid.
  void rewarm(warmPage, BASE + "/pay/9", "get the work");
  const paidId = await startFrame(page, BASE + "/pay/9");
  void rewarm(warmPage, BASE + "/pay/1", "locked");
  const unpaidId = await startFrame(page, BASE + "/pay/1");
  await hoverText(view, "250", { mayScroll: true });
  await holdOn(page, BEATS.create - 800);

  view = await revealByBeat(page, unpaidId, "Locked. It unlocks here", "Unpaid checkout · listing 1", BEATS.create);
  logScene("unpaid", { vo: voNow() });
  const locked = view.getByText("Locked. It unlocks here").first();
  await locked.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
  await hoverText(view, "Locked. It unlocks here", { mayScroll: true });
  await holdOn(page, BEATS.unpaid - 800);

  view = await revealByBeat(page, paidId, "Get the work", "Paid · listing 9", BEATS.unpaid);
  logScene("paid", { vo: voNow() });
  void rewarm(warmPage, BASE + "/receipt/9", "10.000247");
  const receiptId = await startFrame(page, BASE + "/receipt/9");
  const gate9Id = await startFrame(page, GATE_BASE + "/gate/9");
  const work = view.getByText("Get the work").first();
  await work.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
  await hoverText(view, "Get the work", { mayScroll: true });
  logScene("paid-work-visible", { vo: voNow() });
  await holdOn(page, BEATS.paid - 800);

  view = await revealByBeat(page, receiptId, "10.000247", "Receipt · on-chain paid", BEATS.paid);
  logScene("receipt", { vo: voNow() });
  await hoverText(view, "Ethereum transfer", { mayScroll: true });
  void rewarm(warmPage, GATE_BASE + "/gate/1", "402");
  const gate1Id = await startFrame(page, GATE_BASE + "/gate/1");
  await holdOn(page, BEATS.receipt - 800);

  view = await revealByBeat(page, gate9Id, "Access granted", "GET /api/gate/9  →  200", BEATS.receipt);
  logScene("gate200", { vo: voNow() });
  await hoverText(view, "200 OK", { mayScroll: true });
  const docsId = await startFrame(page, BASE + "/docs");
  await holdOn(page, BEATS.gate200 - 800);

  view = await revealByBeat(page, gate1Id, "402 Payment Required", "GET /api/gate/1  →  402", BEATS.gate200);
  logScene("gate402", { vo: voNow() });
  await hoverText(view, "402 Payment Required", { mayScroll: true });
  await holdOn(page, BEATS.gate402 - 800);

  view = await revealByBeat(page, docsId, "isPaid", "Other contracts call isPaid", BEATS.gate402);
  logScene("docs", { vo: voNow() });
  await view
    .locator("#ispai")
    .evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "start" }))
    .catch(() => {});
  await caption(page, "Remote proof. Local unlock.");
  const isPaidHead = view.locator("#ispai h2").first();
  const isPaidBox = await isPaidHead.boundingBox().catch(() => null);
  if (isPaidBox) await move(page, isPaidBox.x + 40, isPaidBox.y + 16, 12);
  else await hoverText(view, "Other contracts ask this", { mayScroll: true });
  await holdOn(page, Math.max(BEATS.docs, voiceMs + 400));
  logScene("end", { vo: voNow() });

  const video = page.video();
  await page.close();
  const videoPath = video ? await video.path() : "";
  await context.close();
  await warmContext.close();
  await browser.close();
  if (!videoPath) throw new Error("Playwright did not write a video");
  console.log("video", videoPath);

  mux(videoPath, AUDIO, OUT_MP4, actualTitleMs / 1000, trimSec);
  const destMs = audioDurationMs(OUT_MP4);
  console.log("mp4", OUT_MP4, destMs, { actualTitleMs, trimSec });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
