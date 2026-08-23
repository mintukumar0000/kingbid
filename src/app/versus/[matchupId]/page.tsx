import { Header } from "@/components/Header";
import { VersusInteractive } from "@/components/VersusInteractive";
import { PAGE } from "@/lib/layout";

type Props = { params: Promise<{ matchupId: string }> };

export default async function VersusPage({ params }: Props) {
  const { matchupId } = await params;

  return (
    <main className="flex-1">
      <Header />
      <div className={`${PAGE} py-10`}>
        <h1 className="text-center text-2xl font-bold">Versus</h1>
        <VersusInteractive matchupId={matchupId} />
      </div>
    </main>
  );
}
