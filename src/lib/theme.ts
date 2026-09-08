import { create } from "zustand";

export type Theme = "light" | "dark";

const KEY = "paidline-theme";

function stored(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const t = localStorage.getItem(KEY);
    if (t === "light" || t === "dark") return t;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore quota */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#f3ebe0" : "#14110e");
}

export const useTheme = create<{
  theme: Theme;
  hydrate: () => void;
  toggle: () => void;
}>((set, get) => ({
  theme: "dark",
  hydrate: () => {
    const theme = stored();
    applyTheme(theme);
    set({ theme });
  },
  toggle: () => {
    const next: Theme = get().theme === "light" ? "dark" : "light";
    applyTheme(next);
    set({ theme: next });
  },
}));
