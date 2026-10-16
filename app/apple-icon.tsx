import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#9E2F45",
          backgroundImage: "linear-gradient(145deg, #B8405A 0%, #9E2F45 45%, #6E1F30 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 128,
            height: 128,
            borderRadius: 999,
            border: "3px solid rgba(243,236,230,0.55)",
            color: "#F3ECE6",
            fontSize: 84,
            fontFamily: "Georgia, serif",
          }}
        >
          S
        </div>
      </div>
    ),
    size,
  );
}
