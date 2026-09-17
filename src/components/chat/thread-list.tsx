import { Button } from "@/components/ui/button";
import {
  createThread,
  deleteThread,
  loadThreads,
  type ThreadRecord,
} from "@/lib/threads";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Code2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import forjaLogo from "@/assets/forja-logo.png";

export function ThreadList() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;
  const [threads, setThreads] = useState<ThreadRecord[]>([]);

  const refresh = useCallback(() => setThreads(loadThreads()), []);

  useEffect(() => {
    refresh();
    // Refresh when another part of the app saves messages (title updates).
    const interval = window.setInterval(refresh, 2000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const handleNew = () => {
    const thread = createThread();
    refresh();
    void navigate({ to: "/$threadId", params: { threadId: thread.id } });
  };

  const handleDelete = (id: string) => {
    deleteThread(id);
    refresh();
    if (id === activeId) {
      const remaining = loadThreads();
      const next = remaining[0] ?? createThread();
      void navigate({ to: "/$threadId", params: { threadId: next.id } });
    }
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-sidebar max-md:hidden">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <img
          src={forjaLogo}
          alt=""
          width={32}
          height={32}
          className="rounded-lg"
        />
        <div>
          <p className="font-display text-sm font-semibold tracking-tight">Forja</p>
          <p className="text-[11px] text-muted-foreground">IA que programa apps</p>
        </div>
      </div>

      <div className="px-3">
        <Button onClick={handleNew} className="w-full justify-start gap-2" size="sm">
          <Plus className="size-4" />
          Nueva conversación
        </Button>
      </div>

      <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`group flex items-center gap-1 rounded-lg text-sm transition-colors ${
              thread.id === activeId
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
            }`}
          >
            <Link
              to="/$threadId"
              params={{ threadId: thread.id }}
              className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2"
            >
              <Code2 className="size-3.5 shrink-0 opacity-60" />
              <span className="truncate">{thread.title}</span>
            </Link>
            <button
              type="button"
              aria-label={`Eliminar ${thread.title}`}
              onClick={() => handleDelete(thread.id)}
              className="mr-1.5 hidden rounded p-1 text-muted-foreground hover:text-destructive group-hover:block"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );
}
