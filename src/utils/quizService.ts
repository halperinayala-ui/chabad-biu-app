import { supabase } from '../lib/supabase';
import {
  generateRoomCode,
  type QuizAnswer,
  type QuizDeck,
  type QuizPlayer,
  type QuizSession
} from '../data/quizDecks';

export interface QuizSessionWithStats extends QuizSession {
  players: QuizPlayer[];
}

export interface SubmitAnswerResult {
  accepted: boolean;
  reason?: string;
  already_answered?: boolean;
  selected_option?: number;
  is_correct?: boolean;
  points_earned?: number;
  response_time_ms?: number;
  new_score?: number;
  new_streak?: number;
}

export function isMissingQuizTablesError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string; details?: string };
  const code = err.code || '';
  const msg = `${err.message || ''} ${err.details || ''}`.toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('quiz_sessions') && (msg.includes('does not exist') || msg.includes('could not find'))
  );
}

export async function createQuizSession(
  deck: QuizDeck,
  options?: { customTitle?: string; durationSec?: number; createdBy?: string | null }
): Promise<QuizSession> {
  const durationSec = options?.durationSec ?? 20;
  const title = (options?.customTitle || '').trim() || deck.title;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert({
        code,
        title,
        deck_id: deck.id,
        questions: deck.questions,
        status: 'lobby',
        current_question_index: 0,
        question_duration_sec: durationSec,
        created_by: options?.createdBy ?? null
      })
      .select('*')
      .single();

    if (!error && data) {
      return data as QuizSession;
    }

    // Retry only on unique code collision
    if (error && (error.code === '23505' || error.message?.includes('duplicate'))) {
      continue;
    }
    throw error;
  }

  throw new Error('לא הצלחנו לייצר קוד משחק פנוי, נסי שוב');
}

export async function fetchAllQuizSessions(): Promise<QuizSessionWithStats[]> {
  const { data: sessions, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const list = (sessions || []) as QuizSession[];
  if (list.length === 0) return [];

  const sessionIds = list.map((s) => s.id);
  const { data: players, error: playersErr } = await supabase
    .from('quiz_players')
    .select('*')
    .in('session_id', sessionIds)
    .order('score', { ascending: false });

  if (playersErr) throw playersErr;

  const grouped: Record<string, QuizPlayer[]> = {};
  (players || []).forEach((p) => {
    const player = p as QuizPlayer;
    if (!grouped[player.session_id]) grouped[player.session_id] = [];
    grouped[player.session_id].push(player);
  });

  return list.map((s) => ({
    ...s,
    players: (grouped[s.id] || []).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.total_response_ms - b.total_response_ms;
    })
  }));
}

export async function fetchSessionById(sessionId: string): Promise<QuizSession | null> {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) throw error;
  return data as QuizSession | null;
}

export async function fetchSessionByCode(code: string): Promise<QuizSession | null> {
  const cleanCode = code.trim();
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('code', cleanCode)
    .maybeSingle();

  if (error) throw error;
  return data as QuizSession | null;
}

export async function fetchSessionPlayers(sessionId: string): Promise<QuizPlayer[]> {
  const { data, error } = await supabase
    .from('quiz_players')
    .select('*')
    .eq('session_id', sessionId)
    .order('score', { ascending: false })
    .order('total_response_ms', { ascending: true });

  if (error) throw error;
  return (data || []) as QuizPlayer[];
}

export async function fetchSessionAnswers(sessionId: string, questionIndex?: number): Promise<QuizAnswer[]> {
  let query = supabase
    .from('quiz_answers')
    .select('*')
    .eq('session_id', sessionId)
    .order('response_time_ms', { ascending: true });

  if (typeof questionIndex === 'number') {
    query = query.eq('question_index', questionIndex);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as QuizAnswer[];
}

export async function deleteQuizSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('quiz_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

export async function deleteMultipleQuizSessions(sessionIds: string[]): Promise<void> {
  if (sessionIds.length === 0) return;
  const { error } = await supabase
    .from('quiz_sessions')
    .delete()
    .in('id', sessionIds);

  if (error) throw error;
}

export async function startQuestionOnServer(
  sessionId: string,
  questionIndex: number,
  durationSec: number
): Promise<void> {
  const { error } = await supabase.rpc('start_quiz_question', {
    p_session_id: sessionId,
    p_question_index: questionIndex,
    p_duration_sec: durationSec
  });

  if (error) throw error;
}

export async function revealQuestionOnServer(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('quiz_sessions')
    .update({ status: 'reveal' })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function finishSessionOnServer(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('quiz_sessions')
    .update({
      status: 'finished',
      finished_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function joinQuizAsPlayer(
  sessionId: string,
  nickname: string,
  avatar: string
): Promise<QuizPlayer> {
  const { data, error } = await supabase
    .from('quiz_players')
    .insert({
      session_id: sessionId,
      nickname: nickname.trim(),
      avatar
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as QuizPlayer;
}

export async function submitQuizAnswer(
  sessionId: string,
  playerId: string,
  questionIndex: number,
  selectedOption: number
): Promise<SubmitAnswerResult> {
  const { data, error } = await supabase.rpc('submit_quiz_answer', {
    p_session_id: sessionId,
    p_player_id: playerId,
    p_question_index: questionIndex,
    p_selected_option: selectedOption
  });

  if (error) throw error;
  return data as SubmitAnswerResult;
}
