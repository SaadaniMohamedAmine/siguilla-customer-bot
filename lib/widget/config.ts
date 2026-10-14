import { z } from "zod";

export const WidgetConfig = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#9E2F45"),
  theme: z.enum(["dark", "light"]).default("dark"),
  position: z.enum(["right", "left"]).default("right"),
  headerStyle: z.enum(["subtle", "bold"]).default("subtle"),
  displayName: z.string().max(40).default("Concierge"),
  subtitle: z.string().max(60).default(""),
  avatarUrl: z.string().url().nullable().default(null),
  welcome: z.string().max(240).default("Good evening. How may I help you today?"),
  placeholder: z.string().max(80).default("Ask a question…"),
  suggestions: z.array(z.string().max(40)).max(3).default([]),
  tooltip: z.string().max(80).nullable().default(null),
  showBadge: z.boolean().default(true),
});
export type WidgetConfig = z.infer<typeof WidgetConfig>;
export const parseWidgetConfig = (raw: unknown): WidgetConfig => WidgetConfig.parse(raw ?? {});
