"use client";

import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { Calendar, Layers } from "lucide-react";

interface SessionSummary {
  id: string;
  title: string;
  prompt: string;
  created_at: string;
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
          <h3 className="mb-2 text-lg font-semibold text-foreground line-clamp-1 group-hover:text-accent-light transition-colors">
            {session.title || "Untitled Session"}
          </h3>
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
