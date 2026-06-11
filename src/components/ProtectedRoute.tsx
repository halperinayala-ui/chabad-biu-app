import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, User, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  showGuestView?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false, showGuestView = false }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Loader2 className="spinner" size={48} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  if (!user) {
    if (showGuestView) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, rgba(73,38,145,0.12), rgba(73,38,145,0.06))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={36} style={{ color: 'var(--primary)', opacity: 0.7 }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            כניסה לאזור האישי
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '280px', lineHeight: 1.6 }}>
            התחברי כדי לראות את הפרופיל שלך, לנהל הרשמות ולקבל התראות
          </p>
          <Link
            to="/auth"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.85rem 2rem', borderRadius: '999px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: 'white', fontWeight: 700, fontSize: '1rem',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(73,38,145,0.3)',
            }}
          >
            <LogIn size={18} />
            התחברות / הרשמה
          </Link>
        </div>
      );
    }
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && profile && !profile.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

