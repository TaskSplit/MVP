"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Paperclip, X, FileText } from "lucide-react";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PromptInput() {
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const MAX_FILES = 10;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    setFiles((prev) => {
      const combined = [...prev];
      for (const file of fileArray) {
        if (combined.length >= MAX_FILES) break;
        if (file.size > MAX_FILE_SIZE) {
          setError(`"${file.name}" exceeds 10MB limit`);
          continue;
        }
        // Avoid duplicates by name+size
        if (!combined.some((f) => f.name === file.name && f.size === file.size)) {
          combined.push(file);
        }
      }
      return combined;
    });
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      // 1. Create the session
      const res = await fetch("/mvp/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const { sessionId } = await res.json();

      // 2. Upload files if any
      if (files.length > 0) {
        const formData = new FormData();
        formData.append("sessionId", sessionId);
        files.forEach((file) => formData.append("files", file));

        const uploadRes = await fetch("/mvp/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}));
          console.error("File upload error:", data.error);
          // Continue to session even if upload fails - prompt still works
        }
      }

      router.push(`/session/${sessionId}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
      {error && (
        <div className="mb-3 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      <div
        className={`glass-card p-2 !cursor-default transition-all ${
          isDragging ? "border-accent/50 shadow-[0_0_20px_rgba(124,58,237,0.2)]" : ""
        }`}
        style={{ cursor: "default" }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Build a personal blog with Next.js, add authentication, deploy to Vercel..."
          rows={4}
          className="w-full resize-none rounded-lg bg-transparent p-4 text-foreground placeholder:text-muted/50 focus:outline-none"
        />

        {/* File chips */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pb-2">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/20 px-2.5 py-1.5 text-xs text-accent-light group"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[140px] truncate">{file.name}</span>
                <span className="text-muted text-[10px]">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ml-0.5 rounded-full p-0.5 text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-accent/5 border-2 border-dashed border-accent/40">
            <p className="text-sm font-medium text-accent-light">
              Drop files here
            </p>
          </div>
        )}

        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || files.length >= MAX_FILES}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted hover:text-accent-light hover:bg-accent/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Attach files for context (code, docs, configs)"
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span>Attach</span>
              {files.length > 0 && (
                <span className="text-accent-light">({files.length})</span>
              )}
            </button>
          </div>
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

      <p className="mt-2 text-center text-xs text-muted/60">
        Attach code files, docs, or configs to give the AI more context
      </p>
    </form>
  );
}
