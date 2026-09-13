import assert from "node:assert/strict";
import test from "node:test";
import { parseUnits } from "../utils.ts";
import {
  DUST_MAX,
  DUST_MIN,
  classifyWork,
  normalizeWork,
  uniqueExactUsdc,
  workVisibleToBuyer,
} from "./work-format.ts";

test("classifyWork treats http(s) URLs as links", () => {
  assert.equal(classifyWork("https://paidline.vercel.app/api/gate/3"), "link");
  assert.equal(classifyWork("http://example.com/notes.md"), "link");
  assert.equal(classifyWork("Wire isPaid into your contract"), "text");
  assert.equal(classifyWork("ftp://not-this"), "text");
});

test("normalizeWork trims and rejects empty or huge bodies", () => {
  const ok = normalizeWork("  https://example.com/work  ");
  assert.equal(ok.kind, "link");
  assert.equal(ok.body, "https://example.com/work");
  assert.throws(() => normalizeWork("short"), /Attach the work/);
  assert.throws(() => normalizeWork("x".repeat(8001)), /too long/);
});

test("uniqueExactUsdc adds 100–999 micro-USDC so DuplicateTerms can differ", () => {
  const base = parseUnits("250", 6);
  const amount = uniqueExactUsdc("250", 247);
  assert.equal(amount, base + 247n);
  assert.throws(() => uniqueExactUsdc("250", 99), /Dust/);
  assert.throws(() => uniqueExactUsdc("250", 1000), /Dust/);
  assert.throws(() => uniqueExactUsdc("0", DUST_MIN), /greater than zero/);
  assert.ok(DUST_MAX > DUST_MIN);
});

test("workVisibleToBuyer never returns a body while unpaid", () => {
  const secret = { kind: "text" as const, body: "the actual brief" };
  assert.equal(workVisibleToBuyer(false, secret), null);
  assert.deepEqual(workVisibleToBuyer(true, secret), secret);
  assert.equal(workVisibleToBuyer(true, null), null);
});
