import { MapPin, Clock, CalendarDays, ChevronLeft, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import './EventCard.css';

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description?: string;
  registrationMode?: 'form' | 'rsvp' | 'none' | 'external';
  externalLink?: string | null;
  tags?: string[];
  isAdmin?: boolean;
  isFeatured?: boolean;
}

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HEB_LETTERS = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
  'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ',
  'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל'];

const formatHebrewDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayName = HEBREW_DAYS[d.getDay()];
  try {
    const hebrewMonthName = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' }).format(d);
    const hebrewDayNum = parseInt(new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric' }).format(d), 10);
    const hebrewDayStr = HEB_LETTERS[hebrewDayNum] ? `${HEB_LETTERS[hebrewDayNum]}'` : `${hebrewDayNum}`;
    const hebrewDate = `${hebrewDayStr} ב${hebrewMonthName}`;
    const gregorian = `${String(day).padStart(2,'0')}.${String(month).padStart(2,'0')}.${year}`;
    return { dayName, gregorian, hebrewDate };
  } catch {
    const gregorian = `${String(day).padStart(2,'0')}.${String(month).padStart(2,'0')}.${year}`;
    return { dayName, gregorian, hebrewDate: '' };
  }
};

const getButtonLabel = (mode?: string) => {
  if (mode === 'rsvp') return 'לפרטים ואישור הגעה';
  if (mode === 'none') return 'לפרטי האירוע';
  return 'לפרטים והרשמה';
};

const EventCard = ({ id, title, date, time, location, category, description, registrationMode, externalLink, tags = [], isAdmin, isFeatured }: EventCardProps) => {
  const navigate = useNavigate();
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (registrationMode === 'external' && externalLink) {
      window.open(externalLink, '_blank');
    } else {
      navigate(`/events/${id}`);
    }
  };
  const [isExpanded, setIsExpanded] = useState(false);
  const { dayName, gregorian, hebrewDate } = formatHebrewDate(date);

  return (
    <div className="event-card-wrapper">
      {isAdmin && (
        <button
          className="admin-edit-btn"
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/events/${id}/registrants`); }}
          title="ניהול אירוע"
        >
          <Settings size={16} />
        </button>
      )}
      <div className={`event-card ${isExpanded ? 'expanded' : ''} ${isFeatured ? 'featured' : ''}`} onClick={(e) => {
        if (registrationMode === 'external' && externalLink) {
          window.open(externalLink, '_blank');
        } else {
          setIsExpanded(!isExpanded);
        }
      }}>
        <div className="event-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className={`event-category ${isFeatured ? 'featured-category' : ''}`}>{category}</span>
            </div>
            <button className="expand-btn" style={{ background: 'none', border: 'none', color: isFeatured ? 'var(--secondary)' : 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          <h3 className={`event-title ${isFeatured ? 'featured-title' : ''}`}>{title}</h3>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                {description && (
                  <p className="event-desc-preview" style={{ whiteSpace: 'pre-line', marginBottom: '1rem' }}>{description}</p>
                )}

                {tags.length > 0 && (
                  <div className="event-tags">
                    {tags.map(tag => (
                      <span key={tag} className="event-tag">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="event-details">
                  <div className="detail-item">
                    <CalendarDays size={15} />
                    <div className="detail-date-col">
                      <span>יום {dayName}, {gregorian}</span>
                      {hebrewDate && <span className="hebrew-date">{hebrewDate}</span>}
                    </div>
                  </div>
                  <div className="detail-item">
                    <Clock size={15} />
                    <span>{time}</span>
                  </div>
                  {location && (
                    <div className="detail-item">
                      <MapPin size={15} />
                      <span>{location}</span>
                    </div>
                  )}
                </div>
                
                <div className="event-actions">
                  <button 
                    className="btn btn-secondary register-btn" 
                    onClick={handleCardClick}
                  >
                    {getButtonLabel(registrationMode)}
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isExpanded && (
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="detail-item" style={{ marginBottom: 0 }}>
                <CalendarDays size={14} />
                <span style={{ fontSize: '0.8rem' }}>{gregorian}</span>
              </div>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderRadius: '12px' }}
                onClick={handleCardClick}
              >
                פרטים <ChevronLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '-4px' }} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
