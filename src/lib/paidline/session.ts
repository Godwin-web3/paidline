import { create } from "zustand";
import { connectWallet, hasWallet } from "./wallet.ts";

type Ethereum = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, fn: (...args: unknown[]) => void) => void;
};

type Session = {
  address: string | null;
  ready: boolean;
  error: string | null;
  hydrate: () => void;
  connect: () => Promise<string | null>;
};

let listening = false;

export const useSession = create<Session>((set) => ({
  address: null,
  ready: false,
  error: null,
  hydrate: () => {
    const eth = (globalThis as { ethereum?: Ethereum }).ethereum;
    if (!eth) {
      set({ ready: true, address: null });
      return;
    }
    void eth
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const list = Array.isArray(accounts) ? (accounts as string[]) : [];
        set({ address: list[0] ?? null, ready: true });
      })
      .catch(() => set({ ready: true }));
    if (!listening) {
      listening = true;
      eth.on?.("accountsChanged", (accounts: unknown) => {
        const list = Array.isArray(accounts) ? (accounts as string[]) : [];
        set({ address: list[0] ?? null, error: null });
      });
    }
  },
  connect: async () => {
    set({ error: null });
    if (!hasWallet()) {
      set({ error: "This browser has no wallet." });
      return null;
    }
    try {
      const address = await connectWallet();
      set({ address });
      return address;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Wallet refused." });
      return null;
    }
  },
}));
