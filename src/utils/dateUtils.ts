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

// ─── Jewish Holidays Detector ─────────────────────────────────────────────────

export interface JewishHoliday {
  name: string;
  type: 'holiday' | 'fast' | 'chol-hamoed' | 'minor' | 'chabad';
}

export const getHebrewHoliday = (date: Date): JewishHoliday | null => {
  const hebDay = getHebrewDay(date);
  const hebMonth = getHebrewMonthName(date);
  const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

  if (hebMonth === 'תשרי') {
    if (hebDay === 1 || hebDay === 2) return { name: 'ראש השנה', type: 'holiday' };
    if (hebDay === 3 && dayOfWeek !== 6) return { name: 'צום גדליה', type: 'fast' };
    if (hebDay === 4 && dayOfWeek === 0) return { name: 'צום גדליה (נדחה)', type: 'fast' };
    if (hebDay === 9) return { name: 'ערב יום כיפור', type: 'minor' };
    if (hebDay === 10) return { name: 'יום כיפור', type: 'holiday' };
    if (hebDay === 14) return { name: 'ערב סוכות', type: 'minor' };
    if (hebDay === 15) return { name: 'חג הסוכות', type: 'holiday' };
    if (hebDay >= 16 && hebDay <= 20) return { name: 'חול המועד סוכות', type: 'chol-hamoed' };
    if (hebDay === 21) return { name: 'הושענא רבה', type: 'minor' };
    if (hebDay === 22) return { name: 'שמיני עצרת / שמחת תורה', type: 'holiday' };
  }

  if (hebMonth === 'כסלו') {
    if (hebDay === 19) return { name: 'י״ט כסלו (חג הגאולה)', type: 'chabad' };
    if (hebDay >= 25) {
      const candle = hebDay - 24;
      const candleNames = ['', 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'שמיני'];
      return { name: `חנוכה (נר ${candleNames[candle] || candle})`, type: 'holiday' };
    }
  }

  if (hebMonth === 'טבת') {
    if (hebDay <= 3) {
      let cursor = new Date(date);
      let candle = 0;
      while (true) {
        const m = getHebrewMonthName(cursor);
        const dy = getHebrewDay(cursor);
        if (m === 'כסלו' && dy === 25) {
          candle = Math.round((date.getTime() - cursor.getTime()) / 86400000) + 1;
          break;
        }
        cursor.setDate(cursor.getDate() - 1);
        if (Math.round((date.getTime() - cursor.getTime()) / 86400000) > 10) break;
      }
      if (candle >= 1 && candle <= 8) {
        const candleNames = ['', 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'שמיני'];
        return { name: `חנוכה (נר ${candleNames[candle] || candle})`, type: 'holiday' };
      }
    }
    if (hebDay === 10) return { name: 'צום עשרה בטבת', type: 'fast' };
  }

  if (hebMonth === 'שבט') {
    if (hebDay === 15) return { name: 'ט״ו בשבט', type: 'minor' };
  }

  if (hebMonth === 'אדר' || hebMonth === 'אדר ב׳') {
    if (hebDay === 13 && dayOfWeek !== 6) return { name: 'תענית אסתר', type: 'fast' };
    if (hebDay === 11 && dayOfWeek === 4) return { name: 'תענית אסתר (מוקדמת)', type: 'fast' };
    if (hebDay === 14) return { name: 'פורים', type: 'holiday' };
    if (hebDay === 15) return { name: 'שושן פורים', type: 'holiday' };
  }

  if (hebMonth === 'אדר א׳') {
    if (hebDay === 14) return { name: 'פורים קטן', type: 'minor' };
    if (hebDay === 15) return { name: 'שושן פורים קטן', type: 'minor' };
  }

  if (hebMonth === 'ניסן') {
    if (hebDay === 11) return { name: 'י״א ניסן (יום הולדת הרבי)', type: 'chabad' };
    if (hebDay === 14) return { name: 'ערב פסח', type: 'minor' };
    if (hebDay === 15) return { name: 'חג הפסח', type: 'holiday' };
    if (hebDay >= 16 && hebDay <= 20) return { name: 'חול המועד פסח', type: 'chol-hamoed' };
    if (hebDay === 21) return { name: 'שביעי של פסח', type: 'holiday' };
  }

  if (hebMonth === 'אייר') {
    if (hebDay === 18) return { name: 'ל״ג בעומר', type: 'minor' };
  }

  if (hebMonth === 'סיוון') {
    if (hebDay === 5) return { name: 'ערב שבועות', type: 'minor' };
    if (hebDay === 6) return { name: 'חג השבועות', type: 'holiday' };
  }

  if (hebMonth === 'תמוז') {
    if (hebDay === 3) return { name: 'ג׳ תמוז (יום ההילולא)', type: 'chabad' };
    if (hebDay === 12 || hebDay === 13) return { name: 'י״ב-י״ג תמוז (חג הגאולה)', type: 'chabad' };
    if (hebDay === 17 && dayOfWeek !== 6) return { name: 'צום י״ז בתמוז', type: 'fast' };
    if (hebDay === 18 && dayOfWeek === 0) return { name: 'צום י״ז בתמוז (נדחה)', type: 'fast' };
  }

  if (hebMonth === 'אב') {
    if (hebDay === 9 && dayOfWeek !== 6) return { name: 'צום תשעה באב', type: 'fast' };
    if (hebDay === 10 && dayOfWeek === 0) return { name: 'צום תשעה באב (נדחה)', type: 'fast' };
    if (hebDay === 15) return { name: 'ט״ו באב', type: 'minor' };
  }

  return null;
};

// ─── Grid Builder ────────────────────────────────────────────────────────────

export interface CalendarDay {
  date: Date;
  dateStr: string;        // YYYY-MM-DD
  hebrewDay: string;      // e.g. "טו"
  hebrewMonth: string;    // e.g. "אלול"
  gregDay: number;
  gregMonth: number;
  isCurrentMonth: boolean; // Belongs to targeted Hebrew month
  isToday: boolean;
  isShabbat: boolean;
  isRoshChodesh: boolean;
  holiday: JewishHoliday | null;
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
 * Builds a true Hebrew-month-centered calendar grid with full holiday annotations.
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
      holiday: getHebrewHoliday(curr),
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
