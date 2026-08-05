import { getDatabase } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const database = getDatabase();
  const result = database.prepare("SELECT 1 AS ok").get() as { ok: number };
  return Response.json(
    { status: result.ok === 1 ? "ok" : "error", service: "agroos", storage: "sqlite" },
    { headers: { "cache-control": "no-store" } },
  );
}
