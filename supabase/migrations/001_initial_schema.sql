-- TaskSplit Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ROUNDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0
);

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rounds of their sessions"
  ON public.rounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = rounds.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rounds for their sessions"
  ON public.rounds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = rounds.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rounds of their sessions"
  ON public.rounds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = rounds.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rounds of their sessions"
  ON public.rounds FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = rounds.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- ============================================
-- STEPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  order_index INT NOT NULL DEFAULT 0
);

ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view steps of their sessions"
  ON public.steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rounds
      JOIN public.sessions ON sessions.id = rounds.session_id
      WHERE rounds.id = steps.round_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create steps for their sessions"
  ON public.steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rounds
      JOIN public.sessions ON sessions.id = rounds.session_id
      WHERE rounds.id = steps.round_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update steps of their sessions"
  ON public.steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rounds
      JOIN public.sessions ON sessions.id = rounds.session_id
      WHERE rounds.id = steps.round_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete steps of their sessions"
  ON public.steps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.rounds
      JOIN public.sessions ON sessions.id = rounds.session_id
      WHERE rounds.id = steps.round_id
      AND sessions.user_id = auth.uid()
    )
  );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_rounds_session_id ON public.rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_steps_round_id ON public.steps(round_id);
