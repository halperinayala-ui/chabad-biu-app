import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft,
  Share2, 
  RotateCw, 
  Coins, 
  Heart, 
  Check, 
  ExternalLink, 
  Info, 
  Sparkles 
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
  const [iframeLoading, setIframeLoading] = useState(true);

  // User details for Kaparot registry before donation
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [isDetailsSubmitted, setIsDetailsSubmitted] = useState(false);
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);

  // Kaparot Amount Selection (determined in advance before rotation)
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const effectiveAmount = isCustom ? (Number(customAmount) || 0) : selectedAmount;

  const scrollToAmountSection = () => {
    const el = document.getElementById('amount-selection-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    document.title = 'פדיון כפרות - חב״ד בקמפוס בר אילן';
    window.scrollTo(0, 0);

    // Auto-detect gender if student is logged in
    if (profile?.gender === 'f') {
      setRecipient('female');
    } else if (profile?.gender === 'm') {
      setRecipient('male');
    }

    // Auto-fill student first and last name if available in profile
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(' ');
      if (parts.length > 0) {
        setFirstName(parts[0]);
        if (parts.length > 1) {
          setLastName(parts.slice(1).join(' '));
        }
      }
    }

    // Check if details were already entered in this session
    const saved = sessionStorage.getItem('kaparot_submitted_v1');
    if (saved === 'true') {
      setIsDetailsSubmitted(true);
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
    const shareUrl = 'https://chabad-biu-app.vercel.app/kaparot';
    const shareText = 'מקיימים את מנהג פדיון כפרות בקלות ישירות דרך האפליקציה של חב״ד בקמפוס בר אילן:';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'פדיון כפרות - חב״ד בקמפוס בר אילן',
          text: shareText,
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

  const handleDetailsSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedMother = motherName.trim();

    if (!trimmedFirst || !trimmedLast || !trimmedMother) {
      toast.error('נא למלא שם פרטי, שם משפחה ושם האם להשלמת הפדיון');
      return;
    }

    if (effectiveAmount <= 0) {
      toast.error('נא לבחור או להזין סכום לפדיון הכפרות');
      return;
    }

    setIsSubmittingDetails(true);
    try {
      const genderVal: 'male' | 'female' = recipient === 'female' ? 'female' : 'male';
      const lastNameFormatted = `${trimmedLast} [פדיון כפרות]`;

      await blessingService.createRequest({
        gender: genderVal,
        full_name: trimmedFirst,
        last_name: lastNameFormatted,
        mother_name: trimmedMother,
        good_resolution: `${effectiveAmount} ₪`,
        blessing_request: '',
      });

      sessionStorage.setItem('kaparot_submitted_v1', 'true');
      setIsDetailsSubmitted(true);
      toast.success('פרטיך נקלטו בהצלחה לפדיון כפרות! כעת ניתן לבצע את התרומה ✨');
    } catch (err) {
      console.error('Error saving kaparot entry:', err);
      toast.error('חלה שגיאה בשמירת הפרטים, אך ניתן להמשיך לתרומה');
      setIsDetailsSubmitted(true);
    } finally {
      setIsSubmittingDetails(false);
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

      {/* Hero Banner image (Clean without covering texts) */}
      <div className="kaparot-hero-banner-container">
        <img 
          src="/kaparot-banner.jpeg" 
          alt="סדר פדיון כפרות - חב״ד בקמפוס בר אילן" 
          className="kaparot-hero-banner-image" 
        />
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
      </div>

      {/* Step 1: Set Kaparot Amount in Advance */}
      <div id="amount-selection-section" className="kaparot-amount-selection-box">
        <div className="amount-section-header">
          <div className="step-badge">שלב 1</div>
          <div className="header-text">
            <h3>קביעת סכום פדיון הכפרות</h3>
            <p>
              לפני תחילת הכפרות, קובעים מראש את סכום הכסף שיינתן לצדקה (כ-36–50 ₪ לנפש כערך תרנגול, או כפי נדבת לבכם):
            </p>
          </div>
        </div>

        <div className="amount-preset-buttons">
          {[36, 50, 100, 180].map((amt) => (
            <button
              key={amt}
              type="button"
              className={`amount-pill-btn ${!isCustom && selectedAmount === amt ? 'selected' : ''}`}
              onClick={() => {
                setSelectedAmount(amt);
                setIsCustom(false);
              }}
            >
              <span className="amt-value">{amt} ₪</span>
              <span className="amt-label">
                {amt === 36 ? "בסיסי (פעמיים 'חי')" : amt === 50 ? 'מהודר' : amt === 100 ? 'תרומה מורחבת' : "עשר פעמים 'חי'"}
              </span>
            </button>
          ))}
          <button
            type="button"
            className={`amount-pill-btn ${isCustom ? 'selected' : ''}`}
            onClick={() => setIsCustom(true)}
          >
            <span className="amt-value">סכום אחר</span>
            <span className="amt-label">הזנה חופשית</span>
          </button>
        </div>

        {isCustom && (
          <div className="custom-amount-input-wrap">
            <label>הזינו סכום לתרומה (בש״ח):</label>
            <div className="input-with-currency">
              <input
                type="number"
                min="1"
                placeholder="למשל: 72"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(Number(e.target.value) || 0);
                }}
                autoFocus
              />
              <span>₪</span>
            </div>
          </div>
        )}

        <div className="kaparot-summary-note">
          <div className="note-icon">💡</div>
          <div className="note-text">
            <strong>איך זה עובד?</strong>
            <span>
              לוקחים שטר או סכום כסף ביד (או במעטפה / שקית), מסובבים מעל הראש ועושים את הכפרות. לאחר מכן תורמים באשראי את הסכום שקבעתם – והכסף שבידכם נפדה לצדקה.
            </span>
          </div>
        </div>
      </div>

      {/* Step 2: Prayer & Ceremony Card */}
      <div className="kaparot-card">
        <div className="kaparot-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="step-badge">שלב 2</div>
          <div className="kaparot-icon-badge">
            <Coins size={20} />
          </div>
          <h2 className="kaparot-card-title" style={{ margin: 0 }}>סדר התפילה והסיבוב מעל הראש</h2>
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
            אוחזים בסכום הכסף שקבעתם (שטר או מטבעות ביד, בשקית או במעטפה), מסובבים <strong>3 פעמים</strong> מעל הראש ואומרים:
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

      {/* Step 3: Donation Card - Embedded In-App Checkout */}
      <div className="donation-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
          <div className="step-badge">שלב 3</div>
          <div className="donation-badge" style={{ margin: 0 }}>
            <Heart size={14} />
            <span>השלמת המצווה</span>
          </div>
        </div>
        <h2 className="donation-title">פדיון הכסף לצדקה באשראי</h2>
        <p className="donation-desc">
          כעת תורמים באשראי את סכום הכפרות שקבעתם – ובכך נפדה הכסף שסובבתם על הראש ישירות לצדקה!
        </p>

        {/* Selected Amount Recap Banner */}
        <div className="selected-amount-recap-banner">
          <div>
            <span>סכום הפדיון שקבעתם: </span>
            <strong>{effectiveAmount} ₪</strong>
          </div>
          <button type="button" onClick={scrollToAmountSection} className="recap-edit-btn">
            שינוי סכום
          </button>
        </div>

        {!isDetailsSubmitted ? (
          <form onSubmit={handleDetailsSubmit} className="kaparot-details-box">
            <div className="kaparot-details-header">
              <Sparkles size={16} />
              <span>רישום פרטים לפדיון כפרות</span>
            </div>
            <p className="kaparot-details-hint">
              רשמו את שמכם ושם האם, ולחצו למטה למעבר ישיר לטופס התרומה המאובטח:
            </p>

            <div className="kaparot-inputs-grid">
              <div className="kaparot-input-field">
                <label>שם פרטי *</label>
                <input
                  type="text"
                  placeholder="למשל: דניאל"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="kaparot-input-field">
                <label>שם משפחה *</label>
                <input
                  type="text"
                  placeholder="למשל: לוי"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div className="kaparot-input-field full-width">
                <label>שם האם * (לפדיון כפרות ולברכה)</label>
                <input
                  type="text"
                  placeholder="למשל: שרה"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingDetails}
              className="kaparot-submit-to-pay-btn"
            >
              {isSubmittingDetails ? (
                <span>רושם את הפרטים...</span>
              ) : (
                <>
                  <span>שמירה ומעבר לפדיון {effectiveAmount > 0 ? `${effectiveAmount} ₪` : 'הכפרות'} באשראי</span>
                  <ChevronLeft size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="kaparot-confirmed-section">
            <div className="kaparot-confirmed-banner">
              <div className="confirmed-info">
                <Check size={18} className="confirmed-check-icon" strokeWidth={3} />
                <span>
                  נרשם לפדיון כפרות: <strong>{firstName} {lastName}</strong> ({recipient === 'female' ? 'בת' : 'בן'} {motherName}) – <strong>{effectiveAmount} ₪</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsSubmitted(false)}
                className="confirmed-edit-btn"
              >
                עריכת פרטים
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.92rem', color: '#475569', margin: '0.5rem 0' }}>
              כעת השלימו את תרומת הפדיון על סך <strong>{effectiveAmount} ₪</strong> בטופס המאובטח שלפניכם:
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
          </div>
        )}

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
          הרב אפרים ואילה פיקארסקי
        </p>

        <button 
          onClick={handleShare}
          className="kaparot-share-big-btn"
        >
          <Share2 size={17} />
          <span>שתפו חברים לקיום המצווה</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Kaparot;
