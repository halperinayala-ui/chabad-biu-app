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
  Volume2,
  VolumeX,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { QUIZ_AVATARS, QuizAvatar } from '../components/QuizAvatar';
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
import { quizSound } from '../utils/quizSound';
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
  const [sfxMuted, setSfxMuted] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState<number>(20);
  const [submitting, setSubmitting] = useState(false);
  const [answerMap, setAnswerMap] = useState<Record<number, SubmitAnswerResult>>({});

  const finishedConfettiRef = useRef(false);
  const lastRevealSoundIdxRef = useRef<number | null>(null);

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

      const savedPlayerId = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${found.id}`);
      const allPlayers = await fetchSessionPlayers(found.id);
      setPlayers(allPlayers);

      if (savedPlayerId) {
        const existingPlayer = allPlayers.find((p) => p.id === savedPlayerId);
        if (existingPlayer) {
          setPlayer(existingPlayer);
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

  // Subtle celebratory sound when reveal opens with a correct answer
  useEffect(() => {
    if (!session || session.status !== 'reveal' || sfxMuted) return;
    const qIdx = session.current_question_index;
    if (lastRevealSoundIdxRef.current === qIdx) return;
    lastRevealSoundIdxRef.current = qIdx;
    if (answerMap[qIdx]?.is_correct) {
      quizSound.playJoin();
    }
  }, [session?.status, session?.current_question_index, answerMap, sfxMuted]);

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

    if (!sfxMuted) {
      quizSound.unlock();
    }

    setJoining(true);
    try {
      const created = await joinQuizAsPlayer(session.id, cleanName, avatar);
      sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${session.id}`, created.id);
      setPlayer(created);
      setPlayers((prev) => [...prev, created]);
      if (!sfxMuted) quizSound.playJoin();
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

    if (!sfxMuted) {
      quizSound.unlock();
      quizSound.playLockIn();
    }

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
  const selectedAvatarObj = QUIZ_AVATARS.find((a) => a.id === avatar);

  const avgResponseSec =
    player && player.total_response_ms > 0 && session
      ? (
          player.total_response_ms /
          1000 /
          Math.max(1, Object.keys(answerMap).length || player.correct_count || 1)
        ).toFixed(2)
      : null;

  return (
    <div className="quiz-play-shell">
      <div className="quiz-play-container">
        {/* Top bar */}
        <div className="quiz-play-topbar">
          <div className="quiz-play-brand">
            <img src="/logo-orange.png" alt="חב״ד בר אילן" style={{ height: '34px', width: 'auto' }} />
            <span>ליגת הפרשה</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {player && (
              <div className="quiz-play-score-pill">
                <QuizAvatar avatar={player.avatar} size={22} />
                <span>{player.nickname}</span>
                <span>•</span>
                <span style={{ color: '#fde68a' }}>{player.score.toLocaleString()} נק׳</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                const next = !sfxMuted;
                setSfxMuted(next);
                quizSound.muted = next;
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.16)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={sfxMuted ? 'הפעל צלילים' : 'השתק צלילים'}
            >
              {sfxMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* 1. No session yet: Enter 4-digit code */}
        {!session && (
          <motion.div
            className="quiz-play-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 style={{ margin: '0 0 0.4rem', fontWeight: 900, fontSize: '1.5rem' }}>
              הצטרפות לחידון
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.72)', margin: '0 0 1.25rem', fontSize: '0.95rem' }}>
              הכניסו את קוד החדר בן 4 הספרות המופיע על המסך הראשי
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                lookupSession(codeInput);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}
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
                <div style={{ color: '#fca5a5', fontSize: '0.9rem', fontWeight: 700 }}>
                  {lookupError}
                </div>
              )}

              <button type="submit" className="quiz-play-primary-btn" disabled={lookingUpCode}>
                {lookingUpCode ? 'מחפש משחק...' : 'המשך למשחק'}
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
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#fde68a', marginBottom: '0.25rem' }}>
              חדר {session.code}
            </div>
            <h2 style={{ margin: '0 0 0.35rem', fontWeight: 900, fontSize: '1.45rem' }}>
              {session.title}
            </h2>

            {session.status === 'finished' ? (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.78)', marginBottom: '1.25rem' }}>
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
                  style={{ display: 'block', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.45rem', color: 'rgba(255,255,255,0.9)' }}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'rgba(255,255,255,0.9)' }}>
                    בחרו סמל שחקן
                  </span>
                  {selectedAvatarObj && (
                    <span style={{ fontSize: '0.8rem', color: '#fde68a', fontWeight: 700 }}>
                      {selectedAvatarObj.label}
                    </span>
                  )}
                </div>

                <div className="quiz-avatars-row">
                  {PLAYER_AVATARS.map((avId) => (
                    <button
                      type="button"
                      key={avId}
                      className={`quiz-avatar-btn ${avatar === avId ? 'active' : ''}`}
                      onClick={() => setAvatar(avId)}
                    >
                      <QuizAvatar avatar={avId} size={42} />
                    </button>
                  ))}
                </div>

                <button type="submit" className="quiz-play-primary-btn" style={{ marginTop: '0.75rem' }} disabled={joining}>
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
              <QuizAvatar avatar={player.avatar} size={68} />
            </div>
            <h2 style={{ margin: '0 0 0.45rem', fontWeight: 900, fontSize: '1.55rem' }}>
              את/ה בפנים, {player.nickname}!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              המשחק <strong style={{ color: '#fff' }}>{session.title}</strong> יתחיל מיד כשהמנחה יפעיל את השאלה הראשונה.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.1rem',
                borderRadius: '999px',
                background: 'rgba(251, 191, 36, 0.16)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                color: '#fde68a',
                fontWeight: 800,
                fontSize: '0.92rem'
              }}
            >
              <Clock size={16} />
              ממתינים על המסך • {players.length} משתתפים מחוברים
            </div>
          </motion.div>
        )}

        {/* 4. Active Question on Phone (Full Question + Matching Colored Option Frames!) */}
        {session && player && session.status === 'question' && currentQuestion && (
          <motion.div
            key={`q-${session.current_question_index}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#fde68a'
              }}
            >
              <span>
                שאלה {session.current_question_index + 1} מתוך {session.questions.length}
              </span>
              <span style={{ color: secondsLeft <= 5 ? '#fca5a5' : '#6ee7b7' }}>
                ⏱️ {secondsLeft} שניות
              </span>
            </div>

            <div className="quiz-phone-timer-bar">
              <div
                className="quiz-phone-timer-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, (secondsLeft / (session.question_duration_sec || 20)) * 100))}%`,
                  backgroundColor: secondsLeft <= 5 ? '#ef4444' : '#fbbf24'
                }}
              />
            </div>

            <div className="quiz-phone-question-box">
              <h2 className="quiz-phone-question-text">{currentQuestion.question}</h2>
            </div>

            {myAnswerForCurrent ? (
              <div className="quiz-feedback-banner wait">
                <Zap size={34} color="#fde68a" style={{ marginBottom: '0.4rem' }} />
                <div style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.3rem' }}>
                  התשובה שלך נקלטה!
                </div>
                <div style={{ fontSize: '0.94rem', opacity: 0.92 }}>
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
                    className={`quiz-phone-option-btn accent-${idx}`}
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

        {/* 5. Reveal Feedback + Live Standings on Phone */}
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
                <div style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: '0.25rem' }}>
                  +{myAnswerForCurrent.points_earned} נקודות
                </div>
                {typeof myAnswerForCurrent.response_time_ms === 'number' && (
                  <div style={{ fontSize: '0.88rem', opacity: 0.95, marginTop: '0.25rem' }}>
                    זמן תגובה: {(myAnswerForCurrent.response_time_ms / 1000).toFixed(2)} שניות ⚡
                  </div>
                )}
              </div>
            ) : (
              <div className="quiz-feedback-banner lose">
                <div style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.3rem' }}>
                  {myAnswerForCurrent ? 'כמעט! לא הפעם' : 'לא הספקת לענות הפעם'}
                </div>
                <div style={{ fontSize: '0.96rem', opacity: 0.95 }}>
                  התשובה הנכונה: <strong>{OPTION_LETTERS[currentQuestion.correctIndex]}. {currentQuestion.options[currentQuestion.correctIndex]}</strong>
                </div>
              </div>
            )}

            <div className="quiz-play-card" style={{ marginBottom: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.68)', fontWeight: 700 }}>המיקום שלך כרגע</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fde68a' }}>
                    מקום #{myRank || '-'} מתוך {players.length}
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.68)', fontWeight: 700 }}>צבירת נקודות</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900 }}>
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
                    background: 'rgba(249, 115, 22, 0.22)',
                    border: '1px solid rgba(251, 146, 60, 0.45)',
                    color: '#fed7aa',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    marginBottom: '0.75rem'
                  }}
                >
                  <Flame size={15} />
                  רצף של {player.streak} תשובות נכונות!
                </div>
              )}

              {currentQuestion.explanation && (
                <div
                  style={{
                    fontSize: '0.92rem',
                    color: 'rgba(255,255,255,0.88)',
                    lineHeight: 1.55,
                    paddingTop: '0.65rem',
                    borderTop: '1px solid rgba(255,255,255,0.12)'
                  }}
                >
                  {currentQuestion.explanation}
                </div>
              )}
            </div>

            {/* Live Top 3 Leaderboard on phone */}
            <div className="quiz-play-card" style={{ padding: '1rem 1.15rem', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fde68a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Trophy size={15} />
                המובילים בסבב כרגע
              </div>
              <div className="quiz-phone-lb-list">
                {players.slice(0, 3).map((p, idx) => (
                  <div key={p.id} className={`quiz-phone-lb-row ${p.id === player.id ? 'is-me' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ color: idx === 0 ? '#fbbf24' : 'rgba(255,255,255,0.75)' }}>#{idx + 1}</strong>
                      <QuizAvatar avatar={p.avatar} size={24} />
                      <span style={{ fontWeight: 700 }}>{p.nickname}</span>
                    </div>
                    <strong style={{ color: '#fde68a' }}>{p.score.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.86rem', color: 'rgba(255,255,255,0.68)', fontWeight: 700 }}>
              ממתינים שהמנחה יעבור לשאלה הבאה...
            </div>
          </motion.div>
        )}

        {/* 6. Finished Summary + Full Round Leaderboard on Phone */}
        {session && player && session.status === 'finished' && (
          <motion.div
            className="quiz-play-card"
            style={{ textAlign: 'center', padding: '1.75rem 1.25rem' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2.5rem' }}>
                {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🏆'}
              </span>
              <QuizAvatar avatar={player.avatar} size={54} />
            </div>

            <h2 style={{ margin: '0 0 0.25rem', fontWeight: 900, fontSize: '1.6rem' }}>
              סיימת במקום #{myRank || '-'}!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.72)', margin: '0 0 1.25rem', fontSize: '0.92rem' }}>
              מתוך {players.length} משתתפים ב-{session.title}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.65rem',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ background: 'rgba(251, 191, 36, 0.14)', border: '1px solid rgba(251, 191, 36, 0.35)', borderRadius: '16px', padding: '0.85rem' }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fde68a' }}>
                  {player.score.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>ניקוד סופי</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(52, 211, 153, 0.35)', borderRadius: '16px', padding: '0.85rem' }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#6ee7b7' }}>
                  {player.correct_count} / {session.questions.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>תשובות נכונות</div>
              </div>
            </div>

            {avgResponseSec && (
              <div style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.75)', marginBottom: '1.15rem' }}>
                מהירות תגובה ממוצעת שלך: <strong style={{ color: '#fde68a' }}>{avgResponseSec} שניות</strong> ⚡
              </div>
            )}

            {/* Full Round Leaderboard right on phone */}
            <div style={{ textAlign: 'right', marginBottom: '1.35rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fde68a', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Trophy size={15} />
                תוצאות הסבב המלאות
              </div>
              <div className="quiz-phone-lb-list">
                {players.slice(0, 10).map((p, idx) => (
                  <div key={p.id} className={`quiz-phone-lb-row ${p.id === player.id ? 'is-me' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ width: '24px', color: idx === 0 ? '#fbbf24' : 'rgba(255,255,255,0.75)' }}>
                        #{idx + 1}
                      </strong>
                      <QuizAvatar avatar={p.avatar} size={26} />
                      <span style={{ fontWeight: 700 }}>{p.nickname}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>
                        {p.correct_count}✓
                      </span>
                      <strong style={{ color: '#fde68a' }}>{p.score.toLocaleString()}</strong>
                    </div>
                  </div>
                ))}
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
                  finishedConfettiRef.current = false;
                  navigate('/play', { replace: true });
                }}
              >
                <Trophy size={18} />
                הצטרפות לסבב חדש
              </button>
              <button
                style={{
                  padding: '0.8rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  fontWeight: 700,
                  color: '#fff',
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
