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
        backgroundImage:
          "radial-gradient(circle at 88% 8%, rgba(158,47,69,0.55) 0%, rgba(158,47,69,0) 45%), radial-gradient(circle at 5% 100%, rgba(158,47,69,0.18) 0%, rgba(158,47,69,0) 40%)",
        padding: 72,
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "#9E2F45",
            color: "#F3ECE6",
            fontSize: 32,
          }}
        >
          S
        </div>
        <div style={{ display: "flex", color: "#F3ECE6", fontSize: 38, letterSpacing: 1 }}>Sigilla</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div style={{ display: "flex", color: "#E3B3BA", fontSize: 22, letterSpacing: 5, marginBottom: 22 }}>
            AI SUPPORT, WITH SOURCES
          </div>
          <div style={{ display: "flex", color: "#F3ECE6", fontSize: 62, lineHeight: 1.12 }}>
            Every answer, sealed by its source.
          </div>
          <div style={{ display: "flex", color: "#A8999A", fontSize: 26, marginTop: 26 }}>
            No-code AI support agents, trained on your docs.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            width: 360,
            background: "#171113",
            border: "1px solid #2E2225",
            borderRadius: 22,
            padding: 24,
            boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14, borderBottom: "1px solid #2E2225" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "#9E2F45",
                color: "#F3ECE6",
                fontSize: 18,
              }}
            >
              S
            </div>
            <div style={{ display: "flex", color: "#F3ECE6", fontSize: 20 }}>Concierge</div>
          </div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-end",
              background: "#2A1F22",
              color: "#F3ECE6",
              fontSize: 20,
              padding: "10px 16px",
              borderRadius: 16,
            }}
          >
            Do you ship to Switzerland?
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              background: "#0E0A0B",
              border: "1px solid #2E2225",
              color: "#F3ECE6",
              fontSize: 20,
              lineHeight: 1.4,
              padding: "12px 16px",
              borderRadius: 16,
            }}
          >
            Yes — 3–5 business days.
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                marginLeft: 8,
                borderRadius: 999,
                background: "#9E2F45",
                color: "#F3ECE6",
                fontSize: 14,
              }}
            >
              1
            </div>
          </div>
          <div style={{ display: "flex", color: "#E3B3BA", fontSize: 17 }}>Sealed by 2 sources</div>
        </div>
      </div>

      <div style={{ display: "flex", color: "#6B5A5D", fontSize: 22, letterSpacing: 2 }}>sigilla.app</div>
    </div>,
    size,
  );
}
