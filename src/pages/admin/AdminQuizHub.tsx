import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Copy,
  Database,
  Eye,
  Play,
  QrCode,
  RefreshCw,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QuizAvatar } from '../../components/QuizAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { OPTION_LETTERS, QUIZ_DECKS, type QuizDeck } from '../../data/quizDecks';
import {
  createQuizSession,
  deleteMultipleQuizSessions,
  deleteQuizSession,
  fetchAllQuizSessions,
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
  const [loading, setLoading] = useState(true);
  const [missingTables, setMissingTables] = useState(false);
  const [launchingDeckId, setLaunchingDeckId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [durationSec, setDurationSec] = useState<number>(20);

  // Modals (Zero browser alert/confirm)
  const [previewDeck, setPreviewDeck] = useState<QuizDeck | null>(null);
  const [resultsSession, setResultsSession] = useState<QuizSessionWithStats | null>(null);
  const [confirmDeleteSession, setConfirmDeleteSession] = useState<QuizSessionWithStats | null>(null);
  const [confirmDeleteAllMode, setConfirmDeleteAllMode] = useState<'finished' | 'all' | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await fetchAllQuizSessions();
      setSessions(data);
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
    loadSessions();
  }, []);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(quizMigrationSql);
      toast.success('קוד ה-SQL הועתק! הדביקי והריצי ב-Supabase SQL Editor');
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
        createdBy: user?.id ?? null
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
              מציגים ברקוד על המסך, הסטודנטים סורקים מהנייד ומשחקים ביחד בזמן אמת
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
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
            onClick={loadSessions}
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
            <button className="btn btn-outline" onClick={loadSessions}>
              <RefreshCw size={17} />
              בדוק שוב לאחר ההרצה
            </button>
          </div>
        </div>
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
      </div>

      {/* Decks to launch */}
      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        <Sparkles size={19} style={{ color: 'var(--primary)' }} />
        בחרי חבילת שאלות לפתיחת משחק חדש
      </h2>

      <div className="quiz-decks-grid">
        {QUIZ_DECKS.map((deck) => (
          <div key={deck.id} className="quiz-deck-card">
            <span
              className="quiz-deck-badge"
              style={{ background: `${deck.accentColor}16`, color: deck.accentColor }}
            >
              {deck.badge}
            </span>
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
        ))}
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
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.45rem' }}>
                    {q.explanation}
                  </div>
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

      {/* Delete Single Confirmation Modal */}
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
