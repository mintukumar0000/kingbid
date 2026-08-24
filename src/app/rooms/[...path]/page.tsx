import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CommunityRoomInterior } from "@/components/CommunityRoomInterior";
import { PAGE } from "@/lib/layout";
import { resolveRoomByPath } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export default async function NestedRoomPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const room = await resolveRoomByPath(path);
  if (!room) notFound();

  if (room.category?.slug) {
    redirect(`/?room=${room.category.slug}`);
  }

  const pathStr = path.join("/");

  return (
    <main className="flex-1">
      <Header />

      {room.childRooms.length > 0 ? (
        <div className={`${PAGE} py-10`}>
          <nav className="text-[13px] text-muted">
            <Link href="/rooms" className="hover:text-accent">
              Rooms
            </Link>
            {path.slice(0, -1).map((segment, i) => (
              <span key={segment}>
                {" "}
                /{" "}
                <Link href={`/rooms/${path.slice(0, i + 1).join("/")}`} className="hover:text-accent">
                  {segment}
                </Link>
              </span>
            ))}
            <span className="text-foreground"> / {room.name}</span>
          </nav>

          <h1 className="font-display mt-4 text-[32px] font-semibold">{room.name}</h1>
          <p className="mt-2 text-[15px] text-muted">{room.description || `${room.roomType} room`}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {room.childRooms.map((child) => (
              <Link
                key={child.slug}
                href={`/rooms/${pathStr}/${child.slug}`}
                className="luxury-card block p-5 transition-colors hover:border-accent"
              >
                <p className="font-semibold">{child.name}</p>
                <p className="mt-1 text-[12px] text-muted capitalize">{child.roomType.replace(/_/g, " ")}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <CommunityRoomInterior roomSlug={room.slug} categorySlug={room.category?.slug} roomName={room.name} />
    </main>
  );
}
