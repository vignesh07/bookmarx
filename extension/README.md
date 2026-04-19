# Bookmarx Sync — browser extension

Pulls your X bookmarks into your self-hosted Bookmarx instance.

## Install (developer mode)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `extension/` directory
5. Pin the extension to the toolbar
6. Open it, paste your server URL and `INGEST_TOKEN`, hit **Save**, then **Sync now**
7. Stay signed in to x.com in another tab during the sync

## How it works

The extension scrapes X's internal Bookmarks GraphQL endpoint using
your own session cookies — no bot account, no API key, no $200/month
tier. Bookmarks are uploaded to `/api/ingest` on your Bookmarx
server in batches of 50 with a small delay between pages to stay
under rate limits.

The query ID and feature flags X embeds in its requests rotate every
few months. The extension self-updates by silently sniffing your own
browser for the live values whenever you visit `x.com/i/bookmarks`,
and on first sync it briefly opens that page in a background tab to
capture them. No DevTools dance required.
