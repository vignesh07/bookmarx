"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { links } from "@/db/schema";
import { fetchAndParseArticle } from "@/lib/article";

export async function fetchArticle(linkId: string) {
  const decodedId = decodeURIComponent(linkId);
  const [link] = await db
    .select()
    .from(links)
    .where(eq(links.id, decodedId))
    .limit(1);

  if (!link) throw new Error("link not found");

  const url = link.expandedUrl ?? link.url;

  try {
    const parsed = await fetchAndParseArticle(url);
    await db
      .update(links)
      .set({
        articleHtml: parsed.html,
        articleText: parsed.text,
        articleByline: parsed.byline,
        articleExcerpt: parsed.excerpt,
        articleLeadImage: parsed.leadImage,
        articleWordCount: parsed.wordCount,
        articleFetchedAt: new Date(),
        articleError: null,
        title: link.title ?? parsed.title,
        siteName: link.siteName ?? parsed.siteName,
      })
      .where(eq(links.id, decodedId));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(links)
      .set({
        articleFetchedAt: new Date(),
        articleError: message,
      })
      .where(eq(links.id, decodedId));
  }

  redirect(`/a/${encodeURIComponent(decodedId)}`);
}
