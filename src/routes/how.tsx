import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/how")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "how" });
  },
  component: () => null,
});
