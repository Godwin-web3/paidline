import { createFileRoute, Link } from "@tanstack/react-router";
import { OpenBoard } from "@/components/open-board";
import { SettledFeed } from "@/components/settled-feed";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/board")({ component: MarketplacePage });

function MarketplacePage() {
  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs uppercase tracking-wide text-muted">Marketplace</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
            What’s for sale.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            Every listing is public. There is no waiting list and no chosen buyer. Send the exact
            USDC and you claim it. The seller receives the dollars. You receive the locked credit.
          </p>
          <div className="mt-8">
            <OpenBoard />
          </div>
          <p className="mt-6 text-xs text-faint">
            Looking is free. Connect a wallet only when you pay. Demo USDC on Ethereum Sepolia.
          </p>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs uppercase tracking-wide text-muted">Already paid</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight">Recently confirmed</h2>
          <div className="mt-6">
            <SettledFeed />
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-12 sm:flex-row sm:items-center sm:px-6">
        <Link to="/new">
          <Button size="lg">Create a listing</Button>
        </Link>
        <Link to="/docs">
          <Button size="lg" variant="ghost">
            How confirmation works
          </Button>
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
