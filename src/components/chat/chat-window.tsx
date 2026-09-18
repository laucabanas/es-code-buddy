import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { saveThreadMessages } from "@/lib/threads";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef } from "react";

import forjaLogo from "@/assets/forja-logo.png";

const SUGGESTIONS = [
  "Prográmame una app de tareas con React y localStorage",
  "Crea una API REST en Node para un blog",
  "Hazme un juego de snake en un solo archivo HTML",
  "Un clon de Spotify: estructura del proyecto y componentes",
];

interface ChatWindowProps {
  threadId: string;
  initialMessages: UIMessage[];
}

export function ChatWindow({ threadId, initialMessages }: ChatWindowProps) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, error, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    // Long code answers stream hundreds of tokens per second; re-rendering and
    // re-highlighting the whole markdown on each one locks up the browser.
    throttle: 100,
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Persist on every settled change for this thread.
  useEffect(() => {
    if (status === "ready" || status === "error") {
      saveThreadMessages(threadId, messages);
    }
  }, [messages, status, threadId]);

  // Keep the composer focused.
  const formRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    formRef.current?.querySelector("textarea")?.focus();
  }, [threadId, status]);

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || isLoading) return;
    void sendMessage({ text });
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <img
                  src={forjaLogo}
                  alt="Forja, tu IA programadora"
                  width={72}
                  height={72}
                  className="rounded-2xl shadow-lg shadow-primary/20"
                />
              }
              title="¿Qué aplicación forjamos hoy?"
              description="Describe la app que quieres y escribiré el código completo por ti."
            >
              <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void sendMessage({ text: s })}
                    className="rounded-xl border border-border bg-card px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message, index) => {
              const isLast = index === messages.length - 1;
              return (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.parts.map((part, partIndex) => {
                      if (part.type === "reasoning") {
                        return (
                          <Reasoning
                            key={partIndex}
                            isStreaming={isLast && status === "streaming"}
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      }
                      if (part.type === "text") {
                        return message.role === "assistant" ? (
                          <MessageResponse key={partIndex}>{part.text}</MessageResponse>
                        ) : (
                          <span key={partIndex} className="whitespace-pre-wrap">
                            {part.text}
                          </span>
                        );
                      }
                      return null;
                    })}
                    {message.role === "assistant" &&
                      isLast &&
                      status === "submitted" && <Shimmer>Forjando tu código…</Shimmer>}
                  </MessageContent>
                </Message>
              );
            })
          )}
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              No pude completar la respuesta. Inténtalo de nuevo; si el problema
              persiste, puede que se hayan agotado los créditos de IA del proyecto.
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div ref={formRef} className="mx-auto w-full max-w-3xl px-4 pb-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            placeholder="Describe la aplicación que quieres programar…"
            aria-label="Mensaje para Forja"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} disabled={isLoading && status !== "streaming"} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Forja puede cometer errores. Revisa el código antes de usarlo en producción.
        </p>
      </div>
    </div>
  );
}
