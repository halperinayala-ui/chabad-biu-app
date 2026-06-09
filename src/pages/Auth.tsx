import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Auth.css';

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        if (!agreedToTerms) {
          setError('יש לאשר את התקנון ומדיניות הפרטיות כדי להמשיך');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });
        
        if (signUpError) throw signUpError;
        if (data.user) {
          alert('הרשמה בוצעה בהצלחה! השלימו עכשיו את הפרטים האישיים שלכם.');
          navigate('/profile');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        if (data.user) {
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err.message);
      setError('אירעה שגיאה: ' + (err.message.includes('Invalid login') ? 'פרטי התחברות שגויים' : err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Auth Error:', err.message);
      setError('שגיאה בהתחברות עם גוגל: ' + err.message);
    }
  };

  return (
    <motion.div 
      className="auth-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="auth-card glass">
        <button className="icon-btn back-btn" onClick={() => navigate(-1)} title="חזרה">
          <ArrowLeft size={20} />
        </button>
        
        <div className="auth-header">
          <h2>{mode === 'login' ? 'ברוכים השבים' : 'הרשמה לקהילת חב"ד בקמפוס בר אילן'}</h2>
          <p>{mode === 'login' ? 'התחברו כדי להירשם לאירועים בקליק' : 'צרו חשבון כדי לשמור את הפרטים שלכם להרשמות עתידיות'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <Mail className="input-icon" size={18} />
            <input 
              type="email" 
              placeholder="אימייל" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={18} />
            <input 
              type="password" 
              placeholder="סיסמה" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>

          {mode === 'register' && (
            <div className="form-group checkbox-group" style={{ margin: '1rem 0' }}>
              <label className="checkbox-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <input 
                  type="checkbox" 
                  checked={agreedToTerms} 
                  onChange={(e) => setAgreedToTerms(e.target.checked)} 
                  required
                />
                <span>
                  אני מסכים/ה <a href="#" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>לתקנון ולמדיניות הפרטיות</a>
                </span>
              </label>
            </div>
          )}

          <button type="submit" className="btn btn-secondary auth-submit-btn" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : (mode === 'login' ? 'התחברות' : 'הרשמה')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {mode === 'login' ? 'עדיין אין לכם חשבון?' : 'כבר יש לכם חשבון?'}
            <button className="switch-mode-btn" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'הירשמו עכשיו' : 'התחברו כאן'}
            </button>
          </p>
          
          <div className="divider">
            <span>או</span>
          </div>
          
          <button className="btn btn-outline google-btn" onClick={handleGoogleLogin} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderColor: 'rgba(0,0,0,0.1)', background: 'white', color: '#333' }}>
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
            המשך עם Google
          </button>

          <button className="btn btn-outline guest-btn" onClick={() => navigate('/')}>
            המשך כאורח (ללא שמירת פרטים)
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Auth;
