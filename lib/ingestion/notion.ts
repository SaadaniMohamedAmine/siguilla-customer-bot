import { Client } from "@notionhq/client";
import { decrypt } from "@/lib/crypto";
import type { RawSection } from "./chunk";

export function notionClient(accessTokenEnc: string) {
  return new Client({ auth: decrypt(accessTokenEnc) });
}

type RichText = { plain_text: string }[];
const rt = (r?: RichText) => (r ?? []).map((t) => t.plain_text).join("");

/** Convertit récursivement les blocs d'une page en markdown simple (profondeur max 3). */
async function blocksToMarkdown(client: Client, blockId: string, depth = 0): Promise<string> {
  const lines: string[] = [];
  let cursor: string | undefined;
  do {
    const res = await client.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const b of res.results as any[]) {
      const t = b.type as string;
      const v = b[t];
      switch (t) {
        case "heading_1":
          lines.push(`# ${rt(v.rich_text)}`);
          break;
        case "heading_2":
          lines.push(`## ${rt(v.rich_text)}`);
          break;
        case "heading_3":
          lines.push(`### ${rt(v.rich_text)}`);
          break;
        case "paragraph":
          lines.push(rt(v.rich_text));
          break;
        case "bulleted_list_item":
          lines.push(`- ${rt(v.rich_text)}`);
          break;
        case "numbered_list_item":
          lines.push(`1. ${rt(v.rich_text)}`);
          break;
        case "to_do":
          lines.push(`- [${v.checked ? "x" : " "}] ${rt(v.rich_text)}`);
          break;
        case "quote":
        case "callout":
          lines.push(`> ${rt(v.rich_text)}`);
          break;
        case "code":
          lines.push("```\n" + rt(v.rich_text) + "\n```");
          break;
        case "toggle":
          lines.push(rt(v.rich_text));
          break;
        case "table_row":
          lines.push((v.cells as RichText[]).map(rt).join(" | "));
          break;
        default:
          break;
      }
      if (b.has_children && depth < 3 && t !== "child_page") lines.push(await blocksToMarkdown(client, b.id, depth + 1));
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return lines.filter(Boolean).join("\n");
}

export async function loadNotionPage(client: Client, pageId: string): Promise<RawSection> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page: any = await client.pages.retrieve({ page_id: pageId });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const titleProp = Object.values(page.properties ?? {}).find((p: any) => p.type === "title") as any;
  const title = rt(titleProp?.title) || "Untitled";
  const text = await blocksToMarkdown(client, pageId);
  return { title, text, url: page.url ?? null, pageNumber: null };
}

/** Pages accessibles par l'intégration (pour la sélection dans l'UI). */
export async function searchNotionPages(client: Client, query = "") {
  const res = await client.search({ query, filter: { property: "object", value: "page" }, page_size: 50 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (res.results as any[]).map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const titleProp = Object.values(p.properties ?? {}).find((x: any) => x.type === "title") as any;
    return { id: p.id as string, title: rt(titleProp?.title) || "Untitled", url: p.url as string, lastEdited: p.last_edited_time as string };
  });
}
