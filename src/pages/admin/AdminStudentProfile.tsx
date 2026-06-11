import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, CheckCircle2, XCircle, Clock, MessageCircle, Bell, Star, Ban, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './AdminCRM.css';

const AdminStudentProfile = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPush, setHasPush] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', studentId).single();
      setProfile(p);
      setAdminNotes(p?.admin_notes || '');

      const { data: regs } = await supabase
        .from('registrations')
        .select('*, events(title, event_date, category)')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false });

      setRegistrations(regs || []);

      const { data: pushData } = await supabase.from('push_subscriptions').select('id').eq('user_id', studentId);
      setHasPush(pushData && pushData.length > 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><Loader2 className="spinner" size={40} style={{ color: 'var(--primary)' }} /></div>;
  if (!profile) return <div style={{ textAlign: 'center', padding: '5rem' }}>סטודנט לא נמצא</div>;

  const attended = registrations.filter(r => r.attended === true).length;
  const absent = registrations.filter(r => r.attended === false).length;
  const rate = registrations.length > 0 ? Math.round((attended / registrations.length) * 100) : null;

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const { error } = await supabase.from('profiles').update({ admin_notes: adminNotes }).eq('id', studentId);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to save notes', err);
      alert('שגיאה בשמירת ההערות');
    } finally {
      setSavingNotes(false);
    }
  };

  const toggleVip = async () => {
    try {
      const newStatus = !profile.is_vip;
      const { error } = await supabase.from('profiles').update({ is_vip: newStatus }).eq('id', studentId);
      if (error) throw error;
      setProfile({ ...profile, is_vip: newStatus });
    } catch (err) {
      alert('שגיאה בעדכון סטטוס VIP');
    }
  };

  const toggleBlock = async () => {
    if (!profile.is_blocked && !window.confirm("לחסום משתמש זה? הוא לא יוכל לראות אירועים ופוסטים (חסימה שקטה).")) return;
    try {
      const newStatus = !profile.is_blocked;
      const { error } = await supabase.from('profiles').update({ is_blocked: newStatus }).eq('id', studentId);
      if (error) throw error;
      setProfile({ ...profile, is_blocked: newStatus });
    } catch (err) {
      alert('שגיאה בעדכון סטטוס חסימה');
    }
  };

  const phone = (profile.phone || '').replace(/-/g, '').replace(/^0/, '972');
  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(`היי ${profile.full_name}!`)}`;

  // The last item in the array is the oldest registration since it's sorted descending
  const firstEventDate = registrations.length > 0 ? new Date(registrations[registrations.length - 1].created_at).toLocaleDateString('he-IL') : null;

  return (
    <motion.div className="admin-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="admin-header">
        <button className="back-btn" onClick={() => navigate('/admin/crm')}>
          <ArrowRight size={20} /> חזרה ל-CRM
        </button>
      </div>

      <div className="crm-grid" style={{ gridTemplateColumns: '340px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Profile Card */}
        <div className="student-card glass" style={{ cursor: 'default' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="student-avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto 1rem', background: profile.gender === 'f' ? 'linear-gradient(135deg, #e91e8c, #ff6b6b)' : 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
              {(profile.full_name || '?').charAt(0)}
            </div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {profile.full_name || 'לא צוין'}
              {hasPush && <Bell size={18} color="#f39c12" fill="#f39c12" title="התראות פוש מופעלות" />}
            </h2>
            <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }} dir="ltr">{profile.phone || '—'}</p>
            {profile.heb_birthday && (
              <p style={{ margin: '0.5rem 0 0', color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 600 }}>🎂 יום הולדת עברי: {profile.heb_birthday}</p>
            )}
            {firstEventDate && (
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>📅 הצטרף/ה ב: {firstEventDate}</p>
            )}
          </div>

          <div className="student-card-stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="mini-stat"><span className="mini-stat-value" style={{ color: 'var(--primary)' }}>{registrations.length}</span><span className="mini-stat-label">הרשמות</span></div>
            <div className="mini-stat"><span className="mini-stat-value" style={{ color: '#2ecc71' }}>{attended}</span><span className="mini-stat-label">הגעות</span></div>
            <div className="mini-stat"><span className="mini-stat-value" style={{ color: '#e74c3c' }}>{absent}</span><span className="mini-stat-label">לא הגיע/ה</span></div>
            <div className="mini-stat"><span className="mini-stat-value">{rate !== null ? `${rate}%` : '—'}</span><span className="mini-stat-label">אחוז הגעה</span></div>
          </div>

          {rate !== null && (
            <div style={{ height: '8px', background: '#eee', borderRadius: '10px', overflow: 'hidden', margin: '1rem 0' }}>
              <div style={{ height: '100%', width: `${rate}%`, background: rate > 70 ? '#2ecc71' : rate > 40 ? '#f39c12' : '#e74c3c', borderRadius: '10px' }} />
            </div>
          )}

          {profile.phone && (
            <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', textDecoration: 'none' }}>
              <MessageCircle size={18} /> שלח/י הודעה בוואטסאפ
            </a>
          )}

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>📝 פתק מנהלים אישי</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>הערות אלו גלויות למנהלים בלבד.</p>
            <textarea
              className="form-control"
              rows={4}
              placeholder="רגישויות, התנדבויות, דברים שחשוב לזכור..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              style={{ resize: 'vertical', width: '100%', marginBottom: '0.5rem' }}
            />
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              onClick={handleSaveNotes}
              disabled={savingNotes || adminNotes === profile.admin_notes}
            >
              {savingNotes ? <Loader2 size={18} className="spinner" /> : <CheckCircle2 size={18} />}
              שמור הערות
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0', color: 'var(--text-primary)' }}><ShieldAlert size={18} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.3rem' }}/> פעולות ניהול מתקדמות</h3>
            
            <button 
              onClick={toggleVip}
              className="btn btn-outline"
              style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '0.5rem',
                borderColor: profile.is_vip ? '#f39c12' : undefined,
                color: profile.is_vip ? '#f39c12' : undefined,
                background: profile.is_vip ? 'rgba(243, 156, 18, 0.1)' : undefined
              }}
            >
              <Star size={18} fill={profile.is_vip ? '#f39c12' : 'none'} />
              {profile.is_vip ? 'בטל סטטוס VIP' : 'סמן כ-VIP'}
            </button>

            <button 
              onClick={toggleBlock}
              className="btn btn-outline"
              style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '0.5rem',
                borderColor: profile.is_blocked ? '#e74c3c' : undefined,
                color: profile.is_blocked ? '#e74c3c' : '#e74c3c',
                background: profile.is_blocked ? 'rgba(231, 76, 60, 0.1)' : undefined
              }}
            >
              <Ban size={18} />
              {profile.is_blocked ? 'שחרר חסימה שקטה' : 'חסום משתמש (שקט)'}
            </button>
          </div>
        </div>

        {/* Events History */}
        <div>
          <h2 style={{ marginBottom: '1rem' }}>היסטוריית השתתפות</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {registrations.map(reg => (
              <div key={reg.id} className="glass" style={{ padding: '1rem 1.5rem', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRight: `4px solid ${reg.attended === true ? '#2ecc71' : reg.attended === false ? '#e74c3c' : '#ddd'}` }}>
                <div>
                  <strong>{reg.events?.title || '—'}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {reg.events?.event_date?.split('-').reverse().join('.')} · {reg.events?.category}
                  </div>
                  {reg.answers && Object.keys(reg.answers).length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {Object.entries(reg.answers).map(([k, v]) => (
                        <span key={k} style={{ fontSize: '0.75rem', background: 'rgba(73,38,145,0.08)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: '10px' }} title={k}>{String(v)}</span>
                      ))}
                    </div>
                  )}
                  {reg.admin_note && <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>📝 {reg.admin_note}</div>}
                </div>
                <div style={{ textAlign: 'center', minWidth: '80px' }}>
                  {reg.attended === true && <><CheckCircle2 size={28} style={{ color: '#2ecc71', display: 'block', margin: '0 auto 4px' }} /><span style={{ fontSize: '0.75rem', color: '#2ecc71', fontWeight: '700' }}>הגיע/ה</span></>}
                  {reg.attended === false && <><XCircle size={28} style={{ color: '#e74c3c', display: 'block', margin: '0 auto 4px' }} /><span style={{ fontSize: '0.75rem', color: '#e74c3c', fontWeight: '700' }}>לא הגיע/ה</span></>}
                  {reg.attended === null && <><Clock size={28} style={{ color: '#bbb', display: 'block', margin: '0 auto 4px' }} /><span style={{ fontSize: '0.75rem', color: '#bbb' }}>לא סומן</span></>}
                  <div style={{ marginTop: '4px' }}>
                    <span className={`status-badge status-${reg.status}`} style={{ fontSize: '0.7rem' }}>{reg.status}</span>
                  </div>
                </div>
              </div>
            ))}
            {registrations.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>אין היסטוריית השתתפות עדיין.</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminStudentProfile;
