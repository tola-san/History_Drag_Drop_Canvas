import { cookies } from "next/headers";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { verifySessionCookies } from "@/lib/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const allowed = new Set([
  "photo-01",
  "photo-02",
  "photo-03",
  "photo-04",
  "photo-05",
]);
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!allowed.has(id)) return new Response(null, { status: 404, headers });
  const session = await verifySessionCookies((await cookies()).getAll());
  if (session.status !== "authenticated")
    return new Response(null, {
      status: session.status === "unauthorized" ? 401 : 503,
      headers,
    });
  try {
    const photo = await readFile(
      path.join(process.cwd(), "private", "default-photos", `${id}.jpg`),
    );
    return new Response(new Uint8Array(photo), {
      headers: { ...headers, "Content-Type": "image/jpeg" },
    });
  } catch {
    return new Response(null, { status: 404, headers });
  }
}
