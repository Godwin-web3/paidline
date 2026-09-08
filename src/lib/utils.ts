import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddr(addr: string, size = 4): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 2 + size)}…${addr.slice(-size)}`;
}

export function formatUnits(amount: bigint, decimals = 6): string {
  const neg = amount < 0n;
  const v = neg ? -amount : amount;
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const frac = v % base;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  const body = fracStr.length ? `${whole}.${fracStr}` : whole.toString();
  return neg ? `-${body}` : body;
}

export function parseUnits(value: string, decimals = 6): bigint {
  const trimmed = value.trim();
  if (!trimmed) return 0n;
  const [w, f = ""] = trimmed.split(".");
  const frac = (f + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(w || "0") * 10n ** BigInt(decimals) + BigInt(frac || "0");
}

export function isAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isTxHash(value: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function formatDue(expiry: number): string {
  const ms = expiry * 1000 - Date.now();
  if (ms <= 0) return "Past due";
  const hours = Math.round(ms / 3_600_000);
  if (hours < 48) return `${hours}h left`;
  const days = Math.round(hours / 24);
  return `${days}d left`;
}
