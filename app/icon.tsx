import { ImageResponse } from "next/og";
import { loadSerifFont } from "@/lib/og-fonts";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const serif = await loadSerifFont();
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
          backgroundImage: "linear-gradient(145deg, #B8405A 0%, #9E2F45 55%, #7A2236 100%)",
          borderRadius: "24%",
          color: "#F3ECE6",
          fontSize: 22,
          fontFamily: "Instrument Serif",
        }}
      >
        S
      </div>
    ),
    { ...size, fonts: [{ name: "Instrument Serif", data: serif, style: "normal", weight: 400 }] },
  );
}
