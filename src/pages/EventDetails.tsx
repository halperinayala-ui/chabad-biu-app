import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, MapPin, ArrowRight, Image as ImageIcon, Loader2, CheckCircle2, XCircle, Settings, Share, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './EventDetails.css';

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string;
}

interface EventData {
  id: string;
  title: string;
  category: string;
  event_date: string;
  event_time: string;
  location: string;
  description: string;
  header_image_url: string;
  flyer_image_url: string;
  requires_approval: boolean;
  max_registrants: number | null;
  closed_message: string;
  form_config: FormField[];
  tags: string[];
  registration_mode: 'form' | 'rsvp' | 'none';
  registration_deadline: string | null;
  registration_start: string | null;
  audience?: string;
}

interface Registration {
  id: string;
  status: string;
}

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myRegistration, setMyRegistration] = useState<Registration | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [guestStatus, setGuestStatus] = useState('');
  const [guestStatusDetails, setGuestStatusDetails] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (event && user) {
      checkExistingRegistration();
    }
  }, [event, user]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
      if (error) throw error;
      setEvent(data);
    } catch (err) {
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingRegistration = async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from('registrations')
      .select('id, status')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setMyRegistration(data);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setSubmitting(true);
    try {
      const formData = new FormData(formRef.current!);
      const answers: Record<string, any> = {};
      
      // Collect only the dynamic form field answers (NOT name/phone – those are in the profile)
      event.form_config?.forEach(field => {
        if (field.type === 'checkbox') {
          const val = formData.get(`field_${field.id}`);
          if (val) answers[field.label] = val;
        } else {
          const val = formData.get(`field_${field.id}`);
          if (val) answers[field.label] = val;
        }
      });

      const eventAud = Array.isArray(event.audience) ? event.audience : [];
      const isEffectivelyOpen = eventAud.length === 0 || (eventAud.includes('student') && eventAud.includes('graduate') && eventAud.includes('other'));

      const isRestrictedGuest = !user && !isEffectivelyOpen;
      const requiresManualApproval = event.requires_approval || isRestrictedGuest;
      const payload: any = {
        event_id: event.id,
        status: requiresManualApproval ? 'pending' : 'approved',
        answers,
      };

      if (user) {
        payload.user_id = user.id;
      } else {
        // Guest validation
        if (!isEffectivelyOpen) {
          if (!guestStatus || !eventAud.includes(guestStatus)) {
            toast.error('האירוע אינו מיועד לקבוצת היעד שסימנת. לא ניתן להשלים הרשמה.');
            setSubmitting(false);
            return;
          }
        }
        payload.guest_name = formData.get('guest_name');
        payload.guest_phone = formData.get('guest_phone');
        if (guestStatus) {
          const labels: Record<string, string> = { student: 'סטודנט/ית', graduate: 'בוגר/ת', other: 'אחר' };
          answers['סטטוס'] = labels[guestStatus] || guestStatus;
          if (guestStatus === 'student' && guestStatusDetails) {
            answers['פירוט לימודים'] = guestStatusDetails;
          }
        }
      }

      const { data, error } = await supabase.from('registrations').insert(payload).select('id, status').single();
      if (error) throw error;

      setMyRegistration(data);
      toast.success(requiresManualApproval ? 'בקשתך נשלחה! נחזור אליך בקרוב.' : 'נרשמת בהצלחה! נתראה באירוע 🎉');
      
      // Trigger Admin Notification (if logged in)
      if (user) {
        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;
          if (token) {
            const userName = profile?.full_name || 'משתמש';
            fetch('/api/notify-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                title: 'נרשם חדש לאירוע!',
                body: `${userName} נרשם לאירוע: ${event.title}`,
                url: `https://chabad-biu-app.vercel.app/admin/events/${event.id}/registrants`,
                targetRole: 'admin'
              })
            }).catch(e => console.error(e));
          }
        } catch (e) { console.error(e); }
      }
    } catch (err: any) {
      console.error('Error registering:', err);
      toast.error('שגיאה בהרשמה: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRSVP = async () => {
    if (!user) {
      toast.error('אנא התחברי כדי לאשר הגעה');
      navigate('/auth');
      return;
    }
    if (!event) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('registrations').insert({
        event_id: event.id,
        user_id: user.id,
        status: event.requires_approval ? 'pending' : 'rsvp',
        answers: {},
      }).select('id, status').single();
      if (error) throw error;
      setMyRegistration(data);
      toast.success(profile?.gender === 'female' ? 'אחלה! רשמנו אותך 🎉' : 'אחלה! רשמנו אותך 🎉');

      // Trigger Admin Notification
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (token) {
          const userName = profile?.full_name || 'משתמש';
          fetch('/api/notify-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              title: 'נרשם חדש לאירוע!',
              body: `${userName} נרשם לאירוע: ${event.title}`,
              url: `https://chabad-biu-app.vercel.app/admin/events/${event.id}/registrants`,
              targetRole: 'admin'
            })
          }).catch(e => console.error(e));
        }
      } catch (e) { console.error(e); }
    } catch (err: any) {
      toast.error('שגיאה: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!myRegistration) return;
    if (!confirm('האם אתה בטוח שברצונך לבטל את ההרשמה?')) return;
    
    setCancelling(true);
    try {
      const { error } = await supabase.from('registrations').delete().eq('id', myRegistration.id);
      if (error) throw error;
      setMyRegistration(null);
      toast.success('ההרשמה בוטלה.');

      // Notify admins about cancellation
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (token) {
          const userName = profile?.full_name || 'משתמש';
          fetch('/api/notify-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              title: 'ביטול הרשמה לאירוע',
              body: `${userName} ביטל/ה הרשמה לאירוע: ${event?.title}`,
              url: `https://chabad-biu-app.vercel.app/admin/events/${event?.id}/registrants`,
              targetRole: 'admin'
            })
          }).catch(e => console.error('Cancel notification failed:', e));
        }
      } catch (e) { console.error(e); }

    } catch (err: any) {
      toast.error('שגיאה בביטול: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };


  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><Loader2 className="spinner" size={40} style={{ color: 'var(--primary)' }} /></div>;
  }

  if (!event) {
    return <div style={{ textAlign: 'center', padding: '5rem' }}>האירוע לא נמצא.</div>;
  }

  const isFemale = profile?.gender === 'f';

  // Registration sidebar content
  const renderRegistrationSidebar = () => {
    // Check audience restriction
    const aud: string[] = (event.audience as any) || [];
    const isEffectivelyOpen = aud.length === 0 || (aud.includes('student') && aud.includes('graduate') && aud.includes('other'));
    const userStatus = (profile as any)?.user_status || null;
    let audienceBlocked = false;
    let audienceMsg = '';
    
    if (!isEffectivelyOpen) {
      if (!user) {
        audienceBlocked = false;
        audienceMsg = 'אירוע זה מיועד לקהל יעד מוגדר. אנא ציינו את הסטטוס שלכם בטופס ההרשמה למטה.';
      } else if (!profile?.is_admin) {
        const isVipAllowed = profile?.is_vip && aud.includes('vip');
        if (!userStatus || (!aud.includes(userStatus) && !isVipAllowed)) {
          audienceBlocked = true;
          const labels: Record<string, string> = { student: 'סטודנטים', graduate: 'בוגרים', other: 'אחרים', vip: 'VIP' };
          const groups = aud.map(a => labels[a] || a).filter(a => a !== 'VIP').join(' ו');
          audienceMsg = `אירוע זה מיועד ל${groups} בלבד. לשינוי הסטטוס שלך כנסו לאזור האישי.`;
        }
      }
    }

    // Check if registration hasn't started yet
    if (event.registration_start && new Date() < new Date(event.registration_start)) {
      const startDate = new Date(event.registration_start);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let dateString = startDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
      if (startDate.toDateString() === today.toDateString()) {
        dateString = 'היום';
      } else if (startDate.toDateString() === tomorrow.toDateString()) {
        dateString = 'מחר';
      }

      const timeString = startDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(73, 38, 145, 0.05)', borderRadius: '16px' }}
        >
          <Clock size={48} style={{ color: 'var(--primary)', opacity: 0.7, margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>ההרשמה טרם נפתחה</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            ההרשמה תיפתח <strong>{dateString} בשעה {timeString}</strong>
          </p>
        </motion.div>
      );
    }

    // Check if registration is closed
    if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(231, 76, 60, 0.05)', borderRadius: '16px' }}
        >
          <Clock size={48} style={{ color: '#e74c3c', opacity: 0.5, margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ color: '#e74c3c', marginBottom: '0.5rem' }}>ההרשמה נסגרה</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{event.closed_message || 'ההרשמה לאירוע זה נסגרה. נשמח לראותכם בפעמים הבאות!'}</p>
        </motion.div>
      );
    }

    // Check audience restriction - show blocked banner (but don't hide the event)
    if (audienceBlocked) {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(231,76,60,0.05)', borderRadius: '16px', border: '1px solid rgba(231,76,60,0.15)' }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
          <h3 style={{ color: '#e74c3c', marginBottom: '0.75rem' }}>ההרשמה מוגבלת</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{audienceMsg}</p>
          {!user && (
            <button className="btn btn-secondary" onClick={() => navigate('/auth')} style={{ justifyContent: 'center' }}>
              התחברות / הרשמה
            </button>
          )}
          {user && (
            <button className="btn btn-outline" onClick={() => navigate('/profile')} style={{ justifyContent: 'center' }}>
              עדכון פרופיל אישי
            </button>
          )}
        </motion.div>
      );
    }

    // Already registered state
    if (myRegistration) {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ textAlign: 'center', padding: '2rem' }}
        >
          <CheckCircle2 size={64} style={{ color: '#2ecc71', margin: '0 auto 1.5rem', display: 'block' }} />
          
          <h3 style={{ color: '#27ae60', marginBottom: '0.5rem', fontSize: '1.4rem' }}>
            {isFemale ? 'את רשומה לאירוע!' : 'אתה רשום לאירוע!'}
          </h3>
          
          {myRegistration.status === 'pending' && (
            <div style={{ background: 'rgba(243, 156, 18, 0.1)', border: '1px solid rgba(243, 156, 18, 0.3)', borderRadius: '12px', padding: '1rem', margin: '1.5rem 0', color: '#d35400', fontSize: '0.95rem' }}>
              <Clock size={18} style={{ display: 'inline', marginInlineEnd: '0.4rem', verticalAlign: 'middle' }} />
              ההרשמה ממתינה לאישור מנהל. נעדכן אותך בקרוב!
            </div>
          )}

          {myRegistration.status === 'approved' && (
            <div style={{ background: 'rgba(46, 204, 113, 0.1)', border: '1px solid rgba(46, 204, 113, 0.3)', borderRadius: '12px', padding: '1rem', margin: '1.5rem 0', color: '#27ae60', fontSize: '0.95rem' }}>
              <CheckCircle2 size={18} style={{ display: 'inline', marginInlineEnd: '0.4rem', verticalAlign: 'middle' }} />
              ההרשמה מאושרת! מחכים לך 🎉
            </div>
          )}

          {myRegistration.status === 'rejected' && (
            <div style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: '12px', padding: '1rem', margin: '1.5rem 0', color: '#c0392b', fontSize: '0.95rem' }}>
              <XCircle size={18} style={{ display: 'inline', marginInlineEnd: '0.4rem', verticalAlign: 'middle' }} />
              לצערנו ההרשמה לא אושרה הפעם.
            </div>
          )}

          <button
            className="btn btn-outline"
            style={{ width: '100%', marginTop: '1rem', color: '#e74c3c', borderColor: '#e74c3c' }}
            onClick={handleCancelRegistration}
            disabled={cancelling}
          >
            {cancelling ? <Loader2 className="spinner" size={16} /> : <XCircle size={16} />}
            ביטול ההרשמה
          </button>
        </motion.div>
      );
    }

    // No registration mode
    if (event.registration_mode === 'none') {
      return (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(73, 38, 145, 0.05)', borderRadius: '16px' }}>
          <CalendarDays size={48} style={{ color: 'var(--primary)', opacity: 0.5, margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ color: 'var(--primary)' }}>כניסה חופשית</h3>
          <p>מחכים לכם שם!</p>
        </div>
      );
    }

    // RSVP mode - only for logged in users. Guests get the form.
    if (event.registration_mode === 'rsvp' && user) {
      return (
        <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            לחצו לאישור הגעה מהיר – ללא מילוי טפסים!
          </p>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '1.5rem', fontSize: '1.3rem', borderRadius: '16px', justifyContent: 'center' }}
            onClick={handleRSVP}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="spinner" /> : (isFemale ? '✋ אני מגיעה!' : '✋ אני מגיע!')}
          </button>
          {event.requires_approval && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(243, 156, 18, 0.1)', border: '1px solid rgba(243, 156, 18, 0.3)', borderRadius: '8px', color: '#d35400', fontSize: '0.9rem', textAlign: 'right' }}>
              <Clock size={14} style={{ display: 'inline', marginInlineEnd: '0.4rem' }} />
              ההגעה מותנית באישור מנהל.
            </div>
          )}
        </div>
      );
    }

    // Full form mode (or RSVP for guests)
    return (
      <form ref={formRef} className="dynamic-form" onSubmit={handleFormSubmit}>
        
        {audienceMsg && !audienceBlocked && !user && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(243, 156, 18, 0.1)', border: '1px solid rgba(243, 156, 18, 0.3)', borderRadius: '12px', color: '#d35400', fontSize: '0.95rem' }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>שימו לב: {audienceMsg}</span>
            <div style={{ marginTop: '0.75rem' }}>
              <button type="button" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', borderColor: '#d35400', color: '#d35400', background: 'transparent' }} onClick={() => navigate('/auth')}>
                <span style={{ textDecoration: 'underline' }}>להתחברות לאפליקציה לחץ כאן</span>
              </button>
            </div>
          </div>
        )}

        {/* Guest fields – shown only if not logged in */}
        {!user && (
          <>
            <div className="form-group">
              <label className="form-label">שם מלא <span className="required-star">*</span></label>
              <input type="text" name="guest_name" className="form-control" required />
            </div>
            <div className="form-group">
              <label className="form-label">מספר טלפון <span className="required-star">*</span></label>
              <input type="tel" name="guest_phone" className="form-control" required />
            </div>
            
            <div className="form-group">
              <label className="form-label">סטטוס מול חב״ד בקמפוס <span className="required-star">*</span></label>
              <select 
                className="form-control" 
                required 
                value={guestStatus}
                onChange={(e) => setGuestStatus(e.target.value)}
              >
                <option value="">בחר/י סטטוס...</option>
                <option value="student">סטודנט/ית בבר אילן</option>
                <option value="graduate">בוגר/ת</option>
                <option value="other">אחר</option>
              </select>
            </div>

            {guestStatus === 'student' && (
              <div className="form-group animate-fade-in-up">
                <label className="form-label">מוסד לימודים, תואר ושנת לימוד <span className="required-star">*</span></label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="לדוגמה: בר אילן, מדעי המחשב, שנה ב׳"
                  value={guestStatusDetails}
                  onChange={(e) => setGuestStatusDetails(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        {/* Dynamic form fields */}
        {event.form_config?.map(field => {
          // Skip Name/Phone for logged-in users (pulled from profile)
          if (user && (field.label.includes('שם') || field.label.includes('טלפון'))) return null;

          return (
            <div className="form-group" key={field.id}>
              {field.type !== 'checkbox' && (
                <label className="form-label">
                  {field.label} {field.required && <span className="required-star">*</span>}
                </label>
              )}

              {(field.type === 'text' || field.type === 'tel') && (
                <input type={field.type} name={`field_${field.id}`} className="form-control" required={field.required} />
              )}
              {field.type === 'textarea' && (
                <textarea name={`field_${field.id}`} className="form-control" rows={3} required={field.required} />
              )}
              {field.type === 'select' && (
                <select name={`field_${field.id}`} className="form-control" required={field.required}>
                  <option value="">בחר/י...</option>
                  {field.options?.split(',').map(o => o.trim()).map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )}
              {field.type === 'radio' && (
                <div className="radio-group-container">
                  {field.options?.split(',').map(o => o.trim()).map(o => (
                    <label key={o} className="radio-label" style={{ fontWeight: 'normal', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="radio" name={`field_${field.id}`} value={o} required={field.required} />
                      <span>{o}</span>
                    </label>
                  ))}
                </div>
              )}
              {field.type === 'multi-select' && (
                <div className="checkbox-group-container">
                  {field.options?.split(',').map(o => o.trim()).map(o => (
                    <label key={o} className="checkbox-label" style={{ fontWeight: 'normal', marginBottom: '0.5rem' }}>
                      <input type="checkbox" name={`field_${field.id}`} value={o} />
                      <span>{o}</span>
                    </label>
                  ))}
                </div>
              )}
              {field.type === 'checkbox' && (
                <label className="checkbox-label">
                  <input type="checkbox" name={`field_${field.id}`} value="כן" required={field.required} />
                  <span>{field.label} {field.required && <span className="required-star">*</span>}</span>
                </label>
              )}
            </div>
          );
        })}

        {event.requires_approval && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(243, 156, 18, 0.1)', border: '1px solid rgba(243, 156, 18, 0.3)', borderRadius: '8px', color: '#d35400', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <Clock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>שימו לב: ההרשמה מותנית באישור. לאחר השליחה נעדכן אותך.</span>
          </div>
        )}

        <button type="submit" className="btn btn-secondary submit-btn" disabled={submitting} style={{ justifyContent: 'center', width: '100%' }}>
          {submitting ? <Loader2 className="spinner" /> : (event.requires_approval ? 'שליחת בקשת הרשמה' : 'שליחת הרשמה')}
        </button>
      </form>
    );
  };

  return (
    <motion.div 
      className="event-details-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="event-top-bar">
        <button className="back-btn" onClick={() => navigate(-1)} style={{ marginBottom: 0 }}>
          <ArrowRight size={20} />
          <span>חזרה</span>
        </button>
        <div className="event-top-actions">
          {profile?.is_admin && (
            <button
              className="btn btn-outline"
              onClick={() => navigate(`/admin/events/edit/${event.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
            >
              <Edit size={16} />
              עריכה
            </button>
          )}
          {profile?.is_admin && (
            <button
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
              onClick={() => navigate(`/admin/events/${event.id}/registrants`)}
            >
              <Settings size={16} /> ניהול
            </button>
          )}
        </div>
      </div>

      <div className="event-details-container glass">
        
        <div className={`event-header-image ${!event.header_image_url ? 'fallback-gradient' : ''}`}>
          {event.header_image_url ? (
            <img src={event.header_image_url} alt="כותרת האירוע" />
          ) : (
            <div className="fallback-pattern"></div>
          )}
        </div>

        <div className="event-content-wrapper">
          <div className="event-main-info">
            <h1 className="event-main-title">{event.title}</h1>
            
            {event.tags && event.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {event.tags.map(tag => (
                  <span key={tag} style={{ background: 'rgba(73, 38, 145, 0.1)', color: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="event-meta-cards">
              <div className="meta-card">
                <CalendarDays className="meta-icon" />
                <div className="meta-text">
                  <span className="meta-label">תאריך</span>
                  <span className="meta-value">{event.event_date.split('-').reverse().join('.')}</span>
                </div>
              </div>
              <div className="meta-card">
                <Clock className="meta-icon" />
                <div className="meta-text">
                  <span className="meta-label">שעה</span>
                  <span className="meta-value">{event.event_time}</span>
                </div>
              </div>
              {event.location && (
                <div className="meta-card">
                  <MapPin className="meta-icon" />
                  <div className="meta-text">
                    <span className="meta-label">מיקום</span>
                    <span className="meta-value">{event.location}</span>
                  </div>
                </div>
              )}
              <div 
                className="meta-card share-card" 
                style={{ cursor: 'pointer', background: 'rgba(230, 126, 34, 0.08)', border: '1px solid rgba(230, 126, 34, 0.2)' }}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: event.title,
                      text: 'הצטרפו אליי לאירוע בחב״ד קמפוס בר אילן!',
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('הקישור הועתק בהצלחה!');
                  }
                }}
              >
                <Share className="meta-icon" style={{ background: 'var(--secondary)', color: 'white' }} />
                <div className="meta-text">
                  <span className="meta-label" style={{ color: 'var(--secondary)' }}>הזמינו חברים</span>
                  <span className="meta-value" style={{ color: 'var(--secondary)' }}>שתפו את האירוע</span>
                </div>
              </div>
            </div>

            <div className="event-description">
              <h3>על האירוע</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{event.description}</p>
            </div>

            {event.flyer_image_url && (
              <div className="event-flyer">
                <h3><ImageIcon size={18} /> מודעת האירוע</h3>
                <img src={event.flyer_image_url} alt="מודעת האירוע" className="flyer-img" />
              </div>
            )}
          </div>

          <div className="event-registration-form">
            <div className="form-header">
              <h2>{myRegistration ? 'ההרשמה שלך' : 'הרשמה לאירוע'}</h2>
            </div>
            
            <AnimatePresence mode="wait">
              {renderRegistrationSidebar()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventDetails;
