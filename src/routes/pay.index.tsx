import { createFileRoute } from "@tanstack/react-router";
import { OpenBoard } from "@/components/open-board";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/pay/")({
  head: () => ({ meta: [{ title: "Marketplace · Paidline" }] }),
  component: Marketplace,
});

function Marketplace() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader title="Marketplace">
        First matching USDC on Ethereum claims the listing. Looking is free.
      </PageHeader>
      <div className="mt-8">
        <OpenBoard searchable />
      </div>
    </main>
  );
}
