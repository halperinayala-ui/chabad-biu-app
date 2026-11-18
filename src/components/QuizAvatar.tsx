import React from 'react';

export interface QuizAvatarDef {
  id: string;
  label: string;
  gradient: string;
  renderSvg: () => React.ReactNode;
}

export const QUIZ_AVATARS: QuizAvatarDef[] = [
  {
    id: 'student-boy-kippah',
    label: 'סטודנט בקמפוס',
    gradient: 'linear-gradient(135deg, #492691, #7c3aed)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Shoulders / Hoodie */}
        <path d="M12 62 C12 48 20 44 32 44 C44 44 52 48 52 62 Z" fill="#312e81" />
        <path d="M25 45 L32 52 L39 45" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
        {/* Neck */}
        <rect x="27" y="38" width="10" height="9" rx="4" fill="#f3c6a5" />
        {/* Ears */}
        <circle cx="19" cy="30" r="3.5" fill="#eab693" />
        <circle cx="45" cy="30" r="3.5" fill="#eab693" />
        {/* Face */}
        <circle cx="32" cy="29" r="13.5" fill="#f6cfb2" />
        {/* Hair */}
        <path d="M18.5 27 C18.5 16 25 13 32 13 C39 13 45.5 16 45.5 27 C43 21 39 19 32 19 C25 19 21 21 18.5 27 Z" fill="#3b2314" />
        {/* Kippah */}
        <path d="M23 15.5 Q32 9 41 15.5 Z" fill="#1e1b4b" stroke="#fbbf24" strokeWidth="1.2" />
        {/* Glasses */}
        <rect x="21.5" y="25.5" width="8.5" height="6.5" rx="2.2" stroke="#1f2937" strokeWidth="1.8" fill="rgba(255,255,255,0.18)" />
        <rect x="34" y="25.5" width="8.5" height="6.5" rx="2.2" stroke="#1f2937" strokeWidth="1.8" fill="rgba(255,255,255,0.18)" />
        <line x1="30" y1="28.5" x2="34" y2="28.5" stroke="#1f2937" strokeWidth="1.8" />
        {/* Eyes */}
        <circle cx="25.8" cy="28.8" r="1.6" fill="#1f2937" />
        <circle cx="38.2" cy="28.8" r="1.6" fill="#1f2937" />
        {/* Smile */}
        <path d="M27.5 35.5 Q32 39 36.5 35.5" stroke="#9a4e32" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'student-girl-glasses',
    label: 'סטודנטית משקיענית',
    gradient: 'linear-gradient(135deg, #db2777, #9333ea)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Back Hair */}
        <path d="M14 30 C13 15 22 10 32 10 C42 10 51 15 50 30 L52 48 C48 50 44 48 44 48 L20 48 C20 48 16 50 12 48 Z" fill="#4a2511" />
        {/* Top */}
        <path d="M13 62 C13 48 21 44 32 44 C43 44 51 48 51 62 Z" fill="#be185d" />
        {/* Neck */}
        <rect x="27.5" y="38" width="9" height="8" rx="4" fill="#f7d3b8" />
        {/* Face */}
        <circle cx="32" cy="29" r="13" fill="#fad9c1" />
        {/* Front Hair part */}
        <path d="M19 27 C20 17 27 14 32 14 C37 14 44 17 45 27 C41 20 35 19 32 21 C29 19 23 20 19 27 Z" fill="#4a2511" />
        {/* Round Stylish Glasses */}
        <circle cx="26" cy="29" r="4.4" stroke="#f59e0b" strokeWidth="1.7" fill="rgba(255,255,255,0.2)" />
        <circle cx="38" cy="29" r="4.4" stroke="#f59e0b" strokeWidth="1.7" fill="rgba(255,255,255,0.2)" />
        <line x1="30.4" y1="29" x2="33.6" y2="29" stroke="#f59e0b" strokeWidth="1.7" />
        {/* Eyes */}
        <circle cx="26" cy="29" r="1.6" fill="#1f2937" />
        <circle cx="38" cy="29" r="1.6" fill="#1f2937" />
        {/* Cheeks & Smile */}
        <ellipse cx="22.5" cy="33.5" rx="2.3" ry="1.3" fill="#fb7185" opacity="0.5" />
        <ellipse cx="41.5" cy="33.5" rx="2.3" ry="1.3" fill="#fb7185" opacity="0.5" />
        <path d="M28 36 Q32 39.2 36 36" stroke="#a64b3b" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'student-boy-headphones',
    label: 'חובב מוזיקה',
    gradient: 'linear-gradient(135deg, #0d9488, #2563eb)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Jacket */}
        <path d="M12 62 C12 48 20 44 32 44 C44 44 52 48 52 62 Z" fill="#0f766e" />
        <path d="M27 44 L32 54 L37 44" fill="#ffffff" />
        {/* Neck */}
        <rect x="27" y="38" width="10" height="8" rx="4" fill="#e6b08a" />
        {/* Head */}
        <circle cx="32" cy="29" r="13.5" fill="#ecc09e" />
        {/* Stylish Hair */}
        <path d="M18.5 27 C18 14 27 11 35 12 C42 13 46 18 45.5 27 C43 21 37 19 30 20 C24 21 20 22 18.5 27 Z" fill="#1f2937" />
        {/* Headphones */}
        <path d="M17 29 C17 14 47 14 47 29" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
        <rect x="14" y="25" width="5" height="10" rx="2.5" fill="#492691" stroke="#fbbf24" strokeWidth="1.3" />
        <rect x="45" y="25" width="5" height="10" rx="2.5" fill="#492691" stroke="#fbbf24" strokeWidth="1.3" />
        {/* Eyes & Eyebrows */}
        <circle cx="26.5" cy="29" r="1.8" fill="#111827" />
        <circle cx="37.5" cy="29" r="1.8" fill="#111827" />
        <path d="M23.5 25.5 Q26.5 24 29 25.5" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M35 25.5 Q37.5 24 40.5 25.5" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" />
        {/* Big grin */}
        <path d="M27 35.5 Q32 39.5 37 35.5" stroke="#8c4427" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'student-girl-curly',
    label: 'סטודנטית חייכנית',
    gradient: 'linear-gradient(135deg, #ea580c, #f59e0b)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Curly Hair Halo */}
        <circle cx="20" cy="22" r="7.5" fill="#2c1608" />
        <circle cx="44" cy="22" r="7.5" fill="#2c1608" />
        <circle cx="17" cy="32" r="7.5" fill="#2c1608" />
        <circle cx="47" cy="32" r="7.5" fill="#2c1608" />
        <circle cx="19" cy="41" r="6.5" fill="#2c1608" />
        <circle cx="45" cy="41" r="6.5" fill="#2c1608" />
        <circle cx="26" cy="15" r="7" fill="#2c1608" />
        <circle cx="38" cy="15" r="7" fill="#2c1608" />
        <circle cx="32" cy="13" r="7" fill="#2c1608" />
        {/* Shirt */}
        <path d="M13 62 C13 48 21 44 32 44 C43 44 51 48 51 62 Z" fill="#492691" />
        {/* Neck */}
        <rect x="27.5" y="38" width="9" height="8" rx="4" fill="#d99b72" />
        {/* Face */}
        <circle cx="32" cy="29.5" r="12.5" fill="#e6aa82" />
        {/* Eyes */}
        <circle cx="26.5" cy="29" r="1.8" fill="#1f2937" />
        <circle cx="37.5" cy="29" r="1.8" fill="#1f2937" />
        <circle cx="26" cy="28.3" r="0.6" fill="#fff" />
        <circle cx="37" cy="28.3" r="0.6" fill="#fff" />
        {/* Cheeks */}
        <ellipse cx="22.5" cy="33.5" rx="2.3" ry="1.3" fill="#fb7185" opacity="0.5" />
        <ellipse cx="41.5" cy="33.5" rx="2.3" ry="1.3" fill="#fb7185" opacity="0.5" />
        {/* Bright Smile */}
        <path d="M27 35.5 Q32 40 37 35.5 Z" fill="#fff" />
      </svg>
    )
  },
  {
    id: 'student-boy-beard',
    label: 'סטודנט מזוקן',
    gradient: 'linear-gradient(135deg, #4338ca, #0284c7)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Shirt */}
        <path d="M12 62 C12 48 20 44 32 44 C44 44 52 48 52 62 Z" fill="#1e293b" />
        <polygon points="26,44 32,52 38,44" fill="#e2e8f0" />
        {/* Neck */}
        <rect x="27" y="38" width="10" height="8" rx="4" fill="#eec3a1" />
        {/* Ears */}
        <circle cx="19" cy="30" r="3.3" fill="#e5b38c" />
        <circle cx="45" cy="30" r="3.3" fill="#e5b38c" />
        {/* Face */}
        <circle cx="32" cy="29" r="13.5" fill="#f4cbb0" />
        {/* Hair & Kippah */}
        <path d="M18.5 27 C19 16 25 13 32 13 C39 13 45 16 45.5 27 C42 20 38 19 32 19 C26 19 22 20 18.5 27 Z" fill="#1f2937" />
        <path d="M23 15 Q32 9.5 41 15 Z" fill="#492691" stroke="#e2e8f0" strokeWidth="1" />
        {/* Neat Beard */}
        <path d="M19 30 C19.5 39 24.5 43.5 32 43.5 C39.5 43.5 44.5 39 45 30 C42.5 34 38 35.5 32 35.5 C26 35.5 21.5 34 19 30 Z" fill="#292524" />
        {/* Mouth */}
        <path d="M28 36.5 Q32 39 36 36.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        {/* Eyes */}
        <circle cx="26.5" cy="28" r="1.8" fill="#111827" />
        <circle cx="37.5" cy="28" r="1.8" fill="#111827" />
      </svg>
    )
  },
  {
    id: 'student-girl-bun',
    label: 'סטודנטית באסוף',
    gradient: 'linear-gradient(135deg, #059669, #14b8a6)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Top Hair Bun */}
        <circle cx="32" cy="11" r="7" fill="#6b3e26" />
        {/* Top */}
        <path d="M13 62 C13 48 21 44 32 44 C43 44 51 48 51 62 Z" fill="#dd6755" />
        {/* Neck */}
        <rect x="27.5" y="38" width="9" height="8" rx="4" fill="#f7d3b8" />
        {/* Ears + Gold Studs */}
        <circle cx="19" cy="30" r="3.2" fill="#ecc09e" />
        <circle cx="45" cy="30" r="3.2" fill="#ecc09e" />
        <circle cx="19" cy="32.5" r="1.4" fill="#fbbf24" />
        <circle cx="45" cy="32.5" r="1.4" fill="#fbbf24" />
        {/* Face */}
        <circle cx="32" cy="29.5" r="13" fill="#fad9c1" />
        {/* Sleek Hair + Headband */}
        <path d="M19 28 C19 17 26 14 32 14 C38 14 45 17 45 28 C41 21 36 20 32 20 C28 20 23 21 19 28 Z" fill="#6b3e26" />
        <path d="M21 22 Q32 15 43 22" stroke="#fbbf24" strokeWidth="2.8" strokeLinecap="round" />
        {/* Eyes */}
        <circle cx="26.5" cy="29.5" r="1.8" fill="#1f2937" />
        <circle cx="37.5" cy="29.5" r="1.8" fill="#1f2937" />
        {/* Smile */}
        <path d="M27.5 36 Q32 39.5 36.5 36" stroke="#a64b3b" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'student-boy-cap',
    label: 'סטודנט ספורטיבי',
    gradient: 'linear-gradient(135deg, #f97316, #dc2626)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* T-shirt */}
        <path d="M12 62 C12 48 20 44 32 44 C44 44 52 48 52 62 Z" fill="#492691" />
        {/* Neck */}
        <rect x="27" y="38" width="10" height="8" rx="4" fill="#e5b38c" />
        {/* Ears */}
        <circle cx="19" cy="31" r="3.2" fill="#dc9f76" />
        <circle cx="45" cy="31" r="3.2" fill="#dc9f76" />
        {/* Face */}
        <circle cx="32" cy="30" r="13.5" fill="#f0c3a0" />
        {/* Baseball Cap */}
        <path d="M18 24 C18 14 46 14 46 24 Z" fill="#f59e0b" />
        <path d="M16 24 Q34 21 52 25.5 Q34 27 16 24 Z" fill="#b45309" />
        {/* Eyes */}
        <circle cx="26.5" cy="30" r="1.8" fill="#111827" />
        <circle cx="37.5" cy="30" r="1.8" fill="#111827" />
        {/* Confident Grin */}
        <path d="M27 36.5 Q32 40.5 37 36.5" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'student-girl-beret',
    label: 'סטודנטית בסטייל',
    gradient: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Long Blonde/Light-Brown Hair */}
        <path d="M14 29 C14 14 23 11 32 11 C41 11 50 14 50 29 L51 50 L13 50 Z" fill="#a16207" />
        {/* Sweater */}
        <path d="M13 62 C13 48 21 44 32 44 C43 44 51 48 51 62 Z" fill="#0f766e" />
        {/* Neck */}
        <rect x="27.5" y="38" width="9" height="8" rx="4" fill="#f7d3b8" />
        {/* Face */}
        <circle cx="32" cy="29.5" r="12.5" fill="#fad9c1" />
        {/* Front Hair */}
        <path d="M19.5 27 C21 19 28 17 32 19 C36 17 43 19 44.5 27 C41 22 36 21 32 22 C28 21 23 22 19.5 27 Z" fill="#a16207" />
        {/* Stylish Beret */}
        <path d="M17 20 C19 10 38 7 47 16 C42 20 25 21 17 20 Z" fill="#492691" stroke="#fbbf24" strokeWidth="1.2" />
        {/* Eyes */}
        <circle cx="26.5" cy="29.5" r="1.8" fill="#1f2937" />
        <circle cx="37.5" cy="29.5" r="1.8" fill="#1f2937" />
        {/* Smile */}
        <path d="M27.5 35.5 Q32 39 36.5 35.5" stroke="#a64b3b" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'student-grad',
    label: 'מצטיין הדיקן',
    gradient: 'linear-gradient(135deg, #1d4ed8, #492691)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Gown */}
        <path d="M12 62 C12 48 20 44 32 44 C44 44 52 48 52 62 Z" fill="#1e1b4b" />
        <path d="M24 45 L32 58 L40 45" fill="#fbbf24" />
        {/* Neck */}
        <rect x="27" y="38" width="10" height="8" rx="4" fill="#f4cbb0" />
        {/* Face */}
        <circle cx="32" cy="30" r="13" fill="#f7d3b8" />
        {/* Hair */}
        <path d="M19 28 C19 20 25 18 32 18 C39 18 45 20 45 28 C42 22 36 21 32 21 C28 21 22 22 19 28 Z" fill="#3b2314" />
        {/* Graduation Cap */}
        <polygon points="32,7 50,15 32,22 14,15" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.4" />
        <line x1="48" y1="16" x2="49" y2="27" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        <circle cx="49" cy="27.5" r="2" fill="#fbbf24" />
        {/* Eyes & Smile */}
        <circle cx="26.5" cy="30" r="1.8" fill="#111827" />
        <circle cx="37.5" cy="30" r="1.8" fill="#111827" />
        <path d="M27.5 36.5 Q32 39.8 36.5 36.5" stroke="#9a4e32" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'chabad-shliach',
    label: 'חסיד בקמפוס',
    gradient: 'linear-gradient(135deg, #b45309, #492691)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Suit */}
        <path d="M12 62 C12 48 20 44 32 44 C44 44 52 48 52 62 Z" fill="#111827" />
        <polygon points="27,44 32,54 37,44" fill="#ffffff" />
        {/* Neck */}
        <rect x="27.5" y="38" width="9" height="8" rx="4" fill="#f3c6a5" />
        {/* Face */}
        <circle cx="32" cy="30" r="13" fill="#f6cfb2" />
        {/* Beard */}
        <path d="M20 31 C20.5 40 25 45 32 45 C39 45 43.5 40 44 31 C41.5 34.5 37.5 36 32 36 C26.5 36 22.5 34.5 20 31 Z" fill="#292524" />
        {/* Classic Fedora Hat */}
        <path d="M20 21 L23 11 Q32 9 41 11 L44 21 Z" fill="#1e1b4b" />
        <rect x="20.5" y="18.5" width="23" height="2.6" fill="#492691" />
        <ellipse cx="32" cy="21.5" rx="18" ry="3.2" fill="#0f172a" stroke="#fbbf24" strokeWidth="0.9" />
        {/* Eyes & Warm Smile */}
        <circle cx="26.5" cy="29" r="1.8" fill="#111827" />
        <circle cx="37.5" cy="29" r="1.8" fill="#111827" />
        <path d="M28 37 Q32 39.5 36 37" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'student-girl-headphones',
    label: 'חובבת מוזיקה',
    gradient: 'linear-gradient(135deg, #ec4899, #6366f1)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Long dark hair */}
        <path d="M14 29 C13 14 22 10 32 10 C42 10 51 14 50 29 L52 49 L12 49 Z" fill="#1f2937" />
        {/* Jacket */}
        <path d="M13 62 C13 48 21 44 32 44 C43 44 51 48 51 62 Z" fill="#7c3aed" />
        {/* Neck */}
        <rect x="27.5" y="38" width="9" height="8" rx="4" fill="#eec3a1" />
        {/* Face */}
        <circle cx="32" cy="29.5" r="12.5" fill="#f4cbb0" />
        {/* Front Hair */}
        <path d="M19.5 26 C21 17 27 14 32 14 C37 14 43 17 44.5 26 C40 20 35 19 32 21 C29 19 24 20 19.5 26 Z" fill="#1f2937" />
        {/* Sleek Headphones */}
        <path d="M16.5 29 C16.5 13 47.5 13 47.5 29" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
        <rect x="13.5" y="25" width="5" height="10" rx="2.5" fill="#ec4899" stroke="#fbbf24" strokeWidth="1.2" />
        <rect x="45.5" y="25" width="5" height="10" rx="2.5" fill="#ec4899" stroke="#fbbf24" strokeWidth="1.2" />
        {/* Eyes & Smile */}
        <circle cx="26.5" cy="29.5" r="1.8" fill="#111827" />
        <circle cx="37.5" cy="29.5" r="1.8" fill="#111827" />
        <path d="M27.5 35.5 Q32 39 36.5 35.5" stroke="#9a4e32" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'student-boy-curly',
    label: 'אנרגיות טובות',
    gradient: 'linear-gradient(135deg, #16a34a, #0d9488)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Hoodie */}
        <path d="M12 62 C12 48 20 44 32 44 C44 44 52 48 52 62 Z" fill="#065f46" />
        {/* Neck */}
        <rect x="27" y="38" width="10" height="8" rx="4" fill="#d99b72" />
        {/* Fluffy Curly Hair */}
        <circle cx="22" cy="18" r="6.5" fill="#2c1608" />
        <circle cx="32" cy="14" r="7" fill="#2c1608" />
        <circle cx="42" cy="18" r="6.5" fill="#2c1608" />
        <circle cx="18" cy="25" r="5.5" fill="#2c1608" />
        <circle cx="46" cy="25" r="5.5" fill="#2c1608" />
        {/* Face */}
        <circle cx="32" cy="30" r="13" fill="#e6aa82" />
        {/* Eyes & Big Happy Smile */}
        <circle cx="26.5" cy="29.5" r="1.8" fill="#111827" />
        <circle cx="37.5" cy="29.5" r="1.8" fill="#111827" />
        <path d="M26.5 35.5 Q32 40.5 37.5 35.5 Z" fill="#fff" />
      </svg>
    )
  },
  {
    id: 'student-girl-coffee',
    label: 'אחרי קפה של בוקר',
    gradient: 'linear-gradient(135deg, #c2410c, #f59e0b)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Bob Hair */}
        <path d="M15 29 C15 14 23 11 32 11 C41 11 49 14 49 29 L50 42 L14 42 Z" fill="#5c2d16" />
        {/* Sweater */}
        <path d="M13 62 C13 48 21 44 32 44 C43 44 51 48 51 62 Z" fill="#b45309" />
        {/* Neck */}
        <rect x="27.5" y="38" width="9" height="8" rx="4" fill="#f7d3b8" />
        {/* Face */}
        <circle cx="32" cy="29.5" r="12.5" fill="#fad9c1" />
        {/* Front Hair */}
        <path d="M19.5 27 C21 17 28 15 35 16 C40 17 43 20 44.5 27 C40 21 34 20 27 21 C23 22 21 24 19.5 27 Z" fill="#5c2d16" />
        {/* Eyes */}
        <circle cx="26.5" cy="29.5" r="1.8" fill="#1f2937" />
        <circle cx="37.5" cy="29.5" r="1.8" fill="#1f2937" />
        <path d="M27.5 35.5 Q32 39 36.5 35.5" stroke="#a64b3b" strokeWidth="1.8" strokeLinecap="round" />
        {/* Little Coffee Cup in Corner */}
        <rect x="38" y="47" width="11" height="12" rx="2.5" fill="#fff" />
        <path d="M49 50 C53 50 53 56 49 56" stroke="#fff" strokeWidth="2" />
        <path d="M42 45 Q41 42 43 40" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'student-boy-scholar',
    label: 'מתמיד בשיעור',
    gradient: 'linear-gradient(135deg, #3730a3, #492691)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Sweater */}
        <path d="M12 62 C12 48 20 44 32 44 C44 44 52 48 52 62 Z" fill="#4338ca" />
        {/* White collar */}
        <polygon points="27,44 32,50 37,44" fill="#fff" />
        {/* Neck */}
        <rect x="27" y="38" width="10" height="8" rx="4" fill="#f3c6a5" />
        {/* Face */}
        <circle cx="32" cy="29.5" r="13" fill="#f6cfb2" />
        {/* Reddish-Brown Hair & Kippah */}
        <path d="M19 27 C19.5 16 25.5 13 32 13 C38.5 13 44.5 16 45 27 C42 20 37 19 32 19 C27 19 22 20 19 27 Z" fill="#7c2d12" />
        <path d="M23 15 Q32 9 41 15 Z" fill="#0f172a" />
        {/* Round Glasses */}
        <circle cx="26" cy="29" r="4.3" stroke="#fbbf24" strokeWidth="1.8" fill="rgba(255,255,255,0.16)" />
        <circle cx="38" cy="29" r="4.3" stroke="#fbbf24" strokeWidth="1.8" fill="rgba(255,255,255,0.16)" />
        <line x1="30.3" y1="29" x2="33.7" y2="29" stroke="#fbbf24" strokeWidth="1.8" />
        {/* Eyes & Smile */}
        <circle cx="26" cy="29" r="1.6" fill="#111827" />
        <circle cx="38" cy="29" r="1.6" fill="#111827" />
        <path d="M27.5 36 Q32 39 36.5 36" stroke="#9a4e32" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'student-girl-sunnies',
    label: 'הכי קולית בקמפוס',
    gradient: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Long Dark-Brown Hair */}
        <path d="M14 29 C13 14 22 10 32 10 C42 10 51 14 50 29 L52 50 L12 50 Z" fill="#3b2314" />
        {/* Denim / Teal Jacket */}
        <path d="M13 62 C13 48 21 44 32 44 C43 44 51 48 51 62 Z" fill="#0284c7" />
        {/* Neck */}
        <rect x="27.5" y="38" width="9" height="8" rx="4" fill="#f0c3a0" />
        {/* Face */}
        <circle cx="32" cy="29.5" r="12.5" fill="#f4cbb0" />
        {/* Cool Sunglasses on forehead */}
        <rect x="21" y="15" width="9.5" height="6" rx="2.5" fill="#1e1b4b" stroke="#fbbf24" strokeWidth="1.3" />
        <rect x="33.5" y="15" width="9.5" height="6" rx="2.5" fill="#1e1b4b" stroke="#fbbf24" strokeWidth="1.3" />
        <line x1="30.5" y1="17.5" x2="33.5" y2="17.5" stroke="#fbbf24" strokeWidth="1.4" />
        {/* Eyes & Confident Smile */}
        <circle cx="26.5" cy="30" r="1.8" fill="#111827" />
        <circle cx="37.5" cy="30" r="1.8" fill="#111827" />
        <path d="M27.5 36 Q32 39.5 36.5 35.5" stroke="#9a4e32" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
];

interface QuizAvatarProps {
  avatar: string;
  size?: number;
}

export const QuizAvatar: React.FC<QuizAvatarProps> = ({ avatar, size = 32 }) => {
  const def = QUIZ_AVATARS.find((a) => a.id === avatar);

  if (!def) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.34),
          background: 'rgba(255,255,255,0.14)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(size * 0.62),
          flexShrink: 0,
          lineHeight: 1
        }}
      >
        {avatar || '✨'}
      </span>
    );
  }

  return (
    <span
      title={def.label}
      style={{
        width: size,
        height: size,
        padding: 2,
        borderRadius: Math.round(size * 0.34),
        background: def.gradient,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        border: '1.5px solid rgba(255, 255, 255, 0.38)'
      }}
    >
      <span style={{ width: '100%', height: '100%', display: 'flex' }}>{def.renderSvg()}</span>
    </span>
  );
};
