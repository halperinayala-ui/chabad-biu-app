import { Link, useLocation } from 'react-router-dom';
import { Info } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  // Hide top bar on admin pages (they have their own header)
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/logo-purple.png" alt="חב״ד בר אילן" style={{ height: '44px', width: 'auto' }} />
        </Link>

        <Link
          to="/about"
          className={`navbar-about-btn ${location.pathname === '/about' ? 'active' : ''}`}
          title="אודות ויצירת קשר"
        >
          <Info size={20} />
          <span>אודות</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
