import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rank = searchParams.get("rank") ?? "1";
  const amount = searchParams.get("amount") ?? "5";
  const name = searchParams.get("name") ?? "kingbid.lol";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #fefaf6 0%, #fff1ec 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#8a7e76", marginBottom: 16 }}>kingbid.lol</div>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#1c1917", textAlign: "center", maxWidth: "90%" }}>
          I claimed #{rank}
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, color: "#e55b3c", marginTop: 12 }}>
          ${Number(amount).toLocaleString("en-US")}
        </div>
        <div style={{ fontSize: 32, color: "#1c1917", marginTop: 24, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 22, color: "#8a7e76", marginTop: 32 }}>Think you can outbid me?</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
