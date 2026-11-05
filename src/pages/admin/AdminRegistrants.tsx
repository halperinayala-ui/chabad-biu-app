import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageCircle, 
  UserCheck, 
  Loader2, 
  Check, 
  X as XIcon, 
  UserCircle, 
  StickyNote, 
  Eye, 
  Edit, 
  Image, 
  Trash2, 
  Download, 
  Copy, 
  ExternalLink, 
  AlertTriangle, 
  FileSpreadsheet,
  RotateCcw,
  Bell,
  BellOff,
  Filter,
  ArrowUp,
  ArrowDown,
  Search
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { formatHebrewDate } from '../../utils/dateUtils';
import './AdminRegistrants.css';

interface Registrant {
  id: string;
  user_id: string;
  created_at: string;
  status: string;
  attended: boolean | null;
  admin_note: string;
  answers: Record<string, any>;
  profiles: {
    id: string;
    full_name: string;
    phone: string;
    gender?: string;
    user_status?: string;
    study_field?: string;
    status_detail?: string;
  } | null;
  guest_name?: string;
  guest_phone?: string;
}

const AdminRegistrants = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();

  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [maxRegistrants, setMaxRegistrants] = useState<number | null>(null);
  const [formConfig, setFormConfig] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWhatsappMenu, setActiveWhatsappMenu] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [waTemplateApproved, setWaTemplateApproved] = useState('היי {name}, איזה כיף שנרשמת לאירוע {event}! אנחנו מחכים לך.');

  // Delete & Export states
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<Registrant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Revert approval modal state
  const [revertConfirmTarget, setRevertConfirmTarget] = useState<Registrant | null>(null);
  const [reverting, setReverting] = useState(false);

  // Dynamic Filtering & Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string | null>>({});
  const [activeColumnMenu, setActiveColumnMenu] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: 'created_at', direction: 'desc' });
  

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    if (!eventId) return;
    try {
      try {
        const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 1).single();
        if (settingsData?.wa_template_approved) setWaTemplateApproved(settingsData.wa_template_approved);
      } catch (settingsErr) {
        // Ignore settings fetch error so it doesn't break the whole page if column is missing
        console.log('Could not fetch wa_template_approved, ignoring');
      }

      const { data: eventData } = await supabase
        .from('events')
        .select('title, event_date, max_registrants, form_config')
        .eq('id', eventId)
        .single();
      if (eventData) {
        setEventTitle(eventData.title);
        setEventDate(eventData.event_date);
        if (eventData.max_registrants) setMaxRegistrants(eventData.max_registrants);
        if (eventData.form_config) setFormConfig(eventData.form_config);
      }

      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id, user_id, status, guest_name, guest_phone, answers, created_at, attended, admin_note,
          profiles (id, full_name, phone, gender, user_status, study_field, status_detail)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrants(data || []);
    } catch (err: any) {
      toast.error('שגיאה בטעינת הנרשמים');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      const { error } = await supabase.from('registrations').update({ status }).eq('id', id);
      if (error) throw error;
      
      const updatedReg = registrants.find(r => r.id === id);
      setRegistrants(registrants.map(r => r.id === id ? { ...r, status } : r));
      
      if (status === 'approved') {
        toast.success('ההרשמה אושרה בהצלחה! 🎉');
      } else if (status === 'pending') {
        toast.success('אישור ההרשמה בוטל (הוחזר להמתנה)');
      } else {
        toast.success('ההרשמה נדחתה');
      }
      
      // Trigger Push Notification only on actual approval or rejection
      if (status !== 'pending' && updatedReg && updatedReg.profiles?.id) {
        const targetUserId = updatedReg.profiles.id;
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
              title: status === 'approved' ? 'ההרשמה אושרה! 🎉' : 'עדכון הרשמה',
              body: status === 'approved' 
                ? `איזה כיף! אישרנו את הרשמתך לאירוע "${eventTitle}". נתראה!`
                : `לצערנו, ההרשמה לאירוע "${eventTitle}" לא אושרה הפעם. נשמח לראותך באירועים הבאים!`,
              url: `https://chabad-biu-app.vercel.app/events/${eventId}`,
              targetUserId: targetUserId
            })
          }).catch(e => console.error("Push notification trigger failed:", e));
        }
      }
      
    } catch { toast.error('שגיאה בעדכון סטטוס'); }
  };

  const markAttendance = async (id: string, attended: boolean | null) => {
    try {
      const { error } = await supabase.from('registrations').update({ attended }).eq('id', id);
      if (error) throw error;
      setRegistrants(registrants.map(r => r.id === id ? { ...r, attended } : r));
      if (attended === true) toast.success('סומן כ"היה"');
      else if (attended === false) toast.success('סומן כ"לא היה"');
      else toast.success('סימון הוסר');
    } catch { toast.error('שגיאה בעדכון נוכחות'); }
  };

  const saveNote = async (id: string) => {
    try {
      const { error } = await supabase.from('registrations').update({ admin_note: noteText }).eq('id', id);
      if (error) throw error;
      setRegistrants(registrants.map(r => r.id === id ? { ...r, admin_note: noteText } : r));
      setEditingNote(null);
      toast.success('הערה נשמרה!');
    } catch { toast.error('שגיאה בשמירת הערה'); }
  };

  // Delete registration
  const handleDeleteRegistration = async () => {
    if (!deleteConfirmTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', deleteConfirmTarget.id);
      if (error) throw error;

      setRegistrants(prev => prev.filter(r => r.id !== deleteConfirmTarget.id));
      toast.success('ההרשמה נמחקה בהצלחה!');
      setDeleteConfirmTarget(null);
    } catch (err: any) {
      console.error('Error deleting registration:', err);
      toast.error('שגיאה במחיקת הרשמה');
    } finally {
      setDeleting(false);
    }
  };

  // Revert registration approval
  const handleRevertApproval = async (notifyStudent: boolean) => {
    if (!revertConfirmTarget) return;
    setReverting(true);
    try {
      const reg = revertConfirmTarget;
      const { error } = await supabase.from('registrations').update({ status: 'pending' }).eq('id', reg.id);
      if (error) throw error;

      setRegistrants(prev => prev.map(r => r.id === reg.id ? { ...r, status: 'pending' } : r));

      if (notifyStudent) {
        toast.success('אישור ההרשמה בוטל ונשלחה התראה לסטודנט');
        if (reg.profiles?.id) {
          const targetUserId = reg.profiles.id;
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
                title: 'עדכון סטטוס הרשמה',
                body: `שים לב: אישור ההרשמה לאירוע "${eventTitle}" בוטל והסטטוס הוחזר להמתנה.`,
                url: `https://chabad-biu-app.vercel.app/events/${eventId}`,
                targetUserId: targetUserId
              })
            }).catch(e => console.error("Push notification trigger failed:", e));
          }
        }
      } else {
        toast.success('אישור ההרשמה בוטל (ללא שליחת התראה)');
      }

      setRevertConfirmTarget(null);
    } catch (err: any) {
      console.error('Error reverting registration status:', err);
      toast.error('שגיאה בביטול אישור ההרשמה');
    } finally {
      setReverting(false);
    }
  };

  const getName = (reg: Registrant) => 
    reg.profiles?.full_name || 
    reg.guest_name || 
    reg.answers?.['שם מלא'] || 
    reg.answers?.['שם'] || 
    '—';

  const getPhone = (reg: Registrant) => 
    reg.profiles?.phone || 
    reg.guest_phone || 
    reg.answers?.['טלפון'] || 
    reg.answers?.['מספר טלפון'] || 
    reg.answers?.['נייד'] || 
    '—';

  // Duplicate detection maps
  const phoneCounts = registrants.reduce((acc: Record<string, number>, reg) => {
    const raw = getPhone(reg);
    const clean = raw.replace(/\D/g, '');
    if (clean.length >= 7) {
      acc[clean] = (acc[clean] || 0) + 1;
    }
    return acc;
  }, {});

  const userIdCounts = registrants.reduce((acc: Record<string, number>, reg) => {
    if (reg.user_id) {
      acc[reg.user_id] = (acc[reg.user_id] || 0) + 1;
    }
    return acc;
  }, {});

  const checkIsDuplicate = (reg: Registrant) => {
    const raw = getPhone(reg);
    const clean = raw.replace(/\D/g, '');
    const phoneDup = clean.length >= 7 && (phoneCounts[clean] || 0) > 1;
    const userDup = Boolean(reg.user_id && (userIdCounts[reg.user_id] || 0) > 1);
    return phoneDup || userDup;
  };

  // Collect all unique question headers for export and display
  const getQuestionHeaders = () => {
    const headers: string[] = [];
    const seen = new Set<string>();
    const excluded = new Set(['שם מלא', 'שם', 'טלפון', 'מספר טלפון', 'נייד']);

    if (Array.isArray(formConfig)) {
      formConfig.forEach(f => {
        const label = f?.label?.trim();
        if (label && !excluded.has(label) && !seen.has(label)) {
          seen.add(label);
          headers.push(label);
        }
      });
    }

    registrants.forEach(r => {
      if (r.answers && typeof r.answers === 'object') {
        Object.keys(r.answers).forEach(k => {
          const label = k.trim();
          if (label && !excluded.has(label) && !seen.has(label)) {
            seen.add(label);
            headers.push(label);
          }
        });
      }
    });

    return headers;
  };

  // Helper to extract unique values for any column dynamically
  const getColumnUniqueValues = (columnKey: string) => {
    const counts: Record<string, number> = {};

    if (columnKey === 'status') {
      registrants.forEach(r => {
        const val = r.status || 'unknown';
        counts[val] = (counts[val] || 0) + 1;
      });
      const statusLabels: Record<string, string> = {
        approved: 'מאושר',
        pending: 'ממתין',
        rejected: 'נדחה',
        rsvp: 'מגיע/ה'
      };
      return Object.entries(counts).map(([val, count]) => ({
        value: val,
        label: statusLabels[val] || val,
        count
      }));
    }

    if (columnKey === 'attended') {
      registrants.forEach(r => {
        const val = r.attended === true ? 'true' : r.attended === false ? 'false' : 'null';
        counts[val] = (counts[val] || 0) + 1;
      });
      const attendanceLabels: Record<string, string> = {
        'true': 'הגיע בפועל',
        'false': 'לא הגיע',
        'null': 'טרם סומן'
      };
      return Object.entries(counts).map(([val, count]) => ({
        value: val,
        label: attendanceLabels[val] || val,
        count
      }));
    }

    // Dynamic question columns
    registrants.forEach(r => {
      const raw = r.answers?.[columnKey];
      const val = (raw === undefined || raw === null || String(raw).trim() === '') ? '__EMPTY__' : String(raw).trim();
      counts[val] = (counts[val] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([val, count]) => ({
        value: val,
        label: val === '__EMPTY__' ? '(ללא מענה / ריק)' : val,
        count
      }));
  };

  // Dynamic filtered and sorted registrants
  const filteredRegistrants = registrants
    .filter(reg => {
      // 1. Global text search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const name = getName(reg).toLowerCase();
        const phone = getPhone(reg).toLowerCase();
        const note = (reg.admin_note || '').toLowerCase();
        const answersStr = Object.values(reg.answers || {}).map(v => String(v)).join(' ').toLowerCase();
        if (!name.includes(q) && !phone.includes(q) && !note.includes(q) && !answersStr.includes(q)) {
          return false;
        }
      }

      // 2. Dynamic column filters
      for (const [colKey, filterVal] of Object.entries(columnFilters)) {
        if (!filterVal) continue;

        if (colKey === 'status') {
          if (reg.status !== filterVal) return false;
        } else if (colKey === 'attended') {
          const val = reg.attended === true ? 'true' : reg.attended === false ? 'false' : 'null';
          if (val !== filterVal) return false;
        } else {
          // Dynamic question column
          const raw = reg.answers?.[colKey];
          const val = (raw === undefined || raw === null || String(raw).trim() === '') ? '__EMPTY__' : String(raw).trim();
          if (val !== filterVal) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const { key, direction } = sortConfig;
      const mult = direction === 'asc' ? 1 : -1;

      if (key === 'name') {
        return getName(a).localeCompare(getName(b), 'he') * mult;
      }
      if (key === 'status') {
        return (a.status || '').localeCompare(b.status || '', 'he') * mult;
      }
      if (key === 'attended') {
        const aVal = a.attended === true ? 2 : a.attended === false ? 0 : 1;
        const bVal = b.attended === true ? 2 : b.attended === false ? 0 : 1;
        return (aVal - bVal) * mult;
      }
      if (key === 'phone') {
        return getPhone(a).localeCompare(getPhone(b)) * mult;
      }
      if (key === 'created_at') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * mult;
      }

      // Dynamic question sorting
      const aVal = String(a.answers?.[key] ?? '');
      const bVal = String(b.answers?.[key] ?? '');
      return aVal.localeCompare(bVal, 'he', { numeric: true }) * mult;
    });

  const setColumnFilter = (columnKey: string, value: string | null) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      if (!value) delete next[columnKey];
      else next[columnKey] = value;
      return next;
    });
    setActiveColumnMenu(null);
  };

  const toggleSort = (columnKey: string, direction?: 'asc' | 'desc') => {
    if (direction) {
      setSortConfig({ key: columnKey, direction });
    } else {
      setSortConfig(prev => {
        if (prev.key === columnKey) {
          return { key: columnKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { key: columnKey, direction: 'asc' };
      });
    }
    setActiveColumnMenu(null);
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchQuery('');
    setSortConfig({ key: 'created_at', direction: 'desc' });
    setActiveColumnMenu(null);
  };

  const activeFilterCount = Object.keys(columnFilters).length + (searchQuery.trim() ? 1 : 0);

  // 1. Export to CSV (Exports current filtered & sorted list)
  const exportToCSV = () => {
    if (filteredRegistrants.length === 0) {
      toast.error('אין נרשמים לייצוא בסינון הנוכחי');
      return;
    }
    const qHeaders = getQuestionHeaders();
    const headers = ['מספר', 'שם מלא', 'טלפון', 'סטטוס', 'נוכחות בפועל', ...qHeaders, 'הערת מנהל', 'תאריך הרשמה'];

    const rows = filteredRegistrants.map((reg, idx) => {
      const statusMap: Record<string, string> = { approved: 'מאושר', pending: 'ממתין', rejected: 'נדחה', rsvp: 'מגיע' };
      const statusText = statusMap[reg.status] || reg.status;
      const attendanceText = reg.attended === true ? 'הגיע' : reg.attended === false ? 'לא הגיע' : 'לא סומן';

      const qValues = qHeaders.map(qh => {
        const val = reg.answers?.[qh] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });

      return [
        idx + 1,
        `"${getName(reg).replace(/"/g, '""')}"`,
        `"${getPhone(reg).replace(/"/g, '""')}"`,
        `"${statusText}"`,
        `"${attendanceText}"`,
        ...qValues,
        `"${(reg.admin_note || '').replace(/"/g, '""')}"`,
        `"${new Date(reg.created_at).toLocaleString('he-IL')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = (eventTitle || 'event').replace(/[^a-zA-Z0-9\u0590-\u05FF_-]/g, '_');
    link.setAttribute('download', `נרשמים_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(
      activeFilterCount > 0 
        ? `קובץ עם ${filteredRegistrants.length} נרשמים מסוננים הורד בהצלחה!` 
        : 'קובץ נרשמים הורד בהצלחה!'
    );
    setShowExportMenu(false);
  };

  // 2. Copy formatted table for instant paste in Google Sheets
  const copyForGoogleSheets = async () => {
    if (filteredRegistrants.length === 0) {
      toast.error('אין נרשמים להעתקה בסינון הנוכחי');
      return;
    }
    const qHeaders = getQuestionHeaders();
    const headers = ['מספר', 'שם מלא', 'טלפון', 'סטטוס', 'נוכחות בפועל', ...qHeaders, 'הערת מנהל', 'תאריך הרשמה'];

    const rows = filteredRegistrants.map((reg, idx) => {
      const statusMap: Record<string, string> = { approved: 'מאושר', pending: 'ממתין', rejected: 'נדחה', rsvp: 'מגיע' };
      const statusText = statusMap[reg.status] || reg.status;
      const attendanceText = reg.attended === true ? 'הגיע' : reg.attended === false ? 'לא הגיע' : 'לא סומן';

      const qValues = qHeaders.map(qh => {
        const val = reg.answers?.[qh] ?? '';
        return String(val).replace(/\t|\r|\n/g, ' ');
      });

      return [
        idx + 1,
        getName(reg).replace(/\t|\r|\n/g, ' '),
        getPhone(reg).replace(/\t|\r|\n/g, ' '),
        statusText,
        attendanceText,
        ...qValues,
        (reg.admin_note || '').replace(/\t|\r|\n/g, ' '),
        new Date(reg.created_at).toLocaleString('he-IL')
      ].join('\t');
    });

    const tsvContent = [headers.join('\t'), ...rows].join('\n');
    try {
      await navigator.clipboard.writeText(tsvContent);
      toast.success(
        activeFilterCount > 0 
          ? `הועתקו ${filteredRegistrants.length} שורות מסוננות! לחצו Ctrl+V בגוגל שיטס` 
          : 'הנתונים הועתקו ללוח! לחצו Ctrl+V בגוגל שיטס'
      );
    } catch {
      toast.error('שגיאה בהעתקה ללוח');
    }
    setShowExportMenu(false);
  };

  // Reusable Column Header Renderer with dynamic Sort & Filter
  const renderColumnHeader = (title: string, columnKey: string, allowFilter = true) => {
    const isFiltered = Boolean(columnFilters[columnKey]);
    const isSorted = sortConfig.key === columnKey;
    const isMenuOpen = activeColumnMenu === columnKey;
    const uniqueValues = allowFilter ? getColumnUniqueValues(columnKey) : [];

    return (
      <th key={columnKey} className={`col-th ${isFiltered ? 'th-filtered' : ''} ${isSorted ? 'th-sorted' : ''}`}>
        <div className="th-header-inner">
          <span 
            className="th-label-clickable" 
            onClick={() => toggleSort(columnKey)} 
            title="לחצו למיון הטור"
          >
            {title}
          </span>
          <div className="th-btn-group">
            {isSorted && (
              <span className="th-sort-arrow" onClick={() => toggleSort(columnKey)} title={sortConfig.direction === 'asc' ? 'מיון עולה' : 'מיון יורד'}>
                {sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              </span>
            )}
            <button
              type="button"
              className={`th-filter-trigger ${isFiltered ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveColumnMenu(isMenuOpen ? null : columnKey);
              }}
              title={`סינון ומיון לפי ${title}`}
            >
              <Filter size={12} />
              {isFiltered && <span className="filter-dot" />}
            </button>
          </div>

          {/* Filter & Sort Popover Dropdown */}
          {isMenuOpen && (
            <>
              <div 
                className="dropdown-backdrop" 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveColumnMenu(null);
                }} 
              />
              <div className="col-menu-popover glass animate-scale-up" onClick={(e) => e.stopPropagation()}>
                <div className="col-menu-top">
                  <div className="col-menu-title">
                    <Filter size={14} color="var(--primary)" />
                    <strong>{title}</strong>
                  </div>
                  <button 
                    type="button" 
                    className="close-popover-btn" 
                    onClick={() => setActiveColumnMenu(null)}
                  >
                    <XIcon size={14} />
                  </button>
                </div>

                {/* Sort options */}
                <div className="col-menu-group">
                  <div className="col-group-title">מיון הטור:</div>
                  <div className="sort-pill-row">
                    <button
                      type="button"
                      className={`sort-pill ${isSorted && sortConfig.direction === 'asc' ? 'active' : ''}`}
                      onClick={() => toggleSort(columnKey, 'asc')}
                    >
                      <ArrowUp size={12} />
                      <span>{columnKey === 'created_at' ? 'מהישן לחדש' : "א' עד ת'"}</span>
                    </button>
                    <button
                      type="button"
                      className={`sort-pill ${isSorted && sortConfig.direction === 'desc' ? 'active' : ''}`}
                      onClick={() => toggleSort(columnKey, 'desc')}
                    >
                      <ArrowDown size={12} />
                      <span>{columnKey === 'created_at' ? 'מהחדש לישן' : "ת' עד א'"}</span>
                    </button>
                  </div>
                </div>

                {/* Filter values */}
                {allowFilter && (
                  <div className="col-menu-group">
                    <div className="col-group-title">
                      <span>סינון לפי ערכים</span>
                      <small>({uniqueValues.length} אפשרויות)</small>
                    </div>
                    <div className="unique-values-list">
                      <button
                        type="button"
                        className={`val-item-btn ${!isFiltered ? 'selected' : ''}`}
                        onClick={() => setColumnFilter(columnKey, null)}
                      >
                        <span className="val-text">הצג הכל (ללא סינון)</span>
                        <span className="val-badge">{registrants.length}</span>
                      </button>

                      {uniqueValues.map(item => {
                        const isSelected = columnFilters[columnKey] === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            className={`val-item-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => setColumnFilter(columnKey, isSelected ? null : item.value)}
                          >
                            <span className="val-text">
                              {isSelected && <Check size={12} style={{ display: 'inline', marginLeft: '4px' }} />}
                              {item.label}
                            </span>
                            <span className="val-badge">{item.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Clear column filter/sort footer */}
                {(isFiltered || isSorted) && (
                  <div className="col-menu-footer">
                    <button
                      type="button"
                      className="reset-col-btn"
                      onClick={() => {
                        setColumnFilter(columnKey, null);
                        if (isSorted) setSortConfig({ key: 'created_at', direction: 'desc' });
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>איפוס סינון ומיון לטור זה</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </th>
    );
  };
  

  const getWhatsappLink = (phone: string, template: string, name: string) => {
    let msg = '';
    if (template === 'approved') msg = waTemplateApproved.replace(/{name}/g, name).replace(/{event}/g, eventTitle);
    else if (template === 'verify') msg = `היי ${name}, ראיתי שנרשמת אלינו לאירוע ${eventTitle}. האם את/ה סטודנט/ית בבר אילן?`;
    else if (template === 'rejected') msg = `היי ${name}, לצערנו ההרשמה לאירוע ${eventTitle} כבר נסגרה. נשמח לראותך בפעמים הבאות!`;
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '972' + cleanPhone.slice(1);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth()+1} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const attended = registrants.filter(r => r.attended === true).length;
  const absent = registrants.filter(r => r.attended === false).length;
  const unmarked = registrants.filter(r => r.attended === null).length;

  const questionHeaders = getQuestionHeaders();

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><Loader2 className="spinner" size={40} style={{ color: 'var(--primary)' }} /></div>;

  return (
    <motion.div className="admin-registrants-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="admin-header">
        <div className="header-titles">
          <button className="back-btn" onClick={() => navigate('/admin')}>
            <ArrowRight size={20} />
            <span>חזרה ללוח בקרה</span>
          </button>
          <h1 style={{ marginTop: '0.5rem' }}>ניהול אירוע: {eventTitle}</h1>
          {eventDate && (
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              {(() => {
                const { gregorian, hebrewDate } = formatHebrewDate(eventDate);
                return hebrewDate ? `${gregorian} | ${hebrewDate}` : gregorian;
              })()}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Export to Google Sheets / Excel */}
          <div className="export-menu-wrapper">
            <button 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#107c41', borderColor: '#107c41' }}
              onClick={() => setShowExportMenu(prev => !prev)}
            >
              <FileSpreadsheet size={16} />
              <span>ייצוא לגוגל שיטס / אקסל</span>
            </button>
            {showExportMenu && (
              <>
                <div 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="export-dropdown glass" style={{ zIndex: 100 }}>
                  <button className="export-menu-item" onClick={exportToCSV}>
                    <Download size={18} color="#107c41" />
                    <div className="export-text">
                      <strong>הורדת קובץ CSV (אקסל / שיטס)</strong>
                      <span>קובץ תואם עברית עם עמודה נפרדת לכל שאלה</span>
                    </div>
                  </button>
                  <button className="export-menu-item" onClick={copyForGoogleSheets}>
                    <Copy size={18} color="#2980b9" />
                    <div className="export-text">
                      <strong>העתקה מהירה לגוגל שיטס</strong>
                      <span>מעתיק את כל הטבלה להדבקה מיידית (Ctrl+V)</span>
                    </div>
                  </button>
                  <a 
                    href="https://sheets.new" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="export-menu-item" 
                    onClick={() => setShowExportMenu(false)}
                  >
                    <ExternalLink size={18} color="#8e44ad" />
                    <div className="export-text">
                      <strong>פתיחת גיליון חדש ב-Google Sheets</strong>
                      <span>פותח לשונית חדשה שבה אפשר להדביק מיד</span>
                    </div>
                  </a>
                </div>
              </>
            )}
          </div>

          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate(`/events/${eventId}`)}>
            <Eye size={16} /> צפייה באירוע (סטודנטים)
          </button>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate(`/community?eventId=${eventId}`)}>
            <Image size={16} /> ניהול גלריית קהילה 📸
          </button>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate(`/admin/events/edit/${eventId}`)}>
            <Edit size={16} /> עריכת אירוע
          </button>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate(`/admin/crm`)}>
            <UserCircle size={18} /> CRM סטודנטים
          </button>
        </div>
      </div>

      {/* Stats Cards (Interactive Quick Filters) */}
      <div className="stats-row">
        <div 
          className={`stat-card glass interactive-stat ${activeFilterCount === 0 ? 'stat-active' : ''}`}
          onClick={clearAllFilters}
          title="לחצו להצגת כל הנרשמים"
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-value">
            {registrants.length}{maxRegistrants ? ` / ${maxRegistrants}` : ''}
          </div>
          <div className="stat-label">
            סך נרשמים
            {maxRegistrants && registrants.filter(r => r.status !== 'rejected').length >= maxRegistrants ? ' (מלא 🔒)' : ''}
          </div>
        </div>

        <div 
          className={`stat-card glass interactive-stat ${columnFilters['status'] === 'approved' ? 'stat-active' : ''}`}
          onClick={() => setColumnFilter('status', columnFilters['status'] === 'approved' ? null : 'approved')}
          title="לחצו לסינון מאושרים בלבד"
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-value" style={{ color: '#2ecc71' }}>
            {registrants.filter(r => r.status === 'approved' || r.status === 'rsvp').length}
          </div>
          <div className="stat-label">
            {columnFilters['status'] === 'approved' ? '✓ מאושרים (מסונן)' : 'מאושרים'}
          </div>
        </div>

        <div 
          className={`stat-card glass interactive-stat ${columnFilters['status'] === 'pending' ? 'stat-active' : ''}`}
          onClick={() => setColumnFilter('status', columnFilters['status'] === 'pending' ? null : 'pending')}
          title="לחצו לסינון ממתינים בלבד"
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-value" style={{ color: '#f39c12' }}>
            {registrants.filter(r => r.status === 'pending').length}
          </div>
          <div className="stat-label">
            {columnFilters['status'] === 'pending' ? '✓ ממתינים (מסונן)' : 'ממתינים'}
          </div>
        </div>

        <div 
          className={`stat-card glass interactive-stat ${columnFilters['attended'] === 'true' ? 'stat-active' : ''}`}
          onClick={() => setColumnFilter('attended', columnFilters['attended'] === 'true' ? null : 'true')}
          title="לחצו לסינון מי שהגיע בפועל"
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-value" style={{ color: '#2ecc71' }}>{attended}</div>
          <div className="stat-label">
            {columnFilters['attended'] === 'true' ? '✓ הגיעו בפועל (מסונן)' : 'הגיעו בפועל'}
          </div>
        </div>

        <div 
          className={`stat-card glass interactive-stat ${columnFilters['attended'] === 'false' ? 'stat-active' : ''}`}
          onClick={() => setColumnFilter('attended', columnFilters['attended'] === 'false' ? null : 'false')}
          title="לחצו לסינון מי שלא הגיע"
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-value" style={{ color: '#e74c3c' }}>{absent}</div>
          <div className="stat-label">
            {columnFilters['attended'] === 'false' ? '✓ לא הגיעו (מסונן)' : 'לא הגיעו'}
          </div>
        </div>

        {unmarked > 0 && (
          <div 
            className={`stat-card glass interactive-stat ${columnFilters['attended'] === 'null' ? 'stat-active' : ''}`}
            onClick={() => setColumnFilter('attended', columnFilters['attended'] === 'null' ? null : 'null')}
            title="לחצו לסינון מי שטרם סומן"
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-value" style={{ color: '#aaa' }}>{unmarked}</div>
            <div className="stat-label">
              {columnFilters['attended'] === 'null' ? '✓ לא סומנו (מסונן)' : 'לא סומנו'}
            </div>
          </div>
        )}
      </div>

      {registrants.length === 0 ? (
        <div className="registrants-table-container glass" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <CheckCircle size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
          <h3>אין נרשמים עדיין לאירוע זה</h3>
        </div>
      ) : (
        <div className="registrants-table-container glass">
          {/* Filter & Search Toolbar */}
          <div className="registrants-toolbar glass">
            <div className="toolbar-search-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="חיפוש חופשי (שם, טלפון, הערה, תשובות...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="table-search-input"
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')} title="נקה חיפוש">
                  <XIcon size={14} />
                </button>
              )}
            </div>

            <div className="toolbar-meta">
              <span className="count-pill">
                מוצגים <strong>{filteredRegistrants.length}</strong> מתוך {registrants.length}
              </span>
              {(activeFilterCount > 0 || isSortedNonDefault) && (
                <button className="reset-all-pill-btn" onClick={clearAllFilters} title="איפוס כל הסינונים והמיונים">
                  <RotateCcw size={12} />
                  <span>איפוס סינונים</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          {(activeFilterCount > 0 || isSortedNonDefault) && (
            <div className="active-filters-chips-bar">
              <span className="chips-bar-title">סינונים פעילים:</span>
              
              {searchQuery.trim() && (
                <span className="active-chip">
                  <span className="chip-key">חיפוש:</span>
                  <strong className="chip-val">"{searchQuery.trim()}"</strong>
                  <button className="chip-del" onClick={() => setSearchQuery('')}><XIcon size={12} /></button>
                </span>
              )}

              {Object.entries(columnFilters).map(([colKey, val]) => {
                if (!val) return null;
                let colTitle = colKey;
                if (colKey === 'status') colTitle = 'סטטוס';
                else if (colKey === 'attended') colTitle = 'נוכחות';

                let displayVal = val;
                if (colKey === 'status') {
                  const map: Record<string, string> = { approved: 'מאושר', pending: 'ממתין', rejected: 'נדחה', rsvp: 'מגיע/ה' };
                  displayVal = map[val] || val;
                } else if (colKey === 'attended') {
                  displayVal = val === 'true' ? 'הגיע בפועל' : val === 'false' ? 'לא הגיע' : 'טרם סומן';
                } else if (val === '__EMPTY__') {
                  displayVal = '(ללא מענה)';
                }

                return (
                  <span key={colKey} className="active-chip">
                    <span className="chip-key">{colTitle}:</span>
                    <strong className="chip-val">{displayVal}</strong>
                    <button className="chip-del" onClick={() => setColumnFilter(colKey, null)}><XIcon size={12} /></button>
                  </span>
                );
              })}

              {isSortedNonDefault && (
                <span className="active-chip sort-chip">
                  <span className="chip-key">מיון:</span>
                  <strong className="chip-val">
                    {sortConfig.key === 'name' ? 'שם' :
                     sortConfig.key === 'status' ? 'סטטוס' :
                     sortConfig.key === 'attended' ? 'נוכחות' :
                     sortConfig.key === 'phone' ? 'טלפון' :
                     sortConfig.key === 'created_at' ? 'תאריך הרשמה' :
                     sortConfig.key} ({sortConfig.direction === 'asc' ? 'עולה ↑' : 'יורד ↓'})
                  </strong>
                  <button className="chip-del" onClick={() => setSortConfig({ key: 'created_at', direction: 'desc' })}><XIcon size={12} /></button>
                </span>
              )}
            </div>
          )}

          <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(73,38,145,0.03)', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span>✅ סמן/י מי הגיע בפועל באמצעות כפתורי הנוכחות (היה / לא היה)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="scroll-note">💡 לחצו על כותרת או אייקון סינון בכל טור למיון וסינון מהיר</span>
              <span className="scroll-note">↔ גלילה לרוחב לכל השאלות</span>
            </div>
          </div>
          
          <div className="table-responsive-wrapper">
            <table className="registrants-table">
              <thead>
                <tr>
                  {renderColumnHeader('שם מלא', 'name', false)}
                  {renderColumnHeader('סטטוס', 'status', true)}
                  <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>פעולות</th>
                  {renderColumnHeader('נוכחות', 'attended', true)}
                  {renderColumnHeader('טלפון', 'phone', false)}
                  <th>הערה</th>
                  {questionHeaders.map(qh => renderColumnHeader(qh, qh, true))}
                  {renderColumnHeader('הרשמה', 'created_at', false)}
                </tr>
              </thead>
              <tbody>
                {filteredRegistrants.length === 0 ? (
                  <tr>
                    <td colSpan={7 + questionHeaders.length} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                      <Filter size={36} style={{ opacity: 0.3, margin: '0 auto 0.75rem', display: 'block', color: 'var(--primary)' }} />
                      <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>לא נמצאו נרשמים התואמים את הסינון הנוכחי</h4>
                      <p style={{ margin: '0 0 1rem', fontSize: '0.88rem' }}>נסו להסיר את הסינון או ללחוץ על איפוס סינונים</p>
                      <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }} onClick={clearAllFilters}>
                        <RotateCcw size={13} style={{ marginLeft: '6px' }} /> איפוס כל הסינונים
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredRegistrants.map(reg => {
                  const isDup = checkIsDuplicate(reg);
                  return (
                    <tr key={reg.id} style={{ background: reg.attended === false ? 'rgba(231,76,60,0.04)' : reg.attended === true ? 'rgba(46,204,113,0.04)' : undefined }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            style={{ background: 'none', border: 'none', cursor: reg.profiles?.id ? 'pointer' : 'default', color: reg.profiles?.id ? 'var(--primary)' : 'inherit', fontWeight: '700', padding: 0, textDecoration: reg.profiles?.id ? 'underline' : 'none', textAlign: 'right', whiteSpace: 'nowrap' }}
                            onClick={() => reg.profiles?.id && navigate(`/admin/crm/${reg.profiles.id}`)}
                          >
                            {getName(reg)}
                          </button>
                          {isDup && (
                            <span className="duplicate-tag" title="זוהתה הרשמה נוספת עם אותו טלפון או משתמש באירוע זה">
                              <AlertTriangle size={11} /> כפיל
                            </span>
                          )}
                        </div>
                      </td>

                      {/* סטטוס */}
                      <td>
                        <span className={`status-badge status-${reg.status}`}>
                          {reg.status === 'pending' && <><Clock size={14} /> ממתין</>}
                          {reg.status === 'approved' && <><CheckCircle size={14} /> מאושר</>}
                          {reg.status === 'rejected' && <><XCircle size={14} /> נדחה</>}
                          {reg.status === 'rsvp' && <><CheckCircle size={14} /> מגיע/ה</>}
                        </span>

                        {reg.status === 'pending' && (
                          <div className="status-action-row">
                            <button className="icon-btn approve-btn" title="אשר הרשמה" onClick={() => updateStatus(reg.id, 'approved')}><UserCheck size={16} /></button>
                            <button className="icon-btn reject-btn" title="דחה הרשמה" onClick={() => updateStatus(reg.id, 'rejected')}><XCircle size={16} /></button>
                          </div>
                        )}

                        {(reg.status === 'approved' || reg.status === 'rsvp') && (
                          <div className="status-action-row">
                            <button 
                              className="revert-btn" 
                              title="ביטול אישור הרשמה" 
                              onClick={() => setRevertConfirmTarget(reg)}
                            >
                              <RotateCcw size={12} />
                              <span>ביטול אישור</span>
                            </button>
                            <button 
                              className="icon-btn reject-btn" 
                              title="דחה הרשמה" 
                              onClick={() => updateStatus(reg.id, 'rejected')}
                              style={{ padding: '0.2rem 0.35rem' }}
                            >
                              <XCircle size={13} />
                            </button>
                          </div>
                        )}

                        {reg.status === 'rejected' && (
                          <div className="status-action-row">
                            <button 
                              className="revert-btn" 
                              title="החזרה לסטטוס ממתין" 
                              onClick={() => updateStatus(reg.id, 'pending')}
                            >
                              <RotateCcw size={12} />
                              <span>החזר להמתנה</span>
                            </button>
                            <button 
                              className="icon-btn approve-btn" 
                              title="אשר הרשמה" 
                              onClick={() => updateStatus(reg.id, 'approved')}
                              style={{ padding: '0.2rem 0.35rem' }}
                            >
                              <UserCheck size={14} />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* פעולות */}
                      <td className="actions-cell">
                        {/* וואטסאפ */}
                        <div className="whatsapp-dropdown-container">
                          <button className="icon-btn wa-btn" title="וואטסאפ" onClick={() => setActiveWhatsappMenu(activeWhatsappMenu === reg.id ? null : reg.id)}>
                            <MessageCircle size={16} />
                          </button>
                          {activeWhatsappMenu === reg.id && (
                            <>
                              <div
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
                                onClick={() => setActiveWhatsappMenu(null)}
                              />
                              <div className="whatsapp-dropdown menu-active" style={{ zIndex: 100 }}>
                                <div className="dropdown-title">תבניות הודעה:</div>
                                <a href={getWhatsappLink(getPhone(reg), 'approved', getName(reg))} target="_blank" rel="noreferrer" className="wa-dropdown-item" onClick={() => setActiveWhatsappMenu(null)}>✅ אישור השתתפות</a>
                                <a href={getWhatsappLink(getPhone(reg), 'verify', getName(reg))} target="_blank" rel="noreferrer" className="wa-dropdown-item" onClick={() => setActiveWhatsappMenu(null)}>❓ בירור סטודנט/ית</a>
                                <a href={getWhatsappLink(getPhone(reg), 'rejected', getName(reg))} target="_blank" rel="noreferrer" className="wa-dropdown-item" onClick={() => setActiveWhatsappMenu(null)}>❌ הרשמה נסגרה</a>
                              </div>
                            </>
                          )}
                        </div>

                        {/* מחיקת שורה */}
                        <button 
                          className="icon-btn delete-btn" 
                          title="מחק הרשמה זו" 
                          onClick={() => setDeleteConfirmTarget(reg)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>

                      {/* נוכחות */}
                      <td>
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          <button
                            title="היה"
                            onClick={() => markAttendance(reg.id, reg.attended === true ? null : true)}
                            style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid', borderColor: reg.attended === true ? '#2ecc71' : '#ddd', background: reg.attended === true ? '#2ecc71' : 'white', color: reg.attended === true ? 'white' : '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', padding: 0 }}
                          >
                            <Check size={12} />
                          </button>
                          <button
                            title="לא היה"
                            onClick={() => markAttendance(reg.id, reg.attended === false ? null : false)}
                            style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid', borderColor: reg.attended === false ? '#e74c3c' : '#ddd', background: reg.attended === false ? '#e74c3c' : 'white', color: reg.attended === false ? 'white' : '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', padding: 0 }}
                          >
                            <XIcon size={12} />
                          </button>
                        </div>
                      </td>

                      {/* טלפון */}
                      <td dir="ltr" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{getPhone(reg)}</td>

                      {/* הערה */}
                      <td>
                        {editingNote === reg.id ? (
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <input autoFocus type="text" value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveNote(reg.id)} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', border: '1px solid var(--primary)', borderRadius: '6px', width: '120px' }} />
                            <button onClick={() => saveNote(reg.id)} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>✓</button>
                            <button onClick={() => setEditingNote(null)} style={{ background: '#eee', border: 'none', borderRadius: '6px', padding: '0.2rem 0.4rem', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingNote(reg.id); setNoteText(reg.admin_note || ''); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: reg.admin_note ? 'var(--primary)' : '#bbb', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            title={reg.admin_note || 'הוסף הערה'}
                          >
                            <StickyNote size={14} />
                            <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.admin_note || 'הערה'}</span>
                          </button>
                        )}
                      </td>

                      {/* עמודות דינמיות - עמודה נפרדת לכל שאלה */}
                      {questionHeaders.map(qh => {
                        const val = reg.answers?.[qh];
                        const hasVal = val !== undefined && val !== null && String(val).trim() !== '';
                        const strVal = String(val ?? '');
                        const isYes = strVal === 'כן' || strVal === 'true';
                        const isNo = strVal === 'לא' || strVal === 'false';
                        return (
                          <td key={qh} className="question-col-cell">
                            {hasVal ? (
                              <span className={`answer-cell-badge ${isYes ? 'badge-yes' : isNo ? 'badge-no' : ''}`}>
                                {strVal}
                              </span>
                            ) : (
                              <span className="answer-cell-empty">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* הרשמה */}
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(reg.created_at)}</td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* מודאל אישור מחיקה מעוצב */}
      {deleteConfirmTarget && (
        <div className="custom-modal-overlay" onClick={() => !deleting && setDeleteConfirmTarget(null)}>
          <motion.div 
            className="custom-confirm-modal glass"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-danger-icon">
              <Trash2 size={32} />
            </div>
            <h3 style={{ margin: '0.5rem 0', fontSize: '1.3rem', color: 'var(--text-primary)' }}>מחיקת הרשמה</h3>
            <p style={{ margin: '0.5rem 0', color: 'var(--text-primary)', fontSize: '1rem' }}>
              האם את/ה בטוח/ה שברצונך למחוק את שורת ההרשמה של:
            </p>
            <div style={{ background: 'rgba(73,38,145,0.06)', padding: '0.75rem 1rem', borderRadius: '10px', margin: '0.5rem 0 1rem' }}>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)', display: 'block' }}>
                {getName(deleteConfirmTarget)}
              </strong>
              {getPhone(deleteConfirmTarget) !== '—' && (
                <span dir="ltr" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {getPhone(deleteConfirmTarget)}
                </span>
              )}
            </div>
            <p style={{ margin: '0 0 1.5rem', color: '#c0392b', fontSize: '0.85rem', background: 'rgba(231,76,60,0.08)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
              ⚠️ פעולה זו תסיר את שורת הנרשם לצמיתות ותעדכן את סך הנרשמים באירוע.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={deleting}
                style={{ minWidth: '100px' }}
              >
                ביטול
              </button>
              <button 
                className="btn" 
                style={{ background: '#e74c3c', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '130px', justifyContent: 'center' }}
                onClick={handleDeleteRegistration}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="spinner" size={16} /> : <><Trash2 size={16} /> מחק לצמיתות</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* מודאל ביטול אישור הרשמה מעוצב */}
      {revertConfirmTarget && (
        <div className="custom-modal-overlay" onClick={() => !reverting && setRevertConfirmTarget(null)}>
          <motion.div 
            className="custom-confirm-modal glass"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-warning-icon">
              <RotateCcw size={30} />
            </div>
            <h3 style={{ margin: '0.5rem 0', fontSize: '1.3rem', color: 'var(--text-primary)' }}>ביטול אישור הרשמה</h3>
            <p style={{ margin: '0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              ברצונך לבטל את אישור ההרשמה של:
            </p>
            <div style={{ background: 'rgba(73,38,145,0.06)', padding: '0.75rem 1rem', borderRadius: '10px', margin: '0.5rem 0 1rem' }}>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)', display: 'block' }}>
                {getName(revertConfirmTarget)}
              </strong>
              {getPhone(revertConfirmTarget) !== '—' && (
                <span dir="ltr" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {getPhone(revertConfirmTarget)}
                </span>
              )}
            </div>
            <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              הסטטוס יוחזר ל־<strong>ממתין</strong>. האם לעדכן את הסטודנט בהתראה לטלפון?
            </p>

            <div className="revert-modal-actions">
              <button 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 1rem', fontWeight: '700' }}
                onClick={() => handleRevertApproval(true)}
                disabled={reverting}
              >
                {reverting ? <Loader2 className="spinner" size={16} /> : <><Bell size={16} /><span>כן, בטל ושלח התראה לסטודנט</span></>}
              </button>

              <button 
                className="btn btn-outline" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 1rem', borderColor: 'rgba(234, 88, 12, 0.4)', color: '#ea580c', fontWeight: '600' }}
                onClick={() => handleRevertApproval(false)}
                disabled={reverting}
              >
                {reverting ? <Loader2 className="spinner" size={16} /> : <><BellOff size={16} /><span>ביטול שקט (ללא שליחת התראה)</span></>}
              </button>

              <button 
                className="btn" 
                style={{ background: '#f1f2f6', color: '#555', border: 'none', width: '100%', padding: '0.55rem 1rem', marginTop: '0.25rem' }}
                onClick={() => setRevertConfirmTarget(null)}
                disabled={reverting}
              >
                חזרה
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminRegistrants;
