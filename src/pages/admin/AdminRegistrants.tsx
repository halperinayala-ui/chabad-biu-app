import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, XCircle, Clock, MessageCircle, UserCheck, Loader2, Check, X as XIcon, UserCircle, StickyNote, Eye, Edit, Image } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
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
  const [loading, setLoading] = useState(true);
  const [activeWhatsappMenu, setActiveWhatsappMenu] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [waTemplateApproved, setWaTemplateApproved] = useState('היי {name}, איזה כיף שנרשמת לאירוע {event}! אנחנו מחכים לך.');
  

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
        .select('title, event_date')
        .eq('id', eventId)
        .single();
      if (eventData) {
        setEventTitle(eventData.title);
        setEventDate(eventData.event_date);
        // isPastEvent: true if event date is today or earlier
        const today = new Date();
        today.setHours(0, 0, 0, 0);
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

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.from('registrations').update({ status }).eq('id', id);
      if (error) throw error;
      
      const updatedReg = registrants.find(r => r.id === id);
      setRegistrants(registrants.map(r => r.id === id ? { ...r, status } : r));
      toast.success(status === 'approved' ? 'ההרשמה אושרה' : 'ההרשמה נדחתה');
      
      // Trigger Push Notification
      if (updatedReg && updatedReg.profiles?.id) {
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

  const getName = (reg: Registrant) => reg.profiles?.full_name || reg.guest_name || '—';
  const getPhone = (reg: Registrant) => reg.profiles?.phone || reg.guest_phone || '—';
  

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
          {eventDate && <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{eventDate.split('-').reverse().join('.')}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
          <div className="stat-value">{registrants.length}</div>
          <div className="stat-label">סך נרשמים</div>
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
          <div style={{ padding: '1rem 1.5rem', background: 'rgba(73,38,145,0.05)', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            ✅ סמן/י מי הגיע בפועל באמצעות כפתורי הנוכחות (היה / לא היה)
          </div>
          <table className="registrants-table">
            <thead>
              <tr>
                <th>שם מלא</th>
                <th>סטטוס</th>
                <th>נוכחות</th>
                <th>פעולות</th>
                <th>טלפון</th>
                <th>הערה</th>
                <th>תשובות</th>
                <th>הרשמה</th>
              </tr>
            </thead>
            <tbody>
              {registrants.map(reg => (
                <tr key={reg.id} style={{ background: reg.attended === false ? 'rgba(231,76,60,0.04)' : reg.attended === true ? 'rgba(46,204,113,0.04)' : undefined }}>
                  <td>
                    <button
                      style={{ background: 'none', border: 'none', cursor: reg.profiles?.id ? 'pointer' : 'default', color: reg.profiles?.id ? 'var(--primary)' : 'inherit', fontWeight: '700', padding: 0, textDecoration: reg.profiles?.id ? 'underline' : 'none' }}
                      onClick={() => reg.profiles?.id && navigate(`/admin/crm/${reg.profiles.id}`)}
                    >
                      {getName(reg)}
                    </button>
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
                      <div className="approval-actions" style={{ marginTop: '0.4rem' }}>
                        <button className="icon-btn approve-btn" title="אשר" onClick={() => updateStatus(reg.id, 'approved')}><UserCheck size={16} /></button>
                        <button className="icon-btn reject-btn" title="דחה" onClick={() => updateStatus(reg.id, 'rejected')}><XCircle size={16} /></button>
                      </div>
                    )}
                  </td>

                  {/* נוכחות */}
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        title="היה"
                        onClick={() => markAttendance(reg.id, reg.attended === true ? null : true)}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid', borderColor: reg.attended === true ? '#2ecc71' : '#ddd', background: reg.attended === true ? '#2ecc71' : 'white', color: reg.attended === true ? 'white' : '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        title="לא היה"
                        onClick={() => markAttendance(reg.id, reg.attended === false ? null : false)}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid', borderColor: reg.attended === false ? '#e74c3c' : '#ddd', background: reg.attended === false ? '#e74c3c' : 'white', color: reg.attended === false ? 'white' : '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  </td>

                  {/* פעולות */}
                  <td className="actions-cell">
                    <div className="whatsapp-dropdown-container">
                      <button className="icon-btn wa-btn" title="וואטסאפ" onClick={() => setActiveWhatsappMenu(activeWhatsappMenu === reg.id ? null : reg.id)}>
                        <MessageCircle size={18} />
                      </button>
                      {activeWhatsappMenu === reg.id && (
                        <div className="whatsapp-dropdown menu-active">
                          <div className="dropdown-title">תבניות הודעה:</div>
                          <a href={getWhatsappLink(getPhone(reg), 'approved', getName(reg))} target="_blank" rel="noreferrer" className="wa-dropdown-item">✅ אישור השתתפות</a>
                          <a href={getWhatsappLink(getPhone(reg), 'verify', getName(reg))} target="_blank" rel="noreferrer" className="wa-dropdown-item">❓ בירור סטודנט/ית</a>
                          <a href={getWhatsappLink(getPhone(reg), 'rejected', getName(reg))} target="_blank" rel="noreferrer" className="wa-dropdown-item">❌ הרשמה נסגרה</a>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* טלפון */}
                  <td dir="ltr" style={{ textAlign: 'right' }}>{getPhone(reg)}</td>

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

                  {/* תשובות */}
                  <td>
                    {reg.answers && Object.entries(reg.answers).length > 0
                      ? Object.entries(reg.answers).map(([key, val]) => (
                          <span key={key} className="answer-badge" title={key}>{String(val)}</span>
                        ))
                      : <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>
                    }
                  </td>

                  {/* הרשמה */}
                  <td>{formatDate(reg.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default AdminRegistrants;
