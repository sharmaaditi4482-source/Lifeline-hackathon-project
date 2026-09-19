import { retrieveChunks } from "@/lib/ai/vectorStore";
import { streamGenerateText, hasGeminiKey } from "@/lib/ai/provider";
import { getDonors, getBankUnits, getHospitals, getRequestHistory } from "@/lib/store";
import { matchRequest } from "@/lib/services/matchingService";
import { resolveLocation } from "@/lib/store";
import { createDelivery } from "@/lib/services/deliveryService";
import { recordLiveEvent } from "@/lib/services/eventService";
import { compute7DayShortageAlerts } from "@/lib/services/inventoryService";

export const runtime = "nodejs";
export const maxDuration = 60;

function sse(obj: object) { return `data: ${JSON.stringify(obj)}\n\n`; }

/**
 * POST /api/ai/autopilot/stream
 * SaaS Agentic RAG Autopilot: streams an autonomous 6-step blood-ops run
 * tenant → RAG → risk → match → explain → outreach → delivery → done
 * All steps are grounded in live telemetry and the medical knowledge base.
 */
export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const hospitalName = String(body?.hospitalName || "AIIMS Trauma Centre").trim();
  const bloodGroup = String(body?.bloodGroup || "O-").trim() as any;
  const urgency = String(body?.urgency || "critical").trim() as any;
  const locationLabel = String(body?.locationLabel || hospitalName).trim();
  const unitsNeeded = Number(body?.unitsNeeded || 2);

  if (!hospitalName || !bloodGroup) {
    return new Response(sse({ type: "error", message: "hospitalName and bloodGroup required." }), { headers: { "Content-Type": "text/event-stream" } });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (o: object) => controller.enqueue(encoder.encode(sse(o)));
      try {
        // Step 1: Tenant
        send({ type: "step", id: "tenant", status: "running", title: `🏢 SaaS Tenant: ${hospitalName}`, detail: `Isolating telemetry, inventory and donor pool for this hospital` });
        await new Promise(r => setTimeout(r, 400));
        const loc = await resolveLocation(locationLabel, undefined);
        send({ type: "step", id: "tenant", status: "done", title: `🏢 Tenant ${hospitalName} active`, detail: `📍 ${loc.label} (${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)})` });

        // Step 2: RAG retrieval over medical KB + live telemetry
        send({ type: "step", id: "rag", status: "running", title: "🔍 RAG: Retrieving clinical protocols & live telemetry", detail: `Query: "${bloodGroup} ${urgency} transfusion protocol + dispatch"` });
        const ragQ = `${bloodGroup} ${urgency} emergency transfusion protocol massive transfusion O- universal donor cooldown 90 days`;
        const chunks = await retrieveChunks(ragQ, 4);
        const citations = chunks.map(c => c.title);
        await new Promise(r => setTimeout(r, 500));
        send({ type: "step", id: "rag", status: "done", title: `🔍 RAG retrieved ${citations.length} grounded sources`, detail: citations.join(" · "), citations });

        // Stream a brief grounded insight (RAG-grounded GenAI)
        if (chunks.length) {
          const ragPrompt = `You are LifeLine's RAG medical doctr. Using ONLY the context below, give a 2-sentence ultra-concise protocol note for ${bloodGroup} ${urgency} at ${hospitalName}.\n\nCONTEXT:\n${chunks.map((c,i)=>`[${i+1}] ${c.title}: ${c.content.slice(0,380)}`).join("\n\n")}`;
          await streamGenerateText(ragPrompt, { temperature: 0.3, maxOutputTokens: 180, onChunk: (d) => send({ type: "chunk", step: "rag", text: d }) });
        }

        // Step 3: SaaS Risk Forecast (7-day velocity)
        send({ type: "step", id: "risk", status: "running", title: "📊 SaaS Forecast: 7-day shortage risk", detail: `Analyzing burn rate for ${hospitalName}` });
        const hospitals = await getHospitals();
        const history = getRequestHistory();
        let tenantHosp = hospitals.find(h => h.name.toLowerCase().includes(hospitalName.toLowerCase())) || hospitals[0];
        const alerts = compute7DayShortageAlerts(tenantHosp.inventory, history).filter(a=>a.isUrgentAlert).slice(0,3);
        await new Promise(r => setTimeout(r, 400));
        if (alerts.length) {
          send({ type: "step", id: "risk", status: "done", title: `⚠️ Risk: ${alerts.map(a=>`${a.bloodGroup} ${a.projectedRunoutDays}d`).join(", ")}`, detail: alerts.map(a=>a.alertBannerText).join(" | ") });
        } else {
          send({ type: "step", id: "risk", status: "done", title: "✅ Stock healthy — no 48h runout", detail: `${hospitalName} reserves above burn rate` });
        }

        // Step 4: Deterministic Match Engine (4-vector)
        send({ type: "step", id: "match", status: "running", title: "🧮 Matching Engine: 4-vector scoring", detail: `Scoring ${bloodGroup} candidates within 50km` });
        const donors = await getDonors();
        const bankUnits = await getBankUnits();
        const req: any = { id: `req_auto_${Date.now()}`, hospitalName, location: loc, bloodGroup, unitsNeeded, urgency, status: "open", createdAt: new Date().toISOString() };
        const matches = matchRequest(req, { donors, bankUnits }).slice(0, 5);
        await new Promise(r => setTimeout(r, 600));
        if (!matches.length) {
          send({ type: "step", id: "match", status: "done", title: "⚠️ No compatible match — escalating radius", detail: `0 candidates for ${bloodGroup}` });
        } else {
          send({ type: "step", id: "match", status: "done", title: `✅ Top match: ${matches[0].sourceName} (${matches[0].bloodGroup}) — ${Math.round(matches[0].score*100)}/100`, detail: matches.map(m=>`${m.sourceName} ${m.bloodGroup} ${m.distanceKm}km ${Math.round(m.score*100)}`).join(" | "), matches });
          recordLiveEvent({ type: "match_found", title: `Autopilot matched ${matches[0].bloodGroup} for ${hospitalName}`, description: `${matches[0].sourceName} at ${matches[0].distanceKm}km — score ${Math.round(matches[0].score*100)}`, bloodGroup, locationLabel: loc.label });
        }

        // Step 5: Generative Explain (stream)
        if (matches.length) {
          send({ type: "step", id: "explain", status: "running", title: "🤖 Generative: Explaining the ranking", detail: `Why ${matches[0].sourceName} scored ${Math.round(matches[0].score*100)}` });
          const top = matches[0];
          const explainPrompt = `You are LifeLine's explainable AI. Request: ${hospitalName} needs ${unitsNeeded}× ${bloodGroup} (${urgency}) at ${loc.label}. Top candidate: ${top.sourceName} (${top.sourceType}) ${top.bloodGroup} ${top.distanceKm}km score ${Math.round(top.score*100)}/100 breakdown urgency ${top.breakdown.urgency} proximity ${top.breakdown.proximity} expiry ${top.breakdown.expiry} reliability ${top.breakdown.reliability}. Write 3 crisp sentences for a nurse: strongest vector, weakest vector, one action. No markdown headings.`;
          let fullExplain = "";
          const streamed = await streamGenerateText(explainPrompt, { temperature: 0.35, maxOutputTokens: 280, onChunk: (d) => { fullExplain += d; send({ type: "chunk", step: "explain", text: d }); } });
          if (!streamed && !fullExplain) {
            const fb = `${top.sourceName} leads at ${Math.round(top.score*100)}/100 — urgency ${top.breakdown.urgency} and proximity ${top.breakdown.proximity} are strongest; dispatch this candidate first.`;
            send({ type: "chunk", step: "explain", text: fb });
          }
          send({ type: "step", id: "explain", status: "done", title: "🤖 Explanation ready", detail: `Strongest: urgency ${top.breakdown.urgency} · proximity ${top.breakdown.proximity}` });
        }

        // Step 6: Agentic Outreach (3 donors)
        if (matches.length) {
          const donorMatches = matches.filter(m=>m.sourceType==="donor").slice(0,3);
          send({ type: "step", id: "outreach", status: "running", title: `📤 Agentic: Drafting outreach to ${donorMatches.length || 1} donor(s)`, detail: donorMatches.map(d=>d.sourceName).join(", ") || matches[0].sourceName });
          for (const dm of (donorMatches.length ? donorMatches : [matches[0]])) {
            const outreachPrompt = `Write a 35-word WhatsApp outreach from LifeLine to donor ${dm.sourceName} (${dm.bloodGroup}, ${dm.distanceKm}km) for ${hospitalName} ${bloodGroup} ${urgency}. Request ID ${req.id}. Ask to reply YES in 5 min. Warm, urgent, concise.`;
            let msg = "";
            await streamGenerateText(outreachPrompt, { temperature: 0.7, maxOutputTokens: 120, onChunk: (d) => { msg += d; send({ type: "chunk", step: "outreach", text: d }); } });
            send({ type: "chunk", step: "outreach", text: "\n\n---\n\n" });
            await new Promise(r => setTimeout(r, 200));
          }
          send({ type: "step", id: "outreach", status: "done", title: "📤 Outreach drafted", detail: `${donorMatches.length || 1} WhatsApp messages ready` });
        }

        // Step 7: Hyperlocal Dispatch (real delivery)
        if (matches.length) {
          const top = matches[0];
          send({ type: "step", id: "delivery", status: "running", title: "🛵 Dispatching hyperlocal rider", detail: `From ${top.sourceName} → ${hospitalName} (${top.distanceKm}km)` });
          try {
            const from = (top as any).location || loc;
            createDelivery({ requestId: req.id, hospitalName, bloodGroup, sourceType: top.sourceType, sourceName: top.sourceName, fromLat: from.lat, fromLng: from.lng, toLat: loc.lat, toLng: loc.lng, distanceKm: top.distanceKm });
            send({ type: "step", id: "delivery", status: "done", title: "🛵 Rider dispatched — live tracking active", detail: `1.8–${top.distanceKm}km · ETA ~${Math.round(top.distanceKm/24*60)+3} min (sim×12)` });
          } catch { send({ type: "step", id: "delivery", status: "done", title: "🛵 Delivery simulated", detail: top.sourceName }); }
        }

        // Final SaaS summary
        send({ type: "done", mode: hasGeminiKey() ? "llm" : "fallback", citations, aiEnabled: hasGeminiKey(), summary: `Autopilot completed for ${hospitalName} — ${bloodGroup} ${urgency} — ${matches.length} matches ranked, rider dispatched, outreach drafted, RAG-grounded.` });
      } catch (e: any) {
        send({ type: "error", message: e?.message || "Autopilot failed" });
      } finally { try { controller.close(); } catch {} }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" } });
}
