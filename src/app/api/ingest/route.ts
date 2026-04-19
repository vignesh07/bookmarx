import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { syncRuns } from "@/db/schema";
import { IngestPayload, ingestBookmarks } from "@/lib/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = process.env.INGEST_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "INGEST_TOKEN not configured on the server" },
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (provided !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = IngestPayload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const runId = randomUUID();
  await db.insert(syncRuns).values({
    id: runId,
    startedAt: new Date(),
    bookmarksSeen: 0,
    bookmarksNew: 0,
    bookmarksUpdated: 0,
    source: "extension",
  });

  try {
    const result = await ingestBookmarks(parsed.data.bookmarks);
    await db
      .update(syncRuns)
      .set({
        finishedAt: new Date(),
        bookmarksSeen: result.seen,
        bookmarksNew: result.inserted,
        bookmarksUpdated: result.updated,
      })
      .where(eq(syncRuns.id, runId));
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    await db
      .update(syncRuns)
      .set({
        finishedAt: new Date(),
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(syncRuns.id, runId));
    throw err;
  }
}
