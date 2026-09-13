import { parseUnits } from "../utils.ts";

export const MAX_WORK_CHARS = 8000;
export const MIN_WORK_CHARS = 8;
export const DUST_MIN = 100;
export const DUST_MAX = 999;

export type WorkKind = "link" | "text";

export type WorkPayload = {
  kind: WorkKind;
  body: string;
};

export function classifyWork(body: string): WorkKind {
  const trimmed = body.trim();
  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:" || url.protocol === "http:") return "link";
  } catch {
    /* not a URL */
  }
  return "text";
}

export function normalizeWork(body: string): WorkPayload {
  const trimmed = body.trim();
  if (trimmed.length < MIN_WORK_CHARS) {
    throw new Error("Attach the work. A short brief or a URL.");
  }
  if (trimmed.length > MAX_WORK_CHARS) {
    throw new Error("Work is too long (8,000 characters).");
  }
  return { kind: classifyWork(trimmed), body: trimmed };
}

/** Micro-USDC suffix so two listings at the same sticker price do not share DuplicateTerms. */
export function pickDust(): number {
  return DUST_MIN + Math.floor(Math.random() * (DUST_MAX - DUST_MIN + 1));
}

export function uniqueExactUsdc(human: string, dust: number): bigint {
  if (!Number.isInteger(dust) || dust < DUST_MIN || dust > DUST_MAX) {
    throw new Error("Dust must be 100–999 micro-USDC.");
  }
  const base = parseUnits(human, 6);
  if (base <= 0n) throw new Error("Price must be greater than zero.");
  return base + BigInt(dust);
}

/** Buyer-facing payload. Unpaid callers always get null — even if the store has a body. */
export function workVisibleToBuyer(paid: boolean, work: WorkPayload | null): WorkPayload | null {
  if (!paid) return null;
  return work;
}
