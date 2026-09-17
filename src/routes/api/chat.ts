import {
  createLovableAiGatewayResponsesProvider,
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
} from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM_PROMPT = `Eres Forja, un ingeniero de software senior que programa aplicaciones completas. Responde SIEMPRE en español.

Tu especialidad es ayudar a construir aplicaciones: diseñas la arquitectura, escribes código completo y funcional, y explicas las decisiones importantes de forma breve.

Reglas:
- Entrega código completo y listo para usar, no fragmentos incompletos con "// resto del código".
- Usa markdown con bloques de código que indiquen el lenguaje (\`\`\`ts, \`\`\`python, etc.) y nombra el archivo sugerido antes de cada bloque.
- Por defecto usa TypeScript, React y Tailwind para apps web salvo que el usuario pida otra cosa.
- Si la petición es ambigua, propón una interpretación razonable y constrúyela; menciona las suposiciones al final.
- Sé conciso en la prosa: el código es el protagonista.
- Si el usuario reporta un error, diagnostica la causa más probable y entrega la corrección completa.`;

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Se requieren mensajes", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const runIdFetch = createLovableAiGatewayRunIdFetch(
          getLovableAiGatewayRunId(request),
        );
        const lovable = createLovableAiGatewayResponsesProvider(
          key,
          runIdFetch.fetch,
        );

        const result = streamText({
          model: lovable.responses("openai/gpt-6-astra"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          sendReasoning: true,
        });
        const runId = runIdFetch.getRunId();
        if (runId) response.headers.set("X-Lovable-AIG-Run-ID", runId);
        return response;
      },
    },
  },
});
