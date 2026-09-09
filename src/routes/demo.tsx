import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/demo")({ component: DemoPage });

function DemoPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="text-xs uppercase tracking-wide text-muted">Demo</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">How Paidline works</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        List. Pay. Confirm. A short walkthrough of the live product.
      </p>
      <video
        className="mt-8 w-full rounded-xl border border-line bg-black"
        controls
        playsInline
        preload="metadata"
        src="/demo.mp4"
      >
        <a href="/demo.mp4">Download the demo</a>
      </video>
      <p className="mt-4 flex flex-wrap gap-4 text-sm">
        <a href="/demo.mp4" download className="underline decoration-line underline-offset-4">
          Download video
        </a>
        <a href="/demo.mp3" download className="underline decoration-line underline-offset-4">
          Voice only
        </a>
        <Link to="/" className="underline decoration-line underline-offset-4">
          Site
        </Link>
      </p>
    </main>
  );
}
