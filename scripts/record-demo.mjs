#!/usr/bin/env node
/**
 * Timed browser walkthrough of the live Paidline app.
 * Overlay the narration in ffmpeg after this writes a silent webm.
 *
 *   node scripts/record-demo.mjs
 */
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const BASE = process.env.DEMO_BASE ?? "http://127.0.0.1:43123";
const GATE_BASE = process.env.DEMO_GATE_BASE ?? "https://paidline.vercel.app";
const AUDIO = process.env.DEMO_AUDIO ?? "/tmp/paidline-demo-long.mp3";
const OUT_DIR = process.env.DEMO_OUT_DIR ?? "/tmp/paidline-demo-rec";
const VOICEOVER_LEAD_MS = 0;

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

function sleep(page, ms) {
  return page.waitForTimeout(ms);
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

async function hideChrome(page) {
  await page.addStyleTag({
    content: `#paidline-demo-cap{font-feature-settings:"ss01"}`,
  });
}

async function smoothScroll(page, y, ms) {
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
    { y, ms },
  );
}

async function scrollInto(page, selector, ms = 900) {
  const loc = page.locator(selector).first();
  if (await loc.count()) {
    await loc.scrollIntoViewIfNeeded();
    await sleep(page, Math.min(ms, 400));
  }
}

async function scene(page, budgetMs, fn) {
  const t0 = Date.now();
  await fn();
  const used = Date.now() - t0;
  const remain = budgetMs - used;
  if (remain > 50) await sleep(page, remain);
}

async function waitText(page, needle, timeout = 40000) {
  await page.waitForFunction(
    (n) => document.body.innerText.toLowerCase().includes(n.toLowerCase()),
    needle,
    { timeout },
  );
}

async function warmup(context) {
  const p = await context.newPage();
  p.setDefaultTimeout(20000);
  const targets = [
    BASE + "/",
    BASE + "/pay",
    BASE + "/pay/1",
    BASE + "/pay/9",
    BASE + "/receipt/9",
    BASE + "/docs",
    BASE + "/new",
    GATE_BASE + "/gate/9",
    GATE_BASE + "/gate/1",
  ];
  for (const url of targets) {
    try {
      await p.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      await p.waitForTimeout(600);
    } catch {
      /* still film against a cold page if warmup misses */
    }
  }
  const vid = p.video();
  await p.close();
  if (vid) {
    try {
      const path = await vid.path();
      if (path) spawnSync("rm", ["-f", path]);
    } catch {
      /* ignore */
    }
  }
}

async function typeInto(page, placeholder, text, delay = 22) {
  const field = page.getByPlaceholder(placeholder).first();
  await field.click();
  await field.fill("");
  await field.pressSequentially(text, { delay });
}

async function breathe(page, ms) {
  const t0 = Date.now();
  let toggle = 0;
  while (Date.now() - t0 < ms - 60) {
    const left = ms - (Date.now() - t0);
    const x = 360 + (toggle % 3) * 160;
    const y = 240 + (toggle % 2) * 90;
    await page.mouse.move(x, y, { steps: 12 });
    toggle += 1;
    await sleep(page, Math.min(900, left));
  }
}

async function main() {
  if (!existsSync(AUDIO)) {
    throw new Error(`Narration missing: ${AUDIO}`);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const voiceMs = audioDurationMs(AUDIO);
  const totalMs = voiceMs + VOICEOVER_LEAD_MS;

  const weights = [
    ["landing", 24],
    ["how", 12],
    ["marketplace", 11],
    ["create", 15],
    ["unpaid", 11],
    ["paid", 13],
    ["receipt", 7],
    ["gate200", 7],
    ["gate402", 6],
    ["docs", 9],
  ];
  const sum = weights.reduce((a, [, w]) => a + w, 0);
  const dur = Object.fromEntries(weights.map(([k, w]) => [k, Math.round((w / sum) * totalMs)]));

  console.log("voiceover_ms", voiceMs);
  console.log("scene_ms", dur);

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
    locale: "en-US",
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("paidline-theme", "dark");
    } catch {
      /* ignore */
    }
    document.documentElement.classList.add("dark");
    document.documentElement.dataset.theme = "dark";
  });

  await warmup(context);

  const page = await context.newPage();
  page.setDefaultTimeout(25000);

  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;background:#14110e;color:#f4efe8;font-family:Georgia,serif;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center">
    <p style="font-size:64px;margin:0">Paidline</p>
    <p style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:22px;color:#c9bfb3;margin:18px 0 0">Public marketplace. On-chain paid.</p>
    <p style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;color:#8a8178;margin:72px 0 0">BUIDL CTC 2026 · Creditcoin · Attestcoin</p>
  </body></html>`);
  await sleep(page, 4200);

  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await waitText(page, "judge walkthrough");
  await hideChrome(page);
  await caption(page, "The problem");

  await scene(page, dur.landing, async () => {
    await sleep(page, 2200);
    await caption(page, "What Paidline is");
    await page.mouse.move(280, 260, { steps: 18 });
    await sleep(page, 5000);
    await caption(page, "Live board");
    const paid = page.getByText("Already paid").first();
    if (await paid.count()) await paid.hover();
    await sleep(page, 2800);
    const live = page.getByText("Live listings").first();
    if (await live.count()) await live.hover();
    await sleep(page, 1800);
    await page.mouse.move(980, 320, { steps: 16 });
    await breathe(page, 6000);
  });

  await scene(page, dur.how, async () => {
    await caption(page, "How it works");
    await page.evaluate(() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    await sleep(page, 2200);
    await caption(page, "A checker. Not a custodian.");
    await page.evaluate(() => {
      const el = [...document.querySelectorAll("h2")].find((n) => /not a custodian/i.test(n.textContent || ""));
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    await sleep(page, 1800);
  });

  await scene(page, dur.marketplace, async () => {
    await page.goto(BASE + "/pay", { waitUntil: "domcontentloaded" });
    await waitText(page, "InvoicePaid listener");
    await caption(page, "Marketplace");
    await sleep(page, 1600);
    await smoothScroll(page, 180, 900);
    await page.getByText("InvoicePaid listener").first().hover().catch(() => {});
    await sleep(page, 2200);
    await smoothScroll(page, 420, 1100);
    await page.getByText("September retainer").first().hover().catch(() => {});
    await sleep(page, 1800);
  });

  await scene(page, dur.create, async () => {
    await page.goto(BASE + "/new", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Create a listing" }).waitFor();
    await caption(page, "Create a listing");
    await sleep(page, 700);
    await typeInto(page, "September retainer", "September research brief", 18);
    await typeInto(page, "250.00", "250", 42);
    await typeInto(page, "Delivery of the work", "Sealed brief, unlocked on payment", 16);
    const workField = page.getByPlaceholder("Paste the deliverable or a link to it.");
    await workField.click();
    await workField.pressSequentially(
      "Delivery notes. Buyers only see this after isPaid is true.",
      { delay: 12 },
    );
    await typeInto(page, "0.01", "0.01", 40);
    await page.getByRole("button", { name: "7 days" }).click().catch(() => {});
    await sleep(page, 600);
    await page.getByText("Buyer preview").hover().catch(() => {});
  });

  await scene(page, dur.unpaid, async () => {
    await page.goto(BASE + "/pay/1", { waitUntil: "domcontentloaded" });
    await waitText(page, "Locked. It unlocks here");
    await caption(page, "Unpaid checkout · listing 1");
    await sleep(page, 1400);
    await smoothScroll(page, 360, 1000);
    await breathe(page, 4000);
  });

  await scene(page, dur.paid, async () => {
    await page.goto(BASE + "/pay/9", { waitUntil: "domcontentloaded" });
    await waitText(page, "Get the work");
    await caption(page, "Paid · listing 9");
    await sleep(page, 1200);
    const work = page.getByText("Get the work").first();
    if (await work.count()) await work.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
    await sleep(page, 900);
    await smoothScroll(page, 520, 1100);
  });

  await scene(page, dur.receipt, async () => {
    await page.goto(BASE + "/receipt/9", { waitUntil: "domcontentloaded" });
    await waitText(page, "10.000247");
    await caption(page, "Receipt · on-chain paid");
    await sleep(page, 800);
    await smoothScroll(page, 240, 700);
  });

  await scene(page, dur.gate200, async () => {
    await page.goto(GATE_BASE + "/gate/9", { waitUntil: "domcontentloaded" });
    await waitText(page, "Access granted");
    await caption(page, "GET /api/gate/9  →  200");
    await sleep(page, 700);
    await smoothScroll(page, 200, 600);
  });

  await scene(page, dur.gate402, async () => {
    await page.goto(GATE_BASE + "/gate/1", { waitUntil: "domcontentloaded" });
    await waitText(page, "402 Payment Required");
    await caption(page, "GET /api/gate/1  →  402");
  });

  await scene(page, dur.docs, async () => {
    await page.goto(BASE + "/docs", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Docs" }).waitFor();
    await caption(page, "Other contracts call isPaid");
    await page.evaluate(() => document.getElementById("ispai")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    await sleep(page, 900);
    await caption(page, "Remote proof. Local unlock.");
  });

  await sleep(page, 1200);
  const video = page.video();
  await page.close();
  const videoPath = video ? await video.path() : "";
  await context.close();
  await browser.close();
  console.log("video", videoPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
