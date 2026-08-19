import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Info, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NotificationCenter } from './NotificationCenter';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Optional: Set up real-time subscription here if desired later
    } else {
      setUnreadCount(0);
    }
  }, [user, location.pathname]); // Refresh on navigation

  const fetchUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);
      if (!error) setUnreadCount(count || 0);
    } catch (e) {}
  };

  // Hide top bar on admin pages (they have their own header)
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <>
      <nav className="navbar glass">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <img src="/logo-purple.png" alt="חב״ד בר אילן" style={{ height: '44px', width: 'auto' }} />
          </Link>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {user && (
              <button 
                className="navbar-about-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                title="התראות"
                style={{ position: 'relative' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#e74c3c', borderRadius: '50%' }} />
                )}
              </button>
            )}

            <Link
              to="/about"
              className={`navbar-about-btn ${location.pathname === '/about' ? 'active' : ''}`}
              title="אודות ויצירת קשר"
            >
              <Info size={20} />
              <span>אודות</span>
            </Link>
          </div>
        </div>
      </nav>

      {showNotifications && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
            onClick={() => setShowNotifications(false)} 
          />
          <NotificationCenter onClose={() => {
            setShowNotifications(false);
            fetchUnreadCount();
          }} />
        </>
      )}
    </>
  );
};

export default Navbar;
