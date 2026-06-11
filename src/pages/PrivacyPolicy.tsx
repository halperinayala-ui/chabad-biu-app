import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <motion.div className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: '100px', paddingTop: '20px' }}>
      <button className="back-btn" onClick={() => navigate(-1)} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>
        <ArrowRight size={20} /> חזרה
      </button>

      <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <ShieldCheck size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>תקנון ומדיניות פרטיות</h1>
          <p style={{ color: 'var(--text-secondary)' }}>עודכן לאחרונה: יוני 2026</p>
        </div>

        <div style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> כללי
          </h3>
          <p>
            ברוכים הבאים לאפליקציה של חב"ד בקמפוס בר אילן. מטרת האפליקציה היא להקל על הסטודנטים בקמפוס לקבל מידע על אירועים, שיעורים, ופעילויות קהילתיות ולהירשם אליהם בצורה נוחה ומהירה.
          </p>

          <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} /> איסוף ושימוש במידע
          </h3>
          <p>
            בעת ההרשמה והשימוש באפליקציה, אנו אוספים מידע בסיסי שכולל: שם מלא, מספר טלפון, מגדר ותאריך לידה (לצורך התאמת אירועים וציון ימי הולדת). מידע זה נועד אך ורק לצורך ניהול הקהילה, רישום מאובטח לאירועים, ויצירת קשר במקרי הצורך הקשורים לפעילות חב"ד בקמפוס.
          </p>
          <p>
            <strong>אנו מתחייבים כי המידע האישי שלכם נשמר בצורה מאובטחת ולא יועבר, יימכר או יושכר לשום צד שלישי (מסחרי או אחר) שאינו קשור במישרין להפעלת המערכת.</strong>
          </p>

          <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> קבצי עוגיות (Cookies)
          </h3>
          <p>
            האפליקציה עושה שימוש בקבצי "עוגיות" (Cookies) טכניים ותפעוליים בלבד. קבצים אלו חיוניים לצורך זיהוי משתמש מחובר (כדי שלא תצטרכו להקליד סיסמה בכל כניסה) ולצורך אבטחת המידע. איננו משתמשים בקבצי עוגיות לצורך פרסום ממוקד או מעקב מסחרי (כגון פיקסלים של רשתות חברתיות).
          </p>

          <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} /> הודעות פוש ודיוור
          </h3>
          <p>
            הסכמה לקבלת התראות פוש (Push Notifications) מאפשרת לנו לשלוח לכם עדכונים חשובים על אירועים, שינויים ותזכורות. על ידי אישור קבלת ההתראות באפליקציה, אתם מביעים את הסכמתכם המפורשת לקבלת חומרים אלו (בהתאם לסעיף 30א לחוק התקשורת - "חוק הספאם").
            תוכלו לבטל את קבלת ההתראות בכל עת דרך עמוד הפרופיל שלכם באפליקציה או דרך הגדרות המכשיר שלכם.
          </p>

          <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> אבטחת מידע
          </h3>
          <p>
            אנו מיישמים מערכות ונהלים מתקדמים לאבטחת מידע (המערכת מתארחת על שרתי ענן מאובטחים). עם זאת, חשוב לזכור שאין מערכת המוגנת ב-100% מפני חדירות. הנהלת חב"ד בקמפוס אינה נושאת באחריות לנזק מכל סוג שהוא שייגרם עקב חדירה בלתי מורשית למאגרי המידע.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;
