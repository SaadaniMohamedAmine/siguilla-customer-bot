# Sources

An agent only knows what you give it. Sigilla supports three kinds of sources.

## PDFs

Upload PDF files up to 10 MB each. Sigilla reads the text, splits it into chunks, and embeds each chunk for retrieval.

## Websites

Give Sigilla a starting URL. It follows your `sitemap.xml` when present, otherwise crawls links on the same domain, respecting `robots.txt`. The number of pages crawled per site is capped by your plan.

## Notion (Pro and Team)

Connect a Notion workspace and pick the pages you want indexed. Sigilla re-syncs them the same way as any other source.

## Re-syncing and removing

Click **Resync** on any source to re-crawl or re-read it — only changed chunks are re-embedded, and stale ones are removed. Deleting a source removes its chunks immediately; your agent stops citing it right away.
