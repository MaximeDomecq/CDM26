import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32, height: 32, borderRadius: 8,
        background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 900, color: "#080e1a",
      }}
    >
      26
    </div>,
    { ...size }
  );
}
