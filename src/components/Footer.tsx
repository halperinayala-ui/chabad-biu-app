import { MapPin, Phone, MessageCircle, ExternalLink } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        
        {/* Location Section */}
        <div className="footer-section">
          <h3 className="footer-title">
            <MapPin size={20} className="footer-icon" />
            איפה אנחנו?
          </h3>
          <p className="footer-text">
            ז'בוטינסקי 514 גבעת שמואל<br />
            מעונות פארק המאה, בנין B קומת מסחר
          </p>
          <a 
            href="https://maps.app.goo.gl/XNQgW2hbLZ8Ahy9k8" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            ניווט בוויז / מפות <ExternalLink size={14} />
          </a>
        </div>

        {/* Contact Section */}
        <div className="footer-section">
          <h3 className="footer-title">
            <Phone size={20} className="footer-icon" />
            צרו קשר
          </h3>
          <p className="footer-text">
            הרב אפרים: 054-6371566
          </p>
          <a 
            href="https://wa.me/972546371566" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link whatsapp-link"
          >
            <MessageCircle size={16} /> הודעה ישירה לוואטסאפ
          </a>
        </div>

        {/* Social Section */}
        <div className="footer-section">
          <h3 className="footer-title">הישארו מעודכנים</h3>
          <a 
            href="https://chat.whatsapp.com/HxxrQxeydVb4H3YFxpngTs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm footer-action-btn"
          >
            <MessageCircle size={18} /> קבוצת העדכונים
          </a>
          
          <a 
            href="https://instagram.com/chabadbacampus_biu" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm footer-action-btn instagram-btn"
            style={{ marginTop: '0.75rem' }}
          >
            <span style={{ marginLeft: '0.25rem', fontWeight: 'bold' }}>@</span> chabadbacampus_biu
          </a>
        </div>

      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} חב"ד קמפוס בר אילן. כל הזכויות שמורות.</p>
      </div>
    </footer>
  );
};

export default Footer;
