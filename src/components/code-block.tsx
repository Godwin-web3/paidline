import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/utils";

export function CodeBlock({
  label,
  code,
}: {
  label?: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const ok = await copyText(code);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <p className="font-mono text-[11px] uppercase tracking-wide text-faint">
          {label ?? "Code"}
        </p>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex min-h-8 items-center gap-1.5 text-xs text-muted hover:text-fg"
        >
          {copied ? <Check className="size-3.5" strokeWidth={2} /> : <Copy className="size-3.5" strokeWidth={1.75} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-fg">{code}</pre>
    </div>
  );
}
