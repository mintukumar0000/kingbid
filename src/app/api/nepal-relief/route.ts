import { NextResponse } from "next/server";
import { getCampaignDashboard, isCampaignUiEnabled } from "@/lib/nepal-campaign";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isCampaignUiEnabled()) {
    return NextResponse.json({ enabled: false });
  }
  const data = await getCampaignDashboard();
  return NextResponse.json({ enabled: true, ...data });
}
