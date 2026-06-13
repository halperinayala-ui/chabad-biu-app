import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ArrowRight, Loader2, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  text: string;
  emoji: string;
  expires_at: string;
  created_at: string;
}

const AdminAnnouncements = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('💜');
  const [expiresAt, setExpiresAt] = useState('');
  const [sendPush, setSendPush] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !profile.is_admin) {
      navigate('/');
      return;
    }
    fetchAnnouncements();
  }, [profile, navigate]);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('expires_at', { ascending: false });

      if (error && error.code !== '42P01') throw error; // Ignore relation does not exist yet error
      setAnnouncements(data || []);
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
      if (err.code !== '42P01') toast.error('שגיאה בטעינת הודעות');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!text.trim() || !expiresAt) {
      toast.error('יש להזין תוכן ותאריך תפוגה');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        text: text.trim(),
        emoji: emoji || '💜',
        expires_at: new Date(expiresAt).toISOString()
      };

      if (editingId) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('ההודעה עודכנה בהצלחה!');
      } else {
        const { error } = await supabase.from('announcements').insert(payload);
        if (error) throw error;
        toast.success('ההודעה פורסמה בהצלחה!');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchAnnouncements();

      if (sendPush) {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (token) {
          fetch('/api/notify-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              title: `עדכון: ${emoji || '📢'}`,
              body: text.trim(),
              url: window.location.origin
            })
          }).catch(e => console.error("Push failed", e));
          toast.success('הודעת פוש נשלחה!');
        }
      }
    } catch (err: any) {
      console.error('Error saving announcement:', err);
      toast.error('שגיאה בשמירת הודעה: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('האם את בטוחה שברצונך למחוק הודעה זו?')) return;
    
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      toast.success('ההודעה נמחקה');
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (err: any) {
      toast.error('שגיאה במחיקה: ' + err.message);
    }
  };

  const handleEdit = (ann: Announcement) => {
    setText(ann.text);
    setEmoji(ann.emoji);
    
    // Format date for datetime-local input
    const date = new Date(ann.expires_at);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    setExpiresAt(date.toISOString().slice(0, 16));
    
    setEditingId(ann.id);
    setSendPush(false);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setText('');
    setEmoji('💜');
    setExpiresAt('');
    setSendPush(false);
    setEditingId(null);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><Loader2 className="spinner" size={40} /></div>;

  const activeAnnouncements = announcements.filter(a => new Date(a.expires_at) > new Date());
  const expiredAnnouncements = announcements.filter(a => new Date(a.expires_at) <= new Date());

  return (
    <motion.div className="admin-settings-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="admin-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowRight size={20} />
          <span>חזרה</span>
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus size={18} />
            <span>הודעה חדשה</span>
          </button>
        </div>
      </div>

      <div className="settings-container glass">
        <div className="settings-title">
          <Megaphone size={28} style={{ color: 'var(--primary)' }} />
          <h2>ניהול הודעות כלליות</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          כאן תוכלו לפרסם הודעות שיופיעו באופן בולט בעמוד הבית עד לתאריך התפוגה שתגדירו.
        </p>

        {isModalOpen && (
          <div style={{
            background: 'var(--bg-color)',
            border: '2px solid var(--primary)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              {editingId ? 'עריכת הודעה' : 'פרסום הודעה חדשה'}
            </h3>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ width: '80px', flexShrink: 0 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>אייקון</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={emoji} 
                  onChange={e => setEmoji(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.2rem', padding: '0.5rem' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>תוכן ההודעה</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  style={{ resize: 'vertical' }}
                  placeholder="למשל: שימו לב, השיעור של יום שלישי השבוע בוטל."
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>תאריך ושעת תפוגה (מתי ההודעה תיעלם)</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="sendPushCheckbox" 
                  checked={sendPush} 
                  onChange={(e) => setSendPush(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="sendPushCheckbox" style={{ fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
                  שלח גם כהתראת פוש
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={saving}>ביטול</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="spinner" size={18} /> : (editingId ? 'שמור שינויים' : 'פרסם הודעה')}
              </button>
            </div>
          </div>
        )}

        <h3 style={{ marginBottom: '1rem' }}>הודעות פעילות כרגע ({activeAnnouncements.length})</h3>
        {activeAnnouncements.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>אין הודעות פעילות.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {activeAnnouncements.map(ann => (
              <div key={ann.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(39, 174, 96, 0.05)', border: '1px solid rgba(39, 174, 96, 0.2)', padding: '1rem', borderRadius: '12px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '2rem' }}>{ann.emoji}</div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>{ann.text}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    פג תוקף: {new Date(ann.expires_at).toLocaleString('he-IL')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="icon-btn" onClick={() => handleEdit(ann)} title="ערוך הודעה">
                    <Edit size={18} />
                  </button>
                  <button className="icon-btn delete-btn" onClick={() => handleDelete(ann.id)} title="מחק הודעה">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 style={{ marginBottom: '1rem' }}>הודעות שפג תוקפן</h3>
        {expiredAnnouncements.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>אין היסטוריית הודעות.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {expiredAnnouncements.map(ann => (
              <div key={ann.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '12px', opacity: 0.7, flexWrap: 'wrap' }}>
                <div style={{ fontSize: '2rem', filter: 'grayscale(1)' }}>{ann.emoji}</div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <p style={{ margin: 0 }}>{ann.text}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    פג תוקף ב: {new Date(ann.expires_at).toLocaleString('he-IL')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="icon-btn" onClick={() => handleEdit(ann)} title="שכפל / ערוך הודעה">
                    <Edit size={18} />
                  </button>
                  <button className="icon-btn delete-btn" onClick={() => handleDelete(ann.id)} title="מחק הודעה">
                    <Trash2 size={18} />
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

export default AdminAnnouncements;
