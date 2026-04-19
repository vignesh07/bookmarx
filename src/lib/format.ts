const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
  ["second", 1],
];

export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((d.getTime() - Date.now()) / 1000);
  for (const [unit, secondsInUnit] of UNITS) {
    if (Math.abs(seconds) >= secondsInUnit || unit === "second") {
      return RTF.format(Math.round(seconds / secondsInUnit), unit);
    }
  }
  return "just now";
}

const COMPACT = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function compactNumber(n: number): string {
  return COMPACT.format(n);
}

const FULL = new Intl.NumberFormat("en");

export function formatNumber(n: number): string {
  return FULL.format(n);
}

const DATE = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return DATE.format(d);
}

export function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 230));
}

// X auto-appends `https://t.co/…` tokens to tweet text for every
// attached photo, video, or card. In a reader view those are always
// redundant with the media/link card we render alongside, so strip
// any t.co URL from the body, then collapse the whitespace it left.
const TCO = /https?:\/\/t\.co\/\w+/gi;

export function cleanTweetText(text: string): string {
  return text.replace(TCO, "").replace(/[ \t]+\n/g, "\n").replace(/\s{2,}/g, " ").trim();
}
