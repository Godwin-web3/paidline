import { createFileRoute } from "@tanstack/react-router";
import { OpenBoard } from "@/components/open-board";

export const Route = createFileRoute("/pay/")({ component: Marketplace });

function Marketplace() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Marketplace</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        First matching payment claims the listing.
      </p>
      <div className="mt-8">
        <OpenBoard />
      </div>
    </main>
  );
}
