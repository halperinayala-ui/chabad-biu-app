import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './BlessingRequest.css';

const BlessingRequest = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    document.title = 'שליחת שמות לבקשת ברכה - הסתיימה';
  }, []);

  return (
    <motion.div 
      className="blessing-page"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="blessing-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        {profile?.is_admin && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
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

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fef3c7',
          color: '#d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <CheckCircle2 size={32} />
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.6rem' }}>
          שליחת השמות הסתיימה
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem', maxWidth: '440px', margin: '0 auto 2rem' }}>
          הרב חזר מהציון הקדוש של הרבי מליובאוויטש והשמות הוכנסו לברכה.
          <br />
          נעדכן בעזרת ה׳ לקראת הנסיעה הבאה! 🙏
        </p>

        <button onClick={() => navigate('/')} className="submit-btn" style={{ display: 'inline-flex', width: 'auto', padding: '0.8rem 2rem', margin: '0 auto' }}>
          חזרה לעמוד הבית
        </button>
      </div>
    </motion.div>
  );
};

export default BlessingRequest;
