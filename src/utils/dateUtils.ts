export const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const HEBREW_DAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
export const HEB_LETTERS = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
  'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ',
  'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל'];

export const formatHebrewDate = (dateStr: string) => {
  if (!dateStr) return { dayName: '', gregorian: '', hebrewDate: '' };
  
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

// ─── Hebrew Calendar Helpers ─────────────────────────────────────────────────

/** Returns the Hebrew month name for a given Gregorian date */
export const getHebrewMonthName = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' }).format(date);
  } catch {
    return '';
  }
};

/** Returns the Hebrew year string (e.g. "תשפ״ו") for a given Gregorian date */
export const getHebrewYear = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { year: 'numeric' }).format(date);
  } catch {
    return '';
  }
};

/** Returns the Hebrew day number (1–30) for a given Gregorian date */
export const getHebrewDay = (date: Date): number => {
  try {
    return parseInt(new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric' }).format(date), 10);
  } catch {
    return date.getDate();
  }
};

/** Returns the Hebrew day letter string (e.g. "ט׳", "טו") */
export const getHebrewDayStr = (date: Date): string => {
  const n = getHebrewDay(date);
  return HEB_LETTERS[n] ? `${HEB_LETTERS[n]}` : `${n}`;
};

/** True if the given date is Shabbat (Saturday) */
export const isShabbat = (date: Date): boolean => date.getDay() === 6;

/** True if the given date is Rosh Chodesh (Hebrew day 1 or 30) */
export const isRoshChodesh = (date: Date): boolean => {
  const d = getHebrewDay(date);
  return d === 1 || d === 30;
};

/** Converts a Date to a YYYY-MM-DD string (local time) */
export const toDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export interface CalendarDay {
  date: Date;
  dateStr: string;        // YYYY-MM-DD
  hebrewDay: string;      // e.g. "טו"
  hebrewMonth: string;    // e.g. "אב"
  gregDay: number;
  gregMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isShabbat: boolean;
  isRoshChodesh: boolean;
}

/**
 * Generates the grid of days for a given Gregorian year/month.
 * The grid always starts on Sunday and ends on Saturday.
 * Includes padding days from prev/next month.
 */
export const buildCalendarGrid = (year: number, month: number): CalendarDay[] => {
  const todayStr = toDateStr(new Date());
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start grid from the Sunday on or before the 1st
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // End grid on the Saturday on or after the last day
  const endDate = new Date(lastDay);
  const daysUntilSat = (6 - endDate.getDay() + 7) % 7;
  endDate.setDate(endDate.getDate() + daysUntilSat);

  const days: CalendarDay[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const dateStr = toDateStr(cursor);
    days.push({
      date: new Date(cursor),
      dateStr,
      hebrewDay: getHebrewDayStr(cursor),
      hebrewMonth: getHebrewMonthName(cursor),
      gregDay: cursor.getDate(),
      gregMonth: cursor.getMonth(),
      isCurrentMonth: cursor.getMonth() === month,
      isToday: dateStr === todayStr,
      isShabbat: isShabbat(cursor),
      isRoshChodesh: isRoshChodesh(cursor),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

/** Returns the display title for a calendar month (Hebrew month name + Hebrew year) */
export const getCalendarMonthTitle = (year: number, month: number): { hebrewMonth: string; hebrewYear: string; gregLabel: string } => {
  // Use the 15th of the month to get a stable middle-of-month Hebrew month name
  const mid = new Date(year, month, 15);
  const hebrewMonth = getHebrewMonthName(mid);
  const hebrewYear = getHebrewYear(mid);
  const gregLabel = mid.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  return { hebrewMonth, hebrewYear, gregLabel };
};
