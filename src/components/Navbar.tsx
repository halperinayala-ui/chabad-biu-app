import { Link } from 'react-router-dom';
import { Menu, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, profile } = useAuth();

  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/logo-purple.png" alt="חב״ד בר אילן" style={{ height: '50px', width: 'auto' }} />
        </Link>
        
        <div className="navbar-links desktop-only">
          <Link to="/" className="nav-link">עמוד הבית</Link>
          <Link to="/community" className="nav-link">קהילה 👥</Link>
          {profile?.is_admin && (
            <Link to="/admin" className="nav-link admin-nav-link">
              <LayoutDashboard size={16} />
              ניהול
            </Link>
          )}
        </div>
        
        <div className="navbar-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }} className="desktop-only">
                שלום {profile?.full_name ? profile.full_name.split(' ')[0] : 'אורח'}!
              </span>
              <Link to="/profile" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', textDecoration: 'none' }}>
                האזור האישי
              </Link>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', textDecoration: 'none' }}>
              התחברות
            </Link>
          )}
          
          <button className="mobile-menu-btn">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
