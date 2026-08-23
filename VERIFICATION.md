# KingBid — Verification Checklist

How to confirm, feature by feature, that what got built actually matches the specs. Written as things you can personally click through — not "check that it works," but the exact action and the exact thing you should see.

## How to use this

Go in order. Each phase depends on the one before it — don't verify Phase 2 items if Phase 0 is still failing, since half of Phase 2 (notifications, verification badges) is meaningless on a site that still looks fake. Check the box in your own head or a doc; if an item fails, that's your bug report, already written in plain language for whoever's fixing it.

Interactive version: [kingbid.lol/verify](https://kingbid.lol/verify)

## Phase 0 — Trust basics (blocks everything else)

- [ ] Load the homepage logged out. The online/visitor counter shows a real number, not "—".
- [ ] The "made $X since launch" line (or equivalent) shows a real, non-placeholder figure.
- [ ] Read the homepage and rules copy side by side with outbid.lol's. It should read as clearly your own words, not a close paraphrase.
- [ ] Every empty state (an empty room, a room with 0 listings) says something honest like "0 listings — be the first," never a blank space or a dash that could be mistaken for a broken number.

## Phase 1 — Rooms, Keepers, Reigns, Underdog

**Rooms**

- [ ] Visit a category room directly (e.g. `/?room=ai-agents`). Confirm it shows: leaderboard, keeper name, member count, total bids, total clicks — all real numbers pulled from the DB, not hardcoded.
- [ ] Try to submit a listing to a room you weren't invited to. Confirm it either requires a claim link/token, or requires your own submission — never appears without your action.
- [ ] Nest one room under another (e.g. `/rooms/india/saas`) and confirm the URL and breadcrumb both reflect the parent/child relationship.

**Room Keepers**

- [ ] Find a room with a keeper assigned. Visit that keeper's public profile. Confirm it shows rooms curated, member count, and "products discovered" — pulling real data, not placeholder text.
- [ ] Trigger a keeper level-up condition (e.g. nominate 3 products with a test account) and confirm the level actually changes and unlocks the stated privilege (e.g. Keeper → can create one room) rather than just changing a label.

**Reigns / dethronements**

- [ ] Place a bid that takes #1 in a room. Confirm the previous #1's listing card now shows a closed reign with a duration, not just a rank change.
- [ ] Check that listing's public history/timeline page. Confirm the old reign appears permanently, even though they're no longer #1.
- [ ] Dethrone the same listing twice with a test account and confirm a "comeback" is logged the second time it reclaims #1.

**Underdog Row**

- [ ] Claim a listing, self-report a revenue band, and place a small bid. Confirm it appears on the Underdog board, labeled "unverified."
- [ ] Confirm the underdog ranking is NOT identical to the money ranking — a small bidder with a low revenue band should be able to outrank a bigger dollar bid from a high revenue band.
- [ ] Confirm no exact revenue figure is displayed anywhere publicly — bands only.

## Phase 2 — Momentum, Rivals, Notifications, Kingmaker

- [ ] Bid up a listing quickly (several bids in an hour) and confirm it appears in "Breakout" or "Momentum" within the stated refresh window.
- [ ] Add a rival to a test listing. Have the rival get outbid or gain ground, and confirm you receive a notification referencing the rival by name and the actual dollar/rank gap — not a generic "something changed" message.
- [ ] Get your own test listing outbid and confirm the notification is specific ("dropped from #2 → #4, X is $26 ahead") not generic.
- [ ] Use "Call It" to predict a room's #1 at day's end with a test account. After resolution, confirm your prediction is marked correct/incorrect and confirm no payment screen or balance appeared anywhere in that flow.
- [ ] Check that account's Kingmaker score changed after a correct call.

## Phase 3 — Community, profiles, badges

- [ ] Follow a founder and a room with a test account. Confirm activity from both actually surfaces somewhere you'd see it (a feed, notifications) — a follow button that does nothing on the backend is a common half-built state.
- [ ] Open a founder's public profile. Confirm reigns, dethronements, comebacks, and Kingmaker score (if applicable) all show and match what you did with that test account.
- [ ] Copy the embeddable badge snippet for a listing, paste it into a blank HTML file, and confirm it renders and shows the correct live rank.

## Phase 4 — Fallen Fund (only if you've decided to build it)

- [ ] Confirm, by reading the code or asking the agent directly, that the weekly pool is calculated from platform revenue, not from any individual user's lost bid.
- [ ] Confirm recipient selection follows the published rule (e.g. "top 10 by underdog score, dethroned this week") and there is no random-selection code path anywhere in this feature.
- [ ] Confirm there is no code path that transfers Fallen Fund money to a personal bank account or balance — grants should only ever be visibility (homepage feature, spotlight, analytics access), never cash.
- [ ] Get a legal/payment review of this phase specifically before it goes live, regardless of how the above checks come back.

## Phase 5 — Monetization & migration

- [ ] Subscribe to Founder Pro or Room Pro with a real (small) test payment. Confirm the paid features (analytics, competitor tracking, custom branding, etc.) actually unlock — not just a "subscribed" badge with the same free-tier functionality underneath.
- [ ] Submit a migration claim referencing another platform. Confirm the resulting badge and profile text describe it as a self-reported claim ("previously competed on another pay-to-rank board") — never wording that implies an official import, data transfer, or verified integration.

## Cross-cutting checks (run these regardless of phase)

- [ ] Open two browser tabs, both about to bid the same amount on the same #1 spot. Submit both at nearly the same time. Confirm the system resolves this without letting both "win" or corrupting the listing's total.
- [ ] Try submitting a listing with someone else's real product URL that you have no claim link or invite for. Confirm it's rejected or requires ownership verification — this is the single most important check tied to the consent guardrail from the original spec.
- [ ] Search the live site's own copy for any invented number, testimonial, or "X people currently viewing" style claim that isn't backed by a real, checkable value. This is worth a full read-through, not a skim — it's the fastest way anyone else finds to discredit the whole "honest" positioning.

## Dodo Pro product IDs

Set on Vercel Production (or use built-in defaults):

- `DODO_FOUNDER_PRO_PRODUCT_ID` = `pdt_0Nm2z9ZHI8uSMGj2KPzcA`
- `DODO_ROOM_PRO_PRODUCT_ID` = `pdt_0Nm2zSAGAeI2UbUtdTKxd`
