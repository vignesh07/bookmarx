import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { syncRuns } from "@/db/schema";
import { IngestPayload, ingestBookmarks } from "@/lib/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init?.headers ?? {}) },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    return await handlePost(req);
  } catch (err) {
    // Catch-all so 500s still carry CORS headers — otherwise the browser
    // shows "No 'Access-Control-Allow-Origin' header" to the extension
    // and the real error is invisible.
    console.error("ingest error:", err);
    const message = err instanceof Error ? err.message : String(err);
    // postgres-js surfaces the actual constraint/field via .detail — the
    // default .message is just the parameterized SQL template, which is
    // useless for diagnosis.
    const detail =
      err && typeof err === "object" && "detail" in err
        ? String((err as { detail: unknown }).detail)
        : undefined;
    const constraint =
      err && typeof err === "object" && "constraint_name" in err
        ? String((err as { constraint_name: unknown }).constraint_name)
        : undefined;
    return jsonResponse(
      { error: "ingest failed", message, detail, constraint },
      { status: 500 },
    );
  }
}

async function handlePost(req: Request) {
  const token = process.env.INGEST_TOKEN;
  if (!token) {
    return jsonResponse(
      { error: "INGEST_TOKEN not configured on the server" },
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (provided !== token) {
    return jsonResponse({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid json" }, { status: 400 });
  }

  const parsed = IngestPayload.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
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
    return jsonResponse({ ok: true, ...result });
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
