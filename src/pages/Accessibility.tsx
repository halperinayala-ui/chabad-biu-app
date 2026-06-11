import { motion } from 'framer-motion';
import { ArrowRight, Accessibility as AccessibilityIcon, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Accessibility = () => {
  const navigate = useNavigate();

  return (
    <motion.div className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: '100px', paddingTop: '20px' }}>
      <button className="back-btn" onClick={() => navigate(-1)} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>
        <ArrowRight size={20} /> חזרה
      </button>

      <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <AccessibilityIcon size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>הצהרת נגישות</h1>
        </div>

        <div style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={18} /> מחויבות לנגישות
          </h3>
          <p>
            אנו בחב"ד בקמפוס בר אילן רואים חשיבות עליונה במתן שירות שוויוני, מכבד ונגיש לכלל הסטודנטים, לרבות אנשים עם מוגבלויות.
            השקענו משאבים משמעותיים בהנגשת האפליקציה במטרה לאפשר לכל אדם להשתמש בשירותים שלנו באופן עצמאי ושוויוני.
          </p>

          <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AccessibilityIcon size={18} /> התאמות הנגישות שבוצעו
          </h3>
          <ul style={{ paddingRight: '1.5rem', marginTop: '0.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}><strong>ניווט נוח:</strong> האפליקציה תוכננה לניווט פשוט וברור גם באמצעות מקלדת וקוראי מסך (במכשירים התומכים בכך).</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>ניגודיות צבעים:</strong> הקפדנו על ניגודיות גבוהה בין צבעי הטקסט לצבעי הרקע כדי להקל על לקויי ראייה.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>הגדלת טקסט:</strong> האפליקציה תומכת בהגדלת טקסט המוגדרת במערכת ההפעלה של המכשיר ללא פגיעה במבנה הדפים.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>תיאור תמונות:</strong> רוב התמונות המהותיות באתר מצוידות בטקסט חלופי (Alt Text).</li>
          </ul>

          <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={18} /> פניות בנושא נגישות
          </h3>
          <p>
            אנו ממשיכים במאמצים לשפר את נגישות האפליקציה כחלק ממחויבותנו לאפשר שימוש בה עבור כלל האוכלוסייה.
            אם נתקלתם בבעיית נגישות או שיש לכם הצעה לשיפור, נשמח מאוד לשמוע מכם!
          </p>
          <p>
            ניתן לפנות אלינו באמצעות דרכי יצירת הקשר המופיעות בעמוד "אודות" באפליקציה או דרך מנהלי חב"ד בקמפוס.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Accessibility;
