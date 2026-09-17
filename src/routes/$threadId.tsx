import { ChatWindow } from "@/components/chat/chat-window";
import { ThreadList } from "@/components/chat/thread-list";
import { getThread } from "@/lib/threads";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversación — Forja" },
      {
        name: "description",
        content: "Conversa con Forja, la IA en español que programa aplicaciones completas.",
      },
      { property: "og:title", content: "Forja — IA en español que programa aplicaciones" },
      {
        property: "og:description",
        content: "Describe tu idea y Forja escribe el código completo de tu aplicación.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  // Read persisted messages once per thread; the window remounts on id change.
  const initialMessages = useMemo(
    () => getThread(threadId)?.messages ?? [],
    [threadId],
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      <ThreadList />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatWindow key={threadId} threadId={threadId} initialMessages={initialMessages} />
      </main>
    </div>
  );
}
