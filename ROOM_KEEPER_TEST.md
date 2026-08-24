# Room Keeper — Full Test Guide

Use this checklist to test every Room Keeper feature end-to-end on your deployed site (or `npm run dev` locally).

---

## Prerequisites

1. App running with DB connected (Neon + `DATABASE_URL` in `.env`)
2. Two browser profiles (or normal + incognito) — **Account A** (you) and **Account B** (optional, for follow tests)
3. **Important:** The board is empty on a fresh deploy (`$0 raised`, 0 listings). You **must claim #1 first** before Discovery bets, rivals, or pins work.

### Step 0 — Claim #1 (do this first)

1. Go to **`https://kingbid.lol/#claim`**
2. Paste your product URL (e.g. `nestly.io`) and pay the minimum **$5**
3. Complete checkout — your listing now appears on the global board **and** in room dropdowns
4. Only then can you add Discovery bets, pin listings, etc.

---

## Level ladder (what unlocks what)

| Level | How to earn | What to test |
|-------|-------------|--------------|
| **Observer** | Visit any room | Room header, stats, keeper progress rail |
| **Member** | 1 Discovery bet on `/founders` | Discovery form works |
| **Scout** | 3 Discovery bets | Score starts climbing |
| **Keeper** | Curate 1 active room + Score ≥ 20 | Request room at `/rooms/request` |
| **Senior Keeper** | 3 active rooms + Score ≥ 50 | Pin listings + weekly events |
| **Legendary** | 5 rooms + Score ≥ 100 | Profile badge |

**Shortcut for pin/events:** If you are the **curator** of a room, Keeper tools (pin + weekly event) appear even before Senior Keeper.

---

## 1. Enter a category room

1. Go to **`/rooms`**
2. Click any room (e.g. AI Agents) → opens `/?room=ai-agents`
3. Confirm you see:
   - Community header (keeper, **Members** count, bids, clicks)
   - **Follow room** button
   - This week events · Keepers panel · Underdogs
   - Bid form + leaderboard

**Pass:** Room loads wide layout, stats show real DB numbers.

---

## 2. Follow a room + feed

1. On a room page, click **Follow room**
2. Button changes to **Following**
3. **Members** count increases by 1
4. Go to **`/feed`**
5. Room appears under **Rooms you follow**
6. **Recent activity** shows `Following [room] — waiting for bids & crown changes`

**Note:** Bid/dethronement events only appear after someone claims a spot on the board. Empty board = subscription line only (correct behavior).

---

## 3. Discovery bets → Member / Scout

**Requires Step 0 — at least 1 live listing on the board.**

1. **`/founders`** → pick from the **dropdown** (not free-text)
2. **Add bet** → revisit room → **Member** on progress rail
3. Add 2 more bets → progress toward **Scout**

**If board is empty:** UI shows "Claim #1 on homepage" — typing `nestly.io` manually will fail.

**Pass:** `/api/me` shows `discoveryBets`; keeper level updates on room visit.

---

## 4. Request a room (Keeper / Curator path)

1. On **`/founders`**, note your Kingbid Score
2. Go to **`/rooms/request`**
3. Submit slug, name, type
4. Score ≥ 30 → active immediately; else approve in **`/admin`**

**Pass:** You become **curator** — Keeper panel shows "You curate this room" and **Keeper tools** unlock.

**Note:** "Indie SaaS" (your custom room) ≠ "AI agents" (category room). Member count is per-room — follow each room separately.

---

## 5. Nested geo rooms (`/rooms/india/saas`)

### Create parent geo room

1. **`/rooms/request`**
   - Slug: `india`
   - Name: `India`
   - Type: **Geo / region**

### Create child sub-room

1. **`/rooms/request`**
   - Slug: `saas`
   - Name: `India SaaS`
   - Type: **Tech stack**
   - Parent: **India (india)**

### Browse nested path

1. Open **`/rooms/india`** → hub with **India SaaS** sub-room link
2. Open **`/rooms/india/saas`**
   - If linked to a category board → redirects to `/?room=…`
   - Otherwise → nested hub page with breadcrumbs

**Pass:** URL path resolves; breadcrumbs show `Rooms / india / saas`.

---

## 6. Pin products (Senior Keeper / Curator)

**Requires:** A listing on that room's board + curator or Senior Keeper access.

1. Enter a category room where you are **curator** (or have Senior Keeper level)
2. Scroll to **Keeper tools**
3. Enter a listing **slug** from that room's leaderboard
4. Click **Pin**
5. **Pinned by keepers** section appears above leaderboard
6. Click **Unpin** to remove

**Limits:** Max 3 pins per room.

**API:**
```bash
curl -X POST https://YOUR_DOMAIN/api/rooms/ai-agents/pins \
  -H "Content-Type: application/json" \
  -d '{"listingSlug":"YOUR_SLUG"}' -b cookies.txt
```

---

## 7. Weekly room events (Senior Keeper / Curator)

1. In **Keeper tools**, enter event title (e.g. `Breakout week`)
2. Click **Create**
3. **This week** event feed shows 📅 event
4. Event also appears on **`/feed`** for room followers

**Limit:** Max 2 weekly events per room per week.

**API:**
```bash
curl -X POST https://YOUR_DOMAIN/api/rooms/ai-agents/weekly-events \
  -H "Content-Type: application/json" \
  -d '{"title":"Breakout week","description":"Watch underdogs climb"}' -b cookies.txt
```

---

## 8. Follow a founder

1. Open a keeper profile: **`/profile/{userId}`** (link from room header)
2. Click **Follow founder**
3. Go to **`/feed`** → founder listed under **Founders**
4. Their Discovery bet activity appears in feed

**Second browser:** Use Account B to follow Account A's profile and confirm feed updates.

---

## 9. Profile stats (fixed metrics)

On **`/profile/{your-id}`** confirm:

| Stat | Meaning |
|------|---------|
| **Room members** | People following your curated/keeper rooms (follow graph, not listing count) |
| **Discovery picks** | Your Discovery list size |
| **Successful calls** | Picks that **reached #1 at any point after** you added them (uses reign history) |

**Pass:** Labels match behavior; numbers change when you follow rooms or hit #1 calls.

---

## 10. Room events feed

1. Claim or rebid in a room (creates platform activity)
2. **This week** panel updates (dethronements, new reigns, weekly events, pins)
3. Only current-week events shown by default

---

## 11. Full keeper progression smoke test

Minimal path without waiting for Score 100:

```
Homepage claim #1
  → /founders (3 discovery bets)
  → /rooms/request (create room if score ≥ 30, else admin approve)
  → /?room=YOUR-CATEGORY (follow room)
  → Keeper tools: pin + weekly event (as curator)
  → /feed (see room activity)
  → /profile/YOUR_ID (stats + rooms list)
  → /rooms/india + /rooms/india/saas (nested geo)
```

---

## 12. Verify checklist page

Cross-check against **`/verify`** and **`VERIFICATION.md`** for broader v2 features (Call It, rivals, pricing, etc.).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Keeper tools not visible | Must be **curator** of that room OR Senior Keeper+ globally |
| Pin fails "Listing not found" | Slug must be on **that room's** board |
| Feed empty | Follow at least one room or founder first |
| Nested room 404 | Parent must exist and be `active`; child `parentRoomId` must match |
| Members count 0 | Click **Follow room** — members = followers + non-observer keepers |

---

## Quick URLs

| Page | URL |
|------|-----|
| Room index | `/rooms` |
| Category room | `/?room=ai-agents` |
| Founder Hub | `/founders` |
| Follow feed | `/feed` |
| Request room | `/rooms/request` |
| Geo nested | `/rooms/india/saas` |
| Your profile | `/founders` → link at bottom, or `/profile/{userId}` from `/api/me` |
| Admin approve | `/admin` |
