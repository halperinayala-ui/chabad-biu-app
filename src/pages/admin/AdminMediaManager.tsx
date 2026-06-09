import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, Trash2, ArrowRight, Save, Loader2, Edit2, ImageIcon, Play } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';
import toast from 'react-hot-toast';
import './AdminMediaManager.css';

interface MediaContent {
  id: string;
  title: string;
  category: string;
  description: string;
  video_url: string;
  image_url: string;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  parasha: 'פרשת שבוע 📖',
  lesson: 'שיעור תורה 🎥',
  inspiration: 'השראה וחיזוק 💡',
  other: 'אחר 👥',
};

const getYouTubeId = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
};

const AdminMediaManager = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [posts, setPosts] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('parasha');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [existingCoverUrl, setExistingCoverUrl] = useState<string>('');

  useEffect(() => {
    if (profile && !profile.is_admin) {
      navigate('/');
      return;
    }
    fetchMediaPosts();
  }, [profile, navigate]);

  const fetchMediaPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_contents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      console.error('Error fetching media contents:', err);
      toast.error('שגיאה בטעינת התכנים: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setTitle('');
    setCategory('parasha');
    setDescription('');
    setVideoUrl('');
    setCoverFile(null);
    setCoverPreview('');
    setExistingCoverUrl('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (post: MediaContent) => {
    setEditingId(post.id);
    setTitle(post.title);
    setCategory(post.category);
    setDescription(post.description || '');
    setVideoUrl(post.video_url || '');
    setCoverFile(null);
    setCoverPreview(post.image_url || '');
    setExistingCoverUrl(post.image_url || '');
    setIsFormOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('נא להזין כותרת');
      return;
    }

    setSaving(true);
    try {
      let uploadedImageUrl = existingCoverUrl;

      // 1. Upload cover image if selected (with canvas compression!)
      if (coverFile) {
        toast.loading('מעבד ומעלה תמונת קאבר...', { id: 'uploading' });
        const compressed = await compressImage(coverFile);
        const fileExt = coverFile.name.split('.').pop() || 'jpg';
        const fileName = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('community')
          .upload(filePath, compressed, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('community')
          .getPublicUrl(filePath);

        uploadedImageUrl = publicUrlData.publicUrl;
        toast.dismiss('uploading');
      }

      // If no cover image uploaded and it is a YouTube video, try getting YouTube default thumbnail
      if (!uploadedImageUrl && videoUrl.trim()) {
        const ytId = getYouTubeId(videoUrl);
        if (ytId) {
          uploadedImageUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
        }
      }

      // 2. Insert or Update DB record
      const payload = {
        title: title.trim(),
        category,
        description: description.trim(),
        video_url: videoUrl.trim(),
        image_url: uploadedImageUrl,
        created_by: profile?.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from('media_contents')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('התוכן עודכן בהצלחה!');
      } else {
        const { error } = await supabase
          .from('media_contents')
          .insert([payload]);

        if (error) throw error;
        toast.success('תוכן חדש נוסף בהצלחה!');
      }

      setIsFormOpen(false);
      fetchMediaPosts();
    } catch (err: any) {
      console.error('Error saving media post:', err);
      toast.error('שגיאה בשמירת התוכן: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('האם אתם בטוחים שברצונכם למחוק תוכן זה?')) return;

    try {
      const { error } = await supabase
        .from('media_contents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('התוכן נמחק בהצלחה');
      fetchMediaPosts();
    } catch (err: any) {
      console.error('Error deleting media post:', err);
      toast.error('שגיאה במחיקת התוכן: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
        <Loader2 className="spinner" size={40} />
      </div>
    );
  }

  return (
    <motion.div className="admin-media-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Page Header */}
      <div className="admin-header">
        <button className="back-btn" onClick={() => navigate('/admin')}>
          <ArrowRight size={20} />
          <span>חזרה ללוח בקרה</span>
        </button>
        <button className="btn btn-primary" onClick={handleOpenNew}>
          <Plus size={18} />
          <span>תוכן חדש</span>
        </button>
      </div>

      <div className="media-manager-container glass">
        <div className="manager-title-row">
          <div className="title-wrapper">
            <Video size={28} style={{ color: 'var(--primary)' }} />
            <h2>ניהול תורה ומדיה 🎥</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            פרסום וניהול של סרטוני פרשת שבוע, שיעורי תורה ותכני השראה המופיעים בלשונית הקהילה.
          </p>
        </div>

        {/* Media Grid / List */}
        {posts.length === 0 ? (
          <div className="empty-media-state">
            <Video size={48} className="empty-icon" />
            <h3>אין סרטונים או שיעורים עדיין</h3>
            <p>לחצו על "תוכן חדש" כדי להעלות את שיעור התורה או סרטון הפרשה הראשון שלכם!</p>
          </div>
        ) : (
          <div className="admin-media-grid">
            {posts.map((post) => {
              const ytId = getYouTubeId(post.video_url);
              return (
                <div key={post.id} className="admin-media-card glass">
                  <div className="media-card-preview">
                    {post.image_url ? (
                      <img src={post.image_url} alt={post.title} />
                    ) : ytId ? (
                      <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={post.title} />
                    ) : (
                      <div className="no-preview">
                        <ImageIcon size={30} />
                      </div>
                    )}
                    {ytId && (
                      <div className="play-icon-overlay">
                        <Play size={20} fill="white" color="white" />
                      </div>
                    )}
                    <span className="media-cat-badge">{CATEGORY_LABELS[post.category] || post.category}</span>
                  </div>

                  <div className="media-card-info">
                    <h3>{post.title}</h3>
                    <p>{post.description || 'אין תיאור לתוכן זה.'}</p>
                    
                    <div className="media-card-actions">
                      <button className="icon-btn edit-btn" onClick={() => handleOpenEdit(post)} title="עריכה">
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-btn delete-btn" onClick={() => handleDelete(post.id)} title="מחיקה">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal Form */}
      {isFormOpen && (
        <div className="media-form-backdrop">
          <motion.div 
            className="media-form-modal glass"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="modal-header">
              <h3>{editingId ? 'עריכת תוכן ומדיה 🎥' : 'הוספת תוכן ומדיה חדש 🎥'}</h3>
              <button className="close-modal-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSave} className="media-modal-form">
              <div className="form-group">
                <label className="form-label">שם השיעור / סרטון *</label>
                <input 
                  type="text" 
                  className="form-control"
                  required
                  placeholder="למשל: סרטון לפרשת נח - החלטה קטנה שמשנה חיים"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">קטגוריה *</label>
                  <select 
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="parasha">פרשת שבוע 📖</option>
                    <option value="lesson">שיעור תורה 🎥</option>
                    <option value="inspiration">השראה וחיזוק 💡</option>
                    <option value="other">אחר 👥</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">קישור ליוטיוב / וידאו</label>
                  <input 
                    type="url" 
                    className="form-control"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">תיאור ותוכן השיעור</label>
                <textarea 
                  className="form-control"
                  rows={4}
                  placeholder="כתבו תיאור קצר או תוכן מעורר השראה..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">תמונת קאבר (אופציונלי - יילקח מיוטיוב אם לא יועלה)</label>
                <div className="cover-upload-wrapper">
                  <label className="upload-btn">
                    <ImageIcon size={18} />
                    <span>בחירת תמונה</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }}
                    />
                  </label>
                  {coverPreview && (
                    <div className="preview-image-box">
                      <img src={coverPreview} alt="Preview" />
                      <button 
                        type="button" 
                        className="remove-preview"
                        onClick={() => {
                          setCoverFile(null);
                          setCoverPreview('');
                          setExistingCoverUrl('');
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                  <span>שמירה ופרסום</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminMediaManager;
