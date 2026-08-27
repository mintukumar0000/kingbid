import { Header } from "@/components/Header";
import { CrownsHome } from "@/components/crowns/CrownsHome";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="flex-1">
      <Header />
      <CrownsHome />
    </main>
  );
}
