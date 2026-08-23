import { NextResponse } from "next/server";
import { getOrCreateSessionUser } from "@/lib/users";
import { getFollowFeed } from "@/lib/follows";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateSessionUser();
  const feed = await getFollowFeed(user.id);
  return NextResponse.json(feed);
}
