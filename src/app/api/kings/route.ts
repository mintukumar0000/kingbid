import { NextResponse } from "next/server";
import { getRowOfKings } from "@/lib/kings";

export const dynamic = "force-dynamic";

export async function GET() {
  const kings = await getRowOfKings();
  return NextResponse.json({ kings });
}
