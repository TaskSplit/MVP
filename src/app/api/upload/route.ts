export const runtime = "edge";

import { createRouteHandlerClient } from "@/lib/supabase/route";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "text/css",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/pdf",
]);

const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".csv", ".json", ".xml", ".html", ".css",
  ".js", ".ts", ".jsx", ".tsx", ".py", ".rb", ".go", ".rs",
  ".java", ".c", ".cpp", ".h", ".hpp", ".sh", ".bash", ".zsh",
  ".yaml", ".yml", ".toml", ".ini", ".cfg", ".env", ".sql",
  ".graphql", ".prisma", ".svelte", ".vue", ".php", ".swift",
  ".kt", ".dart", ".r", ".m", ".mm", ".lua", ".pl", ".ex",
  ".exs", ".hs", ".scala", ".clj", ".erl", ".elm",
]);

function isAllowedFile(fileName: string, mimeType: string): boolean {
  if (ALLOWED_TYPES.has(mimeType)) return true;
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  return TEXT_EXTENSIONS.has(ext);
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_SESSION = 10;

export async function POST(request: Request) {
  const { supabase, applyResponseCookies } = createRouteHandlerClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(user.id, "upload", { maxRequests: 20, windowSec: 60 });
  if (limited) return limited;

  const formData = await request.formData();
  const sessionId = formData.get("sessionId") as string;
  const files = formData.getAll("files") as File[];

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  // Verify session ownership
  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Check existing file count
  const { count } = await supabase
    .from("session_files")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if ((count ?? 0) + files.length > MAX_FILES_PER_SESSION) {
    return NextResponse.json(
      { error: `Maximum ${MAX_FILES_PER_SESSION} files per session` },
      { status: 400 }
    );
  }

  const uploaded: { id: string; file_name: string; file_size: number }[] = [];
  const uploadedPaths: string[] = [];

  for (const file of files) {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("session-files").remove(uploadedPaths);
      }
      return NextResponse.json(
        { error: `File "${file.name}" exceeds 10MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isAllowedFile(file.name, file.type)) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("session-files").remove(uploadedPaths);
      }
      return NextResponse.json(
        { error: `File type not supported: "${file.name}"` },
        { status: 400 }
      );
    }

    // Sanitize filename - remove path traversal characters
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${sessionId}/${Date.now()}_${safeName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("session-files")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("session-files").remove(uploadedPaths);
      }
      return NextResponse.json(
        { error: `Failed to upload "${file.name}"` },
        { status: 500 }
      );
    }

    uploadedPaths.push(storagePath);

    // Save metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from("session_files")
      .insert({
        session_id: sessionId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
        storage_path: storagePath,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Roll back all uploaded storage files
      await supabase.storage.from("session-files").remove(uploadedPaths);
      return NextResponse.json(
        { error: `Failed to save file record for "${file.name}"` },
        { status: 500 }
      );
    }

    uploaded.push({
      id: fileRecord.id,
      file_name: fileRecord.file_name,
      file_size: fileRecord.file_size,
    });
  }

  return applyResponseCookies(NextResponse.json({ success: true, files: uploaded }));
}
