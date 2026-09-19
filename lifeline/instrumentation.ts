export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { warmUpGemini } = await import("./lib/ai/warmup");
    await warmUpGemini();

    // LifeLine Realtime Hub — WebSocket broadcast node on port 3001.
    // Runs beside the production server so dashboards get push updates.
    const { startRealtimeHub } = await import("./lib/services/realtimeHub");
    startRealtimeHub();
  }
}