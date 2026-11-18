-- ========================================================
-- Chabad on Campus BIU - Interactive Live Quiz Schema
-- Paste this file into your Supabase SQL Editor and Run
-- ========================================================

-- 1. Quiz Sessions Table (Each game round is a separate row)
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    deck_id TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'question', 'reveal', 'finished')),
    current_question_index INTEGER NOT NULL DEFAULT 0,
    question_started_at TIMESTAMPTZ,
    question_duration_sec INTEGER NOT NULL DEFAULT 20,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_code ON public.quiz_sessions(code);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created_at ON public.quiz_sessions(created_at DESC);

-- 2. Quiz Players Table (Players per round - deleted automatically when round is deleted)
CREATE TABLE IF NOT EXISTS public.quiz_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '✨',
    score INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    total_response_ms INTEGER NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_players_session ON public.quiz_players(session_id);

-- 3. Quiz Answers Table (Individual answers per question - deleted automatically with round)
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.quiz_players(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    selected_option INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, player_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_q ON public.quiz_answers(session_id, question_index);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Quiz Sessions Policies
DROP POLICY IF EXISTS "Quiz sessions are viewable by everyone" ON public.quiz_sessions;
CREATE POLICY "Quiz sessions are viewable by everyone"
ON public.quiz_sessions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage quiz sessions" ON public.quiz_sessions;
CREATE POLICY "Admins can manage quiz sessions"
ON public.quiz_sessions FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Quiz Players Policies
DROP POLICY IF EXISTS "Quiz players are viewable by everyone" ON public.quiz_players;
CREATE POLICY "Quiz players are viewable by everyone"
ON public.quiz_players FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can join a quiz session" ON public.quiz_players;
CREATE POLICY "Anyone can join a quiz session"
ON public.quiz_players FOR INSERT
WITH CHECK (char_length(trim(nickname)) > 0);

DROP POLICY IF EXISTS "Admins can manage quiz players" ON public.quiz_players;
CREATE POLICY "Admins can manage quiz players"
ON public.quiz_players FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Quiz Answers Policies
DROP POLICY IF EXISTS "Quiz answers are viewable by everyone" ON public.quiz_answers;
CREATE POLICY "Quiz answers are viewable by everyone"
ON public.quiz_answers FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can delete quiz answers" ON public.quiz_answers;
CREATE POLICY "Admins can delete quiz answers"
ON public.quiz_answers FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ==========================================
-- ATOMIC SERVER FUNCTIONS (RPC)
-- ==========================================

-- Start a question using DB server timestamp so all phones & host screen stay synchronized
CREATE OR REPLACE FUNCTION public.start_quiz_question(
    p_session_id UUID,
    p_question_index INTEGER,
    p_duration_sec INTEGER DEFAULT 20
)
RETURNS JSONB AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT COALESCE(v_is_admin, false) THEN
        RAISE EXCEPTION 'Unauthorized: only admins can control quiz flow';
    END IF;

    UPDATE public.quiz_sessions
    SET
        status = 'question',
        current_question_index = p_question_index,
        question_duration_sec = p_duration_sec,
        question_started_at = NOW()
    WHERE id = p_session_id;

    RETURN jsonb_build_object(
        'ok', true,
        'question_index', p_question_index,
        'question_started_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.start_quiz_question(UUID, INTEGER, INTEGER) TO authenticated;

-- Submit player answer with server-calculated speed & streak points
CREATE OR REPLACE FUNCTION public.submit_quiz_answer(
    p_session_id UUID,
    p_player_id UUID,
    p_question_index INTEGER,
    p_selected_option INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_player RECORD;
    v_existing RECORD;
    v_question JSONB;
    v_correct_idx INTEGER;
    v_is_correct BOOLEAN;
    v_elapsed_ms INTEGER;
    v_duration_ms INTEGER;
    v_speed_bonus INTEGER;
    v_streak_bonus INTEGER;
    v_new_streak INTEGER;
    v_points INTEGER;
BEGIN
    SELECT * INTO v_session
    FROM public.quiz_sessions
    WHERE id = p_session_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'המשחק לא נמצא';
    END IF;

    IF v_session.status <> 'question' OR v_session.current_question_index <> p_question_index THEN
        RETURN jsonb_build_object(
            'accepted', false,
            'reason', 'time_closed'
        );
    END IF;

    SELECT * INTO v_player
    FROM public.quiz_players
    WHERE id = p_player_id AND session_id = p_session_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'שחקן לא נמצא במשחק זה';
    END IF;

    SELECT * INTO v_existing
    FROM public.quiz_answers
    WHERE session_id = p_session_id
      AND player_id = p_player_id
      AND question_index = p_question_index;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'accepted', true,
            'already_answered', true,
            'selected_option', v_existing.selected_option,
            'is_correct', v_existing.is_correct,
            'points_earned', v_existing.points_earned,
            'response_time_ms', v_existing.response_time_ms,
            'new_score', v_player.score,
            'new_streak', v_player.streak
        );
    END IF;

    v_question := v_session.questions -> p_question_index;
    v_correct_idx := (v_question ->> 'correctIndex')::INTEGER;
    v_is_correct := (p_selected_option = v_correct_idx);

    v_duration_ms := GREATEST(1000, COALESCE(v_session.question_duration_sec, 20) * 1000);
    v_elapsed_ms := GREATEST(
        100,
        LEAST(
            v_duration_ms,
            FLOOR(EXTRACT(EPOCH FROM (NOW() - COALESCE(v_session.question_started_at, NOW()))) * 1000)::INTEGER
        )
    );

    IF v_is_correct THEN
        v_new_streak := v_player.streak + 1;
        v_speed_bonus := ROUND(400.0 * GREATEST(0.0, 1.0 - (v_elapsed_ms::DOUBLE PRECISION / v_duration_ms::DOUBLE PRECISION)))::INTEGER;
        v_streak_bonus := CASE
            WHEN v_new_streak >= 3 THEN 150
            WHEN v_new_streak = 2 THEN 100
            ELSE 0
        END;
        v_points := 600 + v_speed_bonus + v_streak_bonus;
    ELSE
        v_new_streak := 0;
        v_points := 0;
    END IF;

    INSERT INTO public.quiz_answers (
        session_id,
        player_id,
        question_index,
        selected_option,
        is_correct,
        response_time_ms,
        points_earned
    ) VALUES (
        p_session_id,
        p_player_id,
        p_question_index,
        p_selected_option,
        v_is_correct,
        v_elapsed_ms,
        v_points
    );

    UPDATE public.quiz_players
    SET
        score = score + v_points,
        streak = v_new_streak,
        correct_count = correct_count + CASE WHEN v_is_correct THEN 1 ELSE 0 END,
        total_response_ms = total_response_ms + v_elapsed_ms
    WHERE id = p_player_id;

    RETURN jsonb_build_object(
        'accepted', true,
        'already_answered', false,
        'selected_option', p_selected_option,
        'is_correct', v_is_correct,
        'points_earned', v_points,
        'response_time_ms', v_elapsed_ms,
        'new_score', v_player.score + v_points,
        'new_streak', v_new_streak
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.submit_quiz_answer(UUID, UUID, INTEGER, INTEGER) TO anon, authenticated;

-- ==========================================
-- REALTIME PUBLICATION
-- ==========================================

ALTER TABLE public.quiz_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_players REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_answers REPLICA IDENTITY FULL;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sessions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_players;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_answers;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
