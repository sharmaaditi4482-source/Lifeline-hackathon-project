import { generateText } from "./provider";
import { hasGeminiKey } from "./provider";
import type { BloodRequest, MatchResult } from "@/lib/types";

export interface AiResult {
  text: string;
  title: string;
  mode: "llm" | "fallback";
}

const URGENCY_LABEL: Record<string, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
};

/** ── LLM Match Explainer ─────────────────────────────────────────── */

function buildExplainPrompt(req: BloodRequest, match: MatchResult): string {
  const b = match.breakdown;
  return `You are LifeLine's explainable-matching assistant.
Patient request: ${req.bloodGroup} needed, ${req.unitsNeeded} unit(s), urgency ${req.urgency}, at ${req.location.label}.
Candidate: ${match.sourceName} (${match.sourceType}) offering ${match.bloodGroup}, ${match.distanceKm} km away, score ${Math.round(match.score * 100)}/100.
Score breakdown (0-1): urgency ${b.urgency} (35% weight), proximity ${b.proximity} (30%), expiry ${b.expiry} (20%), reliability ${b.reliability} (15%).
Write a clear 4-5 sentence plain-language explanation of why this candidate ranked this way for a busy hospital nurse. Mention the strongest vector and the weakest vector specifically with their values. End with one practical recommendation. Do not use markdown headings.`;
}

function buildFallbackExplanation(req: BloodRequest, match: MatchResult): string {
  const b = match.breakdown;
  const strongest = [
    { label: "clinical urgency", value: b.urgency, weight: "35%" },
    { label: "proximity", value: b.proximity, weight: "30%" },
    { label: "expiry management", value: b.expiry, weight: "20%" },
    { label: "donor reliability", value: b.reliability, weight: "15%" },
  ].sort((a, z) => z.value - a.value);

  const top = strongest[0];
  const bottom = strongest[3];

  return `${match.sourceName} (${match.bloodGroup}) scored ${Math.round(match.score * 100)}/100 for this ${req.urgency} ${req.unitsNeeded}-unit ${req.bloodGroup} request at ${req.location.label}.

The deciding factor was ${top.label} at ${top.value.toFixed(2)} (weight ${top.weight}). Proximity of ${match.distanceKm} km is ${match.distanceKm <= 10 ? "within emergency dispatch reach" : match.distanceKm <= 25 ? "reachable by city ambulance" : "at the edge of the emergency radius"}.

The weakest vector was ${bottom.label} at ${bottom.value.toFixed(2)}. Also, it is ${match.breakdown.expiry >= 0.8 ? "near expiry and prioritized to prevent bio-waste" : "a fresh unit contributing to supply stability"}.

Recommendation: dispatch this source first and keep the remaining candidates on standby.`;
}

export async function explainMatch(req: BloodRequest, match: MatchResult): Promise<AiResult> {
  const llm = await generateText(buildExplainPrompt(req, match), {
    temperature: 0.3,
    maxOutputTokens: 400,
  });
  if (llm) return { text: llm, title: "AI Match Explanation", mode: "llm" };
  return {
    text: buildFallbackExplanation(req, match),
    title: "Match Explanation (deterministic)",
    mode: "fallback",
  };
}

/** ── Emergency SOS Summarizer ─────────────────────────────────────── */

export interface SosContext {
  hospitalName: string;
  bloodGroup: string;
  unitsNeeded: number;
  urgency: string;
  locationLabel: string;
  topSourceName?: string;
  topScore?: number;
  contactName?: string;
}

function buildSosPrompt(c: SosContext): string {
  return `Write a short emergency blood alert (max 90 words) suitable to broadcast to a hospital group chat in India and to a separate short Hindi version.
Include: urgency level (${URGENCY_LABEL[c.urgency] || c.urgency}), blood group ${c.bloodGroup}, ${c.unitsNeeded} unit(s), location ${c.locationLabel}, requesting facility ${c.hospitalName}${c.contactName ? `, contact ${c.contactName}` : ""}${c.topSourceName ? `, best immediate match ${c.topSourceName} (score ${Math.round((c.topScore || 0) * 100)}/100)` : ""}.
Format EXACTLY as:
ENGLISH: <alert>
HINDI: <alert in Devanagari script>
Do not add any other text.`;
}

function buildFallbackSos(c: SosContext): string {
  const en = `🔴 ${URGENCY_LABEL[c.urgency] || c.urgency} ALERT — ${c.unitsNeeded} unit(s) of ${c.bloodGroup} required at ${c.locationLabel} (${c.hospitalName}).${c.topSourceName ? ` Top match: ${c.topSourceName} (${Math.round((c.topScore || 0) * 100)}/100).` : ""} Respond immediately.`;
  const hi = `🔴 आपातकाल — ${c.locationLabel} में ${c.unitsNeeded} यूनिट ${c.bloodGroup} रक्त की तुरंत आवश्यकता है (${c.hospitalName})। तुरंत जवाब दें।`;
  return `ENGLISH: ${en}\nHINDI: ${hi}`;
}

export async function generateSosSummary(c: SosContext): Promise<AiResult> {
  const llm = await generateText(buildSosPrompt(c), {
    temperature: 0.5,
    maxOutputTokens: 220,
  });
  if (llm) return { text: llm, title: "Emergency Summary", mode: "llm" };
  return {
    text: buildFallbackSos(c),
    title: `Emergency Summary — ${URGENCY_LABEL[c.urgency] || ""} ${c.bloodGroup}`,
    mode: "fallback",
  };
}

/** ── Gen AI Donor Outreach ────────────────────────────────────────── */

export interface OutreachContext {
  donorName: string;
  bloodGroup: string;
  distanceKm: number;
  urgency: string;
  requestId: string;
  language: "en" | "hi";
  verified?: boolean;
}

function buildOutreachPrompt(c: OutreachContext): string {
  return `Write a polite, urgent WhatsApp-style donor outreach message in ${c.language === "hi" ? "Hinglish (Hindi written in Latin script)" : "English"} from the LifeLine blood matching platform to a volunteer donor named ${c.donorName} (blood group ${c.bloodGroup}, ${c.verified ? "verified" : "registered"}).
Context: a ${URGENCY_LABEL[c.urgency] || c.urgency} emergency needs ${c.bloodGroup} blood. ${c.donorName} is ${c.distanceKm} km away.
The message must: greet the donor warmly, state the emergency clearly and briefly, give the pickup request ID ${c.requestId}, tell the donor to reply YES to confirm within 5 minutes, and thank them. Max 70 words. Do not add a subject line.`;
}

function buildFallbackOutreach(c: OutreachContext): string {
  const greeting = c.language === "hi" ? "Namaste" : "Hello";
  const vibe = c.urgency === "critical";
  const opening = vibe
    ? `⚡ Need your help immediately!`
    : `We could really use your help today.`;
  return `${greeting} ${c.donorName}, this is LifeLine Blood Match. ${opening} A patient nearby (${c.distanceKm} km away) urgently requires ${c.bloodGroup} blood. Request ID: ${c.requestId}. Please reply YES to confirm a pickup within 5 minutes. Thank you for saving a life! 🩸`;
}

export async function generateDonorOutreach(c: OutreachContext): Promise<AiResult> {
  const llm = await generateText(buildOutreachPrompt(c), {
    temperature: 0.7,
    maxOutputTokens: 200,
  });
  if (llm) return { text: llm, title: "Donor Outreach Message", mode: "llm" };
  return {
    text: buildFallbackOutreach(c),
    title: "Donor Outreach Message (template)",
    mode: "fallback",
  };
}

/** ── Smart Analytics Narrator ─────────────────────────────────────── */

export interface AnalyticsNarrativeInput {
  stats: {
    totalMatches: number;
    mostRequestedGroup: string;
    mostRequestedCount: number;
    averageMatchResponseTimeSeconds: number;
    totalLivesSaved: number;
  };
  trend: Array<{ label: string; count: number; completed: number }>;
  distribution: Array<{ bloodGroup: string; requests: number; liveDonors: number; bankStock: number }>;
}

function buildNarrativePrompt(input: AnalyticsNarrativeInput): string {
  const trendLine = input.trend.map((t) => `${t.label}: ${t.count} requested / ${t.completed} completed`).join("; ");
  const distLine = input.distribution
    .map((d) => `${d.bloodGroup}: ${d.requests} requests, ${d.liveDonors} donors, ${d.bankStock} stock`)
    .join("; ");
  return `You are LifeLine's regional analytics narrator. Analyze the 7-day regional data and write a punchy executive summary (max 150 words) with EXACTLY these three sections:
INSIGHTS: - three bullet points on demand/supply trends
RISKS: - the most vulnerable blood group(s) and why
RECOMMENDATIONS: - two concrete actions for regional coordinators, including whether to launch a donor drive.
Data — stats: ${JSON.stringify(input.stats)}. 7-day trend: ${trendLine}. Blood group distribution: ${distLine}.
Use plain text bullets starting with "- ". Do not use markdown headings.`;
}

function buildFallbackNarrative(input: AnalyticsNarrativeInput): string {
  const low = [...input.distribution]
    .filter((d) => d.bankStock < d.requests)
    .sort((a, b) => a.bankStock - b.bankStock);
  const peak = input.trend.reduce((a, b) => (b.count > a.count ? b : a), input.trend[0]);

  const risks = low.length
    ? low.slice(0, 2).map((d) => `- ${d.bloodGroup}: demand (${d.requests}) exceeds bank stock (${d.bankStock})`)
    : ["- Overall bank stock is trending above daily demand, but monitor negative groups closely"];

  return `INSIGHTS:
- ${input.stats.totalMatches} matches locked, ${input.stats.totalLivesSaved} lives saved over the last 7 days at an average engine response of ${input.stats.averageMatchResponseTimeSeconds}s.
- ${input.stats.mostRequestedGroup} is the most requested group (${input.stats.mostRequestedCount}) — typical for trauma workloads.
- Peak demand hit ${peak.label} with ${peak.count} units requested.

RISKS:
${risks.join("\n")}

RECOMMENDATIONS:
- Schedule a ${low.length ? low[0].bloodGroup : "O-negative"} donor drive in the next 48 hours to shore up the vulnerable group.
- Enable the wider radius escalation tier for negative blood groups during night hours.`;
}

export async function generateAnalyticsNarrative(input: AnalyticsNarrativeInput): Promise<AiResult> {
  const llm = await generateText(buildNarrativePrompt(input), {
    temperature: 0.5,
    maxOutputTokens: 500,
  });
  if (llm) return { text: llm, title: "7-Day Regional Insight Report", mode: "llm" };
  return {
    text: buildFallbackNarrative(input),
    title: "7-Day Regional Insight Report",
    mode: "fallback",
  };
}

export { hasGeminiKey };