import { describe, it, expect, vi } from "vitest";
import type { Client } from "@notionhq/client";

const { ctor } = vi.hoisted(() => ({ ctor: vi.fn() }));
vi.mock("@notionhq/client", () => ({
  Client: class {
    constructor(opts: unknown) {
      ctor(opts);
    }
  },
}));
vi.mock("@/lib/crypto", () => ({ decrypt: vi.fn((v: string) => `decrypted:${v}`) }));

import { notionClient, loadNotionPage, searchNotionPages } from "@/lib/ingestion/notion";

const t = (s: string) => [{ plain_text: s }];
type Block = { id: string; type: string; has_children?: boolean; [k: string]: unknown };
const block = (id: string, type: string, payload: unknown, extra: Partial<Block> = {}): Block => ({ id, type, [type]: payload, ...extra });

function fakeClient(opts: { blocks: Record<string, Block[][]>; page?: unknown; search?: unknown[] }) {
  const calls: Record<string, number> = {};
  const client = {
    pages: { retrieve: vi.fn(async () => opts.page ?? { url: "https://notion.so/p", properties: { Name: { type: "title", title: t("Shipping") } } }) },
    blocks: {
      children: {
        list: vi.fn(async ({ block_id }: { block_id: string }) => {
          const pages = opts.blocks[block_id] ?? [[]];
          const i = (calls[block_id] = (calls[block_id] ?? -1) + 1);
          return { results: pages[i] ?? [], has_more: i < pages.length - 1, next_cursor: i < pages.length - 1 ? `c${i + 1}` : null };
        }),
      },
    },
    search: vi.fn(async () => ({ results: opts.search ?? [] })),
  };
  return client as unknown as Client;
}

describe("notionClient", () => {
  it("decrypts the stored token before creating the client", () => {
    notionClient("cipher");
    expect(ctor).toHaveBeenCalledWith({ auth: "decrypted:cipher" });
  });
});

describe("loadNotionPage", () => {
  it("returns the page title, its URL and the blocks as simple markdown", async () => {
    const client = fakeClient({
      blocks: {
        pg: [
          [
            block("1", "heading_1", { rich_text: t("Shipping") }),
            block("2", "heading_2", { rich_text: t("Delays") }),
            block("3", "heading_3", { rich_text: t("Details") }),
            block("4", "paragraph", { rich_text: t("We ship in 3 days.") }),
            block("5", "bulleted_list_item", { rich_text: t("France") }),
            block("6", "numbered_list_item", { rich_text: t("First") }),
            block("7", "to_do", { rich_text: t("Pack"), checked: true }),
            block("8", "to_do", { rich_text: t("Send"), checked: false }),
            block("9", "quote", { rich_text: t("Careful") }),
            block("10", "callout", { rich_text: t("Note") }),
            block("11", "code", { rich_text: t("npm run build") }),
            block("12", "toggle", { rich_text: t("More") }),
            block("13", "table_row", { cells: [t("a"), t("b")] }),
            block("14", "image", {}),
          ],
        ],
      },
    });
    const section = await loadNotionPage(client, "pg");
    expect(section.title).toBe("Shipping");
    expect(section.url).toBe("https://notion.so/p");
    expect(section.text).toBe(
      ["# Shipping", "## Delays", "### Details", "We ship in 3 days.", "- France", "1. First", "- [x] Pack", "- [ ] Send", "> Careful", "> Note", "```\nnpm run build\n```", "More", "a | b"].join("\n"),
    );
  });

  it("walks nested blocks but never into child pages, and follows pagination", async () => {
    const client = fakeClient({
      blocks: {
        pg: [
          [block("a", "paragraph", { rich_text: t("Parent") }, { has_children: true }), block("cp", "child_page", { title: "Sub" }, { has_children: true })],
          [block("b", "paragraph", { rich_text: t("Second page of results") })],
        ],
        a: [[block("a1", "paragraph", { rich_text: t("Nested") })]],
        cp: [[block("x", "paragraph", { rich_text: t("Must not be read") })]],
      },
    });
    const section = await loadNotionPage(client, "pg");
    expect(section.text).toContain("Parent\nNested");
    expect(section.text).toContain("Second page of results");
    expect(section.text).not.toContain("Must not be read");
  });

  it("falls back to Untitled when the page has no title property", async () => {
    const client = fakeClient({ blocks: { pg: [[]] }, page: { properties: {} } });
    const section = await loadNotionPage(client, "pg");
    expect(section.title).toBe("Untitled");
    expect(section.url).toBeNull();
  });
});

describe("searchNotionPages", () => {
  it("lists the pages the integration can read with their titles", async () => {
    const client = fakeClient({
      blocks: {},
      search: [
        { id: "p1", url: "https://notion.so/p1", last_edited_time: "2026-10-01T00:00:00Z", properties: { Name: { type: "title", title: t("Returns") } } },
        { id: "p2", url: "https://notion.so/p2", last_edited_time: "2026-10-02T00:00:00Z", properties: {} },
      ],
    });
    expect(await searchNotionPages(client, "ret")).toEqual([
      { id: "p1", title: "Returns", url: "https://notion.so/p1", lastEdited: "2026-10-01T00:00:00Z" },
      { id: "p2", title: "Untitled", url: "https://notion.so/p2", lastEdited: "2026-10-02T00:00:00Z" },
    ]);
  });
});
