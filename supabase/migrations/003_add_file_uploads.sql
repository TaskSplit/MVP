-- Session Files table for file uploads
-- ============================================

CREATE TABLE IF NOT EXISTS public.session_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.session_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files of their sessions"
  ON public.session_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_files.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create files for their sessions"
  ON public.session_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_files.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files of their sessions"
  ON public.session_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_files.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_session_files_session_id ON public.session_files(session_id);

-- ============================================
-- Storage bucket for session files
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('session-files', 'session-files', false, 10485760)  -- 10MB limit
ON CONFLICT (id) DO NOTHING;

-- Storage policies (path pattern: {user_id}/{session_id}/{filename})
CREATE POLICY "Authenticated users can upload session files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'session-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own session files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'session-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own session files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'session-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
