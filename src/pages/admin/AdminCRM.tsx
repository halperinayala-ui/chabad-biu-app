import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search, UserCircle, Loader2, Bell, Star, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './AdminCRM.css';

interface StudentSummary {
  id: string;
  full_name: string;
  phone: string;
  gender: string;
  heb_birthday?: string;
  user_status?: string;
  study_field?: string;
  degree_type?: string;
  status_detail?: string;
  is_admin: boolean;
  is_vip: boolean;
  is_blocked: boolean;
  total_registrations: number;
  attended_count: number;
  absent_count: number;
  last_event: string;
  has_push: boolean;
}

const AdminCRM = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'activity'>('activity');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // Fetch all profiles that have at least one registration
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id, full_name, phone, gender, heb_birthday, user_status, study_field, degree_type, status_detail, is_admin, is_vip, is_blocked,
          registrations (
            id, attended, created_at,
            events (title, event_date)
          )
        `)
        .not('registrations', 'is', null);

      if (error) throw error;

      // Fetch push subscriptions
      const { data: pushSubs } = await supabase.from('push_subscriptions').select('user_id');
      const pushUserIds = new Set(pushSubs?.map(p => p.user_id) || []);

      const summary: StudentSummary[] = (profiles || [])
        .filter((p: any) => p.registrations?.length > 0)
        .map((p: any) => {
          const regs = p.registrations || [];
          const attended = regs.filter((r: any) => r.attended === true).length;
          const absent = regs.filter((r: any) => r.attended === false).length;
          const sorted = [...regs].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          return {
            id: p.id,
            full_name: p.full_name || 'לא צוין',
            phone: p.phone || '—',
            gender: p.gender || 'm',
            heb_birthday: p.heb_birthday || undefined,
            user_status: p.user_status,
            study_field: p.study_field,
            degree_type: p.degree_type,
            status_detail: p.status_detail,
            is_admin: p.is_admin || false,
            is_vip: p.is_vip || false,
            is_blocked: p.is_blocked || false,
            total_registrations: regs.length,
            attended_count: attended,
            absent_count: absent,
            last_event: sorted[0]?.events?.title || '—',
            has_push: pushUserIds.has(p.id)
          };
        });

      setStudents(summary);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = students
    .filter(s => s.full_name.includes(search) || s.phone.includes(search))
    .sort((a, b) => sortBy === 'activity' ? b.total_registrations - a.total_registrations : a.full_name.localeCompare(b.full_name, 'he'));

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><Loader2 className="spinner" size={40} style={{ color: 'var(--primary)' }} /></div>;

  return (
    <motion.div className="admin-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="admin-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowRight size={20} /> חזרה
        </button>
        <h1 style={{ margin: 0 }}>CRM · ניהול סטודנטים</h1>
      </div>

      <div className="crm-toolbar glass">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="חיפוש לפי שם או טלפון..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingRight: '2.5rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${sortBy === 'activity' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSortBy('activity')} style={{ fontSize: '0.85rem' }}>לפי פעילות</button>
          <button className={`btn ${sortBy === 'name' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSortBy('name')} style={{ fontSize: '0.85rem' }}>לפי שם</button>
        </div>
      </div>

      <div className="crm-stats-row">
        <div className="stat-card glass"><div className="stat-value">{students.length}</div><div className="stat-label">סך סטודנטים</div></div>
        <div className="stat-card glass"><div className="stat-value" style={{ color: '#2ecc71' }}>{students.reduce((s, st) => s + st.attended_count, 0)}</div><div className="stat-label">סה"כ הגעות מאומתות</div></div>
        <div className="stat-card glass"><div className="stat-value" style={{ color: 'var(--primary)' }}>{students.reduce((s, st) => s + st.total_registrations, 0)}</div><div className="stat-label">סה"כ הרשמות</div></div>
      </div>

      <div className="crm-grid">
        {filtered.map(student => {
          const attendRate = student.total_registrations > 0
            ? Math.round((student.attended_count / student.total_registrations) * 100)
            : null;
          return (
            <motion.div
              key={student.id}
              className="student-card glass"
              whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(73,38,145,0.12)' }}
              onClick={() => navigate(`/admin/crm/${student.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="student-card-header">
                <div className="student-avatar" style={{ background: student.gender === 'f' ? 'linear-gradient(135deg, #e91e8c, #ff6b6b)' : 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                  {student.full_name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {student.full_name}
                    {student.has_push && <Bell size={14} color="#f39c12" fill="#f39c12" title="התראות פוש מופעלות" />}
                    {student.is_vip && <Star size={14} color="#f39c12" fill="#f39c12" title="משתמש VIP" />}
                    {student.is_blocked && <Ban size={14} color="#e74c3c" title="משתמש חסום (חסימה שקטה)" />}
                    {student.is_admin && <span style={{ fontSize: '0.7rem', background: '#34495e', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>מנהל</span>}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }} dir="ltr">{student.phone}</p>
                    
                    {/* User Status Badge */}
                    {student.user_status && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(41, 128, 185, 0.1)', color: '#2980b9', padding: '0.15rem 0.4rem', borderRadius: '10px', fontWeight: 600 }}>
                        {student.user_status === 'student' ? '🎓 סטודנט' : student.user_status === 'graduate' ? '💼 בוגר' : '👤 אחר'}
                        {student.user_status === 'student' && student.study_field ? ` - ${student.study_field}` : ''}
                        {student.user_status === 'other' && student.status_detail ? ` - ${student.status_detail}` : ''}
                      </span>
                    )}

                    {student.heb_birthday && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(73, 38, 145, 0.08)', color: 'var(--primary)', padding: '0.15rem 0.4rem', borderRadius: '10px', fontWeight: 600 }}>🎂 {student.heb_birthday}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="student-card-stats">
                <div className="mini-stat">
                  <span className="mini-stat-value" style={{ color: 'var(--primary)' }}>{student.total_registrations}</span>
                  <span className="mini-stat-label">הרשמות</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-stat-value" style={{ color: '#2ecc71' }}>{student.attended_count}</span>
                  <span className="mini-stat-label">הגעות</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-stat-value">{attendRate !== null ? `${attendRate}%` : '—'}</span>
                  <span className="mini-stat-label">אחוז הגעה</span>
                </div>
              </div>

              {attendRate !== null && (
                <div style={{ height: '6px', background: '#eee', borderRadius: '10px', overflow: 'hidden', margin: '0.75rem 0' }}>
                  <div style={{ height: '100%', width: `${attendRate}%`, background: attendRate > 70 ? '#2ecc71' : attendRate > 40 ? '#f39c12' : '#e74c3c', borderRadius: '10px', transition: 'width 0.8s ease' }} />
                </div>
              )}

              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                אירוע אחרון: <strong>{student.last_event}</strong>
              </p>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <UserCircle size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
            <h3>לא נמצאו סטודנטים</h3>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminCRM;
