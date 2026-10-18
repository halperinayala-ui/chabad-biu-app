import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Users, Settings, BarChart2, Archive, CalendarDays, CalendarCheck, ChevronLeft, Edit, Megaphone, Scroll, ClipboardList } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatHebrewDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

interface EventRow {
  id: string;
  title: string;
  event_date: string;
  category: string;
  registration_mode: string;
  archived: boolean;
  _regCount?: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});
  const [showNewYearBanner, setShowNewYearBanner] = useState(true);
  const [newYearStats, setNewYearStats] = useState({
    total_views: 0,
    qr_scans: 0,
    home_clicks: 0,
    scholarship_clicks: 0,
    whatsapp_clicks: 0
  });
  const [togglingBanner, setTogglingBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Auto-archive past events (date < today)
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      await supabase
        .from('events')
        .update({ archived: true })
        .lt('event_date', todayStr)
        .eq('archived', false);

      const [evsRes, regsRes, setRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, event_date, category, registration_mode, archived')
          .order('event_date', { ascending: false }),
        supabase
          .from('registrations')
          .select('event_id'),
        supabase
          .from('settings')
          .select('wa_templates')
          .eq('id', 1)
          .single()
      ]);

      setEvents(evsRes.data || []);

      const counts: Record<string, number> = {};
      (regsRes.data || []).forEach((r: any) => {
        counts[r.event_id] = (counts[r.event_id] || 0) + 1;
      });
      setRegCounts(counts);

      if (setRes.data?.wa_templates) {
        setShowNewYearBanner(setRes.data.wa_templates.show_new_year_banner !== false);
        if (setRes.data.wa_templates.new_year_stats) {
          setNewYearStats(setRes.data.wa_templates.new_year_stats);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleNewYearBanner = async () => {
    setTogglingBanner(true);
    try {
      const newValue = !showNewYearBanner;
      const { data: setRes } = await supabase.from('settings').select('wa_templates').eq('id', 1).single();
      const currentTemplates = setRes?.wa_templates || {};
      const updatedTemplates = { ...currentTemplates, show_new_year_banner: newValue };

      const { error } = await supabase
        .from('settings')
        .update({ wa_templates: updatedTemplates, updated_at: new Date().toISOString() })
        .eq('id', 1);

      if (error) throw error;
      setShowNewYearBanner(newValue);
      toast.success(newValue ? 'באנר פתיחת שנה הופעל ומוצג בעמוד הבית!' : 'באנר פתיחת שנה הוסר בהצלחה ממסך הבית');
    } catch (err: any) {
      console.error('Error toggling banner:', err);
      toast.error('שגיאה בעדכון: ' + err.message);
    } finally {
      setTogglingBanner(false);
    }
  };

  const activeEvents = events.filter(e => !e.archived);
  const archivedEvents = events.filter(e => e.archived);
  const totalRegs = Object.values(regCounts).reduce((a, b) => a + b, 0);

  const displayed = showArchived ? archivedEvents : activeEvents;

  const cards = [
    { icon: <ClipboardList size={28} />, label: 'מרכז טפסים מיוחדים 📋', desc: 'פדיון כפרות, פ״נ לציון הרבי וטפסים מיוחדים', color: '#d35400', action: () => navigate('/admin/special-forms') },
    { icon: <Plus size={28} />, label: 'אירוע חדש', desc: 'הקמת אירוע חדש עם טופס הרשמה', color: '#492691', action: () => navigate('/admin/events/new') },
    { icon: <CalendarCheck size={28} />, label: 'לוח שנה עברי', desc: 'תכנון שנתי, אירועים מתוכננים וחגים', color: '#7f58c2', action: () => navigate('/admin/calendar') },
    { icon: <Users size={28} />, label: 'CRM סטודנטים', desc: 'צפייה בפרופילים, היסטוריית השתתפות', color: '#e91e8c', action: () => navigate('/admin/crm') },
    { icon: <Megaphone size={28} />, label: 'ניהול הודעות', desc: 'פרסום הודעות פוש ועדכונים בעמוד הבית', color: '#f39c12', action: () => navigate('/admin/announcements') },
    { icon: <Users size={28} />, label: 'ניהול פיד וקהילה 👥', desc: 'פרסום פוסטים, תמונות ושיעורים ישירות מהפיד', color: '#27ae60', action: () => navigate('/community') },
    { icon: <Settings size={28} />, label: 'הגדרות מערכת', desc: 'קטגוריות, תגיות ועוד', color: '#2980b9', action: () => navigate('/admin/settings') },
  ];

  return (
    <motion.div className="admin-dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="dashboard-header">
        <div>
          <h1>לוח בקרה</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>שלום {profile?.full_name?.split(' ')[0] || 'מנהל'} 👋</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="dashboard-kpis">
        <div className="kpi-card glass">
          <div className="kpi-icon" style={{ background: 'rgba(73,38,145,0.1)', color: '#492691' }}><CalendarDays size={22} /></div>
          <div className="kpi-value">{activeEvents.length}</div>
          <div className="kpi-label">אירועים פעילים</div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon" style={{ background: 'rgba(233,30,140,0.1)', color: '#e91e8c' }}><Users size={22} /></div>
          <div className="kpi-value">{totalRegs}</div>
          <div className="kpi-label">סה"כ הרשמות</div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon" style={{ background: 'rgba(41,128,185,0.1)', color: '#2980b9' }}><Archive size={22} /></div>
          <div className="kpi-value">{archivedEvents.length}</div>
          <div className="kpi-label">בארכיון</div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon" style={{ background: 'rgba(39,174,96,0.1)', color: '#27ae60' }}><BarChart2 size={22} /></div>
          <div className="kpi-value">{activeEvents.length > 0 ? Math.round(totalRegs / activeEvents.length) : 0}</div>
          <div className="kpi-label">ממוצע הרשמות לאירוע</div>
        </div>
      </div>

      {/* New Year Banner Toggle Control for Home Page */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.1rem 1.3rem',
        borderRadius: '20px',
        margin: '1.5rem 0',
        background: 'linear-gradient(135deg, rgba(242, 101, 34, 0.08) 0%, rgba(73, 38, 145, 0.06) 100%)',
        border: '1px solid rgba(242, 101, 34, 0.25)',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #f26522, #ff944d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            color: '#fff',
            flexShrink: 0
          }}>
            🍿
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
              באנר פתיחת שנה ועמוד הפופקורן במסך הבית
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {showNewYearBanner ? 'מוצג כרגע לסטודנטים בעמוד הבית' : 'מוסתר כרגע מעמוד הבית (כבוי)'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/new-year')}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>לצפייה בעמוד</span>
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={toggleNewYearBanner}
            disabled={togglingBanner}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              border: 'none',
              background: showNewYearBanner ? '#e74c3c' : '#27ae60',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: showNewYearBanner ? '0 4px 14px rgba(231, 76, 60, 0.3)' : '0 4px 14px rgba(39, 174, 96, 0.3)'
            }}
          >
            {showNewYearBanner ? 'הסרה ממסך הבית' : 'הצגה במסך הבית'}
          </button>
        </div>

        {/* Live Popcorn & New Year Analytics Grid */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          marginTop: '0.5rem',
          paddingTop: '0.85rem',
          borderTop: '1px dashed rgba(242, 101, 34, 0.25)'
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            padding: '0.65rem 0.85rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f26522' }}>
              {newYearStats.qr_scans}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              🍿 סריקות מהפופקורן
            </div>
          </div>

          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            padding: '0.65rem 0.85rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>
              {newYearStats.home_clicks}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              🏠 כניסות מעמוד הבית
            </div>
          </div>

          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            padding: '0.65rem 0.85rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#e65c00' }}>
              {newYearStats.scholarship_clicks}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              🎓 התעניינו במלגה
            </div>
          </div>

          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            padding: '0.65rem 0.85rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#128c7e' }}>
              {newYearStats.whatsapp_clicks}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              💬 לחצו לעדכונים
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="section-title">פעולות מהירות</h2>
      <div className="quick-actions">
        {cards.map((c, i) => (
          <motion.button
            key={i}
            className="action-card glass"
            whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.1)' }}
            onClick={c.action}
          >
            <div className="action-icon" style={{ background: `${c.color}15`, color: c.color }}>{c.icon}</div>
            <div className="action-text">
              <strong>{c.label}</strong>
              <span>{c.desc}</span>
            </div>
            <ChevronLeft size={20} style={{ color: c.color, marginRight: 'auto' }} />
          </motion.button>
        ))}
      </div>

      {/* Events List */}
      <div className="events-list-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            {showArchived ? 'אירועים בארכיון' : 'אירועים פעילים'}
          </h2>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.85rem' }}
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'הצג פעילים' : `ארכיון (${archivedEvents.length})`}
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>טוען...</p>
        ) : displayed.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            {showArchived ? 'אין אירועים בארכיון.' : 'אין אירועים פעילים. צור אירוע חדש!'}
          </p>
        ) : (
          <div className="events-admin-list glass">
            {displayed.map(ev => (
              <div
                key={ev.id}
                className="event-admin-row"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/admin/events/${ev.id}/registrants`)}
                title="לחץ לניהול האירוע"
              >
                <div className="event-admin-info">
                  <span className="event-admin-date">
                    {(() => {
                      if (!ev.event_date) return 'ללא תאריך';
                      const { gregorian, hebrewDate } = formatHebrewDate(ev.event_date);
                      return hebrewDate ? `${gregorian} | ${hebrewDate}` : gregorian;
                    })()}
                  </span>
                  <div>
                    <strong>{ev.title}</strong>
                    <span className="event-admin-cat">{ev.category}</span>
                  </div>
                </div>
                <div className="event-admin-actions" onClick={e => e.stopPropagation()}>
                  <span className="reg-count-badge">
                    <Users size={13} /> {regCounts[ev.id] || 0} נרשמו
                  </span>
                  <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }} onClick={() => navigate(`/admin/events/${ev.id}/registrants`)}>
                    נרשמים
                  </button>
                  <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }} onClick={() => navigate(`/admin/events/edit/${ev.id}`)}>
                    <Edit size={14} /> עריכה
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
