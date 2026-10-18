import React from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  GraduationCap, 
  CalendarDays, 
  MapPin, 
  Home, 
  Sparkles, 
  ChevronLeft, 
  ExternalLink, 
  Share2, 
  Phone,
  Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './NewYearHub.css';

interface ActivityItem {
  emoji: string;
  title: string;
  desc: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    emoji: '🍷',
    title: 'סעודות שבת וחגים',
    desc: 'ארוחות שבת מושקעות באווירה משפחתית חמה, שירים, חברים ואוכל ביתי מעולה.'
  },
  {
    emoji: '💡',
    title: 'מפגשי עומק ומלגות',
    desc: 'שיעורים וסדנאות עומק מרתקות בנושאים שנוגעים בחיים, כולל מלגות לימוד שוות.'
  },
  {
    emoji: '🎉',
    title: 'אירועי שיא והפוגות',
    desc: 'מנגלים, ערבי על האש, מסיבות חג, הפנינג בתקופת מבחנים וטיולים משותפים.'
  },
  {
    emoji: '🤝',
    title: 'אוזן קשבת וסיוע אישי',
    desc: 'אנחנו כאן לכל שאלה, הכוונה, עזרה אישית או סתם שיחה טובה.'
  },
  {
    emoji: '📱',
    title: 'אפליקציה קהילתית',
    desc: 'הרשמה מהירה לאירועים, גלריית תמונות קהילתית, פניות ועדכונים שוטפים.'
  }
];

const NewYearHub: React.FC = () => {
  const navigate = useNavigate();

  const pageUrl = 'https://chabad-biu-app.vercel.app/new-year';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'חב״ד בקמפוס בר אילן - פתיחת שנה',
          text: 'פותחים שנת לימודים מתוקה עם חב״ד בקמפוס בר אילן! כל הפעילויות, העדכונים והמלגות במקום אחד:',
          url: pageUrl
        });
      } catch {
        // User closed the share menu
      }
    } else {
      try {
        await navigator.clipboard.writeText(pageUrl);
        toast.success('הקישור הועתק בהצלחה! שתפו אותו עם חברים');
      } catch {
        toast.error('לא ניתן היה להעתיק את הקישור');
      }
    }
  };

  const scholarshipWhatsAppUrl = `https://wa.me/972546371566?text=${encodeURIComponent(
    'שלום! סרקתי עכשיו את ה-QR מהפופקורן בקמפוס, ואשמח לשמוע פרטים ולהירשם למלגת הפעילות והלימוד לשנה הקרובה 🎓'
  )}`;

  const generalWhatsAppUrl = `https://wa.me/972546371566?text=${encodeURIComponent(
    'היי הרב אפרים ואילה, פגשתי אתכם בחלוקת הפופקורן בקמפוס :)'
  )}`;

  return (
    <div className="newyear-page">
      {/* Hero Welcome Card */}
      <motion.div 
        className="newyear-hero"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="newyear-hero-glow" />
        <div className="newyear-hero-glow-2" />

        <div className="newyear-badge">
          <Sparkles size={16} />
          <span>פתיחת שנת הלימודים תשפ״ז</span>
        </div>

        <h1 className="newyear-hero-title">
          ברוכים הבאים לקמפוס!
        </h1>

        <p className="newyear-hero-subtitle">
          שמחים לפגוש אתכם! חב״ד בקמפוס בר אילן הוא הבית שלכם לרגע של הפסקה, מפגש חם, חברים וקהילה לאורך כל השנה.
        </p>

        <div className="newyear-popcorn-tag">
          <span>🍿</span>
          <span>בתיאבון! מקווים שהפופקורן טעים לכם</span>
        </div>
      </motion.div>

      {/* Main Quick Action Buttons */}
      <div className="newyear-section-title">
        <span>קישורים</span>
        <span className="accent">מהירים</span>
      </div>

      <div className="newyear-actions-grid">
        {/* 1. WhatsApp Updates Group */}
        <motion.a
          href="https://chat.whatsapp.com/HxxrQxeydVb4H3YFxpngTs"
          target="_blank"
          rel="noopener noreferrer"
          className="action-card action-card-whatsapp"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="action-card-content">
            <div className="action-card-icon">
              <MessageCircle size={26} />
            </div>
            <div className="action-card-text">
              <div className="action-card-title">קבוצת העדכונים השקטה בוואטסאפ</div>
              <div className="action-card-desc">עדכונים בלבד על אירועים, ארוחות שבת, הטבות ופעילויות</div>
            </div>
          </div>
          <ChevronLeft size={22} style={{ opacity: 0.8 }} />
        </motion.a>

        {/* 2. Scholarship Registration */}
        <motion.a
          href={scholarshipWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="action-card action-card-scholarship"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="action-card-content">
            <div className="action-card-icon">
              <GraduationCap size={26} />
            </div>
            <div className="action-card-text">
              <div className="action-card-title">הרשמה למלגת לימוד ופעילות 🎓</div>
              <div className="action-card-desc">לחצו לקבלת פרטים והבטחת מקומכם במלגה לשנה הקרובה</div>
            </div>
          </div>
          <ChevronLeft size={22} style={{ opacity: 0.8 }} />
        </motion.a>

        {/* 3. Events Schedule */}
        <motion.div
          onClick={() => navigate('/events')}
          className="action-card action-card-events"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="action-card-content">
            <div className="action-card-icon">
              <CalendarDays size={26} />
            </div>
            <div className="action-card-text">
              <div className="action-card-title">לוח האירועים וההרשמה</div>
              <div className="action-card-desc">סעודות שבת, שיעורים ומפגשים קרובים</div>
            </div>
          </div>
          <ChevronLeft size={22} style={{ opacity: 0.4 }} />
        </motion.div>

        {/* 4. Chat with Rabbi Efraim */}
        <motion.a
          href={generalWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="action-card action-card-contact"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="action-card-content">
            <div className="action-card-icon">
              <Phone size={24} />
            </div>
            <div className="action-card-text">
              <div className="action-card-title">צריכים עזרה או סתם שיחה?</div>
              <div className="action-card-desc">דברו איתנו ישירות בוואטסאפ (הרב אפרים: 054-6371566)</div>
            </div>
          </div>
          <ExternalLink size={20} style={{ opacity: 0.4 }} />
        </motion.a>
      </div>

      {/* Location Card */}
      <motion.div 
        className="location-highlight-card"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="location-highlight-header">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Home size={22} />
          </div>
          <div>
            <div className="location-highlight-title">איפה אנחנו בקמפוס? הבית החם במעונות</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>הדלת שלנו פתוחה לכולכם!</div>
          </div>
        </div>

        <p className="location-highlight-body">
          מעונות פארק המאה, בניין B קומת מסחר, ז׳בוטינסקי 514, גבעת שמואל.
          <br />
          מוזמנים לקפוץ להכיר, לשבת ללמוד, או להגיע לסעודות ושיעורים.
        </p>

        <div className="location-buttons-row">
          <a
            href="https://waze.com/ul?q=%D7%9E%D7%A2%D7%95%D7%A0%D7%95%D7%AA%20%D7%A4%D7%90%D7%A8%D7%A5%20%D7%94%D7%9E%D7%90%D7%94%20%D7%92%D7%91%D7%A2%D7%AA%20%D7%A9%D7%9E%D7%95%D7%90%D7%9C&navigate=yes"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pill-waze"
          >
            <MapPin size={16} />
            <span>ניווט ב-Waze</span>
          </a>
          <a
            href="https://maps.app.goo.gl/XNQgW2hbLZ8Ahy9k8"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pill-maps"
          >
            <ExternalLink size={16} />
            <span>Google Maps</span>
          </a>
        </div>
      </motion.div>

      {/* Annual Activities Grid */}
      <div className="newyear-section-title">
        <span>מה מחכה לכם השנה</span>
        <span className="accent">בחב״ד בקמפוס?</span>
      </div>

      <div className="activities-grid">
        {ACTIVITIES.map((act, idx) => (
          <motion.div 
            key={idx}
            className="activity-card"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className="activity-card-emoji">{act.emoji}</div>
            <div className="activity-card-title">{act.title}</div>
            <div className="activity-card-desc">{act.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Share Section with Friends */}
      <div className="newyear-share-box">
        <button
          onClick={handleShare}
          className="newyear-share-btn"
        >
          <Share2 size={20} />
          <span>שיתוף עם חברים</span>
        </button>
      </div>

      {/* Footer */}
      <div className="newyear-footer">
        <p style={{ margin: '0 0 0.4rem 0', fontWeight: 600, color: 'var(--primary)' }}>
          חב״ד בקמפוס בר אילן
        </p>
        <p style={{ margin: 0, opacity: 0.8 }}>
          הרב אפרים ואילה פיקארסקי • הבית שלכם בקמפוס <Heart size={14} style={{ display: 'inline', color: 'var(--secondary)' }} />
        </p>
      </div>
    </div>
  );
};

export default NewYearHub;
