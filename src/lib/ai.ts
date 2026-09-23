import ZAI from "z-ai-web-dev-sdk";

// Server-side AI helpers with graceful, demo-safe fallbacks.

export const llmChat = async (
  messages: { role: "user" | "assistant"; content: string }[],
  timeoutMs = 9000
): Promise<string | null> => {
  // BE-18: abort on timeout and always clear the timer. The SDK's fetch call
  // does NOT accept/forward an AbortSignal (verified in z-ai-web-dev-sdk
  // dist/index.js — only method/headers/body are passed), so the signal is
  // used on our racing timeout promise instead of the SDK call itself.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const completion = (await Promise.race([
      (async () => {
        const zai = await ZAI.create();
        return zai.chat.completions.create({
          messages,
          thinking: { type: "disabled" },
        });
      })(),
      new Promise<null>((resolve) =>
        controller.signal.addEventListener("abort", () => resolve(null), { once: true })
      ),
    ])) as { choices?: { message?: { content?: string } }[] } | null;

    const content = completion?.choices?.[0]?.message?.content;
    if (!content || !content.trim()) return null;
    return content.trim();
  } catch (err) {
    console.error("[ai] llmChat failed:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
};

// SEC-04: delimit untrusted user text inside LLM prompts (cheap
// prompt-injection hygiene — the model is told markers are data, not commands).
export const untrustedBlock = (text: string): string =>
  `--- USER MESSAGE (untrusted) ---\n${text}\n--- END ---`;

// Extract the first JSON object from a model response.
export const extractJson = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  const cleaned = raw.replace(/```json/gi, "```").replace(/```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
};

export interface StructuredProfile {
  name: string;
  summary: string;
  skills: string[];          // human-readable skills
  tags: string[];            // matcher vocabulary
  experience: string;
  digitalLiteracy: string;
  availability: string;
  goal: string;
  constraints: string[];
  confidence: number;        // 0..1
  aiSummary: string;         // coordinator-facing summary
  verificationFlags: string[];
}

export const INTAKE_SYSTEM_PROMPT = `You are "Ferrix" (Ajira Copilot), a warm, respectful livelihood assistant for informal workers in Nairobi (boda riders, market vendors, mama fuas, plumbers, electricians, domestic workers, fundis, shop attendants).

STYLE RULES:
- Ask exactly ONE short question per reply (max 2 sentences). Never lecture, never list.
- Mirror the user's language: if they write in Swahili or Sheng, reply in natural conversational Swahili; if English, reply in simple English.
- Warm, street-smart, hopeful tone. Encourage without flattering.
- You are assessing skills for a job-matching profile. Gather: current work, skills, phone/digital comfort, goals, biggest challenge.
- Never promise a job. Say "opportunities" and "matches".
- Keep replies under 40 words when possible.`;

export const ANALYZE_SYSTEM_PROMPT = `You are the profiling engine of Ferrix (Ajira Copilot), an AI livelihood copilot for informal workers in Nairobi.
From the conversation transcript, produce a JSON profile. Respond with VALID JSON ONLY, no other text.

JSON schema:
{
  "name": string (use name given, else first name they used, else "Friend"),
  "summary": string (one line, human readable),
  "skills": string[] (3-8 concrete skills phrased plainly, e.g. "Customer service", "M-Pesa handling"),
  "tags": string[] (choose from: customer-service, sales, pricing, negotiation, stock-management, mobile-money, driving, delivery, navigation, sewing, design, alterations, pos, cash-handling, inventory, data-entry, typing, english, swahili, whatsapp, marketing, social-media, cooking, photos, cleaning, laundry, household, childcare, plumbing, electrical, wiring, carpentry, woodworking, masonry, plaster, welding, fabrication, metalwork, painting, decorating, mechanic, repair, appliances, refrigeration, phones, electronics, barber, grooming, transport, furniture, tools, safety, certification, construction),
  "experience": string (one line),
  "digitalLiteracy": string (one line),
  "availability": string (one line, infer sensibly if unclear),
  "goal": string (one line),
  "constraints": string[] (e.g. data-cost, daytime-only, typing-confidence, photos),
  "confidence": number 0..1 (how well the transcript supports the profile),
  "aiSummary": string (2-3 sentences FOR A HUMAN MENTOR: who this person is, their strongest assets, what kind of placement fits, any cautions),
  "verificationFlags": string[] (things a human must verify, e.g. "ID document", "phone ownership", "stated experience")
}`;

export const CATALOG_SYSTEM_PROMPT = `You write WhatsApp catalog copy for small Kenyan traders.
Given a worker profile, write ready-to-paste WhatsApp status/catalog text in their language (Swahili if they lean Swahili, else simple English).
Format:
- 1 hook line
- 3-5 product/service bullet lines with prices (KSh, realistic for Nairobi)
- 1 closing line with "Repyo hii message" style call to action
- keep total under 90 words, no emojis beyond 2.`;

export const CV_SYSTEM_PROMPT = `You write simple one-paragraph starter CVs ("mini-CV") for informal workers in Nairobi.
Given a profile, write a plain-text mini-CV: name line, one-line profile statement, Skills line (comma list), Experience line, Availability line, Contact placeholder.
Keep under 80 words, simple English.`;
