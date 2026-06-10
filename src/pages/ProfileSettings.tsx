import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Phone, Save, LogOut, RefreshCw, CalendarDays, GraduationCap, BookOpen } from 'lucide-react';
import './ProfileSettings.css';

const MONTH_MAP: Record<string, string> = {
  'Tishrei': 'תשרי', 'Cheshvan': 'חשוון', 'Kislev': 'כסלו', 'Tevet': 'טבת',
  'Shevat': 'שבט', 'Adar': 'אדר', 'Adar I': 'אדר', 'Adar II': 'אדר ב',
  'Nisan': 'ניסן', 'Iyyar': 'אייר', 'Sivan': 'סיון', 'Tamuz': 'תמוז',
  'Av': 'אב', 'Elul': 'אלול',
};

const HEBREW_DAYS = [
  'א','ב','ג','ד','ה','ו','ז','ח','ט','י','יא','יב','יג','יד','טו',
  'טז','יז','יח','יט','כ','כא','כב','כג','כד','כה','כו','כז','כח','כט','ל'
];

const HEBREW_MONTHS = [
  'תשרי','חשוון','כסלו','טבת','שבט','אדר','אדר ב','ניסן','אייר','סיון','תמוז','אב','אלול'
];

const ProfileSettings = () => {
  const { user, profile, signOut, refreshProfile, isPushEnabled, subscribeToPush, unsubscribeFromPush } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [hebDay, setHebDay] = useState('');
  const [hebMonth, setHebMonth] = useState('');
  const [gregDate, setGregDate] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState('');

  // Status fields
  const [userStatus, setUserStatus] = useState(''); // 'student' | 'graduate' | 'other'
  const [statusDetail, setStatusDetail] = useState('');
  const [studyField, setStudyField] = useState('');
  const [degreeType, setDegreeType] = useState(''); // 'bachelor' | 'master' | 'phd'
  const [studyYear, setStudyYear] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (location.state?.requireOnboarding && !profile?.full_name) {
      setMessage('ברוכים הבאים! 🎉 אנא השלימו את פרטיכם כדי להמשיך.');
    }
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setGender(profile.gender || '');
      setUserStatus((profile as any).user_status || '');
      setStatusDetail((profile as any).status_detail || '');
      setStudyField((profile as any).study_field || '');
      setDegreeType((profile as any).degree_type || '');
      setStudyYear((profile as any).study_year?.toString() || '');
      // Gregorian date
      if ((profile as any).greg_birthday) {
        setGregDate((profile as any).greg_birthday);
      }
      // Hebrew birthday
      if (profile.heb_birthday) {
        const parts = profile.heb_birthday.split(' ב');
        if (parts.length === 2) {
          setHebDay(parts[0].trim());
          setHebMonth(parts[1].trim());
        }
      }
    }
  }, [user, profile, navigate]);

  const convertToHebrew = useCallback(async (dateStr: string) => {
    if (!dateStr) return;
    setConverting(true);
    setConvertError('');
    try {
      const [year, month, day] = dateStr.split('-');
      const res = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const hebrewDay = HEBREW_DAYS[data.hd - 1];
      const hebrewMonth = MONTH_MAP[data.hm] || data.hm;
      if (hebrewDay) setHebDay(hebrewDay);
      if (hebrewMonth) setHebMonth(hebrewMonth);
    } catch {
      setConvertError('לא הצלחנו להמיר את התאריך. ניתן לבחור ידנית.');
    } finally {
      setConverting(false);
    }
  }, []);

  useEffect(() => {
    if (gregDate) {
      const timer = setTimeout(() => convertToHebrew(gregDate), 400);
      return () => clearTimeout(timer);
    }
  }, [gregDate, convertToHebrew]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      const fullHebBirthday = hebDay && hebMonth ? `${hebDay} ב${hebMonth}` : null;
      const { error } = await supabase.from('profiles').update({
        full_name: fullName,
        phone,
        gender: gender || null,
        heb_birthday: fullHebBirthday,
        greg_birthday: gregDate || null,
        user_status: userStatus || null,
        status_detail: userStatus === 'other' ? statusDetail : null,
        study_field: userStatus === 'student' ? studyField : null,
        degree_type: userStatus === 'student' ? degreeType || null : null,
        study_year: userStatus === 'student' && studyYear ? parseInt(studyYear) : null,
      }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      setMessage('הפרטים נשמרו בהצלחה!');
      // Update local profile state immediately so OnboardingGuard sees it
      setTimeout(() => { navigate('/'); }, 1500);
    } catch (err: any) {
      console.error(err);
      setMessage('שגיאה בשמירת הנתונים: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const statusBtnStyle = (val: string) => ({
    flex: 1,
    padding: '0.7rem 0.5rem',
    borderRadius: '12px',
    border: userStatus === val ? '2px solid var(--primary)' : '2px solid rgba(0,0,0,0.1)',
    background: userStatus === val ? 'rgba(73,38,145,0.1)' : 'transparent',
    color: userStatus === val ? 'var(--primary)' : 'var(--text-secondary)',
    fontWeight: userStatus === val ? 700 : 500,
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  });

  return (
    <motion.div className="profile-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="profile-card glass">
        <div className="profile-header">
          <h2>האזור האישי</h2>
          <p>השלימו את הפרטים כדי להירשם לאירועים בלחיצת כפתור</p>
        </div>

        {message && (
          <div className={`profile-message ${message.includes('שגיאה') ? 'error' : 'success'}`}>{message}</div>
        )}

        <form onSubmit={handleSave} className="profile-form">
          {/* Name */}
          <div className="form-group">
            <label>שם מלא</label>
            <div className="input-group">
              <User className="input-icon" size={18} />
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="לדוגמה: ישראל ישראלי" required />
            </div>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>מספר טלפון</label>
            <div className="input-group">
              <Phone className="input-icon" size={18} />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="לדוגמה: 050-1234567" required />
            </div>
          </div>

          {/* Gender */}
          <div className="form-group">
            <label>מגדר</label>
            <select className="form-control" value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">לא צוין</option>
              <option value="m">זכר</option>
              <option value="f">נקבה</option>
            </select>
          </div>

          {/* ── STATUS SECTION ── */}
          <div className="form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <GraduationCap size={18} style={{ color: 'var(--primary)' }} />
              מי אני?
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button type="button" style={statusBtnStyle('student')} onClick={() => setUserStatus('student')}>🎓 סטודנט/ית</button>
              <button type="button" style={statusBtnStyle('graduate')} onClick={() => setUserStatus('graduate')}>👔 בוגר/ת</button>
              <button type="button" style={statusBtnStyle('other')} onClick={() => setUserStatus('other')}>👤 אחר</button>
            </div>

            {/* "Other" detail */}
            {userStatus === 'other' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="form-group">
                <label>פרטו במה אתם עוסקים</label>
                <input type="text" className="form-control" value={statusDetail} onChange={e => setStatusDetail(e.target.value)} placeholder="לדוגמה: עובד, הורה, תושב בר-אילן..." />
              </motion.div>
            )}

            {/* Student details */}
            {userStatus === 'student' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={15} style={{ color: 'var(--primary)' }} /> מה אתה/את לומד/ת?
                  </label>
                  <input type="text" className="form-control" value={studyField} onChange={e => setStudyField(e.target.value)} placeholder="לדוגמה: משפטים, פסיכולוגיה, מדעי המחשב..." />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label>תואר</label>
                    <select className="form-control" value={degreeType} onChange={e => setDegreeType(e.target.value)}>
                      <option value="">בחר...</option>
                      <option value="bachelor">תואר ראשון</option>
                      <option value="master">תואר שני</option>
                      <option value="phd">דוקטורט</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label>שנה</label>
                    <select className="form-control" value={studyYear} onChange={e => setStudyYear(e.target.value)}>
                      <option value="">בחר...</option>
                      <option value="1">שנה א'</option>
                      <option value="2">שנה ב'</option>
                      <option value="3">שנה ג'</option>
                      <option value="4">שנה ד' ומעלה</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── BIRTHDAY SECTION ── */}
          <div className="form-group" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.25rem' }}>
            <label>יום הולדת 🎂</label>

            {/* Gregorian input */}
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <CalendarDays className="input-icon" size={18} />
              <input type="date" value={gregDate} onChange={e => setGregDate(e.target.value)} max={new Date().toISOString().split('T')[0]} style={{ flex: 1 }} />
              {converting && <RefreshCw size={16} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite', alignSelf: 'center', marginInlineEnd: '0.5rem' }} />}
            </div>
            {convertError && <p style={{ color: '#e74c3c', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{convertError}</p>}

            {/* Hebrew result badge */}
            {(hebDay || hebMonth) && (
              <div style={{ background: 'rgba(73,38,145,0.07)', borderRadius: '10px', padding: '0.6rem 1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>📅 תאריך עברי:</span>
                <span style={{ fontWeight: 600 }}>{hebDay && `${hebDay}' `}ב{hebMonth}</span>
              </div>
            )}

            {/* Manual Hebrew selectors */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select className="form-control" value={hebDay} onChange={e => setHebDay(e.target.value)} style={{ flex: 1 }}>
                <option value="">יום</option>
                {HEBREW_DAYS.map(d => <option key={d} value={d}>{d}'</option>)}
              </select>
              <select className="form-control" value={hebMonth} onChange={e => setHebMonth(e.target.value)} style={{ flex: 2 }}>
                <option value="">חודש</option>
                {HEBREW_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              בחרו תאריך לועזי למעלה לקבלת המרה אוטומטית, או בחרו ידנית
            </p>
          </div>

          {/* Toggles */}
          <div className="settings-toggles">
            <label className="toggle-row">
              <span>קבלת עדכונים ואירועי שיא בוואטסאפ</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="toggle-row">
              <span>לקבלת התראות פוש על אירועים והרשמות</span>
              <input 
                type="checkbox" 
                checked={isPushEnabled} 
                onChange={async (e) => {
                  if (e.target.checked) {
                    await subscribeToPush();
                  } else {
                    await unsubscribeFromPush();
                  }
                }} 
              />
            </label>
          </div>

          <button type="submit" className="btn btn-secondary profile-submit-btn" disabled={loading}>
            {loading ? 'שומר...' : <><Save size={18} /> שמירת פרטים</>}
          </button>
        </form>

        <div className="profile-footer">
          <button className="btn btn-outline logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> התנתקות
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileSettings;
