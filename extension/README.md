# Bookmarx Sync — browser extension

Pulls your X bookmarks into your local Bookmarx instance.

## Install (developer mode)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `extension/` directory
5. Pin the extension to the toolbar
6. Make sure your local Bookmarx server is running (`pnpm dev` in the
   repo root) and you're signed into x.com in another tab
7. Open the popup and hit **Sync now**

The extension talks to `http://localhost:3000` by default. If you
run the dev server on another port, edit the `serverUrl` constant in
`src/background.js` and reload the extension.

## How it works

The extension scrapes X's internal Bookmarks GraphQL endpoint using
your own session cookies — no bot account, no API key, no $200/month
tier. Bookmarks are uploaded to `/api/ingest` on your local Bookmarx
server in batches of 50 with a small delay between pages to stay
under rate limits.

The query ID and feature flags X embeds in its requests rotate every
few months. The extension self-updates by silently sniffing your own
browser for the live values whenever you visit `x.com/i/bookmarks`,
and on first sync it briefly opens that page in a background tab to
capture them. No DevTools dance required.
