import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export type ParsedArticle = {
  title: string | null;
  byline: string | null;
  siteName: string | null;
  excerpt: string | null;
  html: string;
  text: string;
  leadImage: string | null;
  wordCount: number;
};

const FETCH_TIMEOUT_MS = 15_000;

// Real-browser UA: many publishers serve a stripped page or a 403 to
// obvious bots. We're not scraping at scale — one article per user
// click — so identifying as a real browser is appropriate.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export async function fetchAndParseArticle(url: string): Promise<ParsedArticle> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("html")) {
    throw new Error(`not an article (content-type: ${contentType || "unknown"})`);
  }

  const html = await res.text();

  // The second arg (url) teaches jsdom how to resolve relative links
  // inside the article so they stay clickable in the rendered body.
  const dom = new JSDOM(html, { url: res.url });
  const reader = new Readability(dom.window.document, {
    charThreshold: 300,
  });
  const article = reader.parse();

  if (!article || !article.content) {
    throw new Error("no parseable article content");
  }

  const leadImage = extractLeadImage(html, article.content);

  return {
    title: article.title ?? null,
    byline: article.byline ?? null,
    siteName: article.siteName ?? null,
    excerpt: article.excerpt ?? null,
    html: article.content,
    text: article.textContent ?? "",
    leadImage,
    wordCount: (article.textContent ?? "").split(/\s+/).filter(Boolean).length,
  };
}

function extractLeadImage(sourceHtml: string, articleHtml: string): string | null {
  // Prefer og:image from the original page — it's the editor-curated
  // hero. Fall back to the first <img> inside the parsed article body.
  const og = sourceHtml.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  );
  if (og?.[1]) return og[1];
  const twitter = sourceHtml.match(
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  );
  if (twitter?.[1]) return twitter[1];
  const firstImg = articleHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  return firstImg?.[1] ?? null;
}
