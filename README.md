# Kingbid — the leaderboard money can buy

A production-ready **pay-to-rank leaderboard** (in the spirit of [kingbid.lol](https://kingbid.lol)).
Anyone can list a product website or X @handle. The **only ranking factor is the bid**.
Higher bid = higher rank — until someone outbids you.

## What's real vs demo

| Number | Source |
|---|---|
| Online now | Open SSE connections + visitors seen in the last 5 minutes |
| Visitors since launch | Unique hashed IPs that loaded the site |
| Revenue / completed bids | Sum of **completed** payments only |
| Clicks / trending | Rate-limited outbound clicks (1 counted click per IP per listing per 5 min) |
| Rank | Applied only after payment settles — pending checkouts do nothing |

`npm run db:seed` loads **demo listings** (real product URLs) so the board isn't empty on first run. It does **not** fake visitors or online users. Skip the seed if you want a completely empty board.

## Quick start (local)

```bash
npm install
npx prisma db push
npm run db:seed    # optional
npm run dev        # http://localhost:3000
```

Payments run in mock mode (`/checkout/mock`) until you add Polar keys. Emails log to the console.

## The rules

1. New listings start at **$5** (whole dollars, $1 steps, $999,999 max)
2. Taking **#1** requires the current top bid **+ $5**
3. Paying less still lands you wherever that total ranks
4. Equal bids: older listing stays higher
5. Raising costs only the **difference** (min $1)
6. A **completed payment** claims the rank
7. **Takeover**: 5× the top bid locks #1 for 3 hours

## Deploy to Vercel — what you need and what it costs

Monthly, for a new board at launch traffic (thousands of visitors/day):

| Service | Why | Free tier | Typical paid |
|---|---|---|---|
| **Vercel** Hobby | Hosting, HTTPS, CDN | $0 | Pro $20/mo when you need team + more bandwidth |
| **Neon or Supabase Postgres** | Listings, bids, clicks, visitors | Generous free DB | ~$0 until you outgrow free; $19–25/mo if you need always-on + backups |
| **Polar.sh** | Merchant of Record — they collect the bid, handle global sales tax, pay you out | 0/mo | **Polar keeps a platform fee** (check current Polar pricing; budget ~4–5% + card fees on each bid). You do **not** need Stripe directly. |
| **Resend** | Kingbid + confirmation emails | 3,000 emails/mo free | $20/mo at 50k emails |
| **Upstash Redis** (optional, recommended once you scale) | Shared rate-limit + cache across Vercel instances | 10k commands/day free | $10/mo |
| **Domain** | kingbid.yoursite.com | — | ~$12/year |
| **Vercel Analytics** | Page views | Free on Hobby | — |

**Launch budget if you already have a domain: $0/month** until Polar starts sending you bid payouts (they take their cut from each payment, not a subscription).

**Comfortable production budget: ~$20–50/month** (Vercel Pro and/or a paid Postgres) plus Polar's per-transaction fee.

### Steps

1. Create a Neon (or Supabase) Postgres database. Copy the pooled connection string.
2. In `prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"`.
3. Locally: `DATABASE_URL="postgresql://..." npx prisma db push` (do **not** run seed on production unless you want demo rows).
4. Polar.sh → create org → pay-what-you-want product → access token, product id, webhook `https://YOURDOMAIN/api/webhooks/polar` (checkout/order events) → webhook secret.
5. Resend → API key + verified sending domain.
6. Push this repo to GitHub → Import in Vercel → set env vars from `.env.example`:

```
DATABASE_URL
NEXT_PUBLIC_SITE_URL=https://YOURDOMAIN
ADMIN_PASSWORD=          # long random
POLAR_ACCESS_TOKEN=
POLAR_PRODUCT_ID=
POLAR_WEBHOOK_SECRET=
RESEND_API_KEY=
EMAIL_FROM=Kingbid <alerts@YOURDOMAIN>
```

7. Deploy. Add the Polar webhook after the first successful deploy.

When `POLAR_ACCESS_TOKEN` is set, mock checkout is disabled automatically.

> Serverless note: SSE live updates work on a single Vercel instance. For multi-region fan-out later, put the event bus on Upstash Redis pub/sub. Polling (12s) is already the fallback.

## Architecture

```
src/
├── app/           pages + API
├── components/    leaderboard, modal, feeds
├── hooks/         useLiveUpdates (SSE)
└── lib/           bidding, pricing, Polar, URL policy
```

A bid becomes a rank only after `/api/webhooks/polar` (or mock-pay) calls `confirmBid()`, which is serialized and row-locked, then `emitLive()` pushes an SSE event to every open tab.
