import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronRight, 
  Share2, 
  RotateCw, 
  Coins, 
  Heart, 
  Check, 
  ExternalLink, 
  Copy, 
  Info, 
  Sparkles, 
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Kaparot.css';

type RecipientType = 'male' | 'female' | 'family';

const DONATION_URL = 'https://katzr.net/b65d26';

const Kaparot = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [recipient, setRecipient] = useState<RecipientType>('male');
  const [completedRounds, setCompletedRounds] = useState<number[]>([]);
  const [showFlyerModal, setShowFlyerModal] = useState(false);

  useEffect(() => {
    document.title = 'פדיון כפרות - חב״ד בקמפוס בר אילן';
    window.scrollTo(0, 0);

    // Auto-detect gender if student is logged in
    if (profile?.gender === 'f') {
      setRecipient('female');
    } else if (profile?.gender === 'm') {
      setRecipient('male');
    }
  }, [profile]);

  const toggleRound = (roundNum: number) => {
    if (completedRounds.includes(roundNum)) {
      setCompletedRounds(completedRounds.filter(r => r !== roundNum));
    } else {
      const nextRounds = [...completedRounds, roundNum];
      setCompletedRounds(nextRounds);
      if (nextRounds.length === 3) {
        toast.success('יישר כוח! סיימת את 3 הסבבים של פדיון הכפרות ✨');
      }
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = 'מקיימים את מנהג פדיון כפרות בקלות ישירות דרך האפליקציה של חב״ד בקמפוס בר אילן:';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'פדיון כפרות - חב״ד בקמפוס בר אילן',
          text: `${shareText}\n${shareUrl}`,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // user cancelled or share failed, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success('הקישור הועתק! ניתן לשלוח לחברים בוואטסאפ');
    } catch {
      toast.error('לא ניתן היה להעתיק את הקישור');
    }
  };

  const getFormulaText = () => {
    switch (recipient) {
      case 'female':
        return 'זֹאת חֲלִיפָתִי, זֹאת תְּמוּרָתִי, זֹאת כַּפָּרָתִי. זֶה הַכֶּסֶף יֵלֵךְ לִצְדָקָה, וַאֲנִי אֵלֵךְ לְחַיִּים טוֹבִים אֲרֻכִּים וּלְשָׁלוֹם:';
      case 'family':
        return 'אֵלּוּ חֲלִיפָתֵנוּ, אֵלּוּ תְמוּרָתֵנוּ, אֵלּוּ כַּפָּרָתֵנוּ. זֶה הַכֶּסֶף יֵלֵךְ לִצְדָקָה, וַאֲנַחְנוּ נֵלֵךְ לְחַיִּים טוֹבִים אֲרֻכִּים וּלְשָׁלוֹם:';
      case 'male':
      default:
        return 'זֶה חֲלִיפָתִי, זֶה תְּמוּרָתִי, זֶה כַּפָּרָתִי. זֶה הַכֶּסֶף יֵלֵךְ לִצְדָקָה, וַאֲנִי אֵלֵךְ לְחַיִּים טוֹבִים אֲרֻכִּים וּלְשָׁלוֹם:';
    }
  };

  return (
    <motion.div 
      className="kaparot-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Top Action Bar */}
      <div className="kaparot-nav-bar">
        <button 
          onClick={() => navigate('/')} 
          className="kaparot-back-btn"
          title="חזרה לעמוד הבית"
        >
          <ChevronRight size={18} />
          <span>חזרה לדף הבית</span>
        </button>

        <button 
          onClick={handleShare} 
          className="kaparot-share-btn"
          title="שיתוף עם חברים"
        >
          <Share2 size={16} />
          <span>שיתוף</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="kaparot-hero">
        <div className="kaparot-hero-glow" />
        <div className="kaparot-badge">
          <Sparkles size={14} />
          <span>עשרת ימי תשובה • ערב יום הכיפורים</span>
        </div>
        <h1 className="kaparot-title">סדר פדיון כפרות</h1>
        <p className="kaparot-subtitle">חב״ד בקמפוס אוניברסיטת בר אילן</p>
      </div>

      {/* Intro Card */}
      <div className="kaparot-card">
        <div className="kaparot-card-header">
          <div className="kaparot-icon-badge">
            <Info size={20} />
          </div>
          <h2 className="kaparot-card-title">על מנהג הכפרות</h2>
        </div>
        <p className="kaparot-intro-text">
          בערב יום-הכיפורים או בעשרת ימי תשובה, מקיימים את מנהג ה'כפרות'. 
          כוונת מנהג זה היא להעביר מעל ראשנו כל גזירה רעה ולעורר את הלב לתשובה.
          <br /><br />
          נהוג לקיים את המנהג בתרנגול ולתת את ערך התרנגול לצדקה. מי שאינו משיג תרנגול עושה זאת ישירות <strong>בכסף שתורמים לצדקה</strong>. 
          מנהג זה הינו סגולה מיוחדת לשנה טובה ומוצלחת בגשמיות וברוחניות, בבריאות ובפרנסה.
        </p>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            onClick={() => setShowFlyerModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary, #492691)',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              textDecoration: 'underline'
            }}
          >
            <FileText size={15} />
            <span>לצפייה במודעת פדיון הכפרות המקורית</span>
          </button>
        </div>
      </div>

      {/* Prayer & Ceremony Card */}
      <div className="kaparot-card">
        <div className="kaparot-card-header">
          <div className="kaparot-icon-badge">
            <Coins size={20} />
          </div>
          <h2 className="kaparot-card-title">סדר התפילה והסיבוב</h2>
        </div>

        {/* Recipient Selector */}
        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary, #475569)', marginBottom: '0.45rem' }}>
          בחירת נוסח התפילה:
        </label>
        <div className="recipient-selector">
          <button 
            className={`recipient-tab ${recipient === 'male' ? 'active' : ''}`}
            onClick={() => setRecipient('male')}
          >
            עבורי (גבר)
          </button>
          <button 
            className={`recipient-tab ${recipient === 'female' ? 'active' : ''}`}
            onClick={() => setRecipient('female')}
          >
            עבורי (אישה)
          </button>
          <button 
            className={`recipient-tab ${recipient === 'family' ? 'active' : ''}`}
            onClick={() => setRecipient('family')}
          >
            עבור המשפחה
          </button>
        </div>

        {/* Prayer Part 1: Bnei Adam */}
        <div className="prayer-box">
          <div className="prayer-box-label">
            <span>אומרים תפילה זו:</span>
          </div>
          <p className="prayer-content">
            בְּנֵי אָדָם יוֹשְׁבֵי חֹשֶׁךְ וְצַלְמָוֶת, אֲסִירֵי עֳנִי וּבַרְזֶל: 
            יוֹצִיאֵם מֵחֹשֶׁךְ וְצַלְמָוֶת, וּמוֹסְרוֹתֵיהֶם יְנַתֵּק: 
            אֱוִילִים מִדֶּרֶךְ פִּשְׁעָם, וּמֵעֲו‍ֹנֹתֵיהֶם יִתְעַנּוּ: 
            כָּל אֹכֶל תְּתַעֵב נַפְשָׁם, וַיַּגִּיעוּ עַד שַׁעֲרֵי מָוֶת: 
            וַיִּזְעֲקוּ אֶל אֲ-דֹנָי בַּצַּר לָהֶם, מִמְּצֻקוֹתֵיהֶם יוֹשִׁיעֵם: 
            יִשְׁלַח דְּבָרוֹ וְיִרְפָּאֵם, וִימַלֵּט מִשְּׁחִיתוֹתָם: 
            יוֹדוּ לַא-דֹנָי חַסְדּוֹ וְנִפְלְאוֹתָיו לִבְנֵי אָדָם: 
            אִם יֵשׁ עָלָיו מַלְאָךְ מֵלִיץ, אֶחָד מִנִּי אָלֶף, לְהַגִּיד לְאָדָם יָשְׁרוֹ: 
            וַיְחֻנֶּנּוּ, וַיֹּאמֶר, פְּדָעֵהוּ מֵרֶדֶת שַׁחַת, מָצָאתִי כֹפֶר:
          </p>
        </div>

        {/* Rotation Guidance & Formula */}
        <div className="rotation-guidance-box">
          <div className="rotation-instruction-title">
            <RotateCw size={18} />
            <span>הנחיית הסיבוב:</span>
          </div>
          <p className="rotation-instruction-desc">
            אוחזים בכסף (או בכרטיס האשראי / הטלפון הנייד שבו תורמים), מסובבים <strong>3 פעמים</strong> מעל הראש ואומרים את הפסוק הבא:
          </p>

          <div className="rotation-formula-box">
            <p className="rotation-formula-text">
              {getFormulaText()}
            </p>
          </div>

          {/* 3 Rounds Interactive Counter */}
          <div className="rounds-counter-container">
            <span className="rounds-counter-title">
              חוזרים על כך 3 פעמים (בכל פעם מסובבים 3 פעמים - סה״כ 9 סיבובים):
            </span>
            <div className="rounds-buttons">
              {[1, 2, 3].map((round) => {
                const isDone = completedRounds.includes(round);
                return (
                  <button
                    key={round}
                    type="button"
                    className={`round-btn ${isDone ? 'completed' : ''}`}
                    onClick={() => toggleRound(round)}
                  >
                    {isDone ? (
                      <>
                        <Check size={18} strokeWidth={3} />
                        <span>סבב {round} הושלם ✓</span>
                      </>
                    ) : (
                      <>
                        <RotateCw size={16} />
                        <span>סבב {round}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Donation Card */}
      <div className="donation-card">
        <div className="donation-badge">
          <Heart size={14} />
          <span>השלמת המצווה</span>
        </div>
        <h2 className="donation-title">מתן דמי הכפרות לצדקה</h2>
        <p className="donation-desc">
          כדי להשלים את פדיון הכפרות, מעבירים את דמי הכפרות לצדקה.
          <br />
          <strong>מקובל לתת כערך תרנגול (כ-36–50 ₪ לנפש) או כל סכום כפי נדבת לבכם.</strong>
          <br />
          כל התרומות מוקדשות ישירות לפעילות בית חב״ד עם הסטודנטים באוניברסיטת בר אילן.
        </p>

        <a 
          href={DONATION_URL} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="donation-cta-btn"
        >
          <span>לתרומה מאובטחת של דמי הכפרות</span>
          <ExternalLink size={19} />
        </a>

        <div className="donation-note">
          <Coins size={14} />
          <span>התשלום מאובטח ומוכר לצורכי תרומה (סעיף 46)</span>
        </div>
      </div>

      {/* Bottom Wishes & Community Share */}
      <div className="kaparot-footer-wishes">
        <h3 className="wishes-title">גמר חתימה טובה ושנה טובה ומתוקה! 🍯🍎</h3>
        <p className="wishes-sub">
          בברכת שנת ברכה והצלחה בלימודים ובחיים,
          <br />
          הרב ישראל ואילה הלפרין וצוות חב״ד בקמפוס בר אילן 💜
        </p>

        <button 
          onClick={handleShare}
          className="kaparot-share-big-btn"
        >
          <Share2 size={17} />
          <span>שתפו חברים לקיום המצווה</span>
        </button>
      </div>

      {/* Original Flyer Modal */}
      {showFlyerModal && (
        <div className="flyer-modal-overlay" onClick={() => setShowFlyerModal(false)}>
          <div className="flyer-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="flyer-modal-close" 
              onClick={() => setShowFlyerModal(false)}
              aria-label="סגור"
            >
              <X size={20} />
            </button>
            <img 
              src="/kaparot-flyer.jpg" 
              alt="מודעת פדיון כפרות חב״ד בקמפוס" 
              className="flyer-modal-img" 
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Kaparot;
