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

## When the endpoint rotates

X rotates GraphQL query IDs and feature flags every few months. When
syncs start failing or returning empty pages:

1. Open https://x.com/i/bookmarks in Chrome with DevTools → Network
2. Scroll the page to trigger a request
3. Find the `Bookmarks` request and copy its query ID from the URL
4. Update `BOOKMARKS_QUERY_ID` and `FEATURES` in `src/xapi.js`
5. Reload the extension
