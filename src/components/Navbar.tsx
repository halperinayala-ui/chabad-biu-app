import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, LayoutDashboard, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, profile, subscribeToPush } = useAuth();
  const [showBell, setShowBell] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Only show bell if user is logged in, and notifications are supported but not yet granted
    if (user && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowBell(true);
      }
    }
  }, [user]);

  const handleSubscribe = async () => {
    const success = await subscribeToPush();
    if (success) {
      setShowBell(false);
      alert('נרשמת בהצלחה לקבלת התראות!');
    }
  };

  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/app-icon.png" alt="חב״ד בר אילן" style={{ height: '50px', width: 'auto' }} />
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
              {showBell && (
                <button 
                  onClick={handleSubscribe}
                  className="btn" 
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem' }}
                  title="הירשם להתראות"
                >
                  <Bell size={20} className="bell-shake" />
                </button>
              )}
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
          
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-dropdown">
          <Link to="/" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>עמוד הבית</Link>
          <Link to="/community" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>קהילה 👥</Link>
          {profile?.is_admin && (
            <Link to="/admin" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>ניהול</Link>
          )}
          {user ? (
            <Link to="/profile" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>האזור האישי</Link>
          ) : (
            <Link to="/auth" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>התחברות</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
