import { getLeaderboard } from "@/lib/leaderboard";
import { Header } from "@/components/Header";
import { HomeClient } from "@/components/HomeClient";
import { headers } from "next/headers";
import { getCountryFromHeaders } from "@/lib/geo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const countryCode = getCountryFromHeaders(await headers());
  const initialData = await getLeaderboard(1, 50, "global", countryCode);

  return (
    <main className="flex-1">
      <Header />
      <HomeClient initialData={initialData} viewerCountry={countryCode} />
    </main>
  );
}
