import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import EventCard from '../components/EventCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

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

const Events = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('הכל');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventsAndSettings();
  }, []);

  const fetchEventsAndSettings = async () => {
    const timeoutId = setTimeout(() => setLoading(false), 6000);
    try {
      const { data: settingsData } = await supabase.from('settings').select('categories').eq('id', 1).single();
      if (settingsData?.categories) setCategories(settingsData.categories);

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
      console.error('Error fetching events:', err);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    activeCategory === 'הכל' || event.category === activeCategory
  );

  return (
    <div style={{ paddingTop: '0.5rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--secondary)' }}>אירועים</span> קרובים 📅
          </h1>
          <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
            <button
              onClick={() => setActiveCategory('הכל')}
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: '999px',
                border: '1px solid',
                borderColor: activeCategory === 'הכל' ? 'transparent' : 'var(--border)',
                background: activeCategory === 'הכל' ? 'linear-gradient(135deg, var(--primary), var(--primary-light))' : 'var(--surface)',
                color: activeCategory === 'הכל' ? 'white' : 'var(--text-secondary)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
            >
              הכל
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '0.5rem 1.2rem',
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: activeCategory === cat ? 'transparent' : 'var(--border)',
                  background: activeCategory === cat ? 'linear-gradient(135deg, var(--primary), var(--primary-light))' : 'var(--surface)',
                  color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 className="spinner" size={36} style={{ color: 'var(--primary)' }} />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <h3 style={{ marginBottom: '0.5rem' }}>אין אירועים קרובים כרגע</h3>
            <p>עקבו אחרינו לעדכונים!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
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
      </motion.div>
    </div>
  );
};

export default Events;
