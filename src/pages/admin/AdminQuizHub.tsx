import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Database,
  Eye,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  Shuffle,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  Wand2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QuizAvatar } from '../../components/QuizAvatar';
import { useAuth } from '../../contexts/AuthContext';
import {
  OPTION_LETTERS,
  QUIZ_DECKS,
  type QuizDeck,
  type QuizQuestion
} from '../../data/quizDecks';
import { AI_PROMPT_TEMPLATE, parseQuizText } from '../../utils/quizParser';
import {
  createCustomQuizDeck,
  createQuizSession,
  deleteCustomQuizDeck,
  deleteMultipleQuizSessions,
  deleteQuizSession,
  fetchAllQuizSessions,
  fetchCustomQuizDecks,
  isMissingQuizTablesError,
  type QuizSessionWithStats
} from '../../utils/quizService';
import quizMigrationSql from '../../../supabase_quiz_migration.sql?raw';
import './AdminQuizHub.css';

const STATUS_LABEL: Record<string, string> = {
  lobby: 'ממתין לשחקנים',
  question: 'שאלה פעילה',
  reveal: 'תוצאות שאלה',
  finished: 'הסתיים'
};

const AdminQuizHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<QuizSessionWithStats[]>([]);
  const [customDecks, setCustomDecks] = useState<QuizDeck[]>([]);
  const [usingLocalDeckFallback, setUsingLocalDeckFallback] = useState(false);

  const [loading, setLoading] = useState(true);
  const [missingTables, setMissingTables] = useState(false);
  const [launchingDeckId, setLaunchingDeckId] = useState<string | null>(null);

  // Round config
  const [customTitle, setCustomTitle] = useState('');
  const [durationSec, setDurationSec] = useState<number>(20);
  const [shuffleOrder, setShuffleOrder] = useState<boolean>(true);
  const [limitTenQuestions, setLimitTenQuestions] = useState<boolean>(false);

  // Smart-paste custom quiz builder
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderRawText, setBuilderRawText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<QuizQuestion[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [savingDeck, setSavingDeck] = useState(false);

  // Modals (Zero browser alert/confirm)
  const [previewDeck, setPreviewDeck] = useState<QuizDeck | null>(null);
  const [resultsSession, setResultsSession] = useState<QuizSessionWithStats | null>(null);
  const [confirmDeleteSession, setConfirmDeleteSession] = useState<QuizSessionWithStats | null>(null);
  const [confirmDeleteDeck, setConfirmDeleteDeck] = useState<QuizDeck | null>(null);
  const [confirmDeleteAllMode, setConfirmDeleteAllMode] = useState<'finished' | 'all' | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsData, customDeckRes] = await Promise.all([
        fetchAllQuizSessions(),
        fetchCustomQuizDecks()
      ]);
      setSessions(sessionsData);
      setCustomDecks(customDeckRes.decks);
      setUsingLocalDeckFallback(customDeckRes.usingLocalFallback);
      setMissingTables(false);
    } catch (err) {
      if (isMissingQuizTablesError(err)) {
        setMissingTables(true);
      } else {
        console.error(err);
        toast.error('שגיאה בטעינת נתוני המשחקים');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Parse pasted questions in real time
  useEffect(() => {
    if (!builderRawText.trim()) {
      setParsedQuestions([]);
      setParseWarnings([]);
      return;
    }
    const { questions, warnings } = parseQuizText(builderRawText);
    setParsedQuestions(questions);
    setParseWarnings(warnings);
  }, [builderRawText]);

  const allDecks = useMemo(() => [...customDecks, ...QUIZ_DECKS], [customDecks]);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(quizMigrationSql);
      toast.success('קוד ה-SQL הועתק! הדביקי והריצי ב-Supabase SQL Editor');
    } catch {
      toast.error('לא ניתן להעתיק אוטומטית מהדפדפן');
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
      toast.success('ההנחיה הועתקה! הדביקי בצ׳אט ה-AI ובקשי ממנו את השאלות');
    } catch {
      toast.error('לא ניתן להעתיק אוטומטית מהדפדפן');
    }
  };

  const handleLaunchDeck = async (deck: QuizDeck) => {
    setLaunchingDeckId(deck.id);
    try {
      const session = await createQuizSession(deck, {
        customTitle,
        durationSec,
        createdBy: user?.id ?? null,
        shuffle: shuffleOrder,
        limitCount: limitTenQuestions ? 10 : null
      });
      toast.success(`סבב חדש נפתח! קוד: ${session.code}`);
      navigate(`/admin/quiz/host/${session.id}`);
    } catch (err) {
      if (isMissingQuizTablesError(err)) {
        setMissingTables(true);
        toast.error('יש להריץ קודם את קוד ה-SQL בסופאבייס');
      } else {
        console.error(err);
        toast.error('שגיאה בפתיחת סבב חדש');
      }
    } finally {
      setLaunchingDeckId(null);
    }
  };

  const handleSaveCustomDeck = async (andLaunch: boolean) => {
    if (parsedQuestions.length === 0) {
      toast.error('יש להדביק לפחות שאלה תקינה אחת עם 4 אפשרויות');
      return;
    }
    setSavingDeck(true);
    try {
      const { deck, savedToCloud } = await createCustomQuizDeck(
        builderTitle,
        parsedQuestions,
        user?.id ?? null
      );
      setCustomDecks((prev) => [deck, ...prev]);
      if (!savedToCloud) {
        setUsingLocalDeckFallback(true);
      }

      toast.success(
        savedToCloud
          ? 'החידון נשמר בהצלחה בענן!'
          : 'החידון נשמר ומוכן למשחק!'
      );

      setBuilderTitle('');
      setBuilderRawText('');
      setParsedQuestions([]);
      setShowBuilder(false);

      if (andLaunch) {
        await handleLaunchDeck(deck);
      }
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בשמירת החידון');
    } finally {
      setSavingDeck(false);
    }
  };

  const handleSetParsedCorrect = (qIdx: number, optIdx: 0 | 1 | 2 | 3) => {
    setParsedQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, correctIndex: optIdx } : q))
    );
  };

  const handleRemoveParsedQuestion = (qIdx: number) => {
    setParsedQuestions((prev) => prev.filter((_, i) => i !== qIdx));
  };

  const handleConfirmDeleteDeck = async () => {
    if (!confirmDeleteDeck) return;
    setDeleting(true);
    try {
      await deleteCustomQuizDeck(confirmDeleteDeck.id);
      setCustomDecks((prev) => prev.filter((d) => d.id !== confirmDeleteDeck.id));
      toast.success('החידון נמחק');
      setConfirmDeleteDeck(null);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה במחיקת החידון');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDeleteSingle = async () => {
    if (!confirmDeleteSession) return;
    setDeleting(true);
    try {
      await deleteQuizSession(confirmDeleteSession.id);
      setSessions((prev) => prev.filter((s) => s.id !== confirmDeleteSession.id));
      toast.success('הסבב וכל נתוני השחקנים שלו נמחקו מסופאבייס');
      setConfirmDeleteSession(null);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה במחיקת הסבב');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (!confirmDeleteAllMode) return;
    const targets =
      confirmDeleteAllMode === 'finished'
        ? sessions.filter((s) => s.status === 'finished')
        : sessions;

    if (targets.length === 0) {
      setConfirmDeleteAllMode(null);
      return;
    }

    setDeleting(true);
    try {
      await deleteMultipleQuizSessions(targets.map((s) => s.id));
      const removedIds = new Set(targets.map((s) => s.id));
      setSessions((prev) => prev.filter((s) => !removedIds.has(s.id)));
      toast.success(`נמחקו ${targets.length} סבבים בהצלחה`);
      setConfirmDeleteAllMode(null);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה במחיקת הסבבים');
    } finally {
      setDeleting(false);
    }
  };

  const totalPlayersAcrossRounds = sessions.reduce((acc, s) => acc + s.players.length, 0);
  const finishedCount = sessions.filter((s) => s.status === 'finished').length;

  return (
    <motion.div className="admin-quiz-hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="quiz-hub-header">
        <div className="quiz-hub-title-wrap">
          <button
            className="quiz-back-btn"
            onClick={() => navigate('/admin')}
            title="חזרה ללוח הבקרה"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h1>חידון לייב לשיעור</h1>
            <p className="quiz-hub-subtitle">
              מכינים שאלון בהדבקה אחת מכל צ׳אט, מקרינים ברקוד ומשחקים בזמן אמת
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: '0.9rem', padding: '0.6rem 1.15rem' }}
            onClick={() => setShowBuilder((prev) => !prev)}
          >
            <Plus size={17} />
            {showBuilder ? 'סגירת יצירת חידון' : 'צור חידון חדש (הדבקה מהירה)'}
          </button>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.88rem', padding: '0.55rem 1rem' }}
            onClick={() => window.open('/play', '_blank')}
          >
            <QrCode size={16} />
            מסך כניסת סטודנט
          </button>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.88rem', padding: '0.55rem 1rem' }}
            onClick={loadData}
          >
            <RefreshCw size={16} />
            רענון
          </button>
        </div>
      </div>

      {/* One-time SQL setup card if tables aren't created yet */}
      {missingTables && (
        <div className="quiz-setup-card">
          <h2>
            <Database size={22} style={{ color: '#dd6755' }} />
            התקנה חד-פעמית בסופאבייס
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            כדי לשמור סבבים, שחקנים וניקוד בזמן אמת, צריך להוסיף את טבלאות החידון למסד הנתונים בפעולה פשוטה:
          </p>
          <ol className="quiz-setup-steps">
            <li>לחצי על הכפתור למטה כדי להעתיק את פקודת ההקמה המוכנה.</li>
            <li>היכנסי לפרויקט שלך ב-Supabase, פתחי את לשונית <code>SQL Editor</code> והדביקי את הקוד.</li>
            <li>לחצי על <code>Run</code>, ואז לחצי כאן על כפתור הרענון.</li>
          </ol>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleCopySql}>
              <Copy size={17} />
              העתק קוד SQL להקמה
            </button>
            <button className="btn btn-outline" onClick={loadData}>
              <RefreshCw size={17} />
              בדוק שוב לאחר ההרצה
            </button>
          </div>
        </div>
      )}

      {/* Optional cloud-deck sync note if quiz_decks table hasn't been added yet */}
      {!missingTables && usingLocalDeckFallback && customDecks.length > 0 && (
        <div
          style={{
            background: 'rgba(73, 38, 145, 0.06)',
            border: '1px solid rgba(73, 38, 145, 0.2)',
            borderRadius: '14px',
            padding: '0.8rem 1.1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.86rem'
          }}
        >
          <span>
            החידונים שיצרת שמורים כרגע בדפדפן הזה. כדי שיישמרו גם בענן של Supabase בכל מכשיר, אפשר להריץ את עדכון ה-SQL החד-פעמי.
          </span>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
            onClick={handleCopySql}
          >
            <Copy size={14} />
            העתק SQL מעודכן
          </button>
        </div>
      )}

      {/* ─── SMART PASTE QUIZ BUILDER ─── */}
      {showBuilder && (
        <motion.div
          className="quiz-builder-card"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="quiz-builder-header">
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Wand2 size={20} style={{ color: 'var(--primary)' }} />
                יצירת חידון חדש בהדבקה אחת
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                הכיני שאלות מגוונות בצ׳אט (לדוגמה ChatGPT או Gemini), הדביקי את הכל כאן בבת אחת — והמערכת תבנה את החידון אוטומטית.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.86rem', padding: '0.5rem 0.95rem' }}
              onClick={handleCopyPrompt}
            >
              <Copy size={15} />
              העתק הנחיה מוכנה לצ׳אט (פרומפט)
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label
                htmlFor="builder-deck-title"
                style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
              >
                שם החידון
              </label>
              <input
                id="builder-deck-title"
                className="quiz-config-input"
                style={{ width: '100%' }}
                type="text"
                value={builderTitle}
                onChange={(e) => setBuilderTitle(e.target.value)}
                placeholder="לדוגמה: חידון יום רביעי — פרשת וישלח"
              />
            </div>

            <div>
              <label
                htmlFor="builder-raw-text"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}
              >
                <ClipboardPaste size={15} />
                הדביקי כאן את השאלות מהצ׳אט (כל פורמט של שאלה + 4 אפשרויות + סימון * ליד הנכונה)
              </label>
              <textarea
                id="builder-raw-text"
                className="quiz-builder-textarea"
                value={builderRawText}
                onChange={(e) => setBuilderRawText(e.target.value)}
                placeholder={`דוגמה:\nשאלה: מה ראה יעקב בחלומו?\nא. כוכבים\nב. סולם ומלאכים *\nג. עץ זית\nד. נהר מים\nהסבר: חלום הסולם מסמל את התפילה והחיבור בין שמיים לארץ.`}
              />
            </div>

            {parseWarnings.length > 0 && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '12px',
                  padding: '0.7rem 0.9rem',
                  fontSize: '0.84rem',
                  color: '#92400e'
                }}
              >
                {parseWarnings.map((w, i) => (
                  <div key={i}>• {w}</div>
                ))}
              </div>
            )}

            {parsedQuestions.length > 0 && (
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#047857', marginBottom: '0.45rem' }}>
                  זוהו {parsedQuestions.length} שאלות מוכנות! (אפשר ללחוץ על תשובה כדי לשנות איזו נכונה)
                </div>
                <div className="quiz-parsed-list">
                  {parsedQuestions.map((q, qIdx) => (
                    <div key={q.id} className="quiz-preview-item" style={{ marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                          {qIdx + 1}. {q.question}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveParsedQuestion(qIdx)}
                          style={{ color: '#dc2626', flexShrink: 0 }}
                          title="הסר שאלה"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="quiz-preview-options">
                        {q.options.map((opt, optIdx) => (
                          <button
                            type="button"
                            key={optIdx}
                            className={`quiz-parsed-opt-btn ${q.correctIndex === optIdx ? 'correct' : ''}`}
                            onClick={() => handleSetParsedCorrect(qIdx, optIdx as 0 | 1 | 2 | 3)}
                          >
                            <span>
                              <strong>{OPTION_LETTERS[optIdx]}.</strong> {opt}
                            </span>
                            {q.correctIndex === optIdx && <CheckCircle2 size={14} />}
                          </button>
                        ))}
                      </div>
                      {q.explanation && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                          הסבר: {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={savingDeck}
                onClick={() => setShowBuilder(false)}
              >
                ביטול
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={savingDeck || parsedQuestions.length === 0}
                onClick={() => handleSaveCustomDeck(false)}
              >
                שמור חידון לרשימה
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={savingDeck || parsedQuestions.length === 0}
                onClick={() => handleSaveCustomDeck(true)}
              >
                <Play size={16} />
                {savingDeck ? 'שומר...' : 'שמור והתחל משחק עכשיו'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Round Configuration Bar */}
      <div className="quiz-config-bar">
        <div className="quiz-config-field">
          <label htmlFor="round-custom-title">שם הסבב (אופציונלי — לזיהוי נוח בהיסטוריה)</label>
          <input
            id="round-custom-title"
            className="quiz-config-input"
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="לדוגמה: שיעור יום רביעי — קבוצה א׳"
          />
        </div>

        <div className="quiz-config-field" style={{ flex: '0 0 auto' }}>
          <label>זמן תשובה לכל שאלה</label>
          <div className="quiz-duration-pills">
            {[15, 20, 30].map((sec) => (
              <button
                key={sec}
                type="button"
                className={`quiz-duration-pill ${durationSec === sec ? 'active' : ''}`}
                onClick={() => setDurationSec(sec)}
              >
                {sec} שניות
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="quiz-checkbox-label">
            <input
              type="checkbox"
              checked={shuffleOrder}
              onChange={(e) => setShuffleOrder(e.target.checked)}
            />
            <Shuffle size={15} style={{ color: 'var(--primary)' }} />
            ערבב סדר שאלות
          </label>
          <label className="quiz-checkbox-label">
            <input
              type="checkbox"
              checked={limitTenQuestions}
              onChange={(e) => setLimitTenQuestions(e.target.checked)}
            />
            סבב מקוצר (עד 10 שאלות)
          </label>
        </div>
      </div>

      {/* Decks to launch */}
      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        <Sparkles size={19} style={{ color: 'var(--primary)' }} />
        חידונים מוכנים להפעלה
      </h2>

      <div className="quiz-decks-grid">
        {allDecks.map((deck) => {
          const isCustom = !QUIZ_DECKS.some((d) => d.id === deck.id);
          return (
            <div key={deck.id} className="quiz-deck-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  className="quiz-deck-badge"
                  style={{ background: `${deck.accentColor}16`, color: deck.accentColor }}
                >
                  {deck.badge}
                </span>
                {isCustom && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteDeck(deck)}
                    style={{ color: '#dc2626', padding: '0.25rem' }}
                    title="מחק חידון זה"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <h3 className="quiz-deck-title">{deck.title}</h3>
              <p className="quiz-deck-sub">{deck.subtitle}</p>
              <div className="quiz-deck-actions">
                <button
                  className="quiz-launch-btn"
                  style={{ background: deck.accentColor }}
                  disabled={launchingDeckId === deck.id}
                  onClick={() => handleLaunchDeck(deck)}
                >
                  <Play size={17} />
                  {launchingDeckId === deck.id ? 'פותח סבב...' : 'התחל משחק חדש'}
                </button>
                <button
                  className="quiz-preview-btn"
                  type="button"
                  onClick={() => setPreviewDeck(deck)}
                >
                  <Eye size={16} />
                  הצצה לשאלות
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Saved Rounds & Cleanup */}
      <div className="quiz-sessions-header">
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>
            סבבים שמורים ונתוני משחקים ({sessions.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            סה״כ {totalPlayersAcrossRounds} משתתפים בכל הסבבים השמורים • ניתן למחוק סבבי ניסיון כדי לשמור על ניקיון ב-Supabase
          </p>
        </div>

        {sessions.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {finishedCount > 0 && (
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.83rem', padding: '0.45rem 0.9rem', color: '#b45309', borderColor: 'rgba(180,83,9,0.3)' }}
                onClick={() => setConfirmDeleteAllMode('finished')}
              >
                <Trash2 size={15} />
                נקה סבבים שהסתיימו ({finishedCount})
              </button>
            )}
            <button
              className="btn btn-outline"
              style={{ fontSize: '0.83rem', padding: '0.45rem 0.9rem', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}
              onClick={() => setConfirmDeleteAllMode('all')}
            >
              <Trash2 size={15} />
              מחק הכל ({sessions.length})
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          טוען סבבים...
        </p>
      ) : sessions.length === 0 ? (
        <div
          className="glass"
          style={{
            borderRadius: '18px',
            padding: '2.25rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)'
          }}
        >
          עדיין אין סבבים שמורים. לחצי על ״התחל משחק חדש״ למעלה כדי להפעיל סבב ניסיון או שיעור חי!
        </div>
      ) : (
        <div className="quiz-sessions-list">
          {sessions.map((session) => {
            const topPlayer = session.players[0];
            const dateLabel = new Date(session.created_at).toLocaleString('he-IL', {
              dateStyle: 'short',
              timeStyle: 'short'
            });

            return (
              <div key={session.id} className="quiz-session-row">
                <div className="quiz-session-meta">
                  <div className="quiz-session-top">
                    <strong style={{ fontSize: '1.02rem' }}>{session.title}</strong>
                    <span className="quiz-code-chip">קוד {session.code}</span>
                    <span className={`quiz-status-pill quiz-status-${session.status}`}>
                      {STATUS_LABEL[session.status] || session.status}
                    </span>
                  </div>
                  <div className="quiz-session-details">
                    <span>{dateLabel}</span>
                    <span>•</span>
                    <span>
                      <Users size={14} style={{ verticalAlign: 'text-bottom', marginLeft: '4px' }} />
                      {session.players.length} משתתפים
                    </span>
                    <span>•</span>
                    <span>{session.questions.length} שאלות</span>
                    {topPlayer && (
                      <>
                        <span>•</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Trophy size={14} />
                          מוביל/ה: <QuizAvatar avatar={topPlayer.avatar} size={22} /> {topPlayer.nickname} ({topPlayer.score.toLocaleString()} נק׳)
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="quiz-session-actions">
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '0.84rem', padding: '0.5rem 0.95rem' }}
                    onClick={() => navigate(`/admin/quiz/host/${session.id}`)}
                  >
                    <Play size={15} />
                    {session.status === 'finished' ? 'צפה בפודיום' : 'מסך מנחה'}
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.84rem', padding: '0.5rem 0.9rem' }}
                    onClick={() => setResultsSession(session)}
                  >
                    <BarChart3 size={15} />
                    נתונים ({session.players.length})
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{
                      fontSize: '0.84rem',
                      padding: '0.5rem 0.75rem',
                      color: '#dc2626',
                      borderColor: 'rgba(220,38,38,0.28)'
                    }}
                    onClick={() => setConfirmDeleteSession(session)}
                    title="מחק סבב זה מסופאבייס"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Questions Modal */}
      {previewDeck && (
        <div className="quiz-modal-backdrop" onClick={() => setPreviewDeck(null)}>
          <div className="quiz-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-modal-header">
              <h3>{previewDeck.title}</h3>
              <button onClick={() => setPreviewDeck(null)} style={{ color: 'var(--text-secondary)' }}>
                <X size={22} />
              </button>
            </div>
            <div>
              {previewDeck.questions.map((q, idx) => (
                <div key={q.id} className="quiz-preview-item">
                  <div style={{ fontWeight: 800, fontSize: '0.96rem' }}>
                    {idx + 1}. {q.question}
                  </div>
                  <div className="quiz-preview-options">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={`quiz-preview-opt ${optIdx === q.correctIndex ? 'correct' : ''}`}
                      >
                        <strong>{OPTION_LETTERS[optIdx]}.</strong> {opt}
                        {optIdx === q.correctIndex && (
                          <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                        )}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.45rem' }}>
                      {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Session Results Modal */}
      {resultsSession && (
        <div className="quiz-modal-backdrop" onClick={() => setResultsSession(null)}>
          <div className="quiz-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-modal-header">
              <div>
                <h3>תוצאות ונתוני סבב</h3>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {resultsSession.title} • קוד {resultsSession.code}
                </div>
              </div>
              <button onClick={() => setResultsSession(null)} style={{ color: 'var(--text-secondary)' }}>
                <X size={22} />
              </button>
            </div>

            {resultsSession.players.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem 0' }}>
                לא הצטרפו שחקנים בסבב זה.
              </p>
            ) : (
              <table className="quiz-standings-table">
                <thead>
                  <tr>
                    <th>מקום</th>
                    <th>שם</th>
                    <th>ניקוד</th>
                    <th>תשובות נכונות</th>
                    <th>זמן ממוצע</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsSession.players.map((p, idx) => {
                    const avgSec =
                      resultsSession.questions.length > 0 && p.total_response_ms > 0
                        ? (p.total_response_ms / 1000 / Math.max(1, p.correct_count || 1)).toFixed(1)
                        : '—';
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 900 }}>#{idx + 1}</td>
                        <td style={{ fontWeight: 700 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                            <QuizAvatar avatar={p.avatar} size={24} />
                            <span>{p.nickname}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                          {p.score.toLocaleString()}
                        </td>
                        <td>
                          {p.correct_count} / {resultsSession.questions.length}
                        </td>
                        <td>{avgSec === '—' ? '—' : `${avgSec} שנ׳`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Delete Custom Deck Confirmation Modal */}
      {confirmDeleteDeck && (
        <div className="quiz-modal-backdrop" onClick={() => !deleting && setConfirmDeleteDeck(null)}>
          <div className="quiz-modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="quiz-modal-header">
              <h3>מחיקת חידון</h3>
              <button onClick={() => !deleting && setConfirmDeleteDeck(null)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              למחוק את החידון <strong>{confirmDeleteDeck.title}</strong> מהרשימה?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                className="btn btn-outline"
                disabled={deleting}
                onClick={() => setConfirmDeleteDeck(null)}
              >
                ביטול
              </button>
              <button
                className="btn"
                style={{ background: '#dc2626', color: '#fff' }}
                disabled={deleting}
                onClick={handleConfirmDeleteDeck}
              >
                {deleting ? 'מוחק...' : 'כן, מחק'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Session Confirmation Modal */}
      {confirmDeleteSession && (
        <div className="quiz-modal-backdrop" onClick={() => !deleting && setConfirmDeleteSession(null)}>
          <div className="quiz-modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="quiz-modal-header">
              <h3>מחיקת סבב</h3>
              <button onClick={() => !deleting && setConfirmDeleteSession(null)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              למחוק לצמיתות את הסבב <strong>{confirmDeleteSession.title}</strong> (קוד {confirmDeleteSession.code}) כולל כל נתוני השחקנים והתשובות מ-Supabase?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                className="btn btn-outline"
                disabled={deleting}
                onClick={() => setConfirmDeleteSession(null)}
              >
                ביטול
              </button>
              <button
                className="btn"
                style={{ background: '#dc2626', color: '#fff' }}
                disabled={deleting}
                onClick={handleConfirmDeleteSingle}
              >
                {deleting ? 'מוחק...' : 'כן, מחק לצמיתות'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {confirmDeleteAllMode && (
        <div className="quiz-modal-backdrop" onClick={() => !deleting && setConfirmDeleteAllMode(null)}>
          <div className="quiz-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="quiz-modal-header">
              <h3>ניקוי סבבים</h3>
              <button onClick={() => !deleting && setConfirmDeleteAllMode(null)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {confirmDeleteAllMode === 'finished'
                ? `פעולה זו תמחק ${finishedCount} סבבים שהסתיימו כולל כל תוצאות המשתתפים שלהם מ-Supabase.`
                : `פעולה זו תמחק את כל ${sessions.length} הסבבים השמורים כולל נתוני המשתתפים מ-Supabase.`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                className="btn btn-outline"
                disabled={deleting}
                onClick={() => setConfirmDeleteAllMode(null)}
              >
                ביטול
              </button>
              <button
                className="btn"
                style={{ background: '#dc2626', color: '#fff' }}
                disabled={deleting}
                onClick={handleConfirmBulkDelete}
              >
                {deleting ? 'מנקה...' : 'אישור ומחיקה'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminQuizHub;
