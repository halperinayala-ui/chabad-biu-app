import type { QuizQuestion } from '../data/quizDecks';

export interface ParsedQuizResult {
  questions: QuizQuestion[];
  warnings: string[];
}

export const AI_PROMPT_TEMPLATE = `הכן לי חידון של 15 שאלות מגוונות ומעניינות לשיעור סטודנטים באוניברסיטה, המשלב שאלות על פרשת השבוע [כתבי כאן את שם הפרשה] וידע כללי ביהדות, בסדר מעורבב.
החזר את השאלות בפורמט המדויק הבא בלבד (ללא הקדמות מיותרות), וסמן כוכבית (*) בסוף התשובה הנכונה:

שאלה: טקסט השאלה כאן?
א. אפשרות ראשונה
ב. אפשרות שנייה *
ג. אפשרות שלישית
ד. אפשרות רביעית
הסבר: משפט הסבר קצר ומעניין שיוצג אחרי התשובה.`;

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .trim();
}

function stripCorrectMarker(text: string): { clean: string; markedCorrect: boolean } {
  let marked = false;
  let result = text.trim();

  const markerRegexes = [
    /\s*[*✓✔✅]+\s*$/,
    /^\s*[*✓✔✅]+\s*/,
    /\s*\((?:תשובה\s*)?נכונה?\)\s*$/i,
    /\s*\[(?:תשובה\s*)?נכונה?\]\s*$/i
  ];

  for (const rx of markerRegexes) {
    if (rx.test(result)) {
      marked = true;
      result = result.replace(rx, '').trim();
    }
  }

  return { clean: result, markedCorrect: marked };
}

function parseLetterToIndex(token: string): 0 | 1 | 2 | 3 | null {
  const t = token.trim().toUpperCase();
  if (t === 'א' || t === 'A' || t === '1') return 0;
  if (t === 'ב' || t === 'B' || t === '2') return 1;
  if (t === 'ג' || t === 'C' || t === '3') return 2;
  if (t === 'ד' || t === 'D' || t === '4') return 3;
  return null;
}

function tryParseJsonFormat(raw: string): QuizQuestion[] | null {
  const stripped = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  if (!stripped.startsWith('[') && !stripped.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(stripped);
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : null;
    if (!arr) return null;

    const results: QuizQuestion[] = [];
    arr.forEach((item: Record<string, unknown>, idx: number) => {
      const qText = typeof item.question === 'string' ? item.question.trim() : '';
      const opts = Array.isArray(item.options) ? item.options.map((o) => String(o).trim()) : [];
      if (!qText || opts.length < 4) return;
      const rawIdx = typeof item.correctIndex === 'number' ? item.correctIndex : 0;
      const correctIndex = (rawIdx >= 0 && rawIdx <= 3 ? rawIdx : 0) as 0 | 1 | 2 | 3;
      const explanation = typeof item.explanation === 'string' ? item.explanation.trim() : '';
      results.push({
        id: `custom-${Date.now()}-${idx}`,
        question: qText,
        options: [opts[0], opts[1], opts[2], opts[3]],
        correctIndex,
        explanation
      });
    });

    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}

export function parseQuizText(rawInput: string): ParsedQuizResult {
  const trimmed = rawInput.trim();
  if (!trimmed) return { questions: [], warnings: [] };

  // 1. Try JSON first if pasted as JSON
  const jsonQuestions = tryParseJsonFormat(trimmed);
  if (jsonQuestions) {
    return { questions: jsonQuestions, warnings: [] };
  }

  // 2. Parse flexible Hebrew / numbered text blocks
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => cleanMarkdown(l))
    .filter((l) => l.length > 0);

  const questions: QuizQuestion[] = [];
  const warnings: string[] = [];

  interface DraftQuestion {
    question: string;
    options: string[];
    correctIndex: 0 | 1 | 2 | 3 | null;
    explanation: string;
  }

  let current: DraftQuestion | null = null;

  const flushCurrent = () => {
    if (!current) return;
    if (current.question && current.options.length >= 4) {
      const idx = questions.length;
      if (current.correctIndex === null) {
        warnings.push(`שאלה ${idx + 1} ("${current.question.slice(0, 32)}...") חסרה סימון של התשובה הנכונה — סומנה א׳ כברירת מחדל.`);
      }
      questions.push({
        id: `custom-${Date.now()}-${idx}`,
        question: current.question,
        options: [
          current.options[0],
          current.options[1],
          current.options[2],
          current.options[3]
        ],
        correctIndex: current.correctIndex ?? 0,
        explanation: current.explanation
      });
    } else if (current.question) {
      warnings.push(`דילגנו על "${current.question.slice(0, 32)}..." כי חסרות 4 אפשרויות תשובה.`);
    }
    current = null;
  };

  for (const line of lines) {
    // Check explicit question prefix: "שאלה:" / "שאלה 1:" / "ש:"
    const explicitQ = line.match(/^(?:שאלה(?:\s*\d+)?|ש)\s*[:.\-]\s*(.+)$/i);
    if (explicitQ) {
      flushCurrent();
      current = {
        question: explicitQ[1].trim(),
        options: [],
        correctIndex: null,
        explanation: ''
      };
      continue;
    }

    // Check explanation line
    const explMatch = line.match(/^(?:הסבר|פירוט|נימוק|הערה|נקודה למחשבה)\s*[:\-]\s*(.+)$/i);
    if (explMatch && current) {
      current.explanation = explMatch[1].trim();
      continue;
    }

    // Check separate "תשובה נכונה: ב" line
    const ansMatch = line.match(/^(?:תשובה(?:\s*נכונה)?|התשובה(?:\s*הנכונה)?|נכון|נכונה)\s*[:\-]\s*(.+)$/i);
    if (ansMatch && current) {
      const val = ansMatch[1].trim();
      const firstChar = val.charAt(0);
      const parsedIdx = parseLetterToIndex(firstChar);
      if (parsedIdx !== null && (val.length === 1 || /^[.)\-\s:]/.test(val.charAt(1)))) {
        current.correctIndex = parsedIdx;
      } else {
        // Try matching by text inclusion
        const foundIdx = current.options.findIndex((o) =>
          o.includes(val) || val.includes(o)
        );
        if (foundIdx >= 0 && foundIdx <= 3) {
          current.correctIndex = foundIdx as 0 | 1 | 2 | 3;
        }
      }
      continue;
    }

    // Check option line: א. / ב) / A. / 1. (when already inside a question) / - / •
    const hebrewOrLatinOpt = line.match(/^([אבגדABCD])\s*[.):\-]\s+(.+)$/i);
    if (hebrewOrLatinOpt && current) {
      const optIdx = parseLetterToIndex(hebrewOrLatinOpt[1]);
      if (optIdx !== null && current.options.length < 4) {
        const { clean, markedCorrect } = stripCorrectMarker(hebrewOrLatinOpt[2]);
        const targetIdx = current.options.length as 0 | 1 | 2 | 3;
        current.options.push(clean);
        if (markedCorrect) {
          current.correctIndex = targetIdx;
        }
        continue;
      }
    }

    // Numbered line: could be a new question (e.g. "1. מה קרה...") OR numbered options (1..4) inside a question that has <4 options
    const numberedLine = line.match(/^(\d+)\s*[.):\-]\s+(.+)$/);
    if (numberedLine) {
      const num = parseInt(numberedLine[1], 10);
      const body = numberedLine[2].trim();

      // If we have a current question with 0..3 options AND num is 1..4 and doesn't end with '?' when options already started -> treat as option
      const looksLikeOption =
        current !== null &&
        current.options.length < 4 &&
        num >= 1 &&
        num <= 4 &&
        (current.options.length > 0 || !body.endsWith('?'));

      if (looksLikeOption && current) {
        const { clean, markedCorrect } = stripCorrectMarker(body);
        const targetIdx = current.options.length as 0 | 1 | 2 | 3;
        current.options.push(clean);
        if (markedCorrect) {
          current.correctIndex = targetIdx;
        }
        continue;
      }

      // Otherwise treat as a brand new question
      flushCurrent();
      current = {
        question: body,
        options: [],
        correctIndex: null,
        explanation: ''
      };
      continue;
    }

    // Bullet option inside an active question
    const bulletOpt = line.match(/^[-•*]\s+(.+)$/);
    if (bulletOpt && current && current.options.length < 4) {
      const { clean, markedCorrect } = stripCorrectMarker(bulletOpt[1]);
      const targetIdx = current.options.length as 0 | 1 | 2 | 3;
      current.options.push(clean);
      if (markedCorrect) {
        current.correctIndex = targetIdx;
      }
      continue;
    }

    // Fallback: if we don't have an active question or previous question already has 4 options, start a new question!
    if (!current || current.options.length >= 4) {
      flushCurrent();
      current = {
        question: line,
        options: [],
        correctIndex: null,
        explanation: ''
      };
    } else {
      // Continuation of question text before options start
      if (current.options.length === 0) {
        current.question = `${current.question} ${line}`.trim();
      }
    }
  }

  flushCurrent();
  return { questions, warnings };
}

export function shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const copy = [...questions];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
