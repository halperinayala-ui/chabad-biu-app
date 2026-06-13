import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CalendarDays, MapPin, Clock, ChevronLeft, Users, Loader2 } from 'lucide-react';

interface EventData {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  location: string;
  category: string;
  description?: string;
  registration_mode?: 'form' | 'rsvp' | 'none';
}

interface CommunityPost {
  id: string;
  image_url: string;
  caption: string;
}

const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const formatEventDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'היום';
  if (diffDays === 1) return 'מחר';
  if (diffDays < 7) return `יום ${WEEKDAYS[date.getDay()]}`;
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
};

const getCategoryEmoji = (cat: string) => {
  const map: Record<string, string> = {
    'שיעור': '📖', 'סעודה': '🍽️', 'חגיגה': '🎉', 'טיול': '🌿',
    'תפילה': '✡️', 'מוזיקה': '🎵', 'ספורט': '⚽', 'אחר': '✨',
  };
  return map[cat] || '✨';
};

const Home = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [recentPosts, setRecentPosts] = useState<CommunityPost[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const timeoutId = setTimeout(() => setLoading(false), 6000);
    try {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const [eventsRes, postsRes, announcementsRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, event_date, event_time, location, category, description, registration_mode')
          .gte('event_date', todayStr)
          .neq('category', 'other')
          .order('event_date', { ascending: true })
          .limit(4),
        supabase
          .from('gallery_posts')
          .select('id, image_url, caption')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('announcements')
          .select('id, text, emoji, expires_at')
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
      ]);

      setEvents(eventsRes.data || []);
      setRecentPosts(postsRes.data || []);
      setAnnouncements(announcementsRes.data || []);
    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const nextEvent = events[0];
  const moreEvents = events.slice(1);
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : null;

  return (
    <div style={{ paddingTop: '0' }}>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '1.5rem' }}
      >
        {user && firstName ? (
          <div>
            <p style={{ fontSize: '0.95rem', marginBottom: '0.2rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--secondary)' }}>שלום, {firstName}</span> 👋
            </p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              מה קורה בחב״ד בקמפוס?
            </h1>
          </div>
        ) : (
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            חב״ד בקמפוס בר אילן 💜
          </h1>
        )}
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="spinner" size={36} style={{ color: 'var(--primary)' }} />
        </div>
      ) : (
        <>
          {/* Announcements List */}
          {announcements.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
              {announcements.map((ann) => (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.12) 0%, rgba(243, 156, 18, 0.04) 100%)',
                    border: '1px solid rgba(243, 156, 18, 0.25)',
                    borderRadius: '16px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div style={{
                    fontSize: '1.5rem',
                    lineHeight: 1,
                    flexShrink: 0,
                    marginTop: '0.1rem'
                  }}>
                    {ann.emoji || '💜'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontWeight: 500, margin: 0 }}>
                      {ann.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Next Event - Big Card */}
          {nextEvent ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ marginBottom: '2rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--secondary)' }}>האירוע הבא</span> שלנו 🎉
                </h2>
              </div>

              <div
                onClick={() => navigate(`/events/${nextEvent.id}`)}
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, #6B3FA0 50%, var(--primary-light) 100%)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(73, 38, 145, 0.35)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {/* Background decorative circle */}
                <div style={{
                  position: 'absolute', top: '-30px', left: '-30px',
                  width: '140px', height: '140px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.07)',
                }} />
                <div style={{
                  position: 'absolute', bottom: '-20px', right: '-20px',
                  width: '100px', height: '100px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '999px',
                    padding: '0.3rem 0.9rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '0.8rem',
                  }}>
                    {getCategoryEmoji(nextEvent.category)} {nextEvent.category}
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.3 }}>
                    {nextEvent.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
                      <CalendarDays size={15} />
                      {formatEventDate(nextEvent.event_date)}
                      {nextEvent.event_time && (
                        <> &bull; <Clock size={15} /> {nextEvent.event_time.substring(0, 5)}</>
                      )}
                    </div>
                    {nextEvent.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
                        <MapPin size={15} />
                        {nextEvent.location}
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'white',
                    color: 'var(--primary)',
                    borderRadius: '999px',
                    padding: '0.6rem 1.3rem',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                  }}>
                    לפרטים והרשמה
                    <ChevronLeft size={16} />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center', padding: '2rem', marginBottom: '2rem',
                background: 'var(--surface)', borderRadius: '20px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📅</div>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>אין אירועים קרובים כרגע</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>עקבו אחרינו לעדכונים!</p>
            </motion.div>
          )}

          {/* Recent Community Posts */}
          {recentPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ marginBottom: '2rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  מהקהילה שלנו <span style={{ color: 'var(--secondary)' }}>👥</span>
                </h2>
                <Link
                  to="/community"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.2rem',
                    color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  הכל <ChevronLeft size={14} />
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', borderRadius: '16px', overflow: 'hidden' }}>
                {recentPosts.map((post, i) => (
                  <Link to="/community" key={post.id} style={{ textDecoration: 'none' }}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      style={{
                        aspectRatio: '1',
                        background: `url(${post.image_url}) center/cover no-repeat`,
                        backgroundColor: 'var(--border)',
                        borderRadius: i === 0 ? '12px 0 0 12px' : i === 2 ? '0 12px 12px 0' : '0',
                      }}
                    />
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* More Upcoming Events */}
          {moreEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--secondary)' }}>אירועים</span> קרובים 📅
                </h2>
                <Link
                  to="/events"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.2rem',
                    color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  הכל <ChevronLeft size={14} />
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {moreEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    onClick={() => navigate(`/events/${event.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      background: 'var(--surface)',
                      borderRadius: '14px',
                      padding: '0.9rem 1rem',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      boxShadow: '0 2px 8px rgba(73,38,145,0.05)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(73,38,145,0.1), rgba(73,38,145,0.05))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.3rem',
                    }}>
                      {getCategoryEmoji(event.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.title}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatEventDate(event.event_date)}
                        {event.event_time && ` • ${event.event_time.substring(0, 5)}`}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                    <ChevronLeft size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
