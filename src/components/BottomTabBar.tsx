import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Users, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './BottomTabBar.css';

const BottomTabBar = () => {
  const location = useLocation();
  const { user, profile } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const tabs = [
    { path: '/', label: 'בית', icon: Home },
    { path: '/events', label: 'אירועים', icon: CalendarDays },
    { path: '/community', label: 'קהילה', icon: Users },
    { path: '/profile', label: 'פרופיל', icon: User },
  ];

  return (
    <nav className="bottom-tab-bar">
      {tabs.map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          to={path}
          className={`tab-item ${isActive(path) ? 'active' : ''}`}
        >
          <div className="tab-icon-wrap">
            <Icon size={22} strokeWidth={isActive(path) ? 2.5 : 1.8} />
            {isActive(path) && <span className="tab-active-dot" />}
          </div>
          <span className="tab-label">{label}</span>
        </Link>
      ))}

      {profile?.is_admin && (
        <Link
          to="/admin"
          className={`tab-item admin-tab ${isActive('/admin') ? 'active' : ''}`}
        >
          <div className="tab-icon-wrap">
            <LayoutDashboard size={22} strokeWidth={isActive('/admin') ? 2.5 : 1.8} />
            {isActive('/admin') && <span className="tab-active-dot" />}
          </div>
          <span className="tab-label">ניהול</span>
        </Link>
      )}
    </nav>
  );
};

export default BottomTabBar;
