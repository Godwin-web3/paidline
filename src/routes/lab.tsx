import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/lab")({
  beforeLoad: () => {
    throw redirect({ to: "/how" });
  },
  component: () => null,
});
