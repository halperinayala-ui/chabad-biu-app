import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Plus, Trash2, Image as ImageIcon, Save, Loader2, X, Tag } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import './AdminEventEditor.css';

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string;
}

const AdminEventEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // If id exists, we are in Edit mode
  const isEditMode = Boolean(id);
  
  // Dynamic Configuration from Settings
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Event Basic Info State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [maxRegistrants, setMaxRegistrants] = useState('');
  const [closedMessage, setClosedMessage] = useState('ההרשמה לאירוע זה נסגרה. נשמח לראותכם בפעמים הבאות!');
  
  // Tags, RSVP, Images
  const [tags, setTags] = useState<string[]>([]);
  const [registrationMode, setRegistrationMode] = useState('form'); 
  const [headerImage, setHeaderImage] = useState<File | null>(null);
  const [flyerImage, setFlyerImage] = useState<File | null>(null);
  
  // Existing image URLs (for edit mode)
  const [existingHeaderUrl, setExistingHeaderUrl] = useState<string | null>(null);
  const [existingFlyerUrl, setExistingFlyerUrl] = useState<string | null>(null);
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [registrationStart, setRegistrationStart] = useState('');
  const [audience, setAudience] = useState<string[]>([]); // [] means everyone; e.g. ['student','graduate']
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [otherDetails, setOtherDetails] = useState<string[]>([]); // unique 'other' status_detail values from profiles

  const [saving, setSaving] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [savingToSettings, setSavingToSettings] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<Record<string, any>>({});

  useEffect(() => {
    const raw = localStorage.getItem('event_templates_v2');
    if (raw) setSavedTemplates(JSON.parse(raw));
  }, []);

  // Dynamic Form State
  const [fields, setFields] = useState<FormField[]>([
    { id: '1', label: 'שם מלא', type: 'text', required: true },
    { id: '2', label: 'טלפון', type: 'tel', required: true }
  ]);

  const headerInputRef = useRef<HTMLInputElement>(null);
  const flyerInputRef = useRef<HTMLInputElement>(null);

  // Initialize data
  useEffect(() => {
    fetchSettings();
    if (isEditMode) {
      fetchEventToEdit();
    }
  }, [id]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (!error && data) {
        setAvailableCategories(data.categories || []);
        setAvailableTags(data.tags || []);
      }
      // Fetch unique 'other' status details from profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('status_detail')
        .eq('user_status', 'other')
        .not('status_detail', 'is', null);
      if (profilesData) {
        const unique = [...new Set(profilesData.map((p: any) => p.status_detail).filter(Boolean))];
        setOtherDetails(unique as string[]);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchEventToEdit = async () => {
    try {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setTitle(data.title);
        setCategory(data.category);
        setEventDate(data.event_date);
        setEventTime(data.event_time);
        setLocation(data.location || '');
        setDescription(data.description || '');
        setRequiresApproval(data.requires_approval);
        setMaxRegistrants(data.max_registrants?.toString() || '');
        setClosedMessage(data.closed_message || '');
        setTags(data.tags || []);
        setRegistrationMode(data.registration_mode || 'form');
        setExistingHeaderUrl(data.header_image_url);
        setExistingFlyerUrl(data.flyer_image_url);
        setRegistrationDeadline(data.registration_deadline ? new Date(new Date(data.registration_deadline).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
        setRegistrationStart(data.registration_start ? new Date(new Date(data.registration_start).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
        setAudience(data.audience || []);
        setIsFeatured(data.is_featured || false);
        if (data.form_config && data.form_config.length > 0) {
          setFields(data.form_config);
        }
      }
    } catch (err) {
      console.error('Error fetching event to edit:', err);
      alert('שגיאה בטעינת נתוני האירוע.');
      navigate('/admin/events/new');
    }
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const uploadImage = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('events').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('events').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!title || !eventDate || !eventTime) {
      toast.error('נא למלא את כל שדות החובה: שם האירוע, תאריך ושעה.');
      return;
    }

    setSaving(true);
    try {
      let finalHeaderUrl = existingHeaderUrl;
      let finalFlyerUrl = existingFlyerUrl;

      // Upload new images if selected (overrides existing)
      if (headerImage) {
        finalHeaderUrl = await uploadImage(headerImage, 'headers');
      }
      if (flyerImage) {
        finalFlyerUrl = await uploadImage(flyerImage, 'flyers');
      }

      const payload: any = {
        title,
        category: category,
        event_date: eventDate,
        event_time: eventTime,
        location,
        description,
        requires_approval: requiresApproval,
        max_registrants: maxRegistrants ? parseInt(maxRegistrants) : null,
        registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
        registration_start: registrationStart ? new Date(registrationStart).toISOString() : null,
        closed_message: closedMessage,
        tags,
        header_image_url: finalHeaderUrl,
        flyer_image_url: finalFlyerUrl,
        registration_mode: registrationMode,
        form_config: registrationMode === 'form' ? fields : [],
        audience: audience,  // TEXT[] array, empty = everyone
        is_featured: isFeatured,
      };

      if (isEditMode) {
        const { error } = await supabase.from('events').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('האירוע עודכן בהצלחה!');
      } else {
        const { error, data } = await supabase.from('events').insert(payload).select().single();
        if (error) throw error;
        toast.success('האירוע נוצר בהצלחה!');
        const isTestEvent = payload.title.toLowerCase().includes('test') || payload.title.includes('בדיקה');

        if (!isTestEvent) {
          // Trigger Inbox Notifications (via RPC)
          try {
            await supabase.rpc('notify_users', {
              p_title: 'אירוע חדש בקהילה!',
              p_body: `האירוע "${payload.title}" נוסף. היכנסו לפרטים!`,
              p_link: data ? `/events/${data.id}` : '/',
              p_type: 'event',
              p_audience: payload.audience || []
            });
          } catch (inboxErr) {
            console.error("Could not trigger inbox notification", inboxErr);
          }

          // Trigger Push Notification
          try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (token) {
              fetch('/api/notify-event', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  title: 'אירוע חדש בחב"ד בקמפוס!',
                  body: payload.title,
                  url: data ? `https://chabad-biu-app.vercel.app/events/${data.id}` : 'https://chabad-biu-app.vercel.app/',
                  audience: payload.audience
                })
              }).catch(e => console.error("Push notification trigger failed:", e));
            }
          } catch (pushErr) {
            console.error("Could not trigger push notification", pushErr);
          }
        }
      }
      
      navigate('/');
    } catch (err: any) {
      console.error('Error saving event:', err);
      toast.error('אירעה שגיאה בשמירת האירוע: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    setFields([...fields, { id: Date.now().toString(), label: 'שאלה חדשה', type: 'text', required: false }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, key: string, value: any) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const saveAsTemplate = () => {
    if (!templateName.trim()) { toast.error('הכניסי שם לתבנית'); return; }
    const template = { title, category, location, description, requiresApproval, maxRegistrants, closedMessage, tags, registrationMode, fields, registrationDeadline };
    const updated = { ...savedTemplates, [templateName.trim()]: template };
    localStorage.setItem('event_templates_v2', JSON.stringify(updated));
    setSavedTemplates(updated);
    setTemplateName('');
    setShowTemplateModal(false);
    toast.success(`תבנית "${templateName.trim()}" נשמרה!`);
  };

  const loadTemplate = (name: string) => {
    const t = savedTemplates[name];
    if (!t) return;
    setTitle(t.title || ''); setCategory(t.category || ''); setLocation(t.location || '');
    setDescription(t.description || ''); setRequiresApproval(t.requiresApproval || false);
    setMaxRegistrants(t.maxRegistrants || ''); setClosedMessage(t.closedMessage || '');
    setTags(t.tags || []); setRegistrationMode(t.registrationMode || 'form');
    setFields(t.fields || []); setRegistrationDeadline(t.registrationDeadline || '');
    setShowTemplateModal(false);
    toast.success(`תבנית "${name}" נטענה! עדכני תאריך ושעה ושמרי.`);
  };

  const deleteTemplate = (name: string) => {
    const updated = { ...savedTemplates };
    delete updated[name];
    localStorage.setItem('event_templates_v2', JSON.stringify(updated));
    setSavedTemplates(updated);
    toast.success(`תבנית "${name}" נמחקה.`);
  };

  const handleArchive = async () => {
    if (!id || !confirm('להעביר לארכיון? האירוע לא יופיע יותר בעמוד הבית.')) return;
    try {
      const { error } = await supabase.from('events').update({ archived: true }).eq('id', id);
      if (error) throw error;
      toast.success('האירוע הועבר לארכיון!');
      navigate('/');
    } catch (err: any) { toast.error('שגיאה: ' + err.message); }
  };

  const handleDelete = async () => {
    if (!id || !confirm('האם את בטוחה שברצונך למחוק את האירוע לגמרי? פעולה זו אינה היפכת!')) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      toast.success('האירוע נמחק לגמרי.');
      navigate('/');
    } catch (err: any) { toast.error('שגיאה: ' + err.message); }
  };

  const addCategoryToSettings = async () => {
    if (!newCategoryInput.trim()) return;
    setSavingToSettings(true);
    try {
      const updated = [...availableCategories, newCategoryInput.trim()];
      await supabase.from('settings').update({ categories: updated }).eq('id', 1);
      setAvailableCategories(updated);
      setCategory(newCategoryInput.trim());
      setNewCategoryInput('');
      toast.success('קטגוריה נוספה והוגדרה!');
    } catch { toast.error('שגיאה בשמירה'); }
    finally { setSavingToSettings(false); }
  };

  const addTagToSettings = async () => {
    if (!newTagInput.trim()) return;
    setSavingToSettings(true);
    try {
      const updated = [...availableTags, newTagInput.trim()];
      await supabase.from('settings').update({ tags: updated }).eq('id', 1);
      setAvailableTags(updated);
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
      toast.success('תגית נוספה ונבחרה!');
    } catch { toast.error('שגיאה בשמירה'); }
    finally { setSavingToSettings(false); }
  };

  if (loadingConfig && isEditMode) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><Loader2 className="spinner" size={40} /></div>;
  }

  return (
    <motion.div className="admin-editor-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Template Modal */}
      {showTemplateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '90%', maxWidth: '460px', direction: 'rtl' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>ניהול תבניות</h3>
            
            {/* Save new template */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input type="text" className="form-control" placeholder='שם התבנית, לדוגמה: "סעודת שבת"' value={templateName} onChange={e => setTemplateName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveAsTemplate()} />
              <button className="btn btn-primary" onClick={saveAsTemplate} style={{ whiteSpace: 'nowrap' }}>שמור</button>
            </div>

            {/* Existing templates */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>תבניות שמורות:</p>
              {Object.keys(savedTemplates).length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>אין תבניות שמורות עדיין.</p>}
              {Object.keys(savedTemplates).map(name => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(73,38,145,0.05)', borderRadius: '10px', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600' }}>{name}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }} onClick={() => loadTemplate(name)}>טעינה</button>
                    <button className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }} onClick={() => { setTemplateName(name); }}>שנה שם</button>
                    <button className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', color: '#e74c3c', borderColor: '#e74c3c' }} onClick={() => deleteTemplate(name)}>מחיקה</button>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-outline" onClick={() => setShowTemplateModal(false)} style={{ width: '100%' }}>סגירה</button>
          </div>
        </div>
      )}

      <div className="admin-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowRight size={20} />
          <span>חזרה</span>
        </button>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isEditMode && (
            <>
              <button className="btn btn-outline" onClick={() => navigate(`/admin/events/${id}/registrants`)}>
                צפייה בנרשמים
              </button>
              <button className="btn btn-outline" onClick={handleArchive} style={{ color: '#e67e22', borderColor: '#e67e22' }}>
                העברה לארכיון
              </button>
              <button className="btn btn-outline" onClick={handleDelete} style={{ color: '#e74c3c', borderColor: '#e74c3c' }}>
                מחיקת אירוע
              </button>
            </>
          )}
          <button className="btn btn-outline" onClick={() => setShowTemplateModal(true)} title="ניהול תבניות לשימוש חוזר">
            <Tag size={16} /> תבניות
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />} 
            <span>{saving ? 'שומר...' : (isEditMode ? 'עדכון אירוע' : 'שמירת אירוע חדש')}</span>
          </button>
        </div>
      </div>

      <div className="admin-editor-grid">
        <div className="admin-card glass">
          <h2>{isEditMode ? 'עריכת אירוע' : 'פרטי אירוע חדש'}</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>שם האירוע <span className="required-star">*</span></label>
              <input type="text" className="form-control" placeholder='לדוגמה: מסיבת חנוכה' value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>קטגוריה</label>
              {!isNewCategory && availableCategories.includes(category || '') || category === '' ? (
                <select 
                  className="form-control" 
                  value={category} 
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setIsNewCategory(true);
                      setCategory('');
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                >
                  <option value="">בחר/י קטגוריה...</option>
                  {availableCategories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                  <option value="__new__" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ קטגוריה חדשה...</option>
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-control" placeholder='הקלידי קטגוריה חדשה...' value={category} onChange={(e) => setCategory(e.target.value)} autoFocus />
                  <button type="button" className="btn btn-outline" onClick={() => { setIsNewCategory(false); setCategory(''); }} style={{ padding: '0 0.75rem' }}>ביטול</button>
                </div>
              )}
              {category && !availableCategories.includes(category) && (
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <small style={{ color: 'var(--text-secondary)' }}>קטגוריה חדשה – </small>
                  <input type="text" className="form-control" placeholder="הכניסי לרשימה הקבועה..." value={newCategoryInput} onChange={e => setNewCategoryInput(e.target.value)} style={{ flex: 1, fontSize: '0.85rem', padding: '0.3rem 0.6rem' }} />
                  <button className="btn btn-outline" style={{ padding: '0.3rem 0.7rem', fontSize: '0.85rem' }} onClick={addCategoryToSettings} disabled={savingToSettings}>
                    {savingToSettings ? <Loader2 size={14} /> : '+ הוסף'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>תאריך <span className="required-star">*</span></label>
              <input type="date" className="form-control" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>שעה <span className="required-star">*</span></label>
              <input type="time" className="form-control" value={eventTime} onChange={(e) => setEventTime(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label>מיקום</label>
            <input type="text" className="form-control" placeholder='לדוגמה: מרכז הסטודנטים' value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="form-group">
            <label>תיאור (יופיע לסטודנטים)</label>
            <textarea className="form-control" rows={4} placeholder="ספרו קצת על האירוע..." value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          </div>

          <div className="form-group tags-section">
            <label>תגיות (יופיעו על כרטיסיית האירוע)</label>
            <div className="tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {availableTags.map(tag => (
                <button 
                  key={tag}
                  className={`tag-btn ${tags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                  style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid var(--primary)', background: tags.includes(tag) ? 'var(--primary)' : 'transparent', color: tags.includes(tag) ? 'white' : 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
                >
                  {tag}
                </button>
              ))}
              {availableTags.length === 0 && <small style={{color: 'var(--text-secondary)'}}>אין תגיות – הוסיפי בהגדרות מערכת.</small>}
            </div>
            {/* Quick-add new tag */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
              <input type="text" className="form-control" placeholder="תגית חדשה..." value={newTagInput} onChange={e => setNewTagInput(e.target.value)} style={{ fontSize: '0.85rem', padding: '0.3rem 0.7rem' }} onKeyDown={e => e.key === 'Enter' && addTagToSettings()} />
              <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }} onClick={addTagToSettings} disabled={savingToSettings}>
                {savingToSettings ? <Loader2 size={14} /> : '+ הוסף תגית'}
              </button>
            </div>
          </div>

          {/* Audience Section */}
          <div className="form-group" style={{ marginTop: '1rem', background: 'rgba(39,174,96,0.04)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(39,174,96,0.15)' }}>
            <label style={{ fontSize: '1rem', color: '#27ae60', marginBottom: '0.5rem', display: 'block' }}>👥 מי יראה את האירוע?</label>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>סמנו ✓ את הקבוצות הרלוונטיות. אם לא סימנתם כלום – האירוע מוצג לכולם.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* סטודנטים */}
              <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '8px', background: audience.includes('student') ? 'rgba(39,174,96,0.12)' : 'transparent', transition: 'background 0.2s' }}>
                <input type="checkbox" checked={audience.includes('student')} onChange={e => setAudience(prev => e.target.checked ? [...prev, 'student'] : prev.filter(x => x !== 'student'))} style={{ width: '18px', height: '18px', accentColor: '#27ae60' }} />
                <div><strong>🎓 סטודנטים</strong></div>
              </label>
              {/* בוגרים */}
              <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '8px', background: audience.includes('graduate') ? 'rgba(39,174,96,0.12)' : 'transparent', transition: 'background 0.2s' }}>
                <input type="checkbox" checked={audience.includes('graduate')} onChange={e => setAudience(prev => e.target.checked ? [...prev, 'graduate'] : prev.filter(x => x !== 'graduate'))} style={{ width: '18px', height: '18px', accentColor: '#27ae60' }} />
                <div><strong>👔 בוגרים</strong></div>
              </label>
              {/* אחר */}
              <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '8px', background: audience.includes('other') ? 'rgba(39,174,96,0.12)' : 'transparent', transition: 'background 0.2s' }}>
                <input type="checkbox" checked={audience.includes('other')} onChange={e => setAudience(prev => e.target.checked ? [...prev, 'other'] : prev.filter(x => x !== 'other'))} style={{ width: '18px', height: '18px', accentColor: '#27ae60' }} />
                <div><strong>👤 אחר</strong>
                  {otherDetails.length > 0 && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{otherDetails.join(', ')}</div>}
                </div>
              </label>
              {/* VIP */}
              <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '8px', background: audience.includes('vip') ? 'rgba(39,174,96,0.12)' : 'transparent', transition: 'background 0.2s' }}>
                <input type="checkbox" checked={audience.includes('vip')} onChange={e => setAudience(prev => e.target.checked ? [...prev, 'vip'] : prev.filter(x => x !== 'vip'))} style={{ width: '18px', height: '18px', accentColor: '#27ae60' }} />
                <div><strong>⭐ VIP (קהל מסומן)</strong></div>
              </label>
            </div>
            {audience.length === 0 && (
              <p style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: '#27ae60', fontWeight: 600 }}>✅ כרגע: האירוע מוצג לכולם</p>
            )}
          </div>

          {/* Featured Event Toggle */}
          <div className="form-row" style={{ marginTop: '1.5rem', background: isFeatured ? 'rgba(221, 103, 85, 0.06)' : 'rgba(221, 103, 85, 0.03)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: `1.5px solid ${isFeatured ? 'rgba(221, 103, 85, 0.4)' : 'rgba(221, 103, 85, 0.15)'}`, transition: 'all 0.3s' }}>
            <label style={{ display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', width: '100%' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={e => setIsFeatured(e.target.checked)}
                  style={{ width: '22px', height: '22px', accentColor: 'var(--secondary)', cursor: 'pointer' }}
                />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: isFeatured ? 'var(--secondary)' : 'var(--text-primary)' }}>
                  🔥 הדגש אירוע זה
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  האירוע יופיע בצבע כתום ויבלוט בראש הרשימה
                </div>
              </div>
            </label>
          </div>

          {/* Registration Mode Section */}
          <div className="form-row" style={{ marginTop: '1.5rem', background: 'rgba(73, 38, 145, 0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(73, 38, 145, 0.1)' }}>
            <div className="form-group" style={{ width: '100%' }}>
              <label style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '1rem' }}>סוג הרשמה לאירוע</label>
              <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'column' }}>
                <label className="radio-label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="regMode" value="form" checked={registrationMode === 'form'} onChange={(e) => setRegistrationMode(e.target.value)} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                  <div>
                    <strong>טופס הרשמה מלא</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>הסטודנטים יתבקשו למלא שאלון מפורט לפי השאלות שתגדיר למטה.</div>
                  </div>
                </label>
                <label className="radio-label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="regMode" value="rsvp" checked={registrationMode === 'rsvp'} onChange={(e) => setRegistrationMode(e.target.value)} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                  <div>
                    <strong>הגעה בלבד (RSVP)</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ללא שאלות. הסטודנטים יראו רק כפתור אישור הגעה מהיר.</div>
                  </div>
                </label>
                <label className="radio-label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" name="regMode" value="none" checked={registrationMode === 'none'} onChange={(e) => setRegistrationMode(e.target.value)} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                  <div>
                    <strong>ללא הרשמה</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>אירוע פתוח, אין צורך להירשם.</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {(registrationMode === 'form' || registrationMode === 'rsvp') && (
            <>
              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group" style={{ padding: '1rem', background: 'rgba(73, 38, 145, 0.05)', borderRadius: '8px', border: '1px solid rgba(73, 38, 145, 0.1)' }}>
                  <label className="checkbox-label" style={{ margin: 0, fontSize: '1.1rem' }}>
                    <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} />
                    <span>האירוע דורש אישור מנהל ידני לאחר הרשמה</span>
                  </label>
                </div>
                <div className="form-group" style={{ padding: '1rem', background: 'rgba(73, 38, 145, 0.05)', borderRadius: '8px', border: '1px solid rgba(73, 38, 145, 0.1)' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>מכסת משתתפים מקסימלית</label>
                  <input type="number" className="form-control" placeholder="ללא הגבלה" style={{ width: '120px', display: 'inline-block' }} value={maxRegistrants} onChange={(e) => setMaxRegistrants(e.target.value)} />
                </div>
              </div>
              
              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group" style={{ padding: '1rem', background: 'rgba(73, 38, 145, 0.05)', borderRadius: '8px', border: '1px solid rgba(73, 38, 145, 0.1)', flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>תאריך ושעת פתיחת הרשמה (אופציונלי)</label>
                  <input type="datetime-local" className="form-control" style={{ width: '100%' }} value={registrationStart} onChange={(e) => setRegistrationStart(e.target.value)} />
                  <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                    השאירו ריק אם תרצו שההרשמה תהיה פתוחה מרגע פרסום האירוע.
                  </small>
                </div>
                <div className="form-group" style={{ padding: '1rem', background: 'rgba(73, 38, 145, 0.05)', borderRadius: '8px', border: '1px solid rgba(73, 38, 145, 0.1)', flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>תאריך ושעת סגירת הרשמה (אופציונלי)</label>
                  <input type="datetime-local" className="form-control" style={{ width: '100%' }} value={registrationDeadline} onChange={(e) => setRegistrationDeadline(e.target.value)} />
                  <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                    השאירו ריק אם תרצו שההרשמה תישאר פתוחה עד מכסת המשתתפים.
                  </small>
                </div>
              </div>
              
              <div className="form-group" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(73, 38, 145, 0.03)', borderRadius: '8px', border: '1px solid rgba(73, 38, 145, 0.08)' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>הודעה שתוצג כשההרשמה סגורה / מלאה</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="ההרשמה לאירוע זה נסגרה. נשמח לראותכם בפעמים הבאות!" 
                  value={closedMessage} 
                  onChange={(e) => setClosedMessage(e.target.value)} 
                />
                <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                  הודעה זו תופיע לסטודנטים אם מכסת המשתתפים תתמלא או אם תבחר/י לסגור את ההרשמה.
                </small>
              </div>
            </>
          )}

          <div className="images-section" style={{ marginTop: '2rem' }}>
            <input type="file" accept="image/*" ref={headerInputRef} style={{ display: 'none' }} onChange={(e) => { if(e.target.files?.[0]) setHeaderImage(e.target.files[0]) }} />
            <input type="file" accept="image/*" ref={flyerInputRef} style={{ display: 'none' }} onChange={(e) => { if(e.target.files?.[0]) setFlyerImage(e.target.files[0]) }} />

            <div className="image-upload-box" onClick={() => headerInputRef.current?.click()} style={{ position: 'relative', overflow: 'hidden' }}>
              {(headerImage || existingHeaderUrl) ? (
                <>
                  <img src={headerImage ? URL.createObjectURL(headerImage) : existingHeaderUrl!} alt="Header preview" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                  <button onClick={(e) => { e.stopPropagation(); setHeaderImage(null); setExistingHeaderUrl(null); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer' }}><X size={16} /></button>
                </>
              ) : (
                <>
                  <ImageIcon size={24} />
                  <span>העלאת תמונת כותרת (אופציונלי)</span>
                  <small>אם לא תעלו, נשים גרדיאנט חב"די יפה</small>
                </>
              )}
            </div>

            <div className="image-upload-box" onClick={() => flyerInputRef.current?.click()} style={{ position: 'relative', overflow: 'hidden' }}>
              {(flyerImage || existingFlyerUrl) ? (
                <>
                  <img src={flyerImage ? URL.createObjectURL(flyerImage) : existingFlyerUrl!} alt="Flyer preview" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0 }} />
                  <button onClick={(e) => { e.stopPropagation(); setFlyerImage(null); setExistingFlyerUrl(null); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer' }}><X size={16} /></button>
                </>
              ) : (
                <>
                  <ImageIcon size={24} />
                  <span>העלאת מודעה / פלאייר (אופציונלי)</span>
                  <small>יופיע בגדול בתוך עמוד האירוע</small>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Form Builder Section - Only show if mode is form */}
        {registrationMode === 'form' && (
          <div className="admin-card form-builder-card glass">
            <h2>בניית טופס הרשמה</h2>
            <p className="builder-desc">כאן תוכלו להחליט אילו שאלות לשאול את הסטודנטים בהרשמה.</p>
            
            <div className="fields-list">
              {fields.map((field, index) => (
                <div key={field.id} className="field-editor-item">
                  <div className="field-header">
                    <span className="field-number">{index + 1}</span>
                    <button className="icon-btn delete-btn" onClick={() => removeField(field.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="field-editor-body">
                    <div className="form-group">
                      <label>נוסח השאלה</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={field.label}
                        onChange={(e) => updateField(field.id, 'label', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>סוג תשובה</label>
                        <select 
                          className="form-control"
                          value={field.type}
                          onChange={(e) => updateField(field.id, 'type', e.target.value)}
                        >
                          <option value="text">📝 טקסט קצר</option>
                          <option value="textarea">📄 פסקה</option>
                          <option value="tel">📞 מספר טלפון</option>
                          <option value="radio">🔘 בחירה מרובה (תשובה אחת)</option>
                          <option value="multi-select">☑️ תיבות סימון (כמה תשובות)</option>
                          <option value="select">🔽 רשימה נפתחת</option>
                          <option value="checkbox">✅ משפט אישור (ללא כותרת)</option>
                        </select>
                      </div>

                      {(field.type === 'select' || field.type === 'multi-select' || field.type === 'radio') && (
                        <div className="form-group" style={{ flex: 2 }}>
                          <label>אפשרויות לבחירה (מופרדות בפסיק)</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="לדוגמה: בשרי, צמחוני, טבעוני"
                            value={field.options || ''}
                            onChange={(e) => updateField(field.id, 'options', e.target.value)}
                          />
                        </div>
                      )}
                      
                      <div className="form-group checkbox-group" style={{ flex: 1 }}>
                        <label className="checkbox-label" style={{ marginTop: '2rem' }}>
                          <input 
                            type="checkbox" 
                            checked={field.required}
                            onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                          />
                          <span>שדה חובה</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-outline add-field-btn" onClick={addField}>
              <Plus size={18} /> הוספת שאלה חדשה
            </button>
          </div>
        )}
        
        {/* Bottom Save Button (Duplicate) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving}
            style={{ minWidth: '150px', padding: '0.8rem', fontSize: '1.1rem', fontWeight: 700 }}
          >
            {saving ? <span className="spinner-small" /> : (isEditMode ? 'עדכן אירוע' : 'שמור אירוע')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminEventEditor;
