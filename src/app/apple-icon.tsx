import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180, height: 180, borderRadius: 40,
        background: "#080e1a",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 130, height: 130, borderRadius: 24,
          background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 60, fontWeight: 900, color: "#080e1a",
        }}
      >
        26
      </div>
    </div>,
    { ...size }
  );
}
