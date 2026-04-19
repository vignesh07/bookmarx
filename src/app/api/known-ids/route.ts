import { NextResponse } from "next/server";
import { isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { bookmarks } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const rows = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(isNull(bookmarks.deletedAt));
  return NextResponse.json(
    { ids: rows.map((r) => r.id) },
    { headers: CORS_HEADERS },
  );
}
