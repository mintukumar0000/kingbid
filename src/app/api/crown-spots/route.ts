import { getAllCrownSpotStates, getCrownSpotStats } from "@/lib/crown-spots-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const spots = await getAllCrownSpotStates();
  const stats = await getCrownSpotStats(spots);
  return Response.json({ spots, stats });
}
