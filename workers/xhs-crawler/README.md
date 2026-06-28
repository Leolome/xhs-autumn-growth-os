# XHS Crawler Worker

Independent low-frequency worker for public XHS operating metrics. It is intentionally outside Next.js and Vercel Serverless.

## Modes

```bash
pnpm crawler:dry-run
pnpm crawler:fixture
pnpm crawler:run
```

- `dry-run`: does not access real pages. Reads mock `crawl_targets`, generates simulated `account_snapshots` / `note_snapshots`, and logs the write pipeline.
- `fixture`: reads local files from `workers/xhs-crawler/fixtures` to test parser behavior without real network.
- `live-public`: reads due `crawl_targets` from Supabase, fetches public pages at a low frequency, writes snapshots/errors, and updates target schedules.

## Environment

Worker writes use the service role key and must only run in a trusted worker environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Do not use the browser anon key for worker writes.

Optional:

```bash
CRAWLER_REQUEST_TIMEOUT_MS=12000
CRAWLER_REQUEST_DELAY_MS=1500
CRAWLER_WRITE_TO_SUPABASE=true
CRAWLER_FIXTURES_DIR=workers/xhs-crawler/fixtures
```

`dry-run` and `fixture` default to in-memory logging unless `CRAWLER_WRITE_TO_SUPABASE=true` is explicitly set.

## Data Flow

```txt
load due crawl_targets
-> create crawl_runs
-> crawl target
-> write account_snapshots / note_snapshots
-> write crawl_errors for failures
-> update crawl_targets last_crawled_at / next_crawled_at
-> complete crawl_runs
```

## Compliance Boundary

This Worker is only for low-frequency public data monitoring and internal operating review.

Forbidden:

- automatic likes
- automatic collects
- automatic comments
- automatic private messages
- verification bypass
- abnormal bulk requests
- fake user interactions
- scraping non-public data
- storing sensitive personal privacy

If a page is blocked, asks for verification, times out, or cannot be parsed, the Worker records `crawl_errors` and relies on frontend manual / CSV supplementation.
