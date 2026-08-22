// Concurrency stress test: creates N bid intents on the SAME listing, then
// fires all payment confirmations simultaneously. If the transaction logic is
// correct, the final listing total must equal the sum of all payments —
// no lost updates, no double counting.
//
// Usage: node scripts/concurrency-test.mjs [count]

const BASE = "http://localhost:3000";
const N = parseInt(process.argv[2] ?? "30", 10);
const TARGET = "concurrency-test-target.dev";

async function createIntent(i) {
  const res = await fetch(`${BASE}/api/bids`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // unique IP per request so the per-IP rate limit doesn't interfere with the test
      "x-forwarded-for": `10.99.${Math.floor(i / 250)}.${(i % 250) + 1}`,
    },
    body: JSON.stringify({
      url: TARGET,
      amount: i === 0 ? 10 : 1, // first bid creates the listing at $10, rest raise by $1
      title: "Concurrency Target",
      description: "Stress test listing",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`intent ${i} failed: ${data.error}`);
  return data.paymentId;
}

async function confirm(paymentId) {
  const res = await fetch(`${BASE}/api/mock-pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`confirm failed: ${data.error}`);
  return data;
}

async function removeTarget() {
  const board = await fetch(`${BASE}/api/listings?limit=100`).then((r) => r.json());
  const entry = board.entries.find((e) => e.displayUrl === TARGET);
  if (entry) {
    await fetch(`${BASE}/api/admin?listingId=${entry.id}`, {
      method: "DELETE",
      headers: { "x-admin-password": process.env.ADMIN_PASSWORD ?? "admin123" },
    });
    console.log("(cleaned up previous test listing)");
  }
}

await removeTarget();

// First bid must complete first so subsequent intents are treated as raises.
console.log(`Creating listing + ${N - 1} raise intents…`);
const first = await createIntent(0);
await confirm(first);

const rest = [];
for (let i = 1; i < N; i++) rest.push(await createIntent(i));

console.log(`Firing ${rest.length} payment confirmations CONCURRENTLY…`);
const t0 = Date.now();
const results = await Promise.allSettled(rest.map((p) => confirm(p)));
const ok = results.filter((r) => r.status === "fulfilled").length;
const failed = results.filter((r) => r.status === "rejected");
console.log(`Done in ${Date.now() - t0}ms — ${ok} succeeded, ${failed.length} failed`);
failed.slice(0, 3).forEach((f) => console.log("  sample failure:", f.reason.message));

const board = await fetch(`${BASE}/api/listings?limit=100`).then((r) => r.json());
const entry = board.entries.find((e) => e.displayUrl === TARGET);
const expected = 10 + (N - 1) * 1;

console.log(`\nExpected total: $${expected}`);
console.log(`Actual total:   $${entry?.currentBid}`);
const pass = entry?.currentBid === expected && failed.length === 0;
console.log(pass ? "✅ PASS — no lost updates under concurrency" : "❌ FAIL — totals diverged or confirmations failed");
await removeTarget();
process.exit(pass ? 0 : 1);
