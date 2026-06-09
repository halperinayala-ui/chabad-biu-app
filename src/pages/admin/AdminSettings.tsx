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
        .upsert({ id: 1, categories, tags, updated_at: new Date().toISOString() });

      if (error) throw error;
      toast.success('ההגדרות נשמרו בהצלחה!');
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
      </div>
    </motion.div>
  );
};

export default AdminSettings;
