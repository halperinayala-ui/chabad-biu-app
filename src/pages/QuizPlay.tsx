import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Clock,
  Flame,
  Home,
  Sparkles,
  Trophy,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  OPTION_LETTERS,
  PLAYER_AVATARS,
  type QuizPlayer,
  type QuizSession
} from '../data/quizDecks';
import {
  fetchSessionAnswers,
  fetchSessionByCode,
  fetchSessionById,
  fetchSessionPlayers,
  joinQuizAsPlayer,
  submitQuizAnswer,
  type SubmitAnswerResult
} from '../utils/quizService';
import './QuizPlay.css';

const STORAGE_KEY_PREFIX = 'chabad_biu_quiz_player_';

const QuizPlay = () => {
  const { code: routeCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const [codeInput, setCodeInput] = useState(routeCode || '');
  const [session, setSession] = useState<QuizSession | null>(null);
  const [player, setPlayer] = useState<QuizPlayer | null>(null);
  const [players, setPlayers] = useState<QuizPlayer[]>([]);

  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<string>(PLAYER_AVATARS[0]);
  const [joining, setJoining] = useState(false);
  const [lookingUpCode, setLookingUpCode] = useState(!!routeCode);
  const [lookupError, setLookupError] = useState('');

  // Per-question interaction state
  const [secondsLeft, setSecondsLeft] = useState<number>(20);
  const [submitting, setSubmitting] = useState(false);
  const [answerMap, setAnswerMap] = useState<Record<number, SubmitAnswerResult>>({});

  const finishedConfettiRef = useRef(false);

  const lookupSession = useCallback(async (rawCode: string) => {
    const clean = rawCode.trim();
    if (!clean) {
      setLookupError('נא להזין קוד משחק');
      return;
    }
    setLookingUpCode(true);
    setLookupError('');
    try {
      const found = await fetchSessionByCode(clean);
      if (!found) {
        setLookupError('לא נמצא משחק עם הקוד הזה. בדקו את הקוד שעל המסך ונסו שוב.');
        setSession(null);
        return;
      }
      setSession(found);

      // Reconnect automatically if already joined in this browser session
      const savedPlayerId = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${found.id}`);
      const allPlayers = await fetchSessionPlayers(found.id);
      setPlayers(allPlayers);

      if (savedPlayerId) {
        const existingPlayer = allPlayers.find((p) => p.id === savedPlayerId);
        if (existingPlayer) {
          setPlayer(existingPlayer);
          // Restore any already-submitted answers for this player
          const prevAnswers = await fetchSessionAnswers(found.id);
          const map: Record<number, SubmitAnswerResult> = {};
          prevAnswers
            .filter((a) => a.player_id === existingPlayer.id)
            .forEach((a) => {
              map[a.question_index] = {
                accepted: true,
                selected_option: a.selected_option,
                is_correct: a.is_correct,
                points_earned: a.points_earned,
                response_time_ms: a.response_time_ms
              };
            });
          setAnswerMap(map);
        }
      }
    } catch (err) {
      console.error(err);
      setLookupError('שגיאה בחיבור למשחק, נסו שוב.');
    } finally {
      setLookingUpCode(false);
    }
  }, []);

  useEffect(() => {
    if (routeCode) {
      setCodeInput(routeCode);
      lookupSession(routeCode);
    }
  }, [routeCode, lookupSession]);

  // Realtime listener for session updates & standings
  useEffect(() => {
    if (!session?.id) return;
    const sessId = session.id;

    const channel = supabase
      .channel(`quiz-play-${sessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_sessions', filter: `id=eq.${sessId}` },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            setSession(payload.new as QuizSession);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_players', filter: `session_id=eq.${sessId}` },
        async () => {
          const latest = await fetchSessionPlayers(sessId);
          setPlayers(latest);
          if (player?.id) {
            const me = latest.find((p) => p.id === player.id);
            if (me) setPlayer(me);
          }
        }
      )
      .subscribe();

    const interval = window.setInterval(async () => {
      try {
        const [freshSess, latestPlayers] = await Promise.all([
          fetchSessionById(sessId),
          fetchSessionPlayers(sessId)
        ]);
        if (freshSess) setSession(freshSess);
        setPlayers(latestPlayers);
        if (player?.id) {
          const me = latestPlayers.find((p) => p.id === player.id);
          if (me) setPlayer(me);
        }
      } catch {
        // Ignore transient network hiccup
      }
    }, 2500);

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [session?.id, player?.id]);

  // Countdown bar on phone during question
  useEffect(() => {
    if (!session || session.status !== 'question') return;
    const duration = session.question_duration_sec || 20;
    const startedMs = session.question_started_at
      ? new Date(session.question_started_at).getTime()
      : Date.now();

    const tick = () => {
      const elapsedSec = (Date.now() - startedMs) / 1000;
      setSecondsLeft(Math.max(0, Math.ceil(duration - elapsedSec)));
    };

    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [session?.status, session?.current_question_index, session?.question_started_at]);

  // Confetti if player finishes in Top 3
  useEffect(() => {
    if (session?.status === 'finished' && player && !finishedConfettiRef.current) {
      const rank = players.findIndex((p) => p.id === player.id) + 1;
      if (rank >= 1 && rank <= 3) {
        finishedConfettiRef.current = true;
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.65 } });
      }
    }
  }, [session?.status, player, players]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const cleanName = nickname.trim();
    if (!cleanName) {
      toast.error('נא לכתוב את השם שלך');
      return;
    }

    setJoining(true);
    try {
      const created = await joinQuizAsPlayer(session.id, cleanName, avatar);
      sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${session.id}`, created.id);
      setPlayer(created);
      setPlayers((prev) => [...prev, created]);
      toast.success('הצטרפת בהצלחה!');
    } catch (err) {
      console.error(err);
      toast.error('לא הצלחנו לצרף אותך, נסי שוב');
    } finally {
      setJoining(false);
    }
  };

  const handleSelectOption = async (optionIndex: number) => {
    if (!session || !player || session.status !== 'question' || submitting) return;
    const qIdx = session.current_question_index;
    if (answerMap[qIdx]) return;

    setSubmitting(true);
    try {
      const res = await submitQuizAnswer(session.id, player.id, qIdx, optionIndex);
      if (!res.accepted) {
        toast.error('הזמן לשאלה זו כבר הסתיים');
        return;
      }
      setAnswerMap((prev) => ({ ...prev, [qIdx]: res }));
      if (typeof res.new_score === 'number') {
        setPlayer((prev) =>
          prev
            ? {
                ...prev,
                score: res.new_score ?? prev.score,
                streak: res.new_streak ?? prev.streak
              }
            : prev
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בשליחת התשובה');
    } finally {
      setSubmitting(false);
    }
  };

  const myRank = player ? players.findIndex((p) => p.id === player.id) + 1 : 0;
  const currentQuestion =
    session && session.questions[session.current_question_index]
      ? session.questions[session.current_question_index]
      : null;
  const myAnswerForCurrent = session ? answerMap[session.current_question_index] : undefined;

  return (
    <div className="quiz-play-shell">
      <div className="quiz-play-container">
        {/* Top bar */}
        <div className="quiz-play-topbar">
          <div className="quiz-play-brand">
            <img src="/logo-purple.png" alt="חב״ד בר אילן" style={{ height: '34px', width: 'auto' }} />
            <span>חידון לייב</span>
          </div>

          {player && (
            <div className="quiz-play-score-pill">
              {player.avatar} {player.nickname} • {player.score.toLocaleString()} נק׳
            </div>
          )}
        </div>

        {/* 1. No session yet: Enter 4-digit code */}
        {!session && (
          <motion.div
            className="quiz-play-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 style={{ margin: '0 0 0.4rem', fontWeight: 900, fontSize: '1.45rem' }}>
              הצטרפות למשחק
            </h2>
            <p style={{ color: '#6b7280', margin: '0 0 1.25rem', fontSize: '0.95rem' }}>
              הכניסו את קוד החדר המופיע על המסך הראשי
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                lookupSession(codeInput);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="quiz-play-input quiz-play-code-input"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                aria-label="קוד משחק"
              />

              {lookupError && (
                <div style={{ color: '#dc2626', fontSize: '0.88rem', fontWeight: 700 }}>
                  {lookupError}
                </div>
              )}

              <button type="submit" className="quiz-play-primary-btn" disabled={lookingUpCode}>
                {lookingUpCode ? 'מחפש משחק...' : 'המשך'}
              </button>
            </form>
          </motion.div>
        )}

        {/* 2. Session found, player not joined yet */}
        {session && !player && (
          <motion.div
            className="quiz-play-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#492691', marginBottom: '0.25rem' }}>
              קוד חדר {session.code}
            </div>
            <h2 style={{ margin: '0 0 0.35rem', fontWeight: 900, fontSize: '1.4rem' }}>
              {session.title}
            </h2>

            {session.status === 'finished' ? (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ color: '#6b7280', marginBottom: '1.25rem' }}>
                  המשחק הזה כבר הסתיים! אם נפתח סבב חדש על המסך, סרקו את הברקוד החדש או הקלידו את הקוד החדש.
                </p>
                <button
                  className="quiz-play-primary-btn"
                  onClick={() => {
                    setSession(null);
                    setCodeInput('');
                    navigate('/play', { replace: true });
                  }}
                >
                  כניסה עם קוד חדש
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinGame} style={{ marginTop: '1rem' }}>
                <label
                  htmlFor="player-nickname"
                  style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}
                >
                  איך לקרוא לך בטבלת המובילים?
                </label>
                <input
                  id="player-nickname"
                  type="text"
                  maxLength={24}
                  className="quiz-play-input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />

                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '1rem' }}>
                  בחרו סמל אישי
                </div>
                <div className="quiz-avatars-row">
                  {PLAYER_AVATARS.map((emo) => (
                    <button
                      type="button"
                      key={emo}
                      className={`quiz-avatar-btn ${avatar === emo ? 'active' : ''}`}
                      onClick={() => setAvatar(emo)}
                    >
                      {emo}
                    </button>
                  ))}
                </div>

                <button type="submit" className="quiz-play-primary-btn" disabled={joining}>
                  <Sparkles size={18} />
                  {joining ? 'מצרף אותך...' : 'יאללה, נכנסים למשחק!'}
                </button>
              </form>
            )}
          </motion.div>
        )}

        {/* 3. Player joined — Lobby */}
        {session && player && session.status === 'lobby' && (
          <motion.div
            className="quiz-play-card"
            style={{ textAlign: 'center', padding: '2.25rem 1.5rem' }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div style={{ fontSize: '3.2rem', marginBottom: '0.5rem' }}>{player.avatar}</div>
            <h2 style={{ margin: '0 0 0.4rem', fontWeight: 900, fontSize: '1.5rem' }}>
              את/ה בפנים, {player.nickname}!
            </h2>
            <p style={{ color: '#6b7280', margin: '0 0 1.4rem', lineHeight: 1.55 }}>
              המשחק <strong>{session.title}</strong> יתחיל מיד כשהמנחה יפעיל את השאלה הראשונה.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                background: '#f3f0ff',
                color: '#492691',
                fontWeight: 800,
                fontSize: '0.9rem'
              }}
            >
              <Clock size={16} />
              מחכים על המסך • {players.length} משתתפים מחוברים
            </div>
          </motion.div>
        )}

        {/* 4. Active Question on Phone (Full Question + Options!) */}
        {session && player && session.status === 'question' && currentQuestion && (
          <motion.div
            key={`q-${session.current_question_index}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', fontSize: '0.86rem', fontWeight: 800, color: '#492691' }}>
              <span>
                שאלה {session.current_question_index + 1} מתוך {session.questions.length}
              </span>
              <span style={{ color: secondsLeft <= 5 ? '#dc2626' : '#492691' }}>
                ⏱️ {secondsLeft} שניות
              </span>
            </div>

            <div className="quiz-phone-timer-bar">
              <div
                className="quiz-phone-timer-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, (secondsLeft / (session.question_duration_sec || 20)) * 100))}%`,
                  backgroundColor: secondsLeft <= 5 ? '#ef4444' : '#492691'
                }}
              />
            </div>

            <div className="quiz-phone-question-box">
              <h2 className="quiz-phone-question-text">{currentQuestion.question}</h2>
            </div>

            {myAnswerForCurrent ? (
              <div className="quiz-feedback-banner wait">
                <Zap size={32} style={{ marginBottom: '0.4rem' }} />
                <div style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.3rem' }}>
                  התשובה שלך נקלטה!
                </div>
                <div style={{ fontSize: '0.94rem', opacity: 0.9 }}>
                  בחרת באפשרות <strong>{OPTION_LETTERS[myAnswerForCurrent.selected_option ?? 0]}</strong> • ממתינים לחשיפת התשובה על המסך
                </div>
              </div>
            ) : secondsLeft <= 0 ? (
              <div className="quiz-feedback-banner lose">
                <Clock size={30} style={{ marginBottom: '0.4rem' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>הזמן לשאלה זו הסתיים</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>ממתינים לתוצאות על המסך...</div>
              </div>
            ) : (
              <div className="quiz-phone-options">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="quiz-phone-option-btn"
                    disabled={submitting}
                    onClick={() => handleSelectOption(idx)}
                  >
                    <span className="quiz-phone-letter">{OPTION_LETTERS[idx]}</span>
                    <span style={{ flex: 1 }}>{opt}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* 5. Reveal Feedback on Phone */}
        {session && player && session.status === 'reveal' && currentQuestion && (
          <motion.div
            key={`rev-${session.current_question_index}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {myAnswerForCurrent?.is_correct ? (
              <div className="quiz-feedback-banner win">
                <CheckCircle2 size={36} style={{ marginBottom: '0.35rem' }} />
                <div style={{ fontSize: '1.45rem', fontWeight: 900 }}>
                  כל הכבוד! תשובה נכונה 🎉
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  +{myAnswerForCurrent.points_earned} נקודות
                </div>
                {typeof myAnswerForCurrent.response_time_ms === 'number' && (
                  <div style={{ fontSize: '0.88rem', opacity: 0.92, marginTop: '0.25rem' }}>
                    זמן תגובה: {(myAnswerForCurrent.response_time_ms / 1000).toFixed(2)} שניות ⚡
                  </div>
                )}
              </div>
            ) : (
              <div className="quiz-feedback-banner lose">
                <div style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                  {myAnswerForCurrent ? 'כמעט! לא הפעם' : 'לא הספקת לענות הפעם'}
                </div>
                <div style={{ fontSize: '0.94rem', opacity: 0.92 }}>
                  התשובה הנכונה: <strong>{OPTION_LETTERS[currentQuestion.correctIndex]}. {currentQuestion.options[currentQuestion.correctIndex]}</strong>
                </div>
              </div>
            )}

            <div className="quiz-play-card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 700 }}>המיקום שלך כרגע</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#492691' }}>
                    מקום #{myRank || '-'} מתוך {players.length}
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 700 }}>ניקוד מצטבר</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>
                    {player.score.toLocaleString()}
                  </div>
                </div>
              </div>

              {player.streak >= 2 && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    background: '#fff7ed',
                    color: '#c2410c',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    marginBottom: '0.75rem'
                  }}
                >
                  <Flame size={15} />
                  רצף של {player.streak} תשובות נכונות!
                </div>
              )}

              {currentQuestion.explanation && (
                <div style={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.55, paddingTop: '0.65rem', borderTop: '1px solid #f3f4f6' }}>
                  {currentQuestion.explanation}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#6b7280', fontWeight: 700 }}>
              ממתינים שהמנחה יעבור לשאלה הבאה...
            </div>
          </motion.div>
        )}

        {/* 6. Finished Summary on Phone */}
        {session && player && session.status === 'finished' && (
          <motion.div
            className="quiz-play-card"
            style={{ textAlign: 'center', padding: '2rem 1.5rem' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div style={{ fontSize: '3.2rem', marginBottom: '0.4rem' }}>
              {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🏆'}
            </div>
            <h2 style={{ margin: '0 0 0.25rem', fontWeight: 900, fontSize: '1.6rem' }}>
              סיימת במקום #{myRank || '-'}!
            </h2>
            <p style={{ color: '#6b7280', margin: '0 0 1.25rem' }}>
              מתוך {players.length} משתתפים ב-{session.title}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ background: '#f5f3ff', borderRadius: '16px', padding: '0.9rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#492691' }}>
                  {player.score.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 700 }}>ניקוד סופי</div>
              </div>
              <div style={{ background: '#ecfdf5', borderRadius: '16px', padding: '0.9rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669' }}>
                  {player.correct_count} / {session.questions.length}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 700 }}>תשובות נכונות</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                className="quiz-play-primary-btn"
                onClick={() => {
                  setSession(null);
                  setPlayer(null);
                  setPlayers([]);
                  setAnswerMap({});
                  setCodeInput('');
                  navigate('/play', { replace: true });
                }}
              >
                <Trophy size={18} />
                הצטרפות לסבב חדש
              </button>
              <button
                style={{
                  padding: '0.75rem',
                  borderRadius: '14px',
                  border: '1px solid #e5e7eb',
                  fontWeight: 700,
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
                onClick={() => navigate('/')}
              >
                <Home size={17} />
                חזרה לעמוד הבית
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuizPlay;
