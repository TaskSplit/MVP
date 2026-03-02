-- Add status column to sessions table
-- Possible values: 'active', 'completed'
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
