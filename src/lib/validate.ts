import { z } from "zod";
import { NextResponse } from "next/server";

// Shared request-body contracts (SEC-02 / BE-09) + parse guards (BE-02 / BE-13).
// Every mutating API route validates its body with one of these zod schemas
// and answers 400 with the first issue message on failure.

// ---- Route body schemas ----------------------------------------------------

export const chatSchema = z.object({
  candidateId: z.string().min(1).optional(),
  // Trimmed by the schema; empty-after-trim and >2000 chars are rejected (BE-03/BE-10).
  message: z
    .string()
    .trim()
    .min(1)
    .max(2000, { message: "Message too long" })
    .optional(),
  // The UI sends `language` (see worker-view post()) — `lang` kept as a tolerant alias.
  language: z.enum(["en", "sw"]).optional(),
  lang: z.enum(["en", "sw"]).optional(),
  persona: z.string().nullish(),
});

export const analyzeSchema = z.object({
  candidateId: z.string().min(1),
});

export const assetSchema = z.object({
  candidateId: z.string().min(1),
  kind: z.enum(["catalog", "cv"]),
});

export const trackRecordSchema = z.object({
  candidateId: z.string().min(1),
  kind: z.enum(["PLACEMENT", "TRAINING", "REVIEW"]),
  title: z.string().trim().min(1).max(200),
  org: z.string().trim().max(120).nullish(),
  detail: z.string().trim().max(500).nullish(),
  rating: z.number().int().min(1).max(5).nullish(),
  occurredAt: z
    .string()
    .refine((v) => !Number.isNaN(new Date(v).getTime()), {
      message: "occurredAt must be a valid datetime",
    })
    .nullish(),
  verifiedBy: z.string().trim().max(120).nullish(),
});

// Real action names come from the PATCH route: accept | contact | place | resolve | note.
export const casePatchSchema = z.object({
  action: z.enum(["accept", "contact", "place", "resolve", "note"], {
    message: "Unknown action",
  }),
  note: z.string().trim().max(500).nullish(),
  opportunityId: z.string().min(1).optional(),
});

// ---- Helpers ----------------------------------------------------------------

// BE-02: parse a JSON body without ever throwing; malformed JSON → null.
export async function safeJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request body";
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 });
}

// SEC-02: validate `raw` against a schema; on failure return the 400 response.
// Usage: const gate = validateBody(chatSchema, raw); if (gate.res) return gate.res;
export function validateBody<T>(
  schema: z.ZodType<T>,
  raw: unknown
): { data: T; res: null } | { data: null; res: NextResponse } {
  const result = schema.safeParse(raw);
  if (result.success) return { data: result.data, res: null };
  return { data: null, res: badRequest(firstIssueMessage(result.error)) };
}

// BE-13: JSON.parse guard for JSON-string columns — one corrupt row can no
// longer 500 a whole list; bad/missing values fall back instead of throwing.
export function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return (parsed === undefined ? fallback : parsed) as T;
  } catch {
    return fallback;
  }
}
