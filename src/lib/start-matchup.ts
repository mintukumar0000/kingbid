/** Create a matchup and confirm both sides so it goes live immediately. */
export async function createAndActivateMatchup(
  listingAId: string,
  listingBId: string
): Promise<{ id: string } | { error: string }> {
  const createRes = await fetch("/api/matchups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ listingAId, listingBId }),
  });
  const created = await createRes.json();
  if (!createRes.ok) {
    return { error: (created.error as string) ?? "Could not start battle." };
  }

  for (const listingId of [listingAId, listingBId]) {
    const confirmRes = await fetch(`/api/matchups/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ listingId }),
    });
    const body = await confirmRes.json();
    if (!confirmRes.ok) {
      return { error: (body.error as string) ?? "Battle created but activation failed." };
    }
  }

  return { id: created.id as string };
}
