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
  FileText,
  Scroll
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { blessingService } from '../utils/blessingService';
import toast from 'react-hot-toast';
import './Kaparot.css';

type RecipientType = 'male' | 'female' | 'family';

const DONATION_URL = 'https://katzr.net/b65d26';
const YAAD_PAY_IFRAME_URL = 'https://icom.yaad.net/cgi-bin/yaadpay/yaadpay3ds.pl?Coin=1&FixTash=False&Info=%E1%E9%FA+%E7%E1%26%2334%3B%E3+%E4%F8%E1+%E0%F4%F8%E9%ED+%F4%E9%F7%E0%F8%F1%F7%E9+&Masof=4500743028&MoreData=True&PageLang=HEB&Postpone=False&SendHesh=True&ShowEngTashText=True&Tash=1&UTF8out=True&action=pay&freq=1&sendemail=True&tmp=11&signature=6ed12ed6e498b03ce22190031066363808882b24cea4ba99b69baedbe691a847';

const Kaparot = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [recipient, setRecipient] = useState<RecipientType>('male');
  const [completedRounds, setCompletedRounds] = useState<number[]>([]);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  // Confirmation & Blessing registration states
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [motherName, setMotherName] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [extraBlessing, setExtraBlessing] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    document.title = 'פדיון כפרות - חב״ד בקמפוס בר אילן';
    window.scrollTo(0, 0);

    // Auto-fill from profile if logged in
    if (profile) {
      if (profile.full_name && !donorName) setDonorName(profile.full_name);
      if (profile.phone && !donorPhone) setDonorPhone(profile.phone);
      if (profile.gender === 'f') {
        setRecipient('female');
      } else if (profile.gender === 'm') {
        setRecipient('male');
      }
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

  const handleConfirmKaparot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      toast.error('נא למלא שם מלא');
      return;
    }
    if (!donorPhone.trim()) {
      toast.error('נא למלא מספר טלפון');
      return;
    }

    setSubmitting(true);
    try {
      const goodResParts = [];
      if (donationAmount.trim()) {
        goodResParts.push(`דמי כפרות: ${donationAmount.trim()}`);
      } else {
        goodResParts.push('דמי כפרות נמסרו לצדקה');
      }
      goodResParts.push(`טלפון: ${donorPhone.trim()}`);

      const blessingTextParts = ['פדיון כפרות לשנה טובה ומבורכת, גמר חתימה טובה'];
      if (extraBlessing.trim()) {
        blessingTextParts.push(extraBlessing.trim());
      }

      await blessingService.createRequest({
        gender: recipient === 'female' ? 'female' : 'male',
        full_name: donorName.trim(),
        last_name: '[פדיון כפרות]',
        mother_name: motherName.trim() || 'עצמי',
        good_resolution: goodResParts.join(' | '),
        blessing_request: blessingTextParts.join(' | '),
      });

      setShowSuccessModal(true);
      toast.success('פדיון הכפרות והשמות נקלטו בהצלחה!');
    } catch (err: any) {
      console.error(err);
      toast.error('שגיאה בשמירת הנתונים. אנא נסו שוב.');
    } finally {
      setSubmitting(false);
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

      {/* Hero Header with banner image */}
      <div className="kaparot-hero-banner-container">
        <img 
          src="/kaparot-banner.jpeg" 
          alt="סדר פדיון כפרות - חב״ד בקמפוס בר אילן" 
          className="kaparot-hero-banner-image" 
        />
        <div className="kaparot-hero-banner-overlay">
          <div className="kaparot-badge">
            <Sparkles size={14} />
            <span>עשרת ימי תשובה • ערב יום הכיפורים</span>
          </div>
          <p className="kaparot-subtitle">חב״ד בקמפוס אוניברסיטת בר אילן</p>
        </div>
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

        {/* Embedded Secure Payment Frame */}
        <div className="donation-iframe-container">
          {iframeLoading && (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--primary, #492691)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>טוען טופס תרומה מאובטח...</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>רגע אחד, מתחברים למערכת הסליקה</div>
            </div>
          )}
          <iframe
            src={YAAD_PAY_IFRAME_URL}
            title="טופס תרומה מאובטח יעד שריג"
            className="donation-iframe"
            onLoad={() => setIframeLoading(false)}
          />
        </div>

        <div style={{ textAlign: 'center', margin: '0.5rem 0 0.85rem' }}>
          <a
            href={DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="donation-fallback-btn"
          >
            <span>אם הטופס לא נטען אצלכם – לחצו כאן לתשלום בחלון נפרד</span>
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="donation-note">
          <Coins size={14} />
          <span>התשלום מאובטח ומוכר לצורכי תרומה (סעיף 46)</span>
        </div>
      </div>

      {/* Donor Information & Blessing Names Registration Card */}
      <div className="kaparot-card" style={{ border: '2px solid rgba(245, 158, 11, 0.4)' }}>
        <div className="kaparot-card-header">
          <div className="kaparot-icon-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706' }}>
            <Scroll size={20} />
          </div>
          <h2 className="kaparot-card-title">רישום שמות לברכה ואישור פדיון כפרות</h2>
        </div>
        <p className="kaparot-intro-text" style={{ marginBottom: '1.25rem' }}>
          לאחר ביצוע התרומה, מלאו את הפרטים שלמטה כדי שהשמות שלכם ושל יקיריכם יועברו ישירות לברכה אצל הרב ישראל ואילה הלפרין לקראת יום הכיפורים:
        </p>

        <form onSubmit={handleConfirmKaparot} className="kaparot-confirm-form">
          <div className="kaparot-form-group">
            <label className="kaparot-label">שם מלא של התורם/ת: *</label>
            <input
              type="text"
              required
              className="kaparot-input"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="לדוגמה: ישראל ישראלי"
            />
          </div>

          <div className="kaparot-form-group">
            <label className="kaparot-label">טלפון ליצירת קשר ועדכונים: *</label>
            <input
              type="tel"
              required
              className="kaparot-input"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              placeholder="050-0000000"
            />
          </div>

          <div className="kaparot-form-group">
            <label className="kaparot-label">שם האמא (לברכה): *</label>
            <input
              type="text"
              required
              className="kaparot-input"
              value={motherName}
              onChange={(e) => setMotherName(e.target.value)}
              placeholder="לדוגמה: שרה"
            />
          </div>

          <div className="kaparot-form-group">
            <label className="kaparot-label">סכום שנתרם (אופציונלי):</label>
            <input
              type="text"
              className="kaparot-input"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              placeholder="לדוגמה: 50 ₪"
            />
          </div>

          <div className="kaparot-form-group">
            <label className="kaparot-label">שמות נוספים לברכה או בקשות מיוחדות (אופציונלי):</label>
            <textarea
              className="kaparot-textarea"
              rows={2}
              value={extraBlessing}
              onChange={(e) => setExtraBlessing(e.target.value)}
              placeholder="לדוגמה: דוד בן רבקה לרפואה שלמה, הצלחה בלימודים..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="kaparot-submit-blessing-btn"
          >
            {submitting ? (
              <span>שומר ומעביר לברכה...</span>
            ) : (
              <>
                <Sparkles size={18} />
                <span>אישור סיום פדיון כפרות ושליחת השמות לברכה</span>
              </>
            )}
          </button>
        </form>
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

      {/* Success / Gmar Chatima Tova Modal */}
      {showSuccessModal && (
        <div className="flyer-modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div 
            className="kaparot-success-modal-content" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="success-festive-icon">
              🍯🍎
            </div>

            <h2 className="success-modal-title">
              גמר חתימה טובה ושנה טובה ומתוקה!
            </h2>

            <div className="success-modal-badge">
              <Sparkles size={14} />
              <span>פדיון הכפרות והשמות נקלטו בהצלחה</span>
            </div>

            <p className="success-modal-desc">
              יישר כוחכם! זכות מצוות פדיון הכפרות והצדקה תעמוד לכם לשנה טובה ומבורכת, 
              כתיבה וחתימה טובה בספר החיים, בריאות איתנה, פרנסה טובה, שמחה, 
              ושפע הצלחה בלימודים ובכל מעשי ידיכם!
              <br /><br />
              השמות הועברו ישירות לברכה אצל הרב ישראל ואילה הלפרין לקראת יום הכיפורים. 🙏
            </p>

            <div className="success-modal-actions">
              <button
                onClick={() => navigate('/')}
                className="modal-btn-primary"
              >
                חזרה לעמוד הבית 💜
              </button>
              <button
                onClick={handleShare}
                className="modal-btn-secondary"
              >
                <Share2 size={16} />
                <span>שתפו חברים לקיום המצווה</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Kaparot;
