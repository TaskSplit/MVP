"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

export function PromptInput() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to create session");
      }

      const { sessionId } = await res.json();
      router.push(`/session/${sessionId}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
      <div className="glass-card p-2 !cursor-default" style={{ cursor: "default" }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Build a personal blog with Next.js, add authentication, deploy to Vercel..."
          rows={4}
          className="w-full resize-none rounded-lg bg-transparent p-4 text-foreground placeholder:text-muted/50 focus:outline-none"
        />
        <div className="flex justify-end px-2 pb-2">
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Split It
          </button>
        </div>
      </div>
    </form>
  );
}
