import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { blessingService, isKaparotRequest, formatKaparotSentence, type BlessingRequestItem } from '../../utils/blessingService';
import { 
  Printer, 
  Copy, 
  Download, 
  Plus, 
  Search, 
  Trash2, 
  Scroll, 
  ChevronRight, 
  Check, 
  Edit3, 
  FileText, 
  Coins, 
  Sparkles,
  Package,
  Flame,
  Wheat
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatHebrewDate } from '../../utils/dateUtils';
import './AdminBlessingRequests.css';

interface AdminSpecialFormsProps {
  defaultTab?: 'kaparot' | 'pan' | 'future';
}

const AdminSpecialForms = ({ defaultTab }: AdminSpecialFormsProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [requests, setRequests] = useState<BlessingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [copied, setCopied] = useState(false);

  // Active form section tab
  const [activeTab, setActiveTab] = useState<'kaparot' | 'pan' | 'future'>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pan' || tabParam === 'blessings') return 'pan';
    if (tabParam === 'future' || tabParam === 'other') return 'future';
    if (tabParam === 'kaparot') return 'kaparot';
    if (defaultTab) return defaultTab;
    return 'kaparot'; // Default to Kaparot during Tishrei
  });

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pan Modal state (Add / Edit)
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
      toast.error('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'kaparot' | 'pan' | 'future') => {
    setActiveTab(tab);
    setSelectedIds([]);
    setSearchQuery('');
    setGenderFilter('all');
    setSearchParams({ tab });
  };

  // Separate datasets cleanly
  const kaparotItems = requests.filter(r => isKaparotRequest(r));
  const panItems = requests.filter(r => !isKaparotRequest(r));

  const kaparotCount = kaparotItems.length;
  const kaparotMaleCount = kaparotItems.filter(r => r.gender === 'male').length;
  const kaparotFemaleCount = kaparotItems.filter(r => r.gender === 'female').length;

  const panCount = panItems.length;
  const panMaleCount = panItems.filter(r => r.gender === 'male').length;
  const panFemaleCount = panItems.filter(r => r.gender === 'female').length;

  // Active items list based on current tab
  const currentItems = activeTab === 'kaparot' ? kaparotItems : panItems;

  const filteredItems = currentItems.filter(req => {
    const matchesGender = genderFilter === 'all' || req.gender === genderFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesGender;

    const matchesSearch =
      req.full_name.toLowerCase().includes(q) ||
      (req.last_name && req.last_name.toLowerCase().includes(q)) ||
      req.mother_name.toLowerCase().includes(q) ||
      (req.good_resolution && req.good_resolution.toLowerCase().includes(q)) ||
      (req.blessing_request && req.blessing_request.toLowerCase().includes(q)) ||
      req.formatted_text.toLowerCase().includes(q);

    return matchesGender && matchesSearch;
  });

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
    if (filteredItems.length === 0) {
      toast.error('אין שמות להעתקה');
      return;
    }

    if (activeTab === 'kaparot') {
      const header = `שמות לפדיון כפרות - בית חב"ד קמפוס בר אילן\n------------------------------------------------------------\n`;
      const lines = filteredItems.map((req, idx) => {
        const text = formatKaparotSentence(req);
        return `${idx + 1}. ${text}`;
      });
      const fullText = header + lines.join('\n');
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success('רשימת שמות פדיון הכפרות הועתקה בהצלחה!');
    } else {
      const hebDateStr = todayHebrewDate.hebrewDate || '';
      const header = `מבקשים להזכיר לברכה אצל כ"ק אדמו"ר${hebDateStr ? ` (${hebDateStr})` : ''}\n------------------------------------------------------------\n`;
      const lines = filteredItems.map(req => req.formatted_text);
      const fullText = header + lines.join('\n\n');
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success('כל שמות הפ״נ הועתקו בהצלחה ללוח!');
    }

    setTimeout(() => setCopied(false), 3000);
  };

  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      toast.error('אין נתונים לייצוא');
      return;
    }

    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let fileName = '';

    if (activeTab === 'kaparot') {
      fileName = `kaparot_names_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['מספר', 'שם מלא לפדיון', 'שם פרטי', 'שם משפחה', 'שם האם', 'סכום פדיון', 'מין', 'תאריך ושעה'];
      rows = filteredItems.map((req, idx) => [
        idx + 1,
        `"${formatKaparotSentence(req).replace(/"/g, '""')}"`,
        `"${req.full_name.replace(/"/g, '""')}"`,
        `"${(req.last_name || '').replace(/\[פדיון כפרות\]/g, '').trim().replace(/"/g, '""')}"`,
        `"${req.mother_name.replace(/"/g, '""')}"`,
        `"${req.good_resolution || ''}"`,
        req.gender === 'male' ? 'זכר' : 'נקבה',
        new Date(req.created_at).toLocaleString('he-IL')
      ]);
    } else {
      fileName = `blessing_requests_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['מספר', 'מין', 'שם פרטי מלא', 'שם משפחה', 'שם האמא', 'החלטה טובה', 'בקשת ברכה', 'טקסט מלא מנוסח', 'תאריך'];
      rows = filteredItems.map((req, idx) => [
        idx + 1,
        req.gender === 'male' ? 'זכר' : 'נקבה',
        `"${req.full_name.replace(/"/g, '""')}"`,
        `"${(req.last_name || '').replace(/"/g, '""')}"`,
        `"${req.mother_name.replace(/"/g, '""')}"`,
        `"${(req.good_resolution || '').replace(/"/g, '""')}"`,
        `"${(req.blessing_request || '').replace(/"/g, '""')}"`,
        `"${req.formatted_text.replace(/"/g, '""')}"`,
        new Date(req.created_at).toLocaleDateString('he-IL')
      ]);
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`האם למחוק את הרישום של ${name}?`)) return;

    try {
      await blessingService.deleteRequest(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
      toast.success('הרישום נמחק');
    } catch (e) {
      toast.error('שגיאה במחיקה');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`האם למחוק ${selectedIds.length} שמות מסומנים?`)) return;

    try {
      await blessingService.deleteBatchRequests(selectedIds);
      setRequests(prev => prev.filter(r => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      toast.success(`${selectedIds.length} שמות נמחקו בהצלחה!`);
    } catch (e) {
      toast.error('שגיאה במחיקת השמות');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(r => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Pan Add/Edit Modal functions
  const handleOpenAddPan = () => {
    setEditingItem(null);
    setNewGender('male');
    setNewName('');
    setNewLastName('');
    setNewMother('');
    setNewResolution('');
    setNewBlessing('');
    setShowAddModal(true);
  };

  const handleOpenEditPan = (item: BlessingRequestItem) => {
    setEditingItem(item);
    setNewGender(item.gender);
    setNewName(item.full_name);
    setNewLastName(item.last_name || '');
    setNewMother(item.mother_name);
    setNewResolution(item.good_resolution || '');
    setNewBlessing(item.blessing_request || '');
    setShowAddModal(true);
  };

  const handleSavePanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newMother.trim()) {
      toast.error('אנא מלאו שם פרטי ושם האמא');
      return;
    }

    setAdding(true);
    try {
      if (editingItem) {
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
        {activeTab === 'kaparot' ? (
          <>
            <h1>רשימת שמות לפדיון כפרות</h1>
            <p>חב״ד בקמפוס בר אילן – ערב יום הכיפורים תשפ״ה</p>
          </>
        ) : (
          <>
            <h1>מבקשים להזכיר לברכה אצל כ"ק אדמו"ר</h1>
            {todayHebrewDate.hebrewDate && <p>{todayHebrewDate.hebrewDate}</p>}
          </>
        )}
      </div>

      {/* Main Admin Page Header */}
      <div className="admin-blessing-header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/admin')} title="חזרה ללוח בקרה">
            <ChevronRight size={20} />
          </button>
          <div className="admin-blessing-title-box">
            <h1>מרכז טפסים מיוחדים 📋</h1>
            <p>ניהול עצמאי ומסודר: פדיון כפרות, פ״נ לציון הרבי וטפסים מיוחדים</p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        {activeTab !== 'future' && (
          <div className="admin-blessing-actions">
            <button className="btn-print" onClick={handlePrint}>
              <Printer size={18} />
              <span>{activeTab === 'kaparot' ? 'הדפסת שמות לפדיון' : 'הדפסת פ״נ מרוכז'}</span>
            </button>

            <button 
              className="btn-copy" 
              style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }} 
              onClick={handleDownloadPDF}
            >
              <FileText size={18} />
              <span>הורדת PDF</span>
            </button>

            <button className="btn-copy" onClick={handleCopyAll}>
              {copied ? <Check size={18} style={{ color: '#10b981' }} /> : <Copy size={18} />}
              <span>{copied ? 'הועתק!' : 'העתקת כל השמות'}</span>
            </button>

            <button className="btn-copy" onClick={handleExportCSV}>
              <Download size={18} />
              <span>ייצוא לאקסל (CSV)</span>
            </button>

            {activeTab === 'pan' && (
              <button 
                className="btn btn-primary" 
                style={{ borderRadius: '14px', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={handleOpenAddPan}
              >
                <Plus size={18} />
                <span>הוספת שם לפ״נ</span>
              </button>
            )}

            {selectedIds.length > 0 && (
              <button 
                className="btn-copy" 
                style={{ background: '#dc2626', color: '#fff', borderColor: '#b91c1c', fontWeight: 700 }}
                onClick={handleDeleteSelected}
              >
                <Trash2 size={18} />
                <span>מחיקת {selectedIds.length} מסומנים</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="special-forms-tabs-container no-print">
        <button
          className={`special-forms-tab-btn ${activeTab === 'kaparot' ? 'active-kaparot' : ''}`}
          onClick={() => handleTabChange('kaparot')}
        >
          <div className="tab-icon-box kaparot-icon">
            <Coins size={20} />
          </div>
          <div className="tab-text-box">
            <strong>פדיון כפרות 🪙</strong>
            <span>שמות ותרומות חגי תשרי</span>
          </div>
          <span className="tab-badge-pill kaparot-pill">{kaparotCount}</span>
        </button>

        <button
          className={`special-forms-tab-btn ${activeTab === 'pan' ? 'active-pan' : ''}`}
          onClick={() => handleTabChange('pan')}
        >
          <div className="tab-icon-box pan-icon">
            <Scroll size={20} />
          </div>
          <div className="tab-text-box">
            <strong>פ״נ ובקשות ברכה 📜</strong>
            <span>החלטות טובות וברכות לציון</span>
          </div>
          <span className="tab-badge-pill pan-pill">{panCount}</span>
        </button>

        <button
          className={`special-forms-tab-btn ${activeTab === 'future' ? 'active-future' : ''}`}
          onClick={() => handleTabChange('future')}
        >
          <div className="tab-icon-box future-icon">
            <Sparkles size={20} />
          </div>
          <div className="tab-text-box">
            <strong>טפסים מיוחדים נוספים ✨</strong>
            <span>מכירת חמץ, לולבים ועוד</span>
          </div>
          <span className="tab-badge-pill future-pill">בקרוב</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: KAPAROT VIEW                                       */}
      {/* ========================================================= */}
      {activeTab === 'kaparot' && (
        <div className="kaparot-view-content">
          {/* KPI Stats for Kaparot */}
          <div className="stats-grid no-print" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="stat-card" style={{ border: '1.5px solid rgba(245, 158, 11, 0.35)' }}>
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Coins size={24} />
              </div>
              <div className="stat-info">
                <h3>{kaparotCount}</h3>
                <span>שמות לפדיון כפרות 🪙</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                👨‍💼
              </div>
              <div className="stat-info">
                <h3>{kaparotMaleCount}</h3>
                <span>זכרים (בן)</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fce7f3', color: '#db2777' }}>
                👩‍💼
              </div>
              <div className="stat-info">
                <h3>{kaparotFemaleCount}</h3>
                <span>נקבות (בת)</span>
              </div>
            </div>
          </div>

          {/* Search & Gender Filter */}
          <div className="filter-bar no-print">
            <div className="search-input-wrap">
              <Search size={18} className="search-icon-pos" />
              <input
                type="text"
                placeholder="חיפוש לפי שם סטודנט או שם האם..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-pills">
              <button
                className={`filter-pill ${genderFilter === 'all' ? 'active' : ''}`}
                onClick={() => setGenderFilter('all')}
              >
                הכל ({kaparotCount})
              </button>
              <button
                className={`filter-pill ${genderFilter === 'male' ? 'active' : ''}`}
                onClick={() => setGenderFilter('male')}
              >
                זכרים ({kaparotMaleCount})
              </button>
              <button
                className={`filter-pill ${genderFilter === 'female' ? 'active' : ''}`}
                onClick={() => setGenderFilter('female')}
              >
                נקבות ({kaparotFemaleCount})
              </button>
            </div>
          </div>

          {/* Kaparot List */}
          <div className="requests-container">
            {filteredItems.length > 0 && (
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                  onChange={toggleSelectAll}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569' }}>
                  {selectedIds.length > 0 ? `סומנו ${selectedIds.length} מתוך ${filteredItems.length} שמות` : 'סימון הכל / בחירת שמות למחיקה'}
                </span>
              </div>
            )}

            {loading ? (
              <p style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>טוען שמות לפדיון כפרות...</p>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🪙</div>
                <h3 style={{ fontSize: '1.2rem', color: '#1e293b', margin: '0 0 0.5rem' }}>
                  {searchQuery ? 'לא נמצאו שמות התואמים לחיפוש' : 'טרם נרשמו שמות לפדיון כפרות'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto' }}>
                  כאשר סטודנטים ימלאו את שמם ושם האם בעמוד פדיון הכפרות, שמותיהם יופיעו כאן באופן מיידי.
                </p>
              </div>
            ) : (
              filteredItems.map((req, idx) => {
                const cleanLast = (req.last_name || '').replace(/\[פדיון כפרות\]/g, '').trim();
                const traditionText = `${req.full_name} ${req.gender === 'male' ? 'בן' : 'בת'} ${req.mother_name}`;

                return (
                  <div key={req.id} className="request-item-row kaparot-row">
                    <div className="no-print" style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(req.id)}
                        onChange={() => toggleSelectOne(req.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </div>
                    <div className="item-index" style={{ background: '#fef3c7', color: '#b45309' }}>{idx + 1}</div>
                    <div className="item-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '1.18rem', fontWeight: 800, color: '#1e1b4b' }}>
                          {traditionText}
                        </span>
                        {cleanLast && (
                          <span style={{
                            background: '#f1f5f9',
                            color: '#475569',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px'
                          }}>
                            {cleanLast}
                          </span>
                        )}
                        <span style={{
                          background: req.gender === 'male' ? '#e0f2fe' : '#fce7f3',
                          color: req.gender === 'male' ? '#0369a1' : '#be185d',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '999px'
                        }}>
                          {req.gender === 'male' ? 'זכר' : 'נקבה'}
                        </span>
                        {req.good_resolution && (
                          <span style={{
                            background: '#fef3c7',
                            color: '#b45309',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.6rem',
                            borderRadius: '999px',
                            border: '1px solid rgba(217, 119, 6, 0.25)'
                          }}>
                            🪙 {req.good_resolution}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        נרשם בתאריך: {new Date(req.created_at).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>

                    <div className="item-actions no-print">
                      <button
                        className="btn-icon-action"
                        title="מחיקת שם"
                        onClick={() => handleDelete(req.id, `${req.full_name} בן/בת ${req.mother_name}`)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PAN & BLESSING REQUESTS VIEW                       */}
      {/* ========================================================= */}
      {activeTab === 'pan' && (
        <div className="pan-view-content">
          {/* KPI Stats for Pan */}
          <div className="stats-grid no-print" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#ebf8ff', color: '#3182ce' }}>
                <Scroll size={24} />
              </div>
              <div className="stat-info">
                <h3>{panCount}</h3>
                <span>סה״כ פ״נ לציון 📜</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                👨‍💼
              </div>
              <div className="stat-info">
                <h3>{panMaleCount}</h3>
                <span>זכרים (בן)</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fce7f3', color: '#db2777' }}>
                👩‍💼
              </div>
              <div className="stat-info">
                <h3>{panFemaleCount}</h3>
                <span>נקבות (בת)</span>
              </div>
            </div>
          </div>

          {/* Search & Gender Filter */}
          <div className="filter-bar no-print">
            <div className="search-input-wrap">
              <Search size={18} className="search-icon-pos" />
              <input
                type="text"
                placeholder="חיפוש לפי שם, החלטה טובה או בקשת ברכה..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-pills">
              <button
                className={`filter-pill ${genderFilter === 'all' ? 'active' : ''}`}
                onClick={() => setGenderFilter('all')}
              >
                הכל ({panCount})
              </button>
              <button
                className={`filter-pill ${genderFilter === 'male' ? 'active' : ''}`}
                onClick={() => setGenderFilter('male')}
              >
                זכרים ({panMaleCount})
              </button>
              <button
                className={`filter-pill ${genderFilter === 'female' ? 'active' : ''}`}
                onClick={() => setGenderFilter('female')}
              >
                נקבות ({panFemaleCount})
              </button>
            </div>
          </div>

          {/* Pan List */}
          <div className="requests-container">
            {filteredItems.length > 0 && (
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                  onChange={toggleSelectAll}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569' }}>
                  {selectedIds.length > 0 ? `סומנו ${selectedIds.length} מתוך ${filteredItems.length} שמות` : 'סימון הכל / בחירת שמות למחיקה'}
                </span>
              </div>
            )}

            {loading ? (
              <p style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>טוען בקשות ברכה...</p>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📜</div>
                <h3 style={{ fontSize: '1.2rem', color: '#1e293b', margin: '0 0 0.5rem' }}>
                  {searchQuery ? 'לא נמצאו בקשות ברכה התואמות לחיפוש' : 'עדיין לא נרשמו בקשות פ״נ'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.2rem' }}>
                  ניתן להוסיף שמות ידנית או להפנות סטודנטים לטופס הפ״נ לקראת תאריכים מיוחדים.
                </p>
                <button className="btn btn-primary" onClick={handleOpenAddPan}>
                  <Plus size={16} />
                  <span>הוספת שם ראשון לפ״נ</span>
                </button>
              </div>
            ) : (
              filteredItems.map((req, idx) => (
                <div key={req.id} className="request-item-row">
                  <div className="no-print" style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(req.id)}
                      onChange={() => toggleSelectOne(req.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>
                  <div className="item-index">{idx + 1}</div>
                  <div className="item-body">
                    <p className="item-text">
                      {req.formatted_text}
                    </p>
                    <div className="no-print" style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      תאריך: {new Date(req.created_at).toLocaleDateString('he-IL')}
                    </div>
                  </div>

                  <div className="item-actions no-print">
                    <button
                      className="btn-icon-action"
                      title="עריכת בקשה"
                      style={{ color: '#2563eb' }}
                      onClick={() => handleOpenEditPan(req)}
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
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: UPCOMING SPECIAL FORMS                             */}
      {/* ========================================================= */}
      {activeTab === 'future' && (
        <div className="future-forms-view no-print">
          <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e1b4b', margin: '0 0 0.5rem' }}>
              טפסים עונתיים ומיוחדים לאורך השנה ✨
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '580px', margin: '0 auto' }}>
              לקראת כל מועד וחג בשנה, נוכל להפעיל כאן טפסים ייעודיים לסטודנטים. כל טופס יקבל אזור ניהול נפרד, ממוקד ומסודר!
            </p>
          </div>

          <div className="future-cards-grid">
            <div className="future-card">
              <div className="future-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Wheat size={28} />
              </div>
              <h3>מכירת חמץ (ערב פסח)</h3>
              <p>טופס ייפוי כוח לרב למכירת חמץ אונליין, כולל כתובות הסטודנטים ומיקום החמץ בבית.</p>
              <span className="future-badge">יופעל בניסן</span>
            </div>

            <div className="future-card">
              <div className="future-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                <Package size={28} />
              </div>
              <h3>ארבעת המינים וסוכה</h3>
              <p>טופס הזמנה וחלוקת סטים מהודרים של 4 המינים לסטודנטים בקמפוס לקראת חג הסוכות.</p>
              <span className="future-badge">יופעל בתשרי</span>
            </div>

            <div className="future-card">
              <div className="future-icon-wrap" style={{ background: '#fce7f3', color: '#db2777' }}>
                <Sparkles size={28} />
              </div>
              <h3>משלוחי מנות ומתנות לאביונים</h3>
              <p>טופס משלוחי מנות הדדיים בין סטודנטים בקמפוס ונתינת מתנות לאביונים ביום הפורים.</p>
              <span className="future-badge">יופעל באדר</span>
            </div>

            <div className="future-card">
              <div className="future-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Flame size={28} />
              </div>
              <h3>נרות חנוכה וערכות חג</h3>
              <p>הרשמה לקבלת חנוכיות, נרות וסופגניות לדירות הסטודנטים והמעונות.</p>
              <span className="future-badge">יופעל בכסלו</span>
            </div>
          </div>
        </div>
      )}

      {/* PAN ADD/EDIT MODAL */}
      {showAddModal && (
        <div className="modal-overlay no-print" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>{editingItem ? 'עריכת בקשת ברכה לפ״נ' : 'הוספת בקשת ברכה לפ״נ'}</h2>
            <form onSubmit={handleSavePanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>מין:</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="radio" name="gender" value="male" checked={newGender === 'male'} onChange={() => setNewGender('male')} />
                    <span>זכר (בן)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="radio" name="gender" value="female" checked={newGender === 'female'} onChange={() => setNewGender('female')} />
                    <span>נקבה (בת)</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>שם פרטי *</label>
                  <input type="text" className="input-text" placeholder="למשל: יוסף יצחק" value={newName} onChange={e => setNewName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>שם משפחה</label>
                  <input type="text" className="input-text" placeholder="למשל: כהן" value={newLastName} onChange={e => setNewLastName(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>שם האמא *</label>
                <input type="text" className="input-text" placeholder="למשל: שרה" value={newMother} onChange={e => setNewMother(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>החלטה טובה (אופציונלי)</label>
                <input type="text" className="input-text" placeholder="למשל: הנחת תפילין, נרות שבת..." value={newResolution} onChange={e => setNewResolution(e.target.value)} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>בקשת ברכה (אופציונלי)</label>
                <input type="text" className="input-text" placeholder="למשל: הצלחה במבחנים, בריאות, זיווג..." value={newBlessing} onChange={e => setNewBlessing(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>ביטול</button>
                <button type="submit" className="btn btn-primary" disabled={adding}>
                  {adding ? 'שומר...' : (editingItem ? 'עדכן פרטים' : 'הוסף לפ״נ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminSpecialForms;
