import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/how")({
  beforeLoad: () => {
    throw redirect({ to: "/docs", hash: "how" });
  },
  component: () => null,
});
