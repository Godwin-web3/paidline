import { BrowserProvider, Contract, parseUnits } from "ethers";
import { PAIDLINE_ABI, ERC20_ABI } from "./abi.ts";
import {
  CREDITCOIN_RPC,
  CREDITCOIN_TESTNET_CHAIN_ID,
  PAIDLINE_ADDRESS,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_CHAIN_KEY,
  USDC_SEPOLIA,
} from "./constants.ts";

type Ethereum = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, fn: (...args: unknown[]) => void) => void;
};

function injected(): Ethereum {
  const eth = (globalThis as { ethereum?: Ethereum }).ethereum;
  if (!eth) throw new Error("Connect a wallet. Paidline does not hold keys for you.");
  return eth;
}

export function hasWallet() {
  return Boolean((globalThis as { ethereum?: Ethereum }).ethereum);
}

export async function connectWallet(): Promise<string> {
  const accounts = (await injected().request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts[0]) throw new Error("No account.");
  return accounts[0];
}

async function switchChain(chainId: number, add?: Record<string, unknown>) {
  const hex = "0x" + chainId.toString(16);
  try {
    await injected().request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hex }],
    });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 4902 && add) {
      await injected().request({ method: "wallet_addEthereumChain", params: [add] });
      return;
    }
    throw err;
  }
}

export async function useCreditcoin() {
  await switchChain(CREDITCOIN_TESTNET_CHAIN_ID, {
    chainId: "0x" + CREDITCOIN_TESTNET_CHAIN_ID.toString(16),
    chainName: "Creditcoin Testnet",
    nativeCurrency: { name: "tCTC", symbol: "tCTC", decimals: 18 },
    rpcUrls: [CREDITCOIN_RPC],
    blockExplorerUrls: ["https://creditcoin-testnet.blockscout.com"],
  });
}

export async function useSepolia() {
  await switchChain(SEPOLIA_CHAIN_ID);
}

function humanCreateError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/DuplicateTerms/i.test(msg)) {
    return new Error(
      "You already have an open invoice for this amount to this wallet. Cancel it or change the price.",
    );
  }
  if (/NotMerchant/i.test(msg)) return new Error("Only the issuing wallet can do that.");
  return err instanceof Error ? err : new Error(msg);
}

export async function createOnchainInvoice(input: {
  title: string;
  releaseLabel: string;
  sourceRecipient: string;
  sourceAmount: bigint;
  escrowTctc: string;
  hours: number;
}) {
  const value = parseUnits(input.escrowTctc, 18);
  if (value <= 0n) throw new Error("Lock some Creditcoin against the invoice.");
  await useCreditcoin();
  const provider = new BrowserProvider(injected());
  const signer = await provider.getSigner();
  const paidline = new Contract(PAIDLINE_ADDRESS, PAIDLINE_ABI, signer);
  const expiry = BigInt(Math.floor(Date.now() / 1000) + input.hours * 3600);
  try {
    const tx = await paidline.createInvoice(
      SEPOLIA_CHAIN_KEY,
      USDC_SEPOLIA,
      input.sourceRecipient,
      input.sourceAmount,
      expiry,
      input.title,
      input.releaseLabel,
      { value },
    );
    const rcpt = await tx.wait();
    const parsed = rcpt.logs
      .map((l: { topics: string[]; data: string }) => {
        try {
          return paidline.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((e: { name: string } | null) => e?.name === "InvoiceCreated");
    return Number(parsed?.args?.invoiceId ?? 0);
  } catch (err) {
    throw humanCreateError(err);
  }
}

export async function sendUsdc(to: string, amount: bigint) {
  await useSepolia();
  const provider = new BrowserProvider(injected());
  const signer = await provider.getSigner();
  const token = new Contract(USDC_SEPOLIA, ERC20_ABI, signer);
  const tx = await token.transfer(to, amount);
  const rcpt = await tx.wait();
  return rcpt.hash as string;
}

export async function cancelOnchain(invoiceId: number) {
  await useCreditcoin();
  const provider = new BrowserProvider(injected());
  const signer = await provider.getSigner();
  const paidline = new Contract(PAIDLINE_ADDRESS, PAIDLINE_ABI, signer);
  try {
    const tx = await paidline.cancel(invoiceId);
    await tx.wait();
  } catch (err) {
    throw humanCreateError(err);
  }
}
