import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronUp,
  Volume2,
  VolumeX,
  FastForward,
  Play,
  Smartphone,
  Download,
  X,
  Share,
  PlusSquare
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
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
    emoji: '🍷',
    title: 'ארוחות שבת',
    desc: 'סעודות שבת מושקעות באווירה ביתית וחמה, אוכל מעולה וחיבורים חדשים במעונות.',
    isFromFlyer: true
  },
  {
    emoji: '🎉',
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const heroVariants = {
  hidden: { opacity: 0, scale: 0.94, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 240,
      damping: 20
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 22
    }
  }
};

const NewYearHub: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFromApp = searchParams.get('source') === 'home';

  const [showFlyer, setShowFlyer] = useState(false);

  // If entering from inside the app banner, never show the video intro!
  const [showIntro, setShowIntro] = useState(() => {
    if (isFromApp) return false;
    return !sessionStorage.getItem('seen_newyear_intro');
  });

  // Controls when the page elements animate into view
  const [contentReady, setContentReady] = useState(() => {
    if (isFromApp) return true;
    return Boolean(sessionStorage.getItem('seen_newyear_intro'));
  });

  const [isMuted, setIsMuted] = useState(true);

  // PWA Install State & Detection
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(standalone);

      const ua = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(ua);
      setIsIOS(isIosDevice);

      const handlePrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handlePrompt);
      return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
    }
  }, []);

  const handleInstallClick = async () => {
    if (isStandalone) {
      toast.success('האפליקציה כבר שמורה במסך הבית שלך! ✨');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('תודה שהתקנתם! ניפגש בפעילויות 💛');
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const triggerFestiveConfetti = () => {
    try {
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.35, x: 0.5 },
        colors: ['#f26522', '#ffc107', '#7a3ebb', '#441e8c', '#ffffff'],
        disableForReducedMotion: true
      });
      setTimeout(() => {
        confetti({
          particleCount: 35,
          angle: 60,
          spread: 55,
          origin: { x: 0.15, y: 0.55 },
          colors: ['#ff944d', '#ffc107', '#1fa855']
        });
        confetti({
          particleCount: 35,
          angle: 120,
          spread: 55,
          origin: { x: 0.85, y: 0.55 },
          colors: ['#ff944d', '#ffc107', '#1fa855']
        });
      }, 260);
    } catch {
      // Graceful fallback
    }
  };

  const handleCloseIntro = () => {
    setShowIntro(false);
    setContentReady(true);
    sessionStorage.setItem('seen_newyear_intro', 'true');
    setTimeout(() => {
      triggerFestiveConfetti();
    }, 180);
  };

  const handleReplayIntro = () => {
    setIsMuted(false);
    setShowIntro(true);
  };

  const pageUrl = 'https://chabad-biu-app.vercel.app/new-year';

  // Specific scholarship WhatsApp link provided by Ayala
  const scholarshipWhatsAppUrl = 'https://wa.me/972534874830?text=%D7%90%D7%A0%D7%99_%D7%A8%D7%95%D7%A6%D7%94_%D7%9C%D7%94%D7%99%D7%A8%D7%A9%D7%9D_%D7%9C%D7%9E%D7%9C%D7%92%D7%94';

  // Rabbi Efraim WhatsApp direct link
  const rabbiWhatsAppUrl = `https://wa.me/972546371566?text=${encodeURIComponent(
    'היי הרב אפרים ואילה, פגשתי אתכם בחלוקת הפופקורן בקמפוס :)'
  )}`;

  useEffect(() => {
    // Track scan / visit
    const trackedSessionKey = 'tracked_newyear_view_' + new Date().toDateString();
    if (!sessionStorage.getItem(trackedSessionKey)) {
      sessionStorage.setItem(trackedSessionKey, 'true');
      fetch('/api/track-newyear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'view', source: isFromApp ? 'home' : 'qr' })
      }).catch(() => {});
    }
  }, [isFromApp]);

  useEffect(() => {
    // If entered directly without video intro, fire welcoming confetti
    if (contentReady && !showIntro) {
      const timer = setTimeout(() => {
        triggerFestiveConfetti();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [contentReady, showIntro]);

  const handleScholarshipClick = () => {
    fetch('/api/track-newyear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'click_scholarship' })
    }).catch(() => {});
  };

  const handleWhatsAppClick = () => {
    fetch('/api/track-newyear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'click_whatsapp' })
    }).catch(() => {});
  };

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
    <div className="newyear-page-wrapper">
      {/* Subtle Floating Ambient Elements */}
      <div className="floating-bg-item floating-bg-1" aria-hidden="true">🍿</div>
      <div className="floating-bg-item floating-bg-2" aria-hidden="true">✨</div>
      <div className="floating-bg-item floating-bg-3" aria-hidden="true">🎉</div>

      {/* Intro Video Splash Modal (Only for direct QR scans) */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            className="intro-video-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35 }}
          >
            <div className="intro-video-container">
              <video
                src="/popcorn-intro.mp4"
                className="intro-video-player"
                autoPlay
                muted={isMuted}
                playsInline
                onEnded={handleCloseIntro}
              />

              <div className="intro-video-controls">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="intro-sound-btn"
                  title={isMuted ? 'הפעלת שמע' : 'השתקת שמע'}
                >
                  {isMuted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
                </button>

                <button
                  type="button"
                  onClick={handleCloseIntro}
                  className="intro-skip-btn"
                >
                  <span>דלג לעמוד</span>
                  <FastForward size={16} />
                </button>
              </div>
            </div>

            <div className="intro-bottom-hint">
              <span>🍿</span>
              <span>אותו תואר. מרגיש אחרת ✨</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staggered Hub Content */}
      <motion.div 
        className="newyear-page"
        variants={containerVariants}
        initial="hidden"
        animate={contentReady ? "visible" : "hidden"}
      >
        {/* Hero Welcome Card Inspired by Flyer */}
        <motion.div 
          className="newyear-hero"
          variants={heroVariants}
        >
          <div className="newyear-hero-glow" />
          <div className="newyear-hero-glow-2" />

          <div className="newyear-top-bar">
            <span className="newyear-bh">ב"ה</span>
            <div className="newyear-badge">
              <Sparkles size={14} className="badge-sparkle-spin" />
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

          <motion.div 
            className="newyear-popcorn-tag"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="popcorn-badge-icon">🍿</span>
            <span>בתיאבון! מקווים שהפופקורן טעים לכם</span>
          </motion.div>
        </motion.div>

        {/* Install / Add to Home Screen Button */}
        <motion.div 
          className="newyear-install-box"
          variants={itemVariants}
        >
          <button 
            type="button"
            onClick={handleInstallClick}
            className="newyear-install-btn"
          >
            <div className="install-btn-content">
              <div className="install-btn-icon-wrap">
                <Smartphone size={24} />
              </div>
              <div className="install-btn-text">
                <div className="install-btn-title">
                  <span>הורדת האפליקציה למסך הבית</span>
                  <span className="install-badge-shine">
                    {isStandalone ? 'מותקן ✨' : 'התקנה מהירה 📲'}
                  </span>
                </div>
                <div className="install-btn-sub">
                  {isStandalone 
                    ? 'האפליקציה כבר שמורה אצלכם במסך הבית' 
                    : 'שמרו אותנו במסך הבית לגישה מהירה לאירועים, שבתות ומלגות'}
                </div>
              </div>
            </div>
            <div className="install-btn-action">
              <Download size={20} />
            </div>
          </button>
        </motion.div>

        {/* Main Quick Action Buttons */}
        <motion.div className="newyear-section-title" variants={itemVariants}>
          <span>קישורים</span>
          <span className="accent">מהירים</span>
        </motion.div>

        <div className="newyear-actions-grid">
          {/* 1. Scholarship Registration (Prominent - First button!) */}
          <motion.a
            href={scholarshipWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleScholarshipClick}
            className="action-card action-card-scholarship"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="action-card-content">
              <div className="action-card-icon">
                <GraduationCap size={28} />
              </div>
              <div className="action-card-text">
                <div className="action-card-title">
                  <span>הרשמה למלגת לימוד ופעילות</span>
                  <span className="scholarship-pulse-tag">מלגה שווה</span>
                </div>
                <div className="action-card-desc">לחצו להרשמה מהירה בוואטסאפ והבטחת מקומכם במלגה</div>
              </div>
            </div>
            <ChevronLeft size={22} style={{ opacity: 0.9 }} />
          </motion.a>

          {/* 2. WhatsApp Updates Group */}
          <motion.a
            href="https://chat.whatsapp.com/HxxrQxeydVb4H3YFxpngTs"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="action-card action-card-whatsapp"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
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

          {/* 3. Events Schedule */}
          <motion.div
            onClick={() => navigate('/events')}
            className="action-card action-card-events"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
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
            href={rabbiWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-card action-card-contact"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="action-card-content">
              <div className="action-card-icon">
                <Phone size={24} />
              </div>
              <div className="action-card-text">
                <div className="action-card-title">דברו איתנו בוואטסאפ</div>
                <div className="action-card-desc">הרב אפרים: 054-6371566 • לכל שאלה או שיחה אישית</div>
              </div>
            </div>
            <ExternalLink size={20} style={{ opacity: 0.4 }} />
          </motion.a>
        </div>

        {/* Location Card Highlight (Matches Flyer) */}
        <motion.div 
          className="location-highlight-card"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
        >
          <div className="location-highlight-header">
            <div className="location-icon-wrapper">
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
            <motion.a
              href="https://waze.com/ul?q=%D7%9E%D7%A2%D7%95%D7%A0%D7%95%D7%AA%20%D7%A4%D7%90%D7%A8%D7%A5%20%D7%94%D7%9E%D7%90%D7%94%20%D7%92%D7%91%D7%A2%D7%AA%20%D7%A9%D7%9E%D7%95%D7%90%D7%9C&navigate=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill-waze"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MapPin size={16} />
              <span>ניווט ב-Waze</span>
            </motion.a>
            <motion.a
              href="https://maps.app.goo.gl/XNQgW2hbLZ8Ahy9k8"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill-maps"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ExternalLink size={16} />
              <span>Google Maps</span>
            </motion.a>
          </div>
        </motion.div>

        {/* Annual Activities Grid based on Flyer */}
        <motion.div className="newyear-section-title" variants={itemVariants}>
          <span>מה מחכה לכם השנה</span>
          <span className="accent">בחב״ד בקמפוס?</span>
        </motion.div>

        <div className="activities-grid">
          {ACTIVITIES.map((act, idx) => (
            <motion.div 
              key={idx}
              className={`activity-card ${act.title === 'מלגה' ? 'card-highlight' : ''}`}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
        <motion.div className="flyer-preview-card" variants={itemVariants}>
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

          <button
            onClick={handleReplayIntro}
            className="flyer-preview-toggle"
            style={{ marginTop: '0.65rem' }}
          >
            <Play size={16} />
            <span>צפייה בסרטון האנימציה (10 שניות) 🍿</span>
          </button>
        </motion.div>

        {/* Share Section with Friends */}
        <motion.div className="newyear-share-box" variants={itemVariants}>
          <motion.button
            onClick={handleShare}
            className="newyear-share-btn"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Share2 size={20} />
            <span>שתפו עם חברים בקמפוס</span>
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.div className="newyear-footer" variants={itemVariants}>
          <p style={{ margin: '0 0 0.4rem 0', fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
            חב״ד בקמפוס בר אילן • כל הלב לכל אחד
          </p>
          <p style={{ margin: 0, opacity: 0.85 }}>
            הרב אפרים ואילה פיקארסקי • הבית שלכם בקמפוס <Heart size={14} style={{ display: 'inline', color: 'var(--secondary)' }} />
          </p>
        </motion.div>
      </motion.div>

      {/* Install Guidance Modal (iOS & Android) */}
      <AnimatePresence>
        {showInstallModal && (
          <motion.div 
            className="install-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInstallModal(false)}
          >
            <motion.div 
              className="install-modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                className="install-modal-close" 
                onClick={() => setShowInstallModal(false)}
                aria-label="סגירה"
              >
                <X size={20} />
              </button>

              <div className="install-modal-header">
                <div className="install-modal-app-icon">
                  <img src="/app-icon.png" alt="חב״ד בקמפוס" />
                </div>
                <h3>הוספת האפליקציה למסך הבית 📲</h3>
                <p>כדי שחב״ד בקמפוס יהיה זמין לכם תמיד בלחיצה אחת מהירה:</p>
              </div>

              {isIOS ? (
                <div className="install-steps-list">
                  <div className="install-step-item">
                    <span className="step-num">1</span>
                    <div className="step-text">
                      לחצו על כפתור השיתוף בתחתית הדפדפן <strong>(סמל <Share size={15} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> Share)</strong>
                    </div>
                  </div>
                  <div className="install-step-item">
                    <span className="step-num">2</span>
                    <div className="step-text">
                      גללו קלות בתפריט ולחצו על <strong>"הוסף למסך הבית" <PlusSquare size={15} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /></strong>
                    </div>
                  </div>
                  <div className="install-step-item">
                    <span className="step-num">3</span>
                    <div className="step-text">
                      לחצו על <strong>"הוסף" (Add)</strong> בפינה העליונה – והאייקון של חב״ד מוכן אצלכם במסך הבית! ✨
                    </div>
                  </div>
                </div>
              ) : (
                <div className="install-steps-list">
                  <div className="install-step-item">
                    <span className="step-num">1</span>
                    <div className="step-text">
                      לחצו על תפריט <strong>3 הנקודות (⋮)</strong> בפינת הדפדפן למעלה
                    </div>
                  </div>
                  <div className="install-step-item">
                    <span className="step-num">2</span>
                    <div className="step-text">
                      בחרו באפשרות <strong>"התקנת אפליקציה"</strong> או <strong>"הוספה למסך הבית"</strong>
                    </div>
                  </div>
                  <div className="install-step-item">
                    <span className="step-num">3</span>
                    <div className="step-text">
                      אשרו את ההתקנה – והאפליקציה תופיע במסך הבית שלכם! ✨
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="button"
                className="install-modal-confirm-btn"
                onClick={() => setShowInstallModal(false)}
              >
                הבנתי, תודה! 👍
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewYearHub;
