import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus, Trash2, ArrowRight, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './AdminSettings.css';

const AdminSettings = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [waTemplateApproved, setWaTemplateApproved] = useState('היי {name}! ההרשמה שלך לאירוע {event} אושרה בהצלחה! מחכים לראותך! צוות חב"ד בקמפוס');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementExpiresAt, setAnnouncementExpiresAt] = useState('');
  const [sendPush, setSendPush] = useState(false);

  useEffect(() => {
    // Basic protection
    if (profile && !profile.is_admin) {
      navigate('/');
      return;
    }
    fetchSettings();
  }, [profile, navigate]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // ignore no rows error if missing

      if (data) {
        setCategories(data.categories || []);
        setTags(data.tags || []);
        if (data.wa_template_approved) setWaTemplateApproved(data.wa_template_approved);
        if (data.announcement_text) setAnnouncementText(data.announcement_text);
        
        // Convert ISO string to format suitable for datetime-local input
        if (data.announcement_expires_at) {
          const date = new Date(data.announcement_expires_at);
          date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
          setAnnouncementExpiresAt(date.toISOString().slice(0, 16));
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          id: 1, 
          categories, 
          tags, 
          wa_template_approved: waTemplateApproved,
          announcement_text: announcementText,
          announcement_expires_at: announcementExpiresAt ? new Date(announcementExpiresAt).toISOString() : null,
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;
      toast.success('ההגדרות נשמרו בהצלחה!');

      // Send push notification if requested
      if (sendPush && announcementText) {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (token) {
          fetch('/api/notify-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              title: 'הודעה חשובה 📢',
              body: announcementText,
              url: window.location.origin
            })
          }).catch(e => console.error("Push failed", e));
          toast.success('הודעת פוש נשלחה!');
          setSendPush(false); // Reset checkbox
        }
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast.error('שגיאה בשמירת הגדרות: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) return;
    setCategories([...categories, newCategory.trim()]);
    setNewCategory('');
  };

  const removeCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags([...tags, newTag.trim()]);
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><Loader2 className="spinner" size={40} /></div>;

  return (
    <motion.div className="admin-settings-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="admin-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowRight size={20} />
          <span>חזרה</span>
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />} 
            <span>שמירת הגדרות</span>
          </button>
        </div>
      </div>

      <div className="settings-container glass">
        <div className="settings-title">
          <Settings size={28} style={{ color: 'var(--primary)' }} />
          <h2>הגדרות מערכת</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          כאן תוכלו לנהל את רשימות הבחירה שיופיעו לשאר המנהלים בעת הקמת אירוע, ואת סינוני עמוד הבית.
        </p>

        <div className="settings-grid">
          {/* Categories Management */}
          <div className="settings-section">
            <h3>קטגוריות אירועים</h3>
            <p className="settings-desc">הקטגוריות יופיעו ככפתורי סינון עליונים בעמוד הבית.</p>
            
            <div className="add-item-bar">
              <input 
                type="text" 
                className="form-control" 
                placeholder="הוספת קטגוריה חדשה..." 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <button className="btn btn-secondary" onClick={addCategory}>
                <Plus size={18} />
              </button>
            </div>

            <ul className="items-list">
              {categories.map((cat, i) => (
                <li key={i} className="item-row">
                  <span>{cat}</span>
                  <button className="icon-btn delete-btn" onClick={() => removeCategory(cat)}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
              {categories.length === 0 && <li className="empty-state">אין קטגוריות. הוסף אחת למעלה.</li>}
            </ul>
          </div>

          {/* Tags Management */}
          <div className="settings-section">
            <h3>תגיות חכמות</h3>
            <p className="settings-desc">תגיות יאפשרו לכם לסמן מאפיינים מיוחדים על אירועים.</p>
            
            <div className="add-item-bar">
              <input 
                type="text" 
                className="form-control" 
                placeholder="הוספת תגית חדשה..." 
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <button className="btn btn-secondary" onClick={addTag}>
                <Plus size={18} />
              </button>
            </div>

            <div className="tags-preview-list">
              {tags.map((tag, i) => (
                <div key={i} className="tag-pill">
                  <span>{tag}</span>
                  <button onClick={() => removeTag(tag)}><Trash2 size={14} /></button>
                </div>
              ))}
              {tags.length === 0 && <div className="empty-state">אין תגיות. הוסף אחת למעלה.</div>}
            </div>
          </div>
        </div>

        {/* WhatsApp Templates Management */}
        <div className="settings-section" style={{ marginTop: '2rem' }}>
          <h3>תבניות הודעות בוואטסאפ</h3>
          <p className="settings-desc">כאן תוכלו לערוך את נוסח ההודעה שתישלח כשאתם לוחצים על אייקון הוואטסאפ בטבלת הנרשמים.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              תבנית להודעת "אישור הרשמה" (השתמשו ב- <code style={{color:'var(--primary)'}}>{"{name}"}</code> לשם הסטודנט וב- <code style={{color:'var(--primary)'}}>{"{event}"}</code> לשם האירוע)
            </label>
            <textarea
              className="form-control"
              rows={4}
              value={waTemplateApproved}
              onChange={(e) => setWaTemplateApproved(e.target.value)}
              style={{ resize: 'vertical' }}
              placeholder='היי {name}! רצינו לעדכן שההרשמה שלך לאירוע {event} אושרה!...'
            />
          </div>
        </div>

        {/* Announcements Management */}
        <div className="settings-section" style={{ marginTop: '2rem', border: '1px solid var(--primary)', background: 'rgba(73, 38, 145, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3>הודעות כלליות בעמוד הבית 📢</h3>
            <button 
              className="btn btn-outline" 
              onClick={() => { setAnnouncementText(''); setAnnouncementExpiresAt(''); }}
              style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
            >
              נקה הודעה
            </button>
          </div>
          <p className="settings-desc">הודעה זו תוצג בולטת בעמוד הבית עד תאריך ושעת התפוגה שתגדירו.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>
                תוכן ההודעה
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                style={{ resize: 'vertical' }}
                placeholder="למשל: שימו לב, השיעור של יום שלישי השבוע בוטל."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>
                  תאריך ושעת תפוגה (מתי ההודעה תיעלם)
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={announcementExpiresAt}
                  onChange={(e) => setAnnouncementExpiresAt(e.target.value)}
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
                <label htmlFor="sendPushCheckbox" style={{ fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  שלח גם כהתראת פוש (Push)
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSettings;
