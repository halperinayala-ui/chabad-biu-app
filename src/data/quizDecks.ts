export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  categoryTag?: string;
}

export interface QuizDeck {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  accentColor: string;
  questions: QuizQuestion[];
}

export interface QuizSession {
  id: string;
  code: string;
  title: string;
  deck_id: string;
  questions: QuizQuestion[];
  status: 'lobby' | 'question' | 'reveal' | 'finished';
  current_question_index: number;
  question_started_at: string | null;
  question_duration_sec: number;
  created_by: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface QuizPlayer {
  id: string;
  session_id: string;
  nickname: string;
  avatar: string;
  score: number;
  streak: number;
  correct_count: number;
  total_response_ms: number;
  joined_at: string;
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  player_id: string;
  question_index: number;
  selected_option: number;
  is_correct: boolean;
  response_time_ms: number;
  points_earned: number;
  created_at: string;
}

export const OPTION_LETTERS = ['א', 'ב', 'ג', 'ד'] as const;

export const PLAYER_AVATARS = ['✨', '🎓', '🔥', '🦁', '🌟', '☕', '📖', '⚡', '🕊️', '🎶'] as const;

const PARASHA_VAYETZEI_QUESTIONS: QuizQuestion[] = [
  {
    id: 'vayetzei-1',
    categoryTag: 'פרשת ויצא',
    question: 'מאיזו עיר יצא יעקב אבינו בתחילת הפרשה, ולאן הוא הלך?',
    options: [
      'יצא מחברון והלך למצרים',
      'יצא מבאר שבע והלך לחרן',
      'יצא משכם והלך לבית אל',
      'יצא מירושלים והלך לבבל'
    ],
    correctIndex: 1,
    explanation: '"ויצא יעקב מבאר שבע וילך חרנה" — רש"י מסביר שיציאת צדיק מן המקום עושה רושם, ולכן התורה מדגישה מאין יצא.'
  },
  {
    id: 'vayetzei-2',
    categoryTag: 'פרשת ויצא',
    question: 'מה ראה יעקב בחלומו המפורסם בדרכו לחרן?',
    options: [
      'כוכבים המשתחווים לו',
      'עץ זית ענק ושבעה ענפים',
      'סולם מוצב ארצה וראשו מגיע השמימה ומלאכים עולים ויורדים בו',
      'נהר של מים חיים הזורם מן ההר'
    ],
    correctIndex: 2,
    explanation: 'חלום הסולם בבית אל מסמל את התפילה ואת החיבור שבין העולם הגשמי לשמיים.'
  },
  {
    id: 'vayetzei-3',
    categoryTag: 'פרשת ויצא',
    question: 'על איזה נדר התחייב יעקב אבינו לאחר שהתעורר מחלומו בבית אל?',
    options: [
      'לתת מעשר מכל אשר ייתן לו ה׳',
      'לצום ארבעים יום',
      'לבנות את בית המקדש מיד',
      'לחזור לכנען תוך שנה אחת'
    ],
    correctIndex: 0,
    explanation: 'יעקב אבינו קבע את יסוד המעשר כשאמר: "וכל אשר תיתן לי עשר אעשרנו לך".'
  },
  {
    id: 'vayetzei-4',
    categoryTag: 'פרשת ויצא',
    question: 'כיצד גלל יעקב את האבן הגדולה מעל פי הבאר בחרן, בעוד שכל הרועים היו זקוקים לשיתוף פעולה?',
    options: [
      'בעזרת מקל הפלא של אביו יצחק',
      'חפר תעלה מסביב לבאר',
      'חיכה עד שרועי האזור יעזרו לו',
      'הוריד אותה בקלות ביד אחת "כמעביר את הפקק מעל פי צלוחית"'
    ],
    correctIndex: 3,
    explanation: 'רש"י מביא שיעקב גלל את האבן העצומה בקלות רבה, כמי שמסיר פקק מעל בקבוק קטן.'
  },
  {
    id: 'vayetzei-5',
    categoryTag: 'פרשת ויצא',
    question: 'כמה שנים עבד יעקב אבינו עבור לאה ורחל יחד?',
    options: [
      '7 שנים',
      '14 שנים',
      '20 שנים',
      '12 שנים'
    ],
    correctIndex: 1,
    explanation: 'יעקב עבד 7 שנים ראשונות, ולאחר שלבן החליף את רחל בלאה עבד 7 שנים נוספות — ובסך הכל 20 שנה בבית לבן.'
  },
  {
    id: 'vayetzei-6',
    categoryTag: 'פרשת ויצא',
    question: 'איזה מבני יעקב לא נולד בפרשת ויצא, אלא רק בפרשה מאוחרת יותר?',
    options: [
      'יוסף',
      'זבולון',
      'בנימין',
      'ראובן'
    ],
    correctIndex: 2,
    explanation: 'אחד עשר השבטים וכן דינה נולדו בחרן בפרשת ויצא; בנימין נולד בארץ כנען בפרשת וישלח.'
  },
  {
    id: 'vayetzei-7',
    categoryTag: 'פרשת ויצא',
    question: 'מה החביאה רחל אמנו תחת כר הגמל כשעזבו את בית לבן?',
    options: [
      'את התרפים של לבן',
      'את מגילת היוחסין של המשפחה',
      'את טבעת הנישואין של לאה',
      'שבעה כבשים קטנים'
    ],
    correctIndex: 0,
    explanation: 'רחל לקחה את התרפים כדי להפריש את אביה לבן מעבודה זרה.'
  },
  {
    id: 'vayetzei-8',
    categoryTag: 'פרשת ויצא',
    question: 'איזה שבט נקרא על שם המילים "הפעם אודה את ה׳"?',
    options: [
      'ראובן',
      'לוי',
      'יוסף',
      'יהודה'
    ],
    correctIndex: 3,
    explanation: 'לאה אמנו קראה לבנה הרביעי יהודה על שם ההודיה לה׳ — ומכאן נקראים כולנו "יהודים".'
  },
  {
    id: 'vayetzei-9',
    categoryTag: 'פרשת ויצא',
    question: 'איך קרא לבן לגל האבנים של הברית שכרת עם יעקב (לעומת השם העברי "גלעד")?',
    options: [
      'בית אל',
      'יגר שהדותא',
      'חרן העד',
      'באר שבע'
    ],
    correctIndex: 1,
    explanation: 'לבן קרא לגל בארמית "יגר שהדותא" (גל עדות), ויעקב קרא לו בעברית "גלעד".'
  },
  {
    id: 'vayetzei-10',
    categoryTag: 'פרשת ויצא',
    question: 'מה פגש יעקב אבינו בסיום הפרשה, ואיך נקרא אותו מקום?',
    options: [
      'באר מים — "באר לחי ראי"',
      'הר גבוה — "הר המוריה"',
      'שני מחנות של מלאכים — "מחניים"',
      'מעיין נסתר — "עין גדי"'
    ],
    correctIndex: 2,
    explanation: 'מלאכי חוץ לארץ ליוו את יעקב ומלאכי ארץ ישראל באו לקראתו, ולכן קרא למקום "מחניים".'
  }
];

const JUDAISM_GENERAL_QUESTIONS: QuizQuestion[] = [
  {
    id: 'judaism-1',
    categoryTag: 'ידע כללי ביהדות',
    question: 'איזו מסכת פותחת את התלמוד הבבלי ועוסקת בעיקר בדיני ברכות וקריאת שמע?',
    options: [
      'מסכת ברכות',
      'מסכת שבת',
      'מסכת פסחים',
      'מסכת אבות'
    ],
    correctIndex: 0,
    explanation: 'מסכת ברכות פותחת את הש"ס כולו — ללמד שבכל פעולה בחיים מתחילים בברכה והודיה.'
  },
  {
    id: 'judaism-2',
    categoryTag: 'ידע כללי ביהדות',
    question: 'מהי החלוקה של תרי״ג (613) המצוות שבתורה?',
    options: [
      '365 מצוות עשה ו-248 מצוות לא תעשה',
      '248 מצוות עשה ו-365 מצוות לא תעשה',
      '300 מצוות עשה ו-313 מצוות לא תעשה',
      '500 מצוות עשה ו-113 מצוות לא תעשה'
    ],
    correctIndex: 1,
    explanation: 'רמ"ח (248) מצוות עשה כנגד איברי האדם, ושס"ה (365) מצוות לא תעשה כנגד ימות השנה.'
  },
  {
    id: 'judaism-3',
    categoryTag: 'ידע כללי ביהדות',
    question: 'איזה מזמור תהילים נהוג לומר בכל יום בחודש אלול ובתחילת חודש תשרי?',
    options: [
      'מזמור כ״ג ("מזמור לדוד ה׳ רועי")',
      'מזמור קכ״א ("שיר למעלות אשא עיני")',
      'מזמור כ״ז ("לדוד ה׳ אורי וישעי")',
      'מזמור א׳ ("אשרי האיש")'
    ],
    correctIndex: 2,
    explanation: 'מזמור כ"ז מבטא ביטחון וקרבה לה׳ בימי התשובה והחגים מראש חודש אלול ועד שמחת תורה.'
  },
  {
    id: 'judaism-4',
    categoryTag: 'ידע כללי ביהדות',
    question: 'מהם שלושת המינים שאוגדים יחד בחג הסוכות (מלבד האתרוג)?',
    options: [
      'לולב, תמר ורימון',
      'זית, לולב וערבה',
      'הדס, ארז וערבה',
      'לולב, הדס וערבה'
    ],
    correctIndex: 3,
    explanation: 'ארבעת המינים הם אתרוג, לולב, שלושה הדסים ושתי ערבות — המסמלים יחד את אחדות עם ישראל.'
  },
  {
    id: 'judaism-5',
    categoryTag: 'ידע כללי ביהדות',
    question: 'מי חיבר את הספר היסודי של חסידות חב״ד, ספר ה"תניא"?',
    options: [
      'רבי שניאור זלמן מלאדי (אדמו״ר הזקן)',
      'הבעל שם טוב',
      'המגיד ממעזריטש',
      'רבי נחמן מברסלב'
    ],
    correctIndex: 0,
    explanation: 'רבי שניאור זלמן מלאדי, מייסד חסידות חב"ד, חיבר את ספר התניא שנדפס לראשונה בשנת תקנ"ז.'
  },
  {
    id: 'judaism-6',
    categoryTag: 'ידע כללי ביהדות',
    question: 'איזו ברכה מברכים לפני אכילת פרי שגדל על עץ (כמו תפוח, זית או תמר)?',
    options: [
      'בורא מיני מזונות',
      'בורא פרי העץ',
      'בורא פרי האדמה',
      'שהכל נהיה בדברו'
    ],
    correctIndex: 1,
    explanation: 'על פירות שגדלים על עץ שגזעו נשאר משנה לשנה מברכים "בורא פרי העץ".'
  },
  {
    id: 'judaism-7',
    categoryTag: 'ידע כללי ביהדות',
    question: 'מהם שלושת הדברים שעליהם העולם עומד, לפי המשנה הראשונה של שמעון הצדיק בפרקי אבות?',
    options: [
      'תורה, צדקה ואהבת ישראל',
      'אמת, דין ושלום',
      'תורה, עבודה (תפילה) וגמילות חסדים',
      'אמונה, ביטחון ושמחה'
    ],
    correctIndex: 2,
    explanation: '"על שלושה דברים העולם עומד: על התורה, ועל העבודה, ועל גמילות חסדים" (אבות א, ב).'
  },
  {
    id: 'judaism-8',
    categoryTag: 'ידע כללי ביהדות',
    question: 'כמה נרות מצווה מדליקים בסך הכל במשך שמונת ימי חג החנוכה (לא כולל השמש)?',
    options: [
      '28 נרות',
      '44 נרות',
      '32 נרות',
      '36 נרות'
    ],
    correctIndex: 3,
    explanation: '1+2+3+4+5+6+7+8 = 36 נרות מצווה (ועם השמש בכל ערב — 44 נרות בסך הכל).'
  },
  {
    id: 'judaism-9',
    categoryTag: 'ידע כללי ביהדות',
    question: 'מה פירוש ראשי התיבות "סת״ם" (כמו בסופר סת״ם)?',
    options: [
      'ספרים, תפילין ומזוזות',
      'ספרי תורה ומגילות',
      'סדרי תפילה מיוחדים',
      'סידור, תהילים ומשנה'
    ],
    correctIndex: 0,
    explanation: 'סופר סת"ם כותב ספרי תורה, תפילין ומזוזות בקלף מבהמה טהורה ובדיו כשרה בכתב אשורי.'
  },
  {
    id: 'judaism-10',
    categoryTag: 'ידע כללי ביהדות',
    question: 'איזה חומש פותח את מחזור קריאת התורה השנתי מיד לאחר שמחת תורה?',
    options: [
      'חומש שמות',
      'חומש בראשית',
      'חומש דברים',
      'חומש ויקרא'
    ],
    correctIndex: 1,
    explanation: 'בשמחת תורה מסיימים את התורה ומיד מתחילים מחדש בפרשת "בראשית" — כי הלימוד אינו נפסק לעולם.'
  }
];

export const QUIZ_DECKS: QuizDeck[] = [
  {
    id: 'parasha-vayetzei',
    title: 'פרשת השבוע — פרשת ויצא',
    subtitle: '10 שאלות קצביות ומעוררות מחשבה על פרשת השבוע',
    badge: 'פרשת השבוע • 10 שאלות',
    accentColor: '#492691',
    questions: PARASHA_VAYETZEI_QUESTIONS
  },
  {
    id: 'judaism-general',
    title: 'ידע כללי ביהדות',
    subtitle: '10 שאלות במגוון נושאים — חגים, מצוות, חסידות ומסורת',
    badge: 'יהדות • 10 שאלות',
    accentColor: '#dd6755',
    questions: JUDAISM_GENERAL_QUESTIONS
  },
  {
    id: 'wednesday-combo',
    title: 'אתגר יום רביעי המלא (פרשה + יהדות)',
    subtitle: 'כל 20 השאלות ברצף: חצי פרשת ויצא וחצי ידע כללי ביהדות',
    badge: 'מרתון מלא • 20 שאלות',
    accentColor: '#0f766e',
    questions: [...PARASHA_VAYETZEI_QUESTIONS, ...JUDAISM_GENERAL_QUESTIONS]
  }
];

export function generateRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
