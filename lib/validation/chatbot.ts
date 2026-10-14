import { z } from "zod";
import { WidgetConfig } from "@/lib/widget/config";

export const ChatbotCreate = z.object({
  name: z.string().trim().min(2).max(60),
});

export const ChatbotUpdate = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(200).nullish(),
  instructions: z.string().trim().max(2000).nullish(),
  similarityThreshold: z.number().min(0.5).max(0.95).optional(),
  allowedDomains: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^(\*\.)?[a-z0-9.-]+\.[a-z]{2,}$|^localhost(:\d+)?$/),
    )
    .max(10)
    .optional(),
  status: z.enum(["draft", "live"]).optional(),
  widgetConfig: WidgetConfig.partial().optional(),
});

export const SourceCreate = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pdf"), name: z.string().min(1).max(200), blobUrl: z.string().url(), blobPathname: z.string() }),
  z.object({ type: z.literal("url"), url: z.string().url() }),
  z.object({ type: z.literal("notion"), pageIds: z.array(z.string()).min(1).max(50) }),
]);
