import { MapPin, Clock, CalendarDays, ChevronLeft, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './EventCard.css';

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description?: string;
  registrationMode?: 'form' | 'rsvp' | 'none';
  tags?: string[];
  isAdmin?: boolean;
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

const EventCard = ({ id, title, date, time, location, category, description, registrationMode, tags = [], isAdmin }: EventCardProps) => {
  const navigate = useNavigate();
  const { dayName, gregorian, hebrewDate } = formatHebrewDate(date);
  const shortDesc = description && description.length > 90
    ? description.slice(0, 90).trimEnd() + '...'
    : description;

  return (
    <div className="event-card-wrapper">
      {isAdmin && (
        <button
          className="admin-edit-btn"
          onClick={(e) => { e.preventDefault(); navigate(`/admin/events/${id}/registrants`); }}
          title="ניהול אירוע"
        >
          <Settings size={16} />
        </button>
      )}
      <Link to={`/events/${id}`} className="event-card-link">
        <div className="event-card">
          <div className="event-content">
            <span className="event-category">{category}</span>
            <h3 className="event-title">{title}</h3>

            {shortDesc && (
              <p className="event-desc-preview" style={{ whiteSpace: 'pre-line' }}>{shortDesc}</p>
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
              <button className="btn btn-secondary register-btn">
                {getButtonLabel(registrationMode)}
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default EventCard;
