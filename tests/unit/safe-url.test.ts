import { describe, it, expect, vi, beforeEach } from "vitest";

const dns = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("node:dns/promises", () => dns);

import { assertPublicUrl, isPrivateIp } from "@/lib/ingestion/safe-url";

beforeEach(() => {
  dns.lookup.mockReset();
  dns.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
});

describe("isPrivateIp", () => {
  it.each([
    "0.0.0.0",
    "10.0.0.1",
    "127.0.0.1",
    "127.1.2.3",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "100.64.0.1",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::",
    "::1",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "ff02::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::ffff:10.0.0.1",
    "64:ff9b::7f00:1",
    "2002:7f00:1::1",
    "not-an-ip",
  ])("treats %s as private", (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });

  it.each(["93.184.216.34", "8.8.8.8", "172.32.0.1", "100.63.0.1", "1.1.1.1", "2606:4700:4700::1111"])(
    "treats %s as public",
    (ip) => {
      expect(isPrivateIp(ip)).toBe(false);
    },
  );
});

describe("assertPublicUrl", () => {
  it("accepts a public https URL", async () => {
    const u = await assertPublicUrl("https://example.com/docs");
    expect(u.hostname).toBe("example.com");
  });

  it.each([
    "http://localhost:3000",
    "http://localhost",
    "http://localhost./",
    "http://app.localhost/",
    "http://printer.local/",
    "http://db.internal/",
    "http://127.0.0.1",
    "http://127.0.0.1:8080",
    "http://169.254.169.254/latest/meta-data",
    "http://10.0.0.1",
    "http://2130706433", // 127.0.0.1 en décimal
    "http://0x7f.0.0.1",
    "http://[::1]/",
    "http://[::ffff:127.0.0.1]/",
    "ftp://example.com/file",
    "file:///etc/passwd",
    "javascript:alert(1)",
    "https://user:pass@example.com/",
    "https://example.com:8443/",
    "not a url",
  ])("rejects %s", async (url) => {
    await expect(assertPublicUrl(url)).rejects.toThrow("invalid_url");
  });

  it("rejects a domain that resolves to a private address", async () => {
    dns.lookup.mockResolvedValue([{ address: "10.0.0.5", family: 4 }]);
    await expect(assertPublicUrl("https://evil.example.com")).rejects.toThrow("invalid_url");
  });

  it("rejects when any resolved address is private", async () => {
    dns.lookup.mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ]);
    await expect(assertPublicUrl("https://mixed.example.com")).rejects.toThrow("invalid_url");
  });

  it("rejects an unresolvable domain", async () => {
    dns.lookup.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(assertPublicUrl("https://does-not-exist.example.com")).rejects.toThrow("invalid_url");
  });
});
