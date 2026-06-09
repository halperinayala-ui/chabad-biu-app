import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import EventCard from '../components/EventCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import './Home.css';

interface EventData {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  location: string;
  category: string;
  description?: string;
  registration_mode?: 'form' | 'rsvp' | 'none';
  tags?: string[];
  audience?: string;
}

const Home = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('הכל');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventsAndSettings();
  }, []);

  const fetchEventsAndSettings = async () => {
    // Timeout after 6 seconds to prevent infinite spinner
    const timeoutId = setTimeout(() => setLoading(false), 6000);

    try {
      // Fetch settings for categories
      const { data: settingsData } = await supabase.from('settings').select('categories').eq('id', 1).single();
      if (settingsData && settingsData.categories) {
        setCategories(settingsData.categories);
      }

      // Fetch upcoming events only (not community gallery posts which use category='other')
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const { data: eventsData, error } = await supabase
        .from('events')
        .select('id, title, event_date, event_time, location, category, description, registration_mode, tags, audience')
        .gte('event_date', todayStr)
        .neq('category', 'other')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(eventsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setEvents([]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Filter by category AND audience
  const userStatus = (profile as any)?.user_status || null;
  const filteredEvents = events.filter(event => {
    if (activeCategory !== 'הכל' && event.category !== activeCategory) return false;
    const aud: string[] = (event.audience as any) || [];
    if (aud.length === 0) return true; // empty = everyone
    if (!userStatus) return false; // guest sees only unrestricted events
    return aud.includes(userStatus);
  });

  return (
    <div className="home-page">
      <motion.header 
        className="hero-section text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.h1 
          className="hero-title animate-fade-in-up"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          חב״ד<br/>בקמפוס בר אילן
        </motion.h1>
        <motion.p 
          className="hero-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          הבית שלכם בקמפוס.<br/>הצטרפו אלינו לאירועים, סעודות ושיעורים באווירה משפחתית וצעירה.
        </motion.p>
      </motion.header>
      
      <section className="events-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <h2>אירועים קרובים</h2>
          <div className="filters">
            <button 
              className={`filter-btn ${activeCategory === 'הכל' ? 'active' : ''}`}
              onClick={() => setActiveCategory('הכל')}
            >
              הכל
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="spinner" size={40} style={{ color: 'var(--primary)' }} />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <h3>אין אירועים קרובים כרגע. עקבו אחרינו לעדכונים!</h3>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event, index) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <EventCard 
                  id={event.id}
                  title={event.title}
                  date={event.event_date}
                  time={event.event_time}
                  location={event.location}
                  category={event.category}
                  description={event.description}
                  registrationMode={event.registration_mode}
                  tags={event.tags}
                  isAdmin={profile?.is_admin}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
