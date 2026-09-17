import { createOpenAI } from "@ai-sdk/openai";

/**
 * Captures/resends the gateway run id so the app's calls correlate with
 * gateway usage logs. Never mint a run id in app code.
 */
export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId;
  const fetchWrapper: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
    const res = await fetch(input, { ...init, headers });
    runId = res.headers.get("X-Lovable-AIG-Run-ID") ?? runId;
    return res;
  };
  return {
    fetch: fetchWrapper,
    getRunId: () => runId,
  };
}

export function getLovableAiGatewayRunId(request: Request): string | undefined {
  return request.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
}

/** Responses API provider pointed at the Lovable AI Gateway. */
export function createLovableAiGatewayResponsesProvider(
  apiKey: string,
  fetchImpl?: typeof fetch,
) {
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    ...(fetchImpl ? { fetch: fetchImpl } : {}),
  });
}
