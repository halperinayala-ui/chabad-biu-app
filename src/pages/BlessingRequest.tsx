import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Send, CheckCircle2, HeartHandshake, Eye, ArrowRight, Scroll, LayoutDashboard } from 'lucide-react';
import { blessingService, formatBlessingSentence } from '../utils/blessingService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './BlessingRequest.css';

const RESOLUTION_CHIPS = [
  'קריאת שמע',
  'הנחת תפילין',
  'נרות שבת',
  'ברכות השחר',
  'ברכת המזון',
  'נטילת ידיים',
  'כשרות',
  'נתינת צדקה בכל יום',
  'שיעור תורה שבועי'
];

const BLESSING_CHIPS = [
  'בריאות איתנה ורפואה שלמה',
  'הצלחה בלימודים ובבחינות',
  'זיווג הגון ומהיר',
  'פרנסה טובה וברווח',
  'נחת מכל המשפחה',
  'שלום בית ושמחה'
];

const BlessingRequest = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [fullName, setFullName] = useState('');
  const [lastName, setLastName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [goodResolution, setGoodResolution] = useState('');
  const [blessingRequest, setBlessingRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    document.title = 'טופס לשליחת שמות ובקשת ברכה בציון הקדוש של הרבי';

    const domain = window.location.origin.includes('localhost') 
      ? 'https://chabad-biu-app.vercel.app' 
      : window.location.origin;
    const imageUrl = `${domain}/title-pan.jpeg`;
    const metaTags = [
      { property: 'og:title', content: 'טופס לשליחת שמות ובקשת ברכה בציון הקדוש של הרבי' },
      { property: 'og:description', content: 'מילוי שמות, החלטות טובות ובקשות ברכה להעברה ישירה לציון הקדוש של הרבי מליובאוויטש' },
      { property: 'og:image', content: imageUrl },
      { property: 'og:image:secure_url', content: imageUrl },
      { name: 'twitter:image', content: imageUrl }
    ];

    metaTags.forEach(({ property, name, content }) => {
      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      }
    });
  }, []);

  const formattedPreview = formatBlessingSentence({
    gender,
    full_name: fullName || (gender === 'male' ? 'דוד שמעון' : 'שרה'),
    last_name: lastName,
    mother_name: motherName || (gender === 'male' ? 'דניאלה' : 'חנה'),
    good_resolution: goodResolution,
    blessing_request: blessingRequest
  });

  const handleAddChip = (text: string, type: 'resolution' | 'blessing') => {
    if (type === 'resolution') {
      setGoodResolution(prev => (prev ? `${prev}, ${text}` : text));
    } else {
      setBlessingRequest(prev => (prev ? `${prev}, ${text}` : text));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('אנא הזינו שם פרטי מלא');
      return;
    }
    if (!motherName.trim()) {
      toast.error('אנא הזינו את שם האמא');
      return;
    }

    setLoading(true);
    try {
      await blessingService.createRequest({
        gender,
        full_name: fullName,
        last_name: lastName,
        mother_name: motherName,
        good_resolution: goodResolution,
        blessing_request: blessingRequest
      });

      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      toast.error('אירעה שגיאה בשמירת הבקשה, אנא נסו שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setFullName('');
    setLastName('');
    setMotherName('');
    setGoodResolution('');
    setBlessingRequest('');
    setShowSuccessModal(false);
  };

  return (
    <motion.div 
      className="blessing-page"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="blessing-card">
        <div className="blessing-header">
          {profile?.is_admin && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <Link 
                to="/admin/blessings" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                  color: '#fff',
                  padding: '0.5rem 1.1rem',
                  borderRadius: '20px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
                }}
              >
                <LayoutDashboard size={16} />
                <span>מעבר לדף ניהול והדפסת שמות (מנהל)</span>
              </Link>
            </div>
          )}

          <div className="blessing-title-image-wrapper">
            <img 
              src="/title-pan.jpeg" 
              alt="טופס לשליחת שמות ובקשת ברכה בציון הקדוש של הרבי" 
              className="blessing-title-image"
            />
          </div>

          <h1 className="blessing-title">כתיבה לרבי מליובאוויטש</h1>
          <p className="blessing-subtitle">
            טופס לשליחת שמות ובקשת ברכה בציון הקדוש של הרבי
          </p>
        </div>

        <form onSubmit={handleSubmit} className="blessing-form">
          {/* Gender Selector */}
          <div className="gender-selector">
            <div className="gender-options">
              <button
                type="button"
                className={`gender-btn male ${gender === 'male' ? 'active' : ''}`}
                onClick={() => setGender('male')}
              >
                <span>👨‍💼</span>
                <span>זכר</span>
              </button>
              <button
                type="button"
                className={`gender-btn female ${gender === 'female' ? 'active' : ''}`}
                onClick={() => setGender('female')}
              >
                <span>👩‍💼</span>
                <span>נקבה</span>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="fullNameInput">
              <span>שם פרטי מלא</span>
              <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              id="fullNameInput"
              type="text"
              className="form-input"
              placeholder={gender === 'male' ? 'למשל: דוד שמעון' : 'למשל: שרה חיה'}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Mother's Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="motherNameInput">
              <span>שם פרטי מלא של האמא</span>
              <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              id="motherNameInput"
              type="text"
              className="form-input"
              placeholder="למשל: דניאלה חנה"
              value={motherName}
              onChange={e => setMotherName(e.target.value)}
              required
            />
          </div>

          {/* Last Name (Optional) */}
          <div className="form-group">
            <label className="form-label" htmlFor="lastNameInput">
              <span>שם משפחה</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>(אופציונלי)</span>
            </label>
            <input
              id="lastNameInput"
              type="text"
              className="form-input"
              placeholder="למשל: כהן"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </div>

          {/* Good Resolution / Decision */}
          <div className="form-group">
            <label className="form-label" htmlFor="goodResolutionInput">
              <Sparkles size={18} style={{ color: '#f39c12' }} />
              <span>החלטה טובה</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>(אופציונלי)</span>
            </label>
            <textarea
              id="goodResolutionInput"
              className="form-textarea"
              rows={2}
              placeholder={gender === 'male' ? 'מקבל על עצמי להתחזק ב...' : 'מקבלת על עצמי להתחזק ב...'}
              value={goodResolution}
              onChange={e => setGoodResolution(e.target.value)}
            />
            <div className="quick-chips">
              {RESOLUTION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chip-btn"
                  onClick={() => handleAddChip(chip, 'resolution')}
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Blessing Request */}
          <div className="form-group">
            <label className="form-label" htmlFor="blessingRequestInput">
              <HeartHandshake size={18} style={{ color: '#e91e8c' }} />
              <span>בקשת ברכה</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>(אופציונלי)</span>
            </label>
            <textarea
              id="blessingRequestInput"
              className="form-textarea"
              rows={3}
              placeholder="למשל: רפואה שלמה, בריאות איתנה, הצלחה בלימודים, זיווג הגון..."
              value={blessingRequest}
              onChange={e => setBlessingRequest(e.target.value)}
            />
            <div className="quick-chips">
              {BLESSING_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chip-btn"
                  onClick={() => handleAddChip(chip, 'blessing')}
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="preview-box">
            <div className="preview-title">
              <Eye size={16} />
              <span>תצוגה מקדימה כפי שתודפס ותועבר לציון:</span>
            </div>
            <p className="preview-text">
              {formattedPreview}
            </p>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            <Send size={20} />
            <span>{loading ? 'שולח...' : 'שליחת הבקשה לציון'}</span>
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="modal-title">הבקשה התקבלה בהצלחה!</h2>
            <p className="modal-desc">
              אשריכם! השם והבקשה שלכם נרשמו במערכת ויובאו בעזרת ה' לברכה והצלחה בציון הקדוש של הרבי מליובאוויטש.
            </p>
            <div className="modal-actions">
              <button 
                type="button" 
                className="submit-btn" 
                style={{ width: '100%', margin: 0 }}
                onClick={handleResetForm}
              >
                <PlusIcon />
                <span>שליחת שם נוסף (לבן משפחה / חבר)</span>
              </button>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ width: '100%', padding: '0.8rem', borderRadius: '16px' }}
                onClick={() => navigate('/')}
              >
                <span>חזרה לדף הבית</span>
                <ArrowRight size={16} style={{ marginRight: '0.4rem' }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

export default BlessingRequest;
