"use client";

import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { Calendar, Layers, CheckCircle2 } from "lucide-react";

interface SessionSummary {
  id: string;
  title: string;
  prompt: string;
  created_at: string;
  status: string;
  round_count: number;
}

interface SessionListProps {
  sessions: SessionSummary[];
}

export function SessionList({ sessions }: SessionListProps) {
  const router = useRouter();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sessions.map((session) => (
        <GlassCard
          key={session.id}
          onClick={() => router.push(`/session/${session.id}`)}
          className="group"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground line-clamp-1 group-hover:text-accent-light transition-colors">
              {session.title || "Untitled Session"}
            </h3>
            {session.status === "completed" && (
              <span className="shrink-0 flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-semibold text-success">
                <CheckCircle2 className="h-3 w-3" />
                Done
              </span>
            )}
          </div>
          <p className="mb-4 text-sm text-muted line-clamp-2">
            {session.prompt}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(session.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {session.round_count} round{session.round_count !== 1 ? "s" : ""}
            </span>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
