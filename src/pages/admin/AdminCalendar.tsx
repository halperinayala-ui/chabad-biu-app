import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Plus, X, CalendarDays, Clock, Tag, Trash2, Sparkles, Edit3, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  getHebrewCalendarGrid,
  findHebrewMonthDate,
  formatHebrewDate,
  toDateStr,
} from '../../utils/dateUtils';
import type { CalendarDay } from '../../utils/dateUtils';
import './AdminCalendar.css';

// ─── Types & Constants ────────────────────────────────────────────────────────

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
  { color: '#492691', label: 'סגול – אירוע מרכזי / סעודת שבת' },
  { color: '#e91e8c', label: 'ורוד – ערב נשים / פעילות' },
  { color: '#e74c3c', label: 'אדום – מועד חסום / משימה דחופה' },
  { color: '#e67e22', label: 'כתום – טיול / סיור / חופשה' },
  { color: '#27ae60', label: 'ירוק – שיעור תורה / לימוד' },
  { color: '#2980b9', label: 'כחול – מפגש צוות / ישיבה' },
  { color: '#8e44ad', label: 'סגול כהה – התוועדות / אירוע מיוחד' },
  { color: '#16a085', label: 'טורקיז – קהילה / התנדבות' },
];

const COLUMN_HEADERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

const HEBREW_MONTHS_LIST = [
  'תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר', 'אדר א׳', 'אדר ב׳', 'ניסן', 'אייר', 'סיוון', 'תמוז', 'אב', 'אלול'
];

const HEBREW_YEARS_LIST = [
  { label: 'תשפ״ה (5785)', year: 5785 },
  { label: 'תשפ״ו (5786)', year: 5786 },
  { label: 'תשפ״ז (5787)', year: 5787 },
  { label: 'תשפ״ח (5788)', year: 5788 },
  { label: 'תשפ״ט (5789)', year: 5789 },
  { label: 'תש״פ (5790)', year: 5790 },
];

// ─── Component ────────────────────────────────────────────────────────────────

const AdminCalendar = () => {
  const { profile } = useAuth();

  // State for currently viewed Hebrew month date
  const [refDate, setRefDate] = useState<Date>(new Date());

  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
  const [sysEvents, setSysEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Day modal
  const [dayModal, setDayModal] = useState<DayModalState>({ open: false, day: null, calEvents: [], sysEvents: [] });

  // Add / Edit event form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formColor, setFormColor] = useState(PRESET_COLORS[0].color);
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
    hebrewYearNum,
    gregRangeStr,
    days: grid,
  } = getHebrewCalendarGrid(refDate);

  const firstDayStr = toDateStr(firstDay);
  const lastDayStr = toDateStr(lastDay);

  // ─── Fetch Data ─────────────────────────────────────────────────────────────

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

  // Direct month/year selection jump
  const handleSelectMonthYear = (monthName: string, yearNum: number) => {
    const newDate = findHebrewMonthDate(monthName, yearNum);
    setRefDate(newDate);
  };

  // ─── Smart Deduplication Helper ─────────────────────────────────────────────

  const eventsOnDay = (dateStr: string) => {
    const dayCal = calEvents.filter(e => e.event_date === dateStr);
    const daySys = sysEvents.filter(e => e.event_date === dateStr);

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

  // ─── Day Click & Modal Controls ──────────────────────────────────────────────

  const handleDayClick = (day: CalendarDay) => {
    const { cal: dayCalEvents, sys: daySysEvents } = eventsOnDay(day.dateStr);
    setDayModal({ open: true, day, calEvents: dayCalEvents, sysEvents: daySysEvents });
    resetForm();
  };

  const closeDayModal = () => {
    setDayModal(prev => ({ ...prev, open: false }));
    setDeleteId(null);
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormTitle('');
    setFormTime('');
    setFormColor(PRESET_COLORS[0].color);
    setFormNotes('');
    setFormError('');
  };

  // ─── Form Edit Trigger ──────────────────────────────────────────────────────

  const startEditingEvent = (ev: CalendarEvent) => {
    setEditingId(ev.id);
    setFormTitle(ev.title);
    setFormTime(ev.event_time || '');
    setFormColor(ev.color || PRESET_COLORS[0].color);
    setFormNotes(ev.notes || '');
    setFormError('');
    setShowForm(true);
  };

  // ─── Save / Update Event ────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formTitle.trim()) { setFormError('נא להזין כותרת לאירוע'); return; }
    if (!dayModal.day) return;
    setFormSaving(true);
    setFormError('');
    try {
      if (editingId) {
        // Update existing planning event
        const { data, error } = await supabase
          .from('calendar_events')
          .update({
            title: formTitle.trim(),
            event_time: formTime || null,
            color: formColor,
            notes: formNotes.trim() || null,
          })
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;

        const updatedEv: CalendarEvent = data;
        setCalEvents(prev => prev.map(e => e.id === editingId ? updatedEv : e));
        setDayModal(prev => ({
          ...prev,
          calEvents: prev.calEvents.map(e => e.id === editingId ? updatedEv : e),
        }));
      } else {
        // Insert new planning event
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
      }

      resetForm();
    } catch (e: any) {
      setFormError('שגיאה בשמירה – בדקי שהטבלה calendar_events קיימת ב-Supabase');
    } finally {
      setFormSaving(false);
    }
  };

  // ─── Delete Event ───────────────────────────────────────────────────────────

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

  // ─── Click Event in Summary List ───────────────────────────────────────────

  const handleSummaryItemClick = (dateStr: string, calEvId?: string) => {
    // Find matching day in grid or construct date
    const dayObj = grid.find(d => d.dateStr === dateStr);

    if (dayObj) {
      handleDayClick(dayObj);
    } else {
      // Build temporary day object for out-of-grid date
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const { dayName, hebrewDate } = formatHebrewDate(dateStr);
      const dayCal = calEvents.filter(e => e.event_date === dateStr);
      const daySys = sysEvents.filter(e => e.event_date === dateStr);

      setDayModal({
        open: true,
        day: {
          date: dt,
          dateStr,
          hebrewDay: hebrewDate.split(' ')[0],
          hebrewMonth: hebrewDate.split(' ')[1] || '',
          gregDay: d,
          gregMonth: m - 1,
          isCurrentMonth: true,
          isToday: dateStr === toDateStr(new Date()),
          isShabbat: dt.getDay() === 6,
          isRoshChodesh: false,
          holiday: null,
        },
        calEvents: dayCal,
        sysEvents: daySys,
      });
      resetForm();
    }

    // If specific cal event ID passed, open edit directly
    if (calEvId) {
      const targetCal = calEvents.find(e => e.id === calEvId);
      if (targetCal) {
        startEditingEvent(targetCal);
      }
    }
  };

  // Active color label
  const activeColorObj = PRESET_COLORS.find(c => c.color === formColor) || PRESET_COLORS[0];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div className="admin-calendar-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* ── Header with Select Jump ── */}
      <div className="cal-header">
        <div className="cal-header-titles">
          <h1 className="cal-main-title">לוח שנה עברי</h1>
          <div className="cal-month-jump-row">
            {/* Hebrew Month Select */}
            <select
              className="cal-select-picker"
              value={hebrewMonthName}
              onChange={e => handleSelectMonthYear(e.target.value, hebrewYearNum)}
            >
              {HEBREW_MONTHS_LIST.map(m => (
                <option key={m} value={m}>חודש {m}</option>
              ))}
            </select>

            {/* Hebrew Year Select */}
            <select
              className="cal-select-picker"
              value={hebrewYearNum}
              onChange={e => handleSelectMonthYear(hebrewMonthName, Number(e.target.value))}
            >
              {HEBREW_YEARS_LIST.map(y => (
                <option key={y.year} value={y.year}>{y.label}</option>
              ))}
            </select>

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

                  {/* Holiday Badge */}
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

                {/* Calendar (planning) events with EDIT button */}
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

                        <div className="plan-event-actions">
                          {/* Edit button */}
                          <button
                            className="plan-event-action-btn edit-btn"
                            onClick={() => startEditingEvent(e)}
                            title="עריכת אירוע"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Delete button */}
                          {deleteId === e.id ? (
                            <div className="delete-confirm">
                              <span>למחוק?</span>
                              <button className="del-yes" onClick={() => handleDelete(e.id)} disabled={deleting}>
                                {deleting ? '...' : 'כן'}
                              </button>
                              <button className="del-no" onClick={() => setDeleteId(null)}>לא</button>
                            </div>
                          ) : (
                            <button
                              className="plan-event-action-btn del-btn"
                              onClick={() => setDeleteId(e.id)}
                              title="מחיקת אירוע"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {dayModal.calEvents.length === 0 && dayModal.sysEvents.length === 0 && !showForm && (
                  <p className="modal-empty">אין אירועים ביום זה</p>
                )}

                {/* Add / Edit Event Form */}
                {showForm ? (
                  <motion.div
                    className="modal-add-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3 className="modal-section-title">
                      {editingId ? <Edit3 size={15} /> : <Plus size={15} />}
                      {editingId ? 'עריכת אירוע תכנון' : 'הוספת אירוע תכנון'}
                    </h3>

                    <div className="form-field">
                      <label>כותרת האירוע *</label>
                      <input
                        type="text"
                        className="cal-input"
                        placeholder="לדוגמה: סעודת שבת, שיעור תורה..."
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

                    {/* Color Picker with Explanation & Labels */}
                    <div className="form-field">
                      <label>צבע וסיווג האירוע</label>
                      <div className="color-picker">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c.color}
                            type="button"
                            className={`color-btn${formColor === c.color ? ' selected' : ''}`}
                            style={{ background: c.color }}
                            onClick={() => setFormColor(c.color)}
                            title={c.label}
                          >
                            {formColor === c.color && <Check size={14} style={{ color: 'white' }} />}
                          </button>
                        ))}
                      </div>
                      <span className="color-active-label" style={{ color: activeColorObj.color }}>
                        {activeColorObj.label}
                      </span>
                    </div>

                    <div className="form-field">
                      <label>הערות נוספות (אופציונלי)</label>
                      <textarea
                        className="cal-input cal-textarea"
                        placeholder="הערות ופרטים לתכנון..."
                        value={formNotes}
                        onChange={e => setFormNotes(e.target.value)}
                        rows={2}
                      />
                    </div>

                    {formError && <p className="form-error">{formError}</p>}

                    <div className="form-actions">
                      <button className="btn btn-primary" onClick={handleSave} disabled={formSaving}>
                        {formSaving ? 'שומר...' : editingId ? 'עדכון אירוע' : 'שמירת אירוע'}
                      </button>
                      <button className="btn btn-outline" onClick={resetForm}>
                        ביטול
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <button className="modal-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
                    <Plus size={16} /> הוסיפי אירוע תכנון
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Monthly Summary List (Clickable items!) ── */}
      <div className="cal-month-summary">
        <h2 className="section-title">
          <CalendarDays size={18} style={{ marginLeft: '0.4rem', verticalAlign: 'middle' }} />
          אירועים בחודש {hebrewMonthName}
        </h2>

        {(() => {
          const monthSys = sysEvents.filter(e => e.event_date >= firstDayStr && e.event_date <= lastDayStr);
          const monthCal = calEvents.filter(e => e.event_date >= firstDayStr && e.event_date <= lastDayStr);

          // Deduplicate planning events if matching system event exists
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
            id?: string;
            dateStr: string;
            title: string;
            type: 'sys' | 'cal';
            color?: string;
            time?: string;
          };

          const merged: MergedItem[] = [
            ...monthSys.map(e => ({ id: e.id, dateStr: e.event_date, title: e.title, type: 'sys' as const })),
            ...filteredMonthCal.map(e => ({ id: e.id, dateStr: e.event_date, title: e.title, type: 'cal' as const, color: e.color, time: e.event_time })),
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
                  <div
                    key={i}
                    className="summary-item clickable-summary-item"
                    onClick={() => handleSummaryItemClick(item.dateStr, item.type === 'cal' ? item.id : undefined)}
                    title="לחצי לצפייה ועריכה"
                  >
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
                    <div className="summary-action-hint">
                      <Edit3 size={15} />
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
