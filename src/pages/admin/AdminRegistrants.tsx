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
  BellOff
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
    gender: string;
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
          id, status, guest_name, guest_phone, answers, created_at, attended, admin_note,
          profiles (id, full_name, phone)
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

  // 1. Export to CSV (Compatible with Excel & Google Sheets)
  const exportToCSV = () => {
    if (registrants.length === 0) {
      toast.error('אין נרשמים לייצוא');
      return;
    }
    const qHeaders = getQuestionHeaders();
    const headers = ['מספר', 'שם מלא', 'טלפון', 'סטטוס', 'נוכחות בפועל', ...qHeaders, 'הערת מנהל', 'תאריך הרשמה'];

    const rows = registrants.map((reg, idx) => {
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
    toast.success('קובץ נרשמים הורד בהצלחה!');
    setShowExportMenu(false);
  };

  // 2. Copy formatted table for instant paste in Google Sheets
  const copyForGoogleSheets = async () => {
    if (registrants.length === 0) {
      toast.error('אין נרשמים להעתקה');
      return;
    }
    const qHeaders = getQuestionHeaders();
    const headers = ['מספר', 'שם מלא', 'טלפון', 'סטטוס', 'נוכחות בפועל', ...qHeaders, 'הערת מנהל', 'תאריך הרשמה'];

    const rows = registrants.map((reg, idx) => {
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
      toast.success('הנתונים הועתקו ללוח! לחץ/י Ctrl+V בגוגל שיטס');
    } catch {
      toast.error('שגיאה בהעתקה ללוח');
    }
    setShowExportMenu(false);
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

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card glass">
          <div className="stat-value">
            {registrants.length}{maxRegistrants ? ` / ${maxRegistrants}` : ''}
          </div>
          <div className="stat-label">
            סך נרשמים
            {maxRegistrants && registrants.filter(r => r.status !== 'rejected').length >= maxRegistrants ? ' (מלא 🔒)' : ''}
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-value" style={{ color: '#2ecc71' }}>{registrants.filter(r => r.status === 'approved' || r.status === 'rsvp').length}</div>
          <div className="stat-label">מאושרים</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-value" style={{ color: '#f39c12' }}>{registrants.filter(r => r.status === 'pending').length}</div>
          <div className="stat-label">ממתינים</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-value" style={{ color: '#2ecc71' }}>{attended}</div>
          <div className="stat-label">הגיעו בפועל</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-value" style={{ color: '#e74c3c' }}>{absent}</div>
          <div className="stat-label">לא הגיעו</div>
        </div>
        {unmarked > 0 && (
          <div className="stat-card glass">
            <div className="stat-value" style={{ color: '#aaa' }}>{unmarked}</div>
            <div className="stat-label">לא סומנו</div>
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
          <div style={{ padding: '1rem 1.5rem', background: 'rgba(73,38,145,0.05)', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span>✅ סמן/י מי הגיע בפועל באמצעות כפתורי הנוכחות (היה / לא היה)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="scroll-note">💡 גלילה לרוחב לצפייה בכל עמודות השאלות</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>סה"כ {registrants.length} נרשמים</span>
            </div>
          </div>
          
          <div className="table-responsive-wrapper">
            <table className="registrants-table">
              <thead>
                <tr>
                  <th>שם מלא</th>
                  <th>סטטוס</th>
                  <th>פעולות</th>
                  <th>נוכחות</th>
                  <th>טלפון</th>
                  <th>הערה</th>
                  {questionHeaders.map(qh => (
                    <th key={qh} className="question-col-header" title={qh}>
                      {qh}
                    </th>
                  ))}
                  <th>הרשמה</th>
                </tr>
              </thead>
              <tbody>
                {registrants.map(reg => {
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
                })}
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
