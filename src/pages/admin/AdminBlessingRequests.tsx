import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { blessingService, type BlessingRequestItem } from '../../utils/blessingService';
import { Printer, Copy, Download, Plus, Search, Trash2, Users, Scroll, ChevronRight, Check, Edit3, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatHebrewDate } from '../../utils/dateUtils';
import './AdminBlessingRequests.css';

const AdminBlessingRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BlessingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [copied, setCopied] = useState(false);

  // Modal state (Add / Edit)
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BlessingRequestItem | null>(null);
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [newName, setNewName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newMother, setNewMother] = useState('');
  const [newResolution, setNewResolution] = useState('');
  const [newBlessing, setNewBlessing] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await blessingService.getAllRequests();
      setRequests(data);
    } catch (e) {
      console.error(e);
      toast.error('שגיאה שטעינת הבקשות');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesGender = genderFilter === 'all' || req.gender === genderFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      req.full_name.toLowerCase().includes(q) ||
      (req.last_name && req.last_name.toLowerCase().includes(q)) ||
      req.mother_name.toLowerCase().includes(q) ||
      req.good_resolution.toLowerCase().includes(q) ||
      req.blessing_request.toLowerCase().includes(q) ||
      req.formatted_text.toLowerCase().includes(q);

    return matchesGender && matchesSearch;
  });

  const maleCount = requests.filter(r => r.gender === 'male').length;
  const femaleCount = requests.filter(r => r.gender === 'female').length;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.success('נפתח חלון ההדפסה. בחרו "שמירה כ-PDF" להורדת הקובץ.', { duration: 4000 });
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handleCopyAll = () => {
    if (filteredRequests.length === 0) {
      toast.error('אין שמות להעתקה');
      return;
    }

    const hebDateStr = todayHebrewDate.hebrewDate || '';
    const header = `מבקשים להזכיר לברכה אצל כ"ק אדמו"ר${hebDateStr ? ` (${hebDateStr})` : ''}\n------------------------------------------------------------\n`;
    
    const lines = filteredRequests.map((req, idx) => `${idx + 1}. ${req.formatted_text}`);
    const fullText = header + lines.join('\n\n');

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('כל השמות הועתקו בהצלחה ללוח!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleExportCSV = () => {
    if (filteredRequests.length === 0) {
      toast.error('אין נתונים לייצוא');
      return;
    }

    const headers = ['מספר', 'מין', 'שם פרטי מלא', 'שם משפחה', 'שם האמא', 'החלטה טובה', 'בקשת ברכה', 'טקסט מלא מנוסח', 'תאריך'];
    const rows = filteredRequests.map((req, idx) => [
      idx + 1,
      req.gender === 'male' ? 'זכר' : 'נקבה',
      `"${req.full_name.replace(/"/g, '""')}"`,
      `"${(req.last_name || '').replace(/"/g, '""')}"`,
      `"${req.mother_name.replace(/"/g, '""')}"`,
      `"${req.good_resolution.replace(/"/g, '""')}"`,
      `"${req.blessing_request.replace(/"/g, '""')}"`,
      `"${req.formatted_text.replace(/"/g, '""')}"`,
      new Date(req.created_at).toLocaleDateString('he-IL')
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `blessing_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`האם למחוק את הבקשה של ${name}?`)) return;

    try {
      await blessingService.deleteRequest(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success('הבקשה נמחקה');
    } catch (e) {
      toast.error('שגיאה במחיקת הבקשה');
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setNewGender('male');
    setNewName('');
    setNewLastName('');
    setNewMother('');
    setNewResolution('');
    setNewBlessing('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: BlessingRequestItem) => {
    setEditingItem(item);
    setNewGender(item.gender);
    setNewName(item.full_name);
    setNewLastName(item.last_name || '');
    setNewMother(item.mother_name);
    setNewResolution(item.good_resolution);
    setNewBlessing(item.blessing_request);
    setShowAddModal(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newMother.trim()) {
      toast.error('אנא מלאו שם פרטי ושם האמא');
      return;
    }

    setAdding(true);
    try {
      if (editingItem) {
        // Edit mode
        const updated = await blessingService.updateRequest(editingItem.id, {
          gender: newGender,
          full_name: newName,
          last_name: newLastName,
          mother_name: newMother,
          good_resolution: newResolution,
          blessing_request: newBlessing
        });

        setRequests(prev => prev.map(r => r.id === editingItem.id ? updated : r));
        toast.success('הבקשה עודכנה בהצלחה');
      } else {
        // Add mode
        const created = await blessingService.createRequest({
          gender: newGender,
          full_name: newName,
          last_name: newLastName,
          mother_name: newMother,
          good_resolution: newResolution,
          blessing_request: newBlessing
        });

        setRequests(prev => [created, ...prev]);
        toast.success('השם נוסף בהצלחה');
      }

      setShowAddModal(false);
      setEditingItem(null);
      setNewName('');
      setNewLastName('');
      setNewMother('');
      setNewResolution('');
      setNewBlessing('');
    } catch (e) {
      toast.error('שגיאה בשמירה');
    } finally {
      setAdding(false);
    }
  };

  const todayHebrewDate = formatHebrewDate(new Date().toISOString().slice(0, 10));

  return (
    <motion.div className="admin-blessing-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header for PRINT ONLY */}
      <div className="print-only-header">
        <h1>מבקשים להזכיר לברכה אצל כ"ק אדמו"ר</h1>
        {todayHebrewDate.hebrewDate && (
          <p style={{ marginTop: '0.4rem', fontSize: '13pt' }}>
            {todayHebrewDate.hebrewDate}
          </p>
        )}
      </div>

      {/* Normal Admin Header */}
      <div className="admin-blessing-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/admin')} title="חזרה ללוח בקרה">
            <ChevronRight size={20} />
          </button>
          <div className="admin-blessing-title-box">
            <h1>ניהול פ״נ ובקשות ברכה</h1>
            <p>ריכוז שמות והחלטות טובות מתאימים להדפסה ישירה לציון הקדוש</p>
          </div>
        </div>

        <div className="admin-blessing-actions">
          <button className="btn-print" onClick={handlePrint}>
            <Printer size={18} />
            <span>הדפסת פ״נ מרוכז</span>
          </button>

          <button className="btn-copy" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }} onClick={handleDownloadPDF}>
            <FileText size={18} />
            <span>הורדת PDF</span>
          </button>

          <button className="btn-copy" onClick={handleCopyAll}>
            {copied ? <Check size={18} style={{ color: '#10b981' }} /> : <Copy size={18} />}
            <span>{copied ? 'הועתק!' : 'העתקת כל השמות'}</span>
          </button>

          <button className="btn-copy" onClick={handleExportCSV}>
            <Download size={18} />
            <span>ייצוא CSV</span>
          </button>

          <button 
            className="btn btn-primary" 
            style={{ borderRadius: '14px', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={handleOpenAdd}
          >
            <Plus size={18} />
            <span>הוספת שם ידנית</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ebf8ff', color: '#3182ce' }}>
            <Scroll size={24} />
          </div>
          <div className="stat-info">
            <h3>{requests.length}</h3>
            <span>סה״כ בקשות ברכה</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            👨‍💼
          </div>
          <div className="stat-info">
            <h3>{maleCount}</h3>
            <span>זכרים (בן)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fce7f3', color: '#db2777' }}>
            👩‍💼
          </div>
          <div className="stat-info">
            <h3>{femaleCount}</h3>
            <span>נקבות (בת)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon-pos" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, שם האמא, החלטה טובה או ברכה..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <button
            className={`filter-pill ${genderFilter === 'all' ? 'active' : ''}`}
            onClick={() => setGenderFilter('all')}
          >
            הכל ({requests.length})
          </button>
          <button
            className={`filter-pill ${genderFilter === 'male' ? 'active' : ''}`}
            onClick={() => setGenderFilter('male')}
          >
            זכרים ({maleCount})
          </button>
          <button
            className={`filter-pill ${genderFilter === 'female' ? 'active' : ''}`}
            onClick={() => setGenderFilter('female')}
          >
            נקבות ({femaleCount})
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="requests-container">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>טוען בקשות...</p>
        ) : filteredRequests.length === 0 ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            {searchQuery || genderFilter !== 'all' ? 'לא נמצאו בקשות ברכה התואמות לחיפוש.' : 'עדיין לא נרשמו בקשות ברכה. ניתן להוסיף ידנית!'}
          </p>
        ) : (
          filteredRequests.map((req, idx) => (
            <div key={req.id} className="request-item-row">
              <div className="item-index">{idx + 1}</div>
              <div className="item-body">
                <p className="item-text">
                  {req.formatted_text}
                </p>
                <div className="item-meta">
                  <span>תאריך שליחה: {new Date(req.created_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>

              <div className="item-actions">
                <button
                  className="btn-icon-action"
                  title="עריכת בקשה"
                  style={{ color: '#2563eb' }}
                  onClick={() => handleOpenEdit(req)}
                >
                  <Edit3 size={18} />
                </button>
                <button
                  className="btn-icon-action"
                  title="מחיקת בקשה"
                  onClick={() => handleDelete(req.id, req.full_name)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'right', maxWidth: '520px' }}>
            <h2 className="modal-title" style={{ textAlign: 'center' }}>
              {editingItem ? 'עריכת בקשת ברכה (פ״נ)' : 'הוספת בקשת ברכה (פ״נ)'}
            </h2>
            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="gender-selector">
                <label className="form-label">מין למבנה הברכה</label>
                <div className="gender-options">
                  <button
                    type="button"
                    className={`gender-btn male ${newGender === 'male' ? 'active' : ''}`}
                    onClick={() => setNewGender('male')}
                  >
                    <span>👨‍💼 זכר</span>
                  </button>
                  <button
                    type="button"
                    className={`gender-btn female ${newGender === 'female' ? 'active' : ''}`}
                    onClick={() => setNewGender('female')}
                  >
                    <span>👩‍💼 נקבה</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">שם פרטי מלא *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="למשל: דוד שמעון"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">שם פרטי מלא של האמא *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="למשל: דניאלה חנה"
                  value={newMother}
                  onChange={e => setNewMother(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">שם משפחה (אופציונלי)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="למשל: כהן"
                  value={newLastName}
                  onChange={e => setNewLastName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">החלטה טובה</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="למשל: קריאת שמע"
                  value={newResolution}
                  onChange={e => setNewResolution(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">בקשת ברכה</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="למשל: רפואה שלמה והצלחה"
                  value={newBlessing}
                  onChange={e => setNewBlessing(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="submit-btn" style={{ flex: 1, margin: 0 }} disabled={adding}>
                  <span>{editingItem ? (adding ? 'מעדכן...' : 'עדכון בקשה') : (adding ? 'מוסיף...' : 'הוספה')}</span>
                </button>
                <button type="button" className="btn btn-outline" style={{ borderRadius: '16px' }} onClick={() => setShowAddModal(false)}>
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminBlessingRequests;
