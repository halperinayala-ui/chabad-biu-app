import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Plus, X, CalendarDays, Clock, Tag, Trash2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  getHebrewCalendarGrid,
  formatHebrewDate,
  toDateStr,
} from '../../utils/dateUtils';
import type { CalendarDay } from '../../utils/dateUtils';
import './AdminCalendar.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  color: string;
  notes?: string;
}

interface SystemEvent {
  id: string;
  title: string;
  event_date: string;
  category: string;
}

interface DayModalState {
  open: boolean;
  day: CalendarDay | null;
  calEvents: CalendarEvent[];
  sysEvents: SystemEvent[];
}

const PRESET_COLORS = [
  '#492691', '#e91e8c', '#e74c3c', '#e67e22',
  '#27ae60', '#2980b9', '#8e44ad', '#16a085',
];

const COLUMN_HEADERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

// ─── Component ────────────────────────────────────────────────────────────────

const AdminCalendar = () => {
  const { profile } = useAuth();

  // State for currently viewed Hebrew month
  const [refDate, setRefDate] = useState<Date>(new Date());

  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
  const [sysEvents, setSysEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Day modal
  const [dayModal, setDayModal] = useState<DayModalState>({ open: false, day: null, calEvents: [], sysEvents: [] });

  // Add event form
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Calculate Hebrew month grid & info
  const {
    firstDay,
    lastDay,
    hebrewMonthName,
    hebrewYearName,
    gregRangeStr,
    days: grid,
  } = getHebrewCalendarGrid(refDate);

  const firstDayStr = toDateStr(firstDay);
  const lastDayStr = toDateStr(lastDay);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cal } = await supabase
        .from('calendar_events')
        .select('id, title, event_date, event_time, color, notes')
        .order('event_date');

      const { data: sys } = await supabase
        .from('events')
        .select('id, title, event_date, category')
        .eq('archived', false)
        .order('event_date');

      setCalEvents(cal || []);
      setSysEvents(sys || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const prevMonth = () => {
    const prev = new Date(firstDay);
    prev.setDate(prev.getDate() - 1);
    setRefDate(prev);
  };

  const nextMonth = () => {
    const next = new Date(lastDay);
    next.setDate(next.getDate() + 1);
    setRefDate(next);
  };

  const goToToday = () => {
    setRefDate(new Date());
  };

  // ─── Smart Deduplication Helper ─────────────────────────────────────────────

  const eventsOnDay = (dateStr: string) => {
    const dayCal = calEvents.filter(e => e.event_date === dateStr);
    const daySys = sysEvents.filter(e => e.event_date === dateStr);

    // Filter out planning events that already match a published system event title on the same date
    const filteredCal = dayCal.filter(calEv => {
      const calTitleClean = calEv.title.trim().toLowerCase();
      const hasMatchingSys = daySys.some(sysEv => {
        const sysTitleClean = sysEv.title.trim().toLowerCase();
        return sysTitleClean.includes(calTitleClean) || calTitleClean.includes(sysTitleClean);
      });
      return !hasMatchingSys;
    });

    return { cal: filteredCal, sys: daySys };
  };

  // ─── Day click ──────────────────────────────────────────────────────────────

  const handleDayClick = (day: CalendarDay) => {
    const { cal: dayCalEvents, sys: daySysEvents } = eventsOnDay(day.dateStr);
    setDayModal({ open: true, day, calEvents: dayCalEvents, sysEvents: daySysEvents });
    setShowForm(false);
    setFormTitle('');
    setFormTime('');
    setFormColor(PRESET_COLORS[0]);
    setFormNotes('');
    setFormError('');
  };

  const closeDayModal = () => {
    setDayModal(prev => ({ ...prev, open: false }));
    setDeleteId(null);
  };

  // ─── Save event ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formTitle.trim()) { setFormError('נא להזין כותרת לאירוע'); return; }
    if (!dayModal.day) return;
    setFormSaving(true);
    setFormError('');
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: formTitle.trim(),
          event_date: dayModal.day.dateStr,
          event_time: formTime || null,
          color: formColor,
          notes: formNotes.trim() || null,
          created_by: profile?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newEv: CalendarEvent = data;
      setCalEvents(prev => [...prev, newEv]);
      setDayModal(prev => ({
        ...prev,
        calEvents: [...prev.calEvents, newEv],
      }));
      setShowForm(false);
      setFormTitle('');
      setFormTime('');
      setFormNotes('');
      setFormColor(PRESET_COLORS[0]);
    } catch (e: any) {
      setFormError('שגיאה בשמירה – בדקי שהטבלה calendar_events קיימת ב-Supabase');
    } finally {
      setFormSaving(false);
    }
  };

  // ─── Delete event ────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await supabase.from('calendar_events').delete().eq('id', id);
      setCalEvents(prev => prev.filter(e => e.id !== id));
      setDayModal(prev => ({
        ...prev,
        calEvents: prev.calEvents.filter(e => e.id !== id),
      }));
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div className="admin-calendar-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* ── Header ── */}
      <div className="cal-header">
        <div className="cal-header-titles">
          <h1 className="cal-main-title">לוח שנה עברי</h1>
          <div className="cal-month-label">
            <span className="cal-heb-month">חודש {hebrewMonthName} {hebrewYearName}</span>
            <span className="cal-greg-month">({gregRangeStr})</span>
          </div>
        </div>
        <div className="cal-nav-controls">
          <button className="cal-nav-btn" onClick={prevMonth} title="חודש עברי קודם">
            <ChevronRight size={20} />
          </button>
          <button className="cal-today-btn" onClick={goToToday}>היום</button>
          <button className="cal-nav-btn" onClick={nextMonth} title="חודש עברי הבא">
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="cal-legend">
        <span className="legend-item"><span className="legend-dot sys-dot" />אירוע רשום</span>
        <span className="legend-item"><span className="legend-dot plan-dot" />אירוע תכנון</span>
        <span className="legend-item holiday-legend">🍷 חגים ומועדים</span>
        <span className="legend-item shab-legend">שבת</span>
        <span className="legend-item rc-legend">ר"ח</span>
      </div>

      {/* ── Grid ── */}
      <div className="cal-grid-container glass">
        {/* Day-of-week headers */}
        <div className="cal-dow-row">
          {COLUMN_HEADERS.map(h => (
            <div key={h} className={`cal-dow-cell${h === 'ש׳' ? ' shab-header' : ''}`}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="cal-loading">טוען לוח עברי...</div>
        ) : (
          <div className="cal-days-grid">
            {grid.map((day) => {
              const { cal, sys } = eventsOnDay(day.dateStr);
              const totalEvents = cal.length + sys.length;
              return (
                <motion.div
                  key={day.dateStr}
                  className={[
                    'cal-day',
                    day.isCurrentMonth ? '' : 'other-month',
                    day.isToday ? 'today' : '',
                    day.isShabbat ? 'shabbat' : '',
                    day.isRoshChodesh && day.isCurrentMonth ? 'rosh-chodesh' : '',
                    day.holiday ? `has-holiday holiday-type-${day.holiday.type}` : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleDayClick(day)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Hebrew date */}
                  <div className="cal-day-heb">
                    {day.isRoshChodesh && day.isCurrentMonth && (
                      <span className="rc-badge">ר"ח</span>
                    )}
                    <span className="heb-num">{day.hebrewDay}</span>
                    {day.isRoshChodesh && (
                      <span className="heb-month-label">{day.hebrewMonth}</span>
                    )}
                  </div>

                  {/* Gregorian date */}
                  <div className="cal-day-greg">{day.gregDay}</div>

                  {/* Holiday Badge (if present) */}
                  {day.holiday && (
                    <span className={`cal-holiday-pill holiday-${day.holiday.type}`} title={day.holiday.name}>
                      ✨ {day.holiday.name}
                    </span>
                  )}

                  {/* Events dots / pills */}
                  {totalEvents > 0 && (
                    <div className="cal-day-events">
                      {sys.slice(0, 1).map(e => (
                        <span key={e.id} className="cal-event-pill sys-pill" title={e.title}>
                          {e.title.length > 10 ? e.title.slice(0, 10) + '…' : e.title}
                        </span>
                      ))}
                      {cal.slice(0, 2).map(e => (
                        <span
                          key={e.id}
                          className="cal-event-pill plan-pill"
                          style={{ background: e.color + '22', color: e.color, borderColor: e.color + '44' }}
                          title={e.title}
                        >
                          {e.title.length > 10 ? e.title.slice(0, 10) + '…' : e.title}
                        </span>
                      ))}
                      {totalEvents > 3 && (
                        <span className="cal-more">+{totalEvents - 3}</span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Day Modal ── */}
      <AnimatePresence>
        {dayModal.open && dayModal.day && (
          <motion.div
            className="cal-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDayModal}
          >
            <motion.div
              className="cal-modal glass"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="cal-modal-header">
                <div>
                  <div className="cal-modal-heb-date">
                    {dayModal.day.hebrewDay} {dayModal.day.hebrewMonth}
                    {dayModal.day.isRoshChodesh && <span className="rc-badge-modal">ר"ח</span>}
                    {dayModal.day.isShabbat && <span className="shab-badge">שבת</span>}
                  </div>
                  <div className="cal-modal-greg-date">
                    {String(dayModal.day.gregDay).padStart(2,'0')}.{String(dayModal.day.gregMonth + 1).padStart(2,'0')}.{dayModal.day.date.getFullYear()}
                  </div>
                </div>
                <button className="cal-modal-close" onClick={closeDayModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="cal-modal-body">

                {/* Holiday banner inside modal */}
                {dayModal.day.holiday && (
                  <div className={`modal-holiday-banner holiday-banner-${dayModal.day.holiday.type}`}>
                    <Sparkles size={18} />
                    <div>
                      <strong>{dayModal.day.holiday.name}</strong>
                    </div>
                  </div>
                )}

                {/* System events */}
                {dayModal.sysEvents.length > 0 && (
                  <section className="modal-section">
                    <h3 className="modal-section-title">
                      <CalendarDays size={15} />
                      אירועים רשומים (פורסם לסטודנטים)
                    </h3>
                    {dayModal.sysEvents.map(e => (
                      <div key={e.id} className="modal-sys-event">
                        <span className="sys-event-dot" />
                        <div>
                          <strong>{e.title}</strong>
                          <span className="modal-cat">{e.category}</span>
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {/* Calendar (planning) events */}
                {dayModal.calEvents.length > 0 && (
                  <section className="modal-section">
                    <h3 className="modal-section-title">
                      <Tag size={15} />
                      אירועי תכנון
                    </h3>
                    {dayModal.calEvents.map(e => (
                      <div key={e.id} className="modal-cal-event">
                        <span className="plan-event-bar" style={{ background: e.color }} />
                        <div className="plan-event-info">
                          <strong>{e.title}</strong>
                          {e.event_time && (
                            <span className="plan-event-time">
                              <Clock size={12} /> {e.event_time}
                            </span>
                          )}
                          {e.notes && <p className="plan-event-notes">{e.notes}</p>}
                        </div>
                        {deleteId === e.id ? (
                          <div className="delete-confirm">
                            <span>למחוק?</span>
                            <button className="del-yes" onClick={() => handleDelete(e.id)} disabled={deleting}>
                              {deleting ? '...' : 'כן'}
                            </button>
                            <button className="del-no" onClick={() => setDeleteId(null)}>לא</button>
                          </div>
                        ) : (
                          <button className="plan-event-delete" onClick={() => setDeleteId(e.id)} title="מחיקה">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </section>
                )}

                {dayModal.calEvents.length === 0 && dayModal.sysEvents.length === 0 && !showForm && (
                  <p className="modal-empty">אין אירועים ביום זה</p>
                )}

                {/* Add event form */}
                {showForm ? (
                  <motion.div
                    className="modal-add-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3 className="modal-section-title"><Plus size={15} /> הוספת אירוע תכנון</h3>

                    <div className="form-field">
                      <label>כותרת *</label>
                      <input
                        type="text"
                        className="cal-input"
                        placeholder="שם האירוע..."
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="form-field">
                      <label>שעה (אופציונלי)</label>
                      <input
                        type="time"
                        className="cal-input"
                        value={formTime}
                        onChange={e => setFormTime(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label>צבע</label>
                      <div className="color-picker">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            className={`color-btn${formColor === c ? ' selected' : ''}`}
                            style={{ background: c }}
                            onClick={() => setFormColor(c)}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="form-field">
                      <label>הערות (אופציונלי)</label>
                      <textarea
                        className="cal-input cal-textarea"
                        placeholder="הערות נוספות..."
                        value={formNotes}
                        onChange={e => setFormNotes(e.target.value)}
                        rows={2}
                      />
                    </div>

                    {formError && <p className="form-error">{formError}</p>}

                    <div className="form-actions">
                      <button className="btn btn-primary" onClick={handleSave} disabled={formSaving}>
                        {formSaving ? 'שומר...' : 'שמירה'}
                      </button>
                      <button className="btn btn-outline" onClick={() => setShowForm(false)}>
                        ביטול
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <button className="modal-add-btn" onClick={() => setShowForm(true)}>
                    <Plus size={16} /> הוסיפי אירוע תכנון
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Monthly summary list ── */}
      <div className="cal-month-summary">
        <h2 className="section-title">
          <CalendarDays size={18} style={{ marginLeft: '0.4rem', verticalAlign: 'middle' }} />
          אירועים בחודש {hebrewMonthName}
        </h2>

        {(() => {
          const monthSys = sysEvents.filter(e => e.event_date >= firstDayStr && e.event_date <= lastDayStr);
          const monthCal = calEvents.filter(e => e.event_date >= firstDayStr && e.event_date <= lastDayStr);

          // Deduplicate planning events if an official system event exists on the same date with similar title
          const filteredMonthCal = monthCal.filter(calEv => {
            const calTitleClean = calEv.title.trim().toLowerCase();
            const hasMatchingSys = monthSys.some(sysEv => {
              return sysEv.event_date === calEv.event_date && (
                sysEv.title.trim().toLowerCase().includes(calTitleClean) ||
                calTitleClean.includes(sysEv.title.trim().toLowerCase())
              );
            });
            return !hasMatchingSys;
          });

          // Merge & sort
          type MergedItem = {
            dateStr: string;
            title: string;
            type: 'sys' | 'cal';
            color?: string;
            time?: string;
          };

          const merged: MergedItem[] = [
            ...monthSys.map(e => ({ dateStr: e.event_date, title: e.title, type: 'sys' as const })),
            ...filteredMonthCal.map(e => ({ dateStr: e.event_date, title: e.title, type: 'cal' as const, color: e.color, time: e.event_time })),
          ].sort((a, b) => a.dateStr.localeCompare(b.dateStr));

          if (merged.length === 0) {
            return <p className="summary-empty">אין אירועים מתוכננים בחודש {hebrewMonthName}</p>;
          }

          return (
            <div className="summary-list glass">
              {merged.map((item, i) => {
                const { dayName, hebrewDate, gregorian } = formatHebrewDate(item.dateStr);
                const shortGreg = gregorian.slice(0, 5);

                return (
                  <div key={i} className="summary-item">
                    <div className="summary-date">
                      <span className="summary-heb-date">{hebrewDate}</span>
                      <span className="summary-greg-sub">יום {dayName} | {shortGreg}</span>
                    </div>
                    <div className="summary-info">
                      <span
                        className="summary-type-dot"
                        style={{ background: item.type === 'cal' ? item.color : '#492691' }}
                      />
                      <span className="summary-title">{item.title}</span>
                      {item.type === 'sys' && <span className="summary-published-badge">פורסם</span>}
                      {item.time && <span className="summary-time">{item.time}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

    </motion.div>
  );
};

export default AdminCalendar;
