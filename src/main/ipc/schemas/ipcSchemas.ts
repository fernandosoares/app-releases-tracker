import { z } from "zod";

// ---------------------------------------------------------------------------
// apps:add
// ---------------------------------------------------------------------------
export const AddAppPayloadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sourceUrl: z
    .string()
    .url("Must be a valid URL")
    .startsWith("https://", "Only HTTPS URLs are accepted"),
});

export type AddAppPayload = z.infer<typeof AddAppPayloadSchema>;

// ---------------------------------------------------------------------------
// apps:remove
// ---------------------------------------------------------------------------
export const RemoveAppPayloadSchema = z.object({
  id: z.string().min(1, "App ID is required"),
});

export type RemoveAppPayload = z.infer<typeof RemoveAppPayloadSchema>;

// ---------------------------------------------------------------------------
// updates:checkOne
// ---------------------------------------------------------------------------
export const CheckOnePayloadSchema = z.object({
  appId: z.string().min(1, "App ID is required"),
});

export type CheckOnePayload = z.infer<typeof CheckOnePayloadSchema>;

// ---------------------------------------------------------------------------
// shell:openExternal
// ---------------------------------------------------------------------------
export const OpenExternalPayloadSchema = z.object({
  url: z
    .string()
    .url("Must be a valid URL")
    .startsWith("https://", "Only HTTPS URLs are accepted"),
});

export type OpenExternalPayload = z.infer<typeof OpenExternalPayloadSchema>;
