import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  FALLBACK_REPLIES,
  STAGE_ORDER,
  personaByKey,
  type ChatStage,
  type Lang,
} from "@/lib/data";
import { INTAKE_SYSTEM_PROMPT, llmChat } from "@/lib/ai";

export const dynamic = "force-dynamic";

const INTRO: Record<Lang, string> = {
  en: "Hello! I'm Ajira Copilot — I help workers like you find real opportunities. I'll ask a few short questions, then build your profile and connect you to a human mentor. To start: what work do you do these days?",
  sw: "Habari! Mimi ni Ajira Copilot — nasaidia wafanyakazi kama wewe kupata fursa halisi. Nitauliza maswali machache, kisha nitatengeneza wasifu wako na kukuhusisha na msimamizi wa binadamu. Kuanzia: unafanya kazi gani siku hizi?",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const language: Lang = body.language === "sw" ? "sw" : "en";
    const message: string | undefined = body.message?.trim();

    let candidateId: string | undefined = body.candidateId;

    if (!candidateId) {
      const persona = personaByKey(body.persona);
      const candidate = await db.candidate.create({
        data: {
          language,
          persona: persona?.key ?? null,
          personaLabel: persona ? persona.label : null,
          location: persona?.location ?? null,
          skills: persona ? JSON.stringify(persona.baseline.skills) : null,
          experience: persona?.baseline.experience ?? null,
          digitalLiteracy: persona?.baseline.digitalLiteracy ?? null,
          goal: persona?.baseline.goal ?? null,
          constraints: persona ? JSON.stringify(persona.baseline.constraints) : null,
          name: persona?.name ?? null,
          phone: persona?.phone ?? null,
        },
      });
      candidateId = candidate.id;
      await db.message.create({
        data: { candidateId, role: "assistant", content: INTRO[language] },
      });
    }

    if (!message) {
      const messages = await db.message.findMany({
        where: { candidateId },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({
        candidateId,
        messages,
        stage: "greet" as ChatStage,
        mode: "idle",
      });
    }

    await db.message.create({ data: { candidateId, role: "user", content: message } });

    const history = await db.message.findMany({
      where: { candidateId },
      orderBy: { createdAt: "asc" },
      take: 14,
    });

    const candidate = await db.candidate.findUnique({ where: { id: candidateId } });
    const persona = personaByKey(candidate?.persona);

    // Stage tracking: N user messages -> reply addresses question N-1
    const userMsgCount = history.filter((m) => m.role === "user").length;
    const replyIdx = Math.min(Math.max(userMsgCount - 1, 0), STAGE_ORDER.length - 1);
    const replyStage = STAGE_ORDER[replyIdx];
    const nextStage = STAGE_ORDER[Math.min(userMsgCount, STAGE_ORDER.length - 1)];

    const contextLines = [
      persona
        ? `The user may resemble this Nairobi persona (do NOT repeat it verbatim): ${persona.label}; ${persona.baseline.experience}; typical skills: ${persona.baseline.skills.join(", ")}.`
        : "",
      "Conversation so far (you are Copilot):",
      ...history.map((m) => `${m.role === "user" ? "User" : "Copilot"}: ${m.content}`),
    ]
      .filter(Boolean)
      .join("\n");

    const llmReply = await llmChat([
      { role: "assistant", content: INTAKE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `${contextLines}\n\nContinue the assessment with ONE short question. This is reply #${userMsgCount}.`,
      },
    ]);

    const mode = llmReply ? "live" : "fallback";
    const reply = llmReply ?? FALLBACK_REPLIES[replyStage][language];

    await db.message.create({ data: { candidateId, role: "assistant", content: reply } });

    const messages = await db.message.findMany({
      where: { candidateId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ candidateId, messages, stage: nextStage, mode });
  } catch (err) {
    console.error("[chat] error:", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
