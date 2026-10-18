import { describe, it, expect, vi, beforeEach } from "vitest";

const blob = vi.hoisted(() => ({ del: vi.fn() }));
vi.mock("@vercel/blob", () => blob);

import { avatarUrlOf, deleteBlobs, isBlobUrl } from "@/lib/blob-cleanup";

const PDF = "https://abc123.public.blob.vercel-storage.com/atelier-shipping-x1.pdf";
const AVATAR = "https://abc123.public.blob.vercel-storage.com/avatar-x2.png";

beforeEach(() => {
  blob.del.mockReset();
  blob.del.mockResolvedValue(undefined);
});

describe("isBlobUrl", () => {
  it("accepts Vercel Blob URLs", () => {
    expect(isBlobUrl(PDF)).toBe(true);
    expect(isBlobUrl("https://abc123.private.blob.vercel-storage.com/x.pdf")).toBe(true);
  });

  it.each([
    "http://abc123.public.blob.vercel-storage.com/x.pdf",
    "https://evil.com/x.pdf",
    "https://blob.vercel-storage.com.evil.com/x.pdf",
    "https://evil.com/?u=abc.public.blob.vercel-storage.com",
    "not a url",
    "",
    null,
    undefined,
    42,
  ])("rejects %s", (value) => {
    expect(isBlobUrl(value)).toBe(false);
  });
});

describe("avatarUrlOf", () => {
  it("reads the avatar from a widgetConfig JSON", () => {
    expect(avatarUrlOf({ avatarUrl: AVATAR, color: "#9E2F45" })).toBe(AVATAR);
  });

  it("returns null when absent or malformed", () => {
    expect(avatarUrlOf({})).toBeNull();
    expect(avatarUrlOf(null)).toBeNull();
    expect(avatarUrlOf({ avatarUrl: null })).toBeNull();
    expect(avatarUrlOf({ avatarUrl: 12 })).toBeNull();
  });
});

describe("deleteBlobs", () => {
  it("deletes the unique Blob URLs in one batch and skips everything else", async () => {
    await deleteBlobs([PDF, PDF, AVATAR, null, undefined, "https://evil.com/x.pdf"]);
    expect(blob.del).toHaveBeenCalledTimes(1);
    expect(blob.del).toHaveBeenCalledWith([PDF, AVATAR]);
  });

  it("does not call del when there is nothing to delete", async () => {
    await deleteBlobs([null, "https://evil.com/x.pdf"]);
    expect(blob.del).not.toHaveBeenCalled();
  });

  it("never throws, even if the Blob API fails", async () => {
    blob.del.mockRejectedValue(new Error("blob down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(deleteBlobs([PDF])).resolves.toBeUndefined();
    spy.mockRestore();
  });
});
