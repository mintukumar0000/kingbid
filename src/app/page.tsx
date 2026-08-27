import { Header } from "@/components/Header";
import { StatsBar } from "@/components/StatsBar";
import { CrownsHome } from "@/components/crowns/CrownsHome";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="flex-1">
      <Header />
      <StatsBar />
      <CrownsHome />
    </main>
  );
}
