"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { RoundWithSteps, SessionFile } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { Send, X, Loader2, MessageCircle } from "lucide-react";

interface PlitMessage {
  role: "user" | "assistant";
  content: string;
}

interface PlitChatProps {
  sessionId: string;
  sessionTitle: string;
  prompt: string;
  rounds: RoundWithSteps[];
  activeRound: number;
  files?: SessionFile[];
  onActionComplete: () => void;
}

export function PlitChat({
  sessionId,
  sessionTitle,
  prompt,
  rounds,
  activeRound,
  files = [],
  onActionComplete,
}: PlitChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<PlitMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm Plit, your task assistant. I can help you if you're stuck on a step, or regenerate parts of your breakdown if something doesn't fit. What do you need?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: PlitMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/mvp/api/plit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: trimmed,
          history: messages,
          context: {
            prompt,
            sessionTitle,
            rounds: rounds.map((r) => ({
              id: r.id,
              name: r.name,
              order_index: r.order_index,
              steps: r.steps.map((s) => ({
                id: s.id,
                title: s.title,
                is_completed: s.is_completed,
                order_index: s.order_index,
              })),
            })),
            activeRound,
            files: files.map((f) => ({
              file_name: f.file_name,
              file_size: f.file_size,
              mime_type: f.mime_type,
            })),
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get response");
      }

      const data = await res.json();
      const assistantMessage: PlitMessage = {
        role: "assistant",
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // If action requires reload, trigger it
      if (data.action?.reload) {
        onActionComplete();
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I ran into an issue: ${errorMsg}. Try again?`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 font-semibold shadow-lg transition-all",
          isOpen
            ? "bg-card border border-border text-muted hover:text-foreground"
            : "plit-button text-white"
        )}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            {/* Plit avatar */}
            <div className="h-7 w-7 rounded-md overflow-hidden border border-accent/60 flex items-center justify-center">
              <img src="/Plit.png" alt="Plit" className="h-full w-full object-cover" />
            </div>
            <span className="hidden sm:inline">Ask Plit</span>
            <MessageCircle className="h-4 w-4 sm:hidden" />
          </>
        )}
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-20 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-border shadow-2xl transition-all duration-300",
          "plit-panel",
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card/80 backdrop-blur-md">
          {/* Plit avatar */}
          <div className="h-9 w-9 rounded-lg overflow-hidden border border-accent/50 flex items-center justify-center">
            <img src="/Plit.png" alt="Plit" className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Plit</h3>
            <p className="text-xs text-muted truncate">Your task assistant</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1 text-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 plit-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="mt-1 h-6 w-6 shrink-0 rounded-md overflow-hidden border border-accent/40">
                  <img src="/Plit.png" alt="Plit" className="h-full w-full object-cover" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-accent text-white rounded-br-sm"
                    : "bg-card border border-border text-foreground rounded-bl-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="mt-1 h-6 w-6 shrink-0 rounded-md overflow-hidden border border-accent/40">
                <img src="/Plit.png" alt="Plit" className="h-full w-full object-cover" />
              </div>
              <div className="bg-card border border-border rounded-xl rounded-bl-sm px-3 py-2">
                <div className="flex gap-1">
                  <span className="plit-typing-dot" />
                  <span className="plit-typing-dot" style={{ animationDelay: "0.15s" }} />
                  <span className="plit-typing-dot" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 bg-card/60 backdrop-blur-md">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Plit anything..."
              rows={1}
              className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-colors"
              style={{ maxHeight: "80px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-all hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
