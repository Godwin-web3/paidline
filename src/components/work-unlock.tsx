import type { WorkPayload } from "@/lib/paidline/work-format";

export function WorkLocked({ paper = false }: { paper?: boolean }) {
  return (
    <div
      className={
        paper
          ? "rounded-xl border border-dashed border-rule px-5 py-4"
          : "rounded-xl border border-dashed border-line bg-raised px-5 py-4"
      }
    >
      <p className={`text-xs uppercase tracking-wide ${paper ? "text-ink-muted" : "text-muted"}`}>
        Work
      </p>
      <p className={`mt-2 text-sm leading-relaxed ${paper ? "text-ink-muted" : "text-muted"}`}>
        Locked. It unlocks here after the contract says this listing is paid.
      </p>
    </div>
  );
}

export function WorkUnlock({
  work,
  paper = false,
}: {
  work: WorkPayload | null;
  paper?: boolean;
}) {
  const label = paper ? "text-ink-muted" : "text-muted";
  const body = paper ? "text-ink" : "text-fg";
  const box = paper
    ? "rounded-xl border border-rule bg-paper px-5 py-4"
    : "rounded-xl border border-paid/30 bg-raised px-5 py-4";

  if (!work) {
    return (
      <div className={box}>
        <p className={`text-xs uppercase tracking-wide ${label}`}>Work</p>
        <p className={`mt-2 text-sm leading-relaxed ${label}`}>
          The seller did not attach a file. The receipt still stands.
        </p>
      </div>
    );
  }

  if (work.kind === "link") {
    return (
      <div className={box}>
        <p className={`text-xs uppercase tracking-wide ${label}`}>Get the work</p>
        <a
          href={work.body}
          target="_blank"
          rel="noreferrer"
          className={`mt-3 inline-block break-all text-sm underline underline-offset-4 ${body}`}
        >
          {work.body}
        </a>
      </div>
    );
  }

  return (
    <div className={box}>
      <p className={`text-xs uppercase tracking-wide ${label}`}>Get the work</p>
      <pre className={`mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed ${body}`}>
        {work.body}
      </pre>
    </div>
  );
}
