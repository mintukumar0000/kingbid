import { handleBidRequest } from "@/lib/bid-request";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleBidRequest(request);
}
