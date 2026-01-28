# SnapPrice

SnapPrice is a lightweight MVP that lets users upload (or capture) a product photo, runs a visual search through a provider API, and returns a price-sorted grid of matching purchase options.

## Local setup

1) Install dependencies
```
npm install
```

2) Configure environment variables
```
cp .env.example .env
```

3) Set up the database
```
npm run prisma:generate
npm run prisma:migrate
```

4) Start the dev server
```
npm run dev
```

Open `http://localhost:3000`.

## Provider configuration

SnapPrice uses a provider adapter so you can swap product search APIs.

- `DATABASE_URL=...` (Postgres connection string)
- `PROVIDER_IDS=ebay,amazon,aliexpress`
- `EBAY_CLIENT_ID=...`
- `EBAY_CLIENT_SECRET=...`
- `EBAY_MARKETPLACE_ID=EBAY_MOTOR`
- `AMAZON_ACCESS_KEY_ID=...`
- `AMAZON_SECRET_ACCESS_KEY=...`
- `AMAZON_PARTNER_TAG=...`
- `AMAZON_HOST=webservices.amazon.com`
- `AMAZON_REGION=us-east-1`
- `ALIEXPRESS_APP_KEY=...`
- `ALIEXPRESS_APP_SECRET=...`
- `ALIEXPRESS_TRACK_ID=...`
- `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
- `DEMO_MODE=true` (optional)
- `SUPABASE_URL=...` (for uploads)
- `SUPABASE_SERVICE_ROLE_KEY=...` (server-only)
- `SUPABASE_STORAGE_BUCKET=snapprice-uploads`

Providers include eBay Motors, Amazon, and AliExpress. If credentials are missing, searches will return empty results for those providers.

## How it works

1) Upload image → stored in `public/uploads` (MVP)
2) Hash image → check 24h cache
3) Visual search provider → candidates
4) Normalize + dedupe → stable sort by total price
5) Persist results + display in grid with ad slots after every 8 cards

## Known limitations

- Exact matching is probabilistic; different lighting or angles may reduce match accuracy.
- Visual search providers vary in coverage and price accuracy.
- File storage is local for MVP and not durable across serverless deployments.
- Rate limiting is in-memory only.
- Demo mode can insert sample results when no matches are returned.

## Next improvements

- Add affiliate tracking links and additional providers (Bing, Amazon, eBay).
- Improve dedupe with product identifiers and stronger similarity matching.
- Move uploads to object storage (S3, GCS).
- Add SSR caching and background refresh for stale results.

## Minimal test plan

- Upload valid JPG/PNG/WebP below 8MB and verify results populate.
- Upload unsupported file type and confirm validation errors.
- Upload same image twice within 24h and confirm cache reuse.
- Verify sorting by Cheapest / Most expensive / Best match is stable.
- Verify ad slots appear after every 8 results without breaking the grid.
