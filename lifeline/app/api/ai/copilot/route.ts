import { NextRequest, NextResponse } from "next/server";
import { answerMedicalQuery } from "@/lib/ai/rag";
import { hasGeminiKey } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/copilot
 * RAG medical copilot — retrieves relevant knowledge chunks for the question,
 * grounds a Gemini answer on them, and returns citations. Degrades to a
 * deterministic, context-cited answer when no GEMINI_API_KEY is configured.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question: unknown = body.question;

    if (typeof question !== "string" || question.trim().length < 4) {
      return NextResponse.json(
        { error: "Please ask a meaningful medical question." },
        { status: 400 }
      );
    }

    const result = await answerMedicalQuery(question.slice(0, 500));
    return NextResponse.json({
      answer: result.answer,
      citations: result.citations,
      mode: result.mode,
      aiEnabled: hasGeminiKey(),
    });
  } catch {
    return NextResponse.json(
      { error: "The medical copilot is temporarily unavailable." },
      { status: 500 }
    );
  }
}