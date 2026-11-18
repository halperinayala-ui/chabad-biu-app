import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Flame,
  Play,
  RotateCcw,
  SkipForward,
  Trash2,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { QuizAvatar } from '../../components/QuizAvatar';
import { useAuth } from '../../contexts/AuthContext';
import {
  OPTION_LETTERS,
  QUIZ_DECKS,
  type QuizAnswer,
  type QuizPlayer,
  type QuizSession
} from '../../data/quizDecks';
import {
  createQuizSession,
  deleteQuizSession,
  fetchSessionAnswers,
  fetchSessionById,
  fetchSessionPlayers,
  finishSessionOnServer,
  revealQuestionOnServer,
  startQuestionOnServer
} from '../../utils/quizService';
import { quizSound } from '../../utils/quizSound';
import './AdminQuizHost.css';

const AdminQuizHost = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<QuizSession | null>(null);
  const [players, setPlayers] = useState<QuizPlayer[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(20);
  const [busyAction, setBusyAction] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const autoRevealedQuestionRef = useRef<number | null>(null);
  const confettiFiredRef = useRef(false);

  const joinUrl = useMemo(() => {
    if (!session) return '';
    return `${window.location.origin}/play/${session.code}`;
  }, [session?.code]);

  const loadAll = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [sess, pl, ans] = await Promise.all([
        fetchSessionById(sessionId),
        fetchSessionPlayers(sessionId),
        fetchSessionAnswers(sessionId)
      ]);
      setSession(sess);
      setPlayers(pl);
      setAnswers(ans);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת המשחק');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Generate QR code locally
  useEffect(() => {
    if (!joinUrl) return;
    QRCode.toDataURL(joinUrl, {
      width: 340,
      margin: 2,
      color: { dark: '#190d35', light: '#ffffff' }
    })
      .then(setQrDataUrl)
      .catch((e) => console.error('QR error:', e));
  }, [joinUrl]);

  // Realtime subscriptions + light fallback polling
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`quiz-host-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            setSession(payload.new as QuizSession);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_players', filter: `session_id=eq.${sessionId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            quizSound.playJoin();
          }
          const latestPlayers = await fetchSessionPlayers(sessionId);
          setPlayers(latestPlayers);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_answers', filter: `session_id=eq.${sessionId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            quizSound.playLockIn();
          }
          const latestAnswers = await fetchSessionAnswers(sessionId);
          setAnswers(latestAnswers);
        }
      )
      .subscribe();

    const interval = window.setInterval(async () => {
      try {
        const [pl, ans] = await Promise.all([
          fetchSessionPlayers(sessionId),
          fetchSessionAnswers(sessionId)
        ]);
        setPlayers(pl);
        setAnswers(ans);
      } catch {
        // Silent background fallback
      }
    }, 2500);

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Countdown timer during 'question'
  useEffect(() => {
    if (!session || session.status !== 'question') return;

    const duration = session.question_duration_sec || 20;
    const startedMs = session.question_started_at
      ? new Date(session.question_started_at).getTime()
      : Date.now();

    const updateTimer = () => {
      const elapsedSec = (Date.now() - startedMs) / 1000;
      const remaining = Math.max(0, Math.ceil(duration - elapsedSec));
      setSecondsLeft((prev) => {
        if (remaining !== prev && remaining > 0 && remaining <= 5) {
          quizSound.playTick(true);
        }
        return remaining;
      });

      if (
        elapsedSec >= duration + 0.6 &&
        autoRevealedQuestionRef.current !== session.current_question_index
      ) {
        autoRevealedQuestionRef.current = session.current_question_index;
        handleRevealQuestion();
      }
    };

    updateTimer();
    const timerId = window.setInterval(updateTimer, 200);
    return () => window.clearInterval(timerId);
  }, [session?.status, session?.current_question_index, session?.question_started_at]);

  // Dramatic background music orchestration
  useEffect(() => {
    if (!session || muted) {
      quizSound.stopMusic();
      return;
    }

    if (session.status === 'lobby') {
      quizSound.startLobbyMusic();
    } else if (session.status === 'question') {
      quizSound.startQuestionMusic(secondsLeft <= 5 && secondsLeft > 0);
    } else {
      quizSound.stopMusic();
    }
  }, [session?.status, muted, secondsLeft <= 5]);

  useEffect(() => {
    return () => {
      quizSound.stopMusic();
    };
  }, []);

  // Confetti when game reaches 'finished'
  useEffect(() => {
    if (session?.status === 'finished' && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      quizSound.playWin();
      confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
    }
  }, [session?.status]);

  const handleToggleMute = () => {
    const next = !muted;
    quizSound.setMuted(next);
    if (!next) {
      quizSound.unlock();
    }
    setMuted(next);
  };

  const handleStartQuestion = async (index: number) => {
    if (!session) return;
    setBusyAction(true);
    try {
      autoRevealedQuestionRef.current = null;
      await startQuestionOnServer(session.id, index, session.question_duration_sec || 20);
      quizSound.playQuestionStart();
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'question',
              current_question_index: index,
              question_started_at: new Date().toISOString()
            }
          : prev
      );
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בהפעלת השאלה');
    } finally {
      setBusyAction(false);
    }
  };

  const handleRevealQuestion = async () => {
    if (!session) return;
    setBusyAction(true);
    try {
      await revealQuestionOnServer(session.id);
      quizSound.playReveal();
      const [latestPlayers, latestAnswers] = await Promise.all([
        fetchSessionPlayers(session.id),
        fetchSessionAnswers(session.id)
      ]);
      setPlayers(latestPlayers);
      setAnswers(latestAnswers);
      setSession((prev) => (prev ? { ...prev, status: 'reveal' } : prev));
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בחשיפת התשובה');
    } finally {
      setBusyAction(false);
    }
  };

  const handleNextOrFinish = async () => {
    if (!session) return;
    const nextIdx = session.current_question_index + 1;
    if (nextIdx < session.questions.length) {
      await handleStartQuestion(nextIdx);
    } else {
      setBusyAction(true);
      try {
        await finishSessionOnServer(session.id);
        setSession((prev) => (prev ? { ...prev, status: 'finished' } : prev));
      } catch (err) {
        console.error(err);
        toast.error('שגיאה בסיום המשחק');
      } finally {
        setBusyAction(false);
      }
    }
  };

  const handleStartFreshRound = async () => {
    if (!session) return;
    const deck =
      QUIZ_DECKS.find((d) => d.id === session.deck_id) || {
        id: session.deck_id,
        title: session.title,
        subtitle: '',
        badge: '',
        accentColor: '#492691',
        questions: session.questions
      };
    setBusyAction(true);
    try {
      confettiFiredRef.current = false;
      const newSession = await createQuizSession(deck, {
        durationSec: session.question_duration_sec,
        createdBy: user?.id ?? null
      });
      toast.success(`סבב חדש נפתח! קוד: ${newSession.code}`);
      navigate(`/admin/quiz/host/${newSession.id}`, { replace: true });
      setSession(newSession);
      setPlayers([]);
      setAnswers([]);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בפתיחת סבב חדש');
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteCurrentRound = async () => {
    if (!session) return;
    setBusyAction(true);
    try {
      await deleteQuizSession(session.id);
      toast.success('הסבב נמחק מסופאבייס');
      navigate('/admin/quiz');
    } catch (err) {
      console.error(err);
      toast.error('שגיאה במחיקת הסבב');
    } finally {
      setBusyAction(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success('הקישור להצטרפות הועתק!');
    } catch {
      toast.error('לא ניתן להעתיק אוטומטית');
    }
  };

  if (loading) {
    return (
      <div className="quiz-host-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>טוען את מסך המנחה...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="quiz-host-shell" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h2>המשחק לא נמצא או נמחק</h2>
        <button className="quiz-start-game-btn" style={{ marginTop: '1rem' }} onClick={() => navigate('/admin/quiz')}>
          חזרה למרכז החידונים
        </button>
      </div>
    );
  }

  const currentQuestion = session.questions[session.current_question_index];
  const currentQuestionAnswers = answers.filter(
    (a) => a.question_index === session.current_question_index
  );
  const fastestCorrectAnswer = currentQuestionAnswers
    .filter((a) => a.is_correct)
    .sort((a, b) => a.response_time_ms - b.response_time_ms)[0];
  const fastestPlayer = fastestCorrectAnswer
    ? players.find((p) => p.id === fastestCorrectAnswer.player_id)
    : null;

  const optionCounts = [0, 1, 2, 3].map(
    (idx) => currentQuestionAnswers.filter((a) => a.selected_option === idx).length
  );

  const durationSec = session.question_duration_sec || 20;
  const timerPercent = Math.max(0, Math.min(100, (secondsLeft / durationSec) * 100));
  const timerColor =
    secondsLeft <= 5 ? '#ef4444' : secondsLeft <= 10 ? '#f59e0b' : '#34d399';

  return (
    <div
      className="quiz-host-shell"
      onPointerDown={() => {
        if (!muted) {
          quizSound.unlock();
          if (session.status === 'lobby') quizSound.startLobbyMusic();
        }
      }}
    >
      {/* Top Bar */}
      <div className="quiz-host-topbar">
        <div className="quiz-host-brand">
          <button
            className="quiz-host-icon-btn"
            onClick={() => navigate('/admin/quiz')}
            title="חזרה ללוח ניהול החידון"
          >
            <ArrowRight size={20} />
          </button>
          <img
            src="/logo-orange.png"
            alt="חב״ד בר אילן"
            style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
          />
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{session.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.68)' }}>
              בית חב״ד בקמפוס בר אילן • אתגר שיעור יום רביעי
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div className="quiz-host-pill">
            <span>קוד:</span>
            <strong style={{ letterSpacing: '0.1em', color: '#fde68a' }}>{session.code}</strong>
          </div>
          <div className="quiz-host-pill">
            <Users size={16} />
            <span>{players.length} שחקנים</span>
          </div>
          <button
            className="quiz-host-icon-btn"
            onClick={handleToggleMute}
            title={muted ? 'הפעל צלילים' : 'השתק צלילים'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* ─── STAGE 1: LOBBY ─── */}
      {session.status === 'lobby' && (
        <div className="quiz-lobby-grid">
          <div className="quiz-qr-card">
            <div className="quiz-qr-frame">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="קוד QR להצטרפות למשחק" />
              ) : (
                <div style={{ width: 240, height: 240 }} />
              )}
            </div>

            <div className="quiz-room-code-box">
              <div className="quiz-room-code-label">או היכנסו לאתר והקישו קוד</div>
              <div className="quiz-room-code-digits">{session.code}</div>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.72)', marginBottom: '0.75rem', wordBreak: 'break-all' }}>
              <code>{joinUrl}</code>
            </div>

            <button
              className="quiz-host-pill"
              style={{ cursor: 'pointer' }}
              onClick={handleCopyLink}
            >
              <Copy size={14} />
              העתק קישור להצטרפות
            </button>
          </div>

          <div className="quiz-lobby-players-panel">
            <h1 className="quiz-lobby-title">סרקו את הברקוד והצטרפו למשחק!</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '1.02rem' }}>
              כל משתתף רואה את השאלות והאפשרויות ישירות בטלפון שלו. המהירים ביותר צוברים יותר נקודות!
            </p>

            <div className="quiz-players-cloud">
              <AnimatePresence>
                {players.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.05rem', marginTop: '2rem' }}>
                    ממתין לסטודנטים הראשונים שיסרקו... ✨
                  </div>
                ) : (
                  players.map((p) => (
                    <motion.div
                      key={p.id}
                      className="quiz-player-chip"
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.7, opacity: 0 }}
                    >
                      <QuizAvatar avatar={p.avatar} size={36} />
                      <span>{p.nickname}</span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.75)' }}>
                {session.questions.length} שאלות • {durationSec} שניות לשאלה
              </div>
              <button
                className="quiz-start-game-btn"
                disabled={busyAction}
                onClick={() => handleStartQuestion(0)}
              >
                <Play size={22} />
                התחל את המשחק ({players.length} מחוברים)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STAGE 2 & 3: QUESTION / REVEAL ─── */}
      {(session.status === 'question' || session.status === 'reveal') && currentQuestion && (
        <div className="quiz-stage-container">
          <div className="quiz-question-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span className="quiz-host-pill">
                שאלה {session.current_question_index + 1} מתוך {session.questions.length}
              </span>
              {currentQuestion.categoryTag && (
                <span className="quiz-host-pill" style={{ borderColor: 'rgba(251,191,36,0.4)', color: '#fde68a' }}>
                  {currentQuestion.categoryTag}
                </span>
              )}
              <span className="quiz-host-pill">
                ענו: <strong>{currentQuestionAnswers.length} / {players.length}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {session.status === 'question' ? (
                <>
                  <div
                    className="quiz-host-pill"
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 900,
                      borderColor: timerColor,
                      color: timerColor
                    }}
                  >
                    ⏱️ {secondsLeft} שנ׳
                  </div>
                  <button
                    className="quiz-start-game-btn"
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.95rem' }}
                    disabled={busyAction}
                    onClick={handleRevealQuestion}
                  >
                    חשוף תשובה
                  </button>
                </>
              ) : (
                <button
                  className="quiz-start-game-btn"
                  style={{ padding: '0.7rem 1.5rem', fontSize: '1rem' }}
                  disabled={busyAction}
                  onClick={handleNextOrFinish}
                >
                  <SkipForward size={18} />
                  {session.current_question_index + 1 < session.questions.length
                    ? 'לשאלה הבאה'
                    : 'לפודיום הסיום 🏆'}
                </button>
              )}
            </div>
          </div>

          {session.status === 'question' && (
            <div className="quiz-timer-track">
              <div
                className="quiz-timer-fill"
                style={{ width: `${timerPercent}%`, backgroundColor: timerColor }}
              />
            </div>
          )}

          <div className="quiz-question-hero">
            <h2>{currentQuestion.question}</h2>
          </div>

          <div className={`quiz-host-split ${session.status === 'reveal' ? 'with-leaderboard' : ''}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="quiz-options-grid">
                {currentQuestion.options.map((opt, idx) => {
                  const isReveal = session.status === 'reveal';
                  const isCorrect = idx === currentQuestion.correctIndex;
                  const count = optionCounts[idx] || 0;
                  const totalAns = currentQuestionAnswers.length || 1;
                  const pct = isReveal ? Math.round((count / totalAns) * 100) : 0;

                  return (
                    <div
                      key={idx}
                      className={`quiz-host-option-card accent-${idx} ${
                        isReveal ? (isCorrect ? 'is-correct' : 'is-dimmed') : ''
                      }`}
                    >
                      {isReveal && (
                        <div className="quiz-option-bar-bg" style={{ width: `${pct}%` }} />
                      )}
                      <div className="quiz-option-letter-badge">{OPTION_LETTERS[idx]}</div>
                      <div className="quiz-option-text-wrap">
                        <span>{opt}</span>
                        {isReveal && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.92rem', flexShrink: 0 }}>
                            {isCorrect && <CheckCircle2 size={18} color="#34d399" />}
                            <span>{count} ({pct}%)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {session.status === 'question' && currentQuestionAnswers.length > 0 && (
                <div className="quiz-answered-strip">
                  <span style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.7)' }}>כבר שלחו תשובה:</span>
                  {currentQuestionAnswers.map((ans) => {
                    const p = players.find((pl) => pl.id === ans.player_id);
                    if (!p) return null;
                    return (
                      <span key={ans.id} className="quiz-answered-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <QuizAvatar avatar={p.avatar} size={22} />
                        <span>{p.nickname}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              {session.status === 'reveal' && (
                <>
                  {fastestPlayer && fastestCorrectAnswer && (
                    <div className="quiz-fastest-banner">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Zap size={22} color="#fbbf24" />
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#fde68a', fontWeight: 700 }}>
                            המהיר/ה ביותר בשאלה זו
                          </div>
                          <div style={{ fontSize: '1.12rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                            <QuizAvatar avatar={fastestPlayer.avatar} size={28} />
                            <span>{fastestPlayer.nickname}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#fde68a', fontSize: '1rem' }}>
                        {(fastestCorrectAnswer.response_time_ms / 1000).toFixed(2)} שנ׳ • +{fastestCorrectAnswer.points_earned} נק׳
                      </div>
                    </div>
                  )}

                  {currentQuestion.explanation && (
                    <div className="quiz-explanation-box">
                      <strong>נקודה למחשבה:</strong> {currentQuestion.explanation}
                    </div>
                  )}
                </>
              )}
            </div>

            {session.status === 'reveal' && (
              <div className="quiz-leaderboard-card">
                <h3 style={{ margin: '0 0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1.1rem' }}>
                  <Trophy size={18} color="#fbbf24" />
                  טבלת המובילים
                </h3>
                {players.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.6)' }}>אין שחקנים עדיין</p>
                ) : (
                  players.slice(0, 8).map((p, idx) => (
                    <div key={p.id} className={`quiz-lb-row ${idx === 0 ? 'top-1' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <strong style={{ width: '24px', color: idx === 0 ? '#fbbf24' : 'rgba(255,255,255,0.7)' }}>
                          #{idx + 1}
                        </strong>
                        <QuizAvatar avatar={p.avatar} size={28} />
                        <span style={{ fontWeight: 700 }}>{p.nickname}</span>
                        {p.streak >= 2 && (
                          <span style={{ fontSize: '0.78rem', color: '#fb923c', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <Flame size={13} /> {p.streak}
                          </span>
                        )}
                      </div>
                      <strong style={{ color: '#fde68a' }}>{p.score.toLocaleString()}</strong>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── STAGE 4: FINISHED PODIUM ─── */}
      {session.status === 'finished' && (
        <div className="quiz-podium-stage">
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.7rem)', fontWeight: 900, margin: '0 0 0.4rem' }}>
            סיכום המשחק — כל הכבוד למשתתפים! 🏆
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0 }}>
            {session.title} • {players.length} שחקנים
          </p>

          {players.length > 0 && (
            <div className="quiz-podium-cards">
              {/* 2nd Place */}
              <div className="quiz-podium-slot place-2">
                <div style={{ fontSize: '2rem' }}>🥈</div>
                {players[1] ? (
                  <>
                    <QuizAvatar avatar={players[1].avatar} size={52} />
                    <strong style={{ fontSize: '1.2rem' }}>{players[1].nickname}</strong>
                    <div style={{ color: '#fde68a', fontWeight: 800 }}>
                      {players[1].score.toLocaleString()} נק׳
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.68)' }}>
                      {players[1].correct_count} נכונות
                    </div>
                  </>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>—</span>
                )}
              </div>

              {/* 1st Place */}
              <div className="quiz-podium-slot place-1">
                <div style={{ fontSize: '2.5rem' }}>🥇</div>
                {players[0] && (
                  <>
                    <QuizAvatar avatar={players[0].avatar} size={64} />
                    <strong style={{ fontSize: '1.45rem' }}>{players[0].nickname}</strong>
                    <div style={{ color: '#fde68a', fontWeight: 900, fontSize: '1.2rem' }}>
                      {players[0].score.toLocaleString()} נק׳
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)' }}>
                      {players[0].correct_count} / {session.questions.length} נכונות
                    </div>
                  </>
                )}
              </div>

              {/* 3rd Place */}
              <div className="quiz-podium-slot place-3">
                <div style={{ fontSize: '2rem' }}>🥉</div>
                {players[2] ? (
                  <>
                    <QuizAvatar avatar={players[2].avatar} size={48} />
                    <strong style={{ fontSize: '1.15rem' }}>{players[2].nickname}</strong>
                    <div style={{ color: '#fde68a', fontWeight: 800 }}>
                      {players[2].score.toLocaleString()} נק׳
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.68)' }}>
                      {players[2].correct_count} נכונות
                    </div>
                  </>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>—</span>
                )}
              </div>
            </div>
          )}

          {players.length > 3 && (
            <div className="quiz-leaderboard-card" style={{ textAlign: 'right', marginBottom: '1.75rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>דירוג מלא</h3>
              {players.slice(3).map((p, idx) => (
                <div key={p.id} className="quiz-lb-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <strong>#{idx + 4}</strong>
                    <QuizAvatar avatar={p.avatar} size={26} />
                    <span>{p.nickname}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{p.correct_count} נכונות</span>
                    <strong style={{ color: '#fde68a' }}>{p.score.toLocaleString()}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
            <button
              className="quiz-start-game-btn"
              disabled={busyAction}
              onClick={handleStartFreshRound}
            >
              <RotateCcw size={19} />
              התחל סבב חדש מאפס
            </button>
            <button
              className="quiz-host-pill"
              style={{ cursor: 'pointer', padding: '0.9rem 1.4rem', fontSize: '1rem' }}
              onClick={() => navigate('/admin/quiz')}
            >
              חזרה לניהול סבבים
            </button>
            <button
              className="quiz-host-pill"
              style={{
                cursor: 'pointer',
                padding: '0.9rem 1.4rem',
                fontSize: '1rem',
                borderColor: 'rgba(239,68,68,0.5)',
                color: '#fecaca'
              }}
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={17} />
              מחק סבב זה מסופאבייס
            </button>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 2500
          }}
          onClick={() => !busyAction && setShowDeleteModal(false)}
        >
          <div
            style={{
              background: '#1f113d',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '22px',
              padding: '1.5rem',
              maxWidth: '420px',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>מחיקת סבב</h3>
              <button style={{ color: '#fff' }} onClick={() => !busyAction && setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              למחוק סבב זה כולל כל השחקנים והניקוד ממסד הנתונים?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                className="quiz-host-pill"
                style={{ cursor: 'pointer' }}
                disabled={busyAction}
                onClick={() => setShowDeleteModal(false)}
              >
                ביטול
              </button>
              <button
                className="quiz-host-pill"
                style={{ cursor: 'pointer', background: '#dc2626', borderColor: '#dc2626' }}
                disabled={busyAction}
                onClick={handleDeleteCurrentRound}
              >
                {busyAction ? 'מוחק...' : 'מחק סבב'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizHost;
