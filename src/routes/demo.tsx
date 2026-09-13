import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "Demo · Paidline" }] }),
  component: DemoPage,
});

function DemoPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="kicker">Walkthrough</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">How Paidline works</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        List. Pay. Confirm. A short walkthrough of the live product on Creditcoin CC3 and Ethereum
        Sepolia.
      </p>
      <video
        className="mt-8 w-full rounded-xl border border-line bg-black shadow-sheet"
        controls
        playsInline
        preload="metadata"
        src="/demo.mp4"
      >
        <a href="/demo.mp4">Download the demo</a>
      </video>
      <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
        <a href="/demo.mp4" download className="hover:text-fg">
          Download video
        </a>
        <a href="/demo.mp3" download className="hover:text-fg">
          Voice only
        </a>
        <Link to="/pay" className="hover:text-fg">
          Live marketplace
        </Link>
        <Link to="/docs" className="hover:text-fg">
          Docs
        </Link>
      </p>
    </main>
  );
}
