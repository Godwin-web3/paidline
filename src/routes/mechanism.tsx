import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/mechanism")({
  beforeLoad: () => {
    throw redirect({ to: "/how" });
  },
  component: () => null,
});
