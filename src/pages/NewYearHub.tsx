import React, { useState } from 'react';
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
  Heart,
  ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './NewYearHub.css';

interface ActivityItem {
  emoji: string;
  title: string;
  desc: string;
  isFromFlyer?: boolean;
}

const ACTIVITIES: ActivityItem[] = [
  {
    emoji: '🎓',
    title: 'מלגה',
    desc: 'מפגשי לימוד והעשרה מרתקים אחת לשבוע עם מלגת לימודים שווה לשנה הקרובה.',
    isFromFlyer: true
  },
  {
    emoji: '🥖',
    title: 'ארוחות שבת',
    desc: 'סעודות שבת מושקעות באווירה ביתית וחמה, אוכל מעולה וחיבורים חדשים במעונות.',
    isFromFlyer: true
  },
  {
    emoji: '🕎',
    title: 'חגים',
    desc: 'מסיבות חנוכה, פורים, ערבי חג, הדלקות נרות ואירועי שיא לאורך כל לוח השנה.',
    isFromFlyer: true
  },
  {
    emoji: '🎒',
    title: 'סופ״שים',
    desc: 'שבתות גיבוש, סופי שבוע חווייתיים וטיולים משותפים ברחבי הארץ.',
    isFromFlyer: true
  },
  {
    emoji: '✈️',
    title: 'מסעות',
    desc: 'משלחות סטודנטים ומסעות תוכן משמעותיים ומעצימים.',
    isFromFlyer: true
  },
  {
    emoji: '📖',
    title: 'מפגשי שיח',
    desc: 'שיחות פתוחות, סדנאות ודיונים מרתקים על החיים, יהדות ואקטואליה.',
    isFromFlyer: true
  },
  {
    emoji: '🤝',
    title: 'אוזן קשבת וסיוע אישי',
    desc: 'אנחנו כאן לכל שאלה, הכוונה, עזרה אישית או סתם שיחה טובה בכל שלב בלימודים.'
  },
  {
    emoji: '📱',
    title: 'אפליקציה ואירועים',
    desc: 'לוח האירועים של הקמפוס, הרשמה בלחיצה, גלריית תמונות ועדכונים שוטפים.'
  }
];

const NewYearHub: React.FC = () => {
  const navigate = useNavigate();
  const [showFlyer, setShowFlyer] = useState(false);

  const pageUrl = 'https://chabad-biu-app.vercel.app/new-year';

  // Specific scholarship WhatsApp link provided by Ayala
  const scholarshipWhatsAppUrl = 'https://wa.me/972534874830?text=%D7%90%D7%A0%D7%99_%D7%A8%D7%95%D7%A6%D7%94_%D7%9C%D7%94%D7%99%D7%A8%D7%A9%D7%9D_%D7%9C%D7%9E%D7%9C%D7%92%D7%94';

  // Rabbi Efraim WhatsApp direct link
  const rabbiWhatsAppUrl = `https://wa.me/972546371566?text=${encodeURIComponent(
    'היי הרב אפרים ואילה, פגשתי אתכם בחלוקת הפופקורן בקמפוס :)'
  )}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'חב״ד בקמפוס בר אילן - יש לך בית בקמפוס',
          text: 'יש לך בית בקמפוס! כל הפעילויות, המלגות, ארוחות השבת והאירועים של חב״ד בר אילן:',
          url: pageUrl
        });
      } catch {
        // User closed share dialog
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

  return (
    <div className="newyear-page">
      {/* Hero Welcome Card Inspired by Flyer */}
      <motion.div 
        className="newyear-hero"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="newyear-hero-glow" />
        <div className="newyear-hero-glow-2" />

        <div className="newyear-top-bar">
          <span className="newyear-bh">ב"ה</span>
          <div className="newyear-badge">
            <Sparkles size={14} />
            <span>פתיחת שנת הלימודים תשפ״ז</span>
          </div>
        </div>

        {/* Big 3D-styled Title matching the flyer */}
        <div className="newyear-hero-title-box">
          <span className="newyear-title-line1">יש לך בית</span>
          <div className="newyear-title-line2-wrap">
            <span className="newyear-title-line2">בקמפוס</span>
          </div>
        </div>

        <p className="newyear-hero-subtitle">
          חב״ד בקמפוס בר אילן הוא המקום שלכם להפסקה, מפגש חם, עשייה, שבתות וקהילה לאורך כל השנה.
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
        {/* 1. Scholarship Registration (Prominent - First button!) */}
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
              <GraduationCap size={28} />
            </div>
            <div className="action-card-text">
              <div className="action-card-title">הרשמה למלגת לימוד ופעילות 🎓</div>
              <div className="action-card-desc">לחצו להרשמה מהירה בוואטסאפ והבטחת מקומכם במלגה</div>
            </div>
          </div>
          <ChevronLeft size={22} style={{ opacity: 0.8 }} />
        </motion.a>

        {/* 2. WhatsApp Updates Group */}
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
              <div className="action-card-title">קבוצת העדכונים השקטה בוואטסאפ 💬</div>
              <div className="action-card-desc">עדכונים בלבד על אירועים, ארוחות שבת, הטבות ופעילויות</div>
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
              <div className="action-card-title">לוח האירועים וההרשמה 📅</div>
              <div className="action-card-desc">סעודות שבת, שיעורים ומפגשים קרובים</div>
            </div>
          </div>
          <ChevronLeft size={22} style={{ opacity: 0.4 }} />
        </motion.div>

        {/* 4. Chat with Rabbi Efraim */}
        <motion.a
          href={rabbiWhatsAppUrl}
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
              <div className="action-card-title">דברו איתנו בוואטסאפ 📞</div>
              <div className="action-card-desc">הרב אפרים: 054-6371566 • לכל שאלה או שיחה אישית</div>
            </div>
          </div>
          <ExternalLink size={20} style={{ opacity: 0.4 }} />
        </motion.a>
      </div>

      {/* Location Card Highlight (Matches Flyer) */}
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
            background: 'linear-gradient(135deg, var(--primary), #f15a24)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Home size={22} />
          </div>
          <div>
            <div className="location-highlight-title">איפה אנחנו בקמפוס? הבית החם במעונות 📍</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>הדלת שלנו פתוחה לכולכם!</div>
          </div>
        </div>

        <p className="location-highlight-body">
          <span className="location-highlight-address">פארק המאה, בניין B • קומת מסחר</span>
          <br />
          ז׳בוטינסקי 514, גבעת שמואל (מעונות הסטודנטים).
          <br />
          מוזמנים לקפוץ להכיר, לשבת ללמוד, או להגיע לסעודות ולשיעורים.
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

      {/* Annual Activities Grid based on Flyer */}
      <div className="newyear-section-title">
        <span>מה מחכה לכם השנה</span>
        <span className="accent">בחב״ד בקמפוס?</span>
      </div>

      <div className="activities-grid">
        {ACTIVITIES.map((act, idx) => (
          <motion.div 
            key={idx}
            className={`activity-card ${act.title === 'מלגה' ? 'card-highlight' : ''}`}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.04 }}
          >
            <div className="activity-card-emoji">{act.emoji}</div>
            <div className="activity-card-title">
              <span>{act.title}</span>
              {act.title === 'מלגה' && (
                <span className="activity-badge-flyer">מומלץ</span>
              )}
            </div>
            <div className="activity-card-desc">{act.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Flyer View Toggle */}
      <div className="flyer-preview-card">
        <button
          onClick={() => setShowFlyer(!showFlyer)}
          className="flyer-preview-toggle"
        >
          <ImageIcon size={18} />
          <span>{showFlyer ? 'סגירת המודעה' : 'לצפייה במודעת פתיחת השנה המלאה 🖼️'}</span>
          {showFlyer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showFlyer && (
          <motion.div 
            className="flyer-preview-img-wrap"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <img 
              src="/flyer-newyear.jpeg" 
              alt="מודעת פתיחת שנה - חב״ד בקמפוס בר אילן" 
            />
          </motion.div>
        )}
      </div>

      {/* Share Section with Friends */}
      <div className="newyear-share-box">
        <button
          onClick={handleShare}
          className="newyear-share-btn"
        >
          <Share2 size={20} />
          <span>שתפו עם חברים בקמפוס</span>
        </button>
      </div>

      {/* Footer */}
      <div className="newyear-footer">
        <p style={{ margin: '0 0 0.4rem 0', fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
          חב״ד בקמפוס בר אילן • כל הלב לכל אחד
        </p>
        <p style={{ margin: 0, opacity: 0.85 }}>
          הרב אפרים ואילה פיקארסקי • הבית שלכם בקמפוס <Heart size={14} style={{ display: 'inline', color: 'var(--secondary)' }} />
        </p>
      </div>
    </div>
  );
};

export default NewYearHub;
