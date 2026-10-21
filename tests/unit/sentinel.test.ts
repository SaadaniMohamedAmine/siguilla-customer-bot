import { describe, it, expect } from "vitest";
import { SentinelGuard, stripSentinel, FALLBACK_SENTINEL } from "@/lib/rag/fallback";

/** Rejoue un flux par morceaux et renvoie ce qui serait émis au visiteur. */
function stream(pieces: string[]) {
  const guard = new SentinelGuard();
  let out = "";
  for (const p of pieces) {
    out += guard.push(p);
    if (guard.stopped) break;
  }
  if (!guard.stopped) out += guard.flush();
  return { out, stopped: guard.stopped };
}

describe("stripSentinel", () => {
  it("keeps everything before the marker, without trailing whitespace", () => {
    expect(stripSentinel(`Sigilla is a platform.\n\n${FALLBACK_SENTINEL}`)).toBe("Sigilla is a platform.");
    expect(stripSentinel(`A. ${FALLBACK_SENTINEL} and then more text`)).toBe("A.");
  });

  it("returns an empty string when the answer is only the marker, even after whitespace", () => {
    expect(stripSentinel(FALLBACK_SENTINEL)).toBe("");
    expect(stripSentinel(`  \n${FALLBACK_SENTINEL}`)).toBe("");
  });

  it("leaves a normal answer untouched", () => {
    expect(stripSentinel("A normal answer [1].")).toBe("A normal answer [1].");
  });
});

describe("SentinelGuard", () => {
  it("passes a normal answer through unchanged", () => {
    expect(stream(["Hello ", "world", "."]).out).toBe("Hello world.");
  });

  it("emits nothing and stops when the answer is only the marker", () => {
    expect(stream([FALLBACK_SENTINEL])).toEqual({ out: "", stopped: true });
  });

  it("drops a marker at the end of a partial answer, with the blank lines before it", () => {
    const r = stream(["Sigilla is a platform [1].", `\n\n${FALLBACK_SENTINEL}`]);
    expect(r.out).toBe("Sigilla is a platform [1].");
    expect(r.stopped).toBe(true);
  });

  it("catches a marker split across several pieces", () => {
    const r = stream(["Part one.", "\n\nNO_", "VERIFIED", "_ANSWER"]);
    expect(r.out).toBe("Part one.");
    expect(r.stopped).toBe(true);
  });

  it("drops a marker in the middle together with everything after it", () => {
    const r = stream([`First half. ${FALLBACK_SENTINEL} Second half that must not appear.`]);
    expect(r.out).toBe("First half.");
  });

  it("does not hold back real words that merely start like the marker", () => {
    const r = stream(["NO ", "NOT ", "NO_VERIFIED is not the marker", " yet."]);
    expect(r.out).toBe("NO NOT NO_VERIFIED is not the marker yet.");
    expect(r.stopped).toBe(false);
  });

  it("keeps paragraph breaks inside an answer", () => {
    expect(stream(["Para one.\n\n", "Para two."]).out).toBe("Para one.\n\nPara two.");
  });

  it("flushes a stream that ends right after a partial marker prefix", () => {
    expect(stream(["Answer ends with NO_VER"]).out).toBe("Answer ends with NO_VER");
  });
});
