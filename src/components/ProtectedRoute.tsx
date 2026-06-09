import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  // Show a loading spinner while auth state is resolving
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Loader2 className="spinner" size={48} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  // If not logged in, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If requires admin and user is not admin, redirect to home
  if (requireAdmin && profile && !profile.is_admin) {
    return <Navigate to="/" replace />;
  }

  // If authorized, render the child components
  return <>{children}</>;
};

export default ProtectedRoute;
