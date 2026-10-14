import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0E0A0B",
        padding: 64,
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ display: "flex", color: "#F3ECE6", fontSize: 32 }}>Sigilla</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          <div style={{ display: "flex", color: "#F3ECE6", fontSize: 52, lineHeight: 1.15 }}>
            &ldquo;Every answer, sealed by its source.&rdquo;
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: 300,
            background: "#171113",
            border: "1px solid #2E2225",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", color: "#F3ECE6", fontSize: 20 }}>Shipping times?</div>
          <div style={{ display: "flex", color: "#A8999A", fontSize: 18 }}>
            3–5 business days, duties at checkout
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                marginLeft: 6,
                borderRadius: 999,
                background: "#9E2F45",
                color: "#F3ECE6",
                fontSize: 12,
              }}
            >
              1
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", color: "#6B5A5D", fontSize: 20 }}>sigilla.app</div>
    </div>,
    size,
  );
}
