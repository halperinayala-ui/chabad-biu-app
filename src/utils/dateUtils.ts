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
    const hebrewDayStr = HEB_LETTERS[hebrewDayNum] ? `${HEB_LETTERS[hebrewDayNum]}` : `${hebrewDayNum}`;
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
  hebrewMonth: string;    // e.g. "אלול"
  gregDay: number;
  gregMonth: number;
  isCurrentMonth: boolean; // Belongs to the targeted Hebrew month
  isToday: boolean;
  isShabbat: boolean;
  isRoshChodesh: boolean;
}

export interface HebrewMonthGridInfo {
  firstDay: Date;
  lastDay: Date;
  hebrewMonthName: string;
  hebrewYearName: string;
  gregRangeStr: string;
  days: CalendarDay[];
}

/**
 * Builds a true Hebrew-month-centered calendar grid.
 * Finds 1st of Hebrew month to last day of Hebrew month,
 * and pads with Sunday-Saturday bounds.
 */
export const getHebrewCalendarGrid = (refDate: Date): HebrewMonthGridInfo => {
  const todayStr = toDateStr(new Date());

  // 1. Find Hebrew day number of refDate
  const dayNum = getHebrewDay(refDate);

  // 2. Find 1st day of this Hebrew month
  const firstDay = new Date(refDate);
  firstDay.setDate(firstDay.getDate() - (dayNum - 1));

  // 3. Find last day of this Hebrew month
  let cursor = new Date(firstDay);
  let lastDay = new Date(firstDay);
  while (true) {
    const nextDay = new Date(cursor);
    nextDay.setDate(nextDay.getDate() + 1);
    if (getHebrewDay(nextDay) === 1) {
      lastDay = cursor;
      break;
    }
    cursor = nextDay;
  }

  const hebrewMonthName = getHebrewMonthName(firstDay);
  const hebrewYearName = getHebrewYear(firstDay);

  // Gregorian label range
  const fmtGreg = (d: Date) => d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  const gregRangeStr = `${fmtGreg(firstDay)} – ${fmtGreg(lastDay)}`;

  // 4. Grid bounds (Sunday to Saturday)
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const gridEnd = new Date(lastDay);
  const daysUntilSat = (6 - gridEnd.getDay() + 7) % 7;
  gridEnd.setDate(gridEnd.getDate() + daysUntilSat);

  // 5. Build days array
  const days: CalendarDay[] = [];
  const curr = new Date(gridStart);

  while (curr <= gridEnd) {
    const dateStr = toDateStr(curr);
    const isCurrentMonth = curr >= firstDay && curr <= lastDay;

    days.push({
      date: new Date(curr),
      dateStr,
      hebrewDay: getHebrewDayStr(curr),
      hebrewMonth: getHebrewMonthName(curr),
      gregDay: curr.getDate(),
      gregMonth: curr.getMonth(),
      isCurrentMonth,
      isToday: dateStr === todayStr,
      isShabbat: isShabbat(curr),
      isRoshChodesh: isRoshChodesh(curr),
    });

    curr.setDate(curr.getDate() + 1);
  }

  return {
    firstDay,
    lastDay,
    hebrewMonthName,
    hebrewYearName,
    gregRangeStr,
    days,
  };
};
