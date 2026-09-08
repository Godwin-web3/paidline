import { createFileRoute } from "@tanstack/react-router";
import { gateFor } from "@/lib/paidline/invoices";

export const Route = createFileRoute("/api/gate/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const id = Number(params.id);
        if (!Number.isInteger(id) || id < 1) {
          return Response.json({ error: "Bad invoice id." }, { status: 400 });
        }
        const origin = new URL(request.url).origin;
        const { status, body } = await gateFor(id, origin);
        return Response.json(body, {
          status,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
