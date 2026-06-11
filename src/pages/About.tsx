import { MapPin, Phone, MessageCircle, ExternalLink, Instagram, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <div style={{ paddingTop: '0.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo-purple.png" alt="חב״ד בר אילן" style={{ height: '80px', width: 'auto', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.4rem' }}>
            חב״ד בקמפוס בר אילן
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            הבית שלכם בקמפוס 💜
          </p>
        </div>

        {/* Location Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '1rem',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 12px rgba(73,38,145,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MapPin size={20} color="white" />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              איפה אנחנו?
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
            ז'בוטינסקי 514, גבעת שמואל<br />
            מעונות פארק המאה, בניין B קומת מסחר
          </p>
          <a
            href="https://maps.app.goo.gl/XNQgW2hbLZ8Ahy9k8"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.6rem 1.2rem', borderRadius: '999px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: 'white', fontWeight: 600, fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={15} />
            ניווט בוויז / מפות
          </a>
        </motion.div>

        {/* Contact Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '1rem',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 12px rgba(73,38,145,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Phone size={20} color="white" />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              צרו קשר
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 500 }}>
            הרב אפרים: 054-6371566
          </p>
          <a
            href="https://wa.me/972546371566"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.6rem 1.2rem', borderRadius: '999px',
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              color: 'white', fontWeight: 600, fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            <MessageCircle size={15} />
            הודעה בוואטסאפ
          </a>
        </motion.div>

        {/* Social Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '1rem',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 12px rgba(73,38,145,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Instagram size={20} color="white" />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              הישארו מעודכנים
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a
              href="https://chat.whatsapp.com/HxxrQxeydVb4H3YFxpngTs"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.8rem 1.2rem', borderRadius: 'var(--radius)',
                background: 'rgba(37, 211, 102, 0.08)',
                border: '1px solid rgba(37, 211, 102, 0.2)',
                color: '#128C7E', fontWeight: 600, fontSize: '0.95rem',
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={18} />
              קבוצת העדכונים בוואטסאפ
            </a>
            <a
              href="https://instagram.com/chabadbacampus_biu"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.8rem 1.2rem', borderRadius: 'var(--radius)',
                background: 'rgba(188, 24, 136, 0.06)',
                border: '1px solid rgba(188, 24, 136, 0.15)',
                color: '#bc1888', fontWeight: 600, fontSize: '0.95rem',
                textDecoration: 'none',
              }}
            >
              <Instagram size={18} />
              @chabadbacampus_biu
            </a>
          </div>
        </motion.div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
          © {new Date().getFullYear()} חב״ד קמפוס בר אילן
        </p>
      </motion.div>
    </div>
  );
};

export default About;
