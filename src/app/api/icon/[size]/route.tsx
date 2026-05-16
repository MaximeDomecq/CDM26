import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params;
  const size = parseInt(sizeStr, 10) || 192;
  const pad = Math.round(size * 0.13);
  const sq = size - pad * 2;
  const sqR = Math.round(size * 0.09);
  const fontSize = Math.round(size * 0.38);

  return new ImageResponse(
    <div
      style={{
        width: size, height: size,
        background: "#080e1a",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        style={{
          width: sq, height: sq, borderRadius: sqR,
          background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize, fontWeight: 900, color: "#080e1a",
        }}
      >
        26
      </div>
    </div>,
    { width: size, height: size }
  );
}
