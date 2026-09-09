import { createFileRoute, Link } from "@tanstack/react-router";
import { OpenBoard } from "@/components/open-board";
import { SettledFeed } from "@/components/settled-feed";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/board")({ component: BoardPage });

function BoardPage() {
  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="font-display text-sm italic text-muted">The board</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
            First payment claims it.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            Every open invoice is a public listing. There is no buyer list. Locked Creditcoin
            releases to the wallet that sends the matching USDC. No reservation. No waitlist. The
            first matching transfer wins.
          </p>
          <div className="mt-8">
            <OpenBoard />
          </div>
          <p className="mt-6 text-xs text-faint">
            No wallet to watch. Connect only when you pay. Demo USDC on Ethereum Sepolia.
          </p>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="font-display text-sm italic text-muted">Already stamped</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight">Recently settled</h2>
          <div className="mt-6">
            <SettledFeed />
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-12 sm:flex-row sm:items-center sm:px-6">
        <Link to="/new">
          <Button size="lg">List something</Button>
        </Link>
        <Link to="/docs">
          <Button size="lg" variant="ghost">
            How the stamp works
          </Button>
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
