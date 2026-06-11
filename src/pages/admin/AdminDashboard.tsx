import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Users, Settings, BarChart2, Archive, CalendarDays, ChevronLeft, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
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

      const { data: evs } = await supabase
        .from('events')
        .select('id, title, event_date, category, registration_mode, archived')
        .order('event_date', { ascending: false });

      setEvents(evs || []);

      // Fetch registration counts per event
      const { data: regs } = await supabase
        .from('registrations')
        .select('event_id');

      const counts: Record<string, number> = {};
      (regs || []).forEach((r: any) => {
        counts[r.event_id] = (counts[r.event_id] || 0) + 1;
      });
      setRegCounts(counts);
    } finally {
      setLoading(false);
    }
  };

  const activeEvents = events.filter(e => !e.archived);
  const archivedEvents = events.filter(e => e.archived);
  const totalRegs = Object.values(regCounts).reduce((a, b) => a + b, 0);

  const displayed = showArchived ? archivedEvents : activeEvents;

  const cards = [
    { icon: <Plus size={28} />, label: 'אירוע חדש', desc: 'הקמת אירוע חדש עם טופס הרשמה', color: '#492691', action: () => navigate('/admin/events/new') },
    { icon: <Users size={28} />, label: 'CRM סטודנטים', desc: 'צפייה בפרופילים, היסטוריית השתתפות', color: '#e91e8c', action: () => navigate('/admin/crm') },
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
                  <span className="event-admin-date">{ev.event_date ? ev.event_date.split('-').reverse().join('.') : 'ללא תאריך'}</span>
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
