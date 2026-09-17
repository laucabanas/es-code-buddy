import { bootstrapInitialThread } from "@/lib/threads";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import forjaLogo from "@/assets/forja-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forja — IA en español que programa aplicaciones" },
      {
        name: "description",
        content:
          "Forja es un asistente de IA en español que programa aplicaciones completas: describe tu idea y recibe código funcional al instante.",
      },
      { property: "og:title", content: "Forja — IA en español que programa aplicaciones" },
      {
        property: "og:description",
        content:
          "Describe tu idea y Forja escribe el código completo de tu aplicación, en español.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const thread = bootstrapInitialThread();
    void navigate({ to: "/$threadId", params: { threadId: thread.id }, replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <img
        src={forjaLogo}
        alt="Forja, tu IA programadora"
        width={64}
        height={64}
        className="animate-pulse rounded-2xl"
      />
      <p className="text-sm text-muted-foreground">Calentando la forja…</p>
    </div>
  );
}
