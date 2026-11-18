import React from 'react';

export interface QuizAvatarDef {
  id: string;
  label: string;
  gradient: string;
  renderSvg: () => React.ReactNode;
}

export const QUIZ_AVATARS: QuizAvatarDef[] = [
  {
    id: 'lion-yehuda',
    label: 'אריה גיבור',
    gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Fluffy mane */}
        <circle cx="32" cy="34" r="23" fill="#b45309" />
        <circle cx="16" cy="20" r="7" fill="#d97706" />
        <circle cx="48" cy="20" r="7" fill="#d97706" />
        <circle cx="12" cy="35" r="7" fill="#d97706" />
        <circle cx="52" cy="35" r="7" fill="#d97706" />
        <circle cx="20" cy="50" r="7" fill="#d97706" />
        <circle cx="44" cy="50" r="7" fill="#d97706" />
        <circle cx="32" cy="14" r="7" fill="#d97706" />
        {/* Ears */}
        <circle cx="19" cy="22" r="5" fill="#fbbf24" />
        <circle cx="45" cy="22" r="5" fill="#fbbf24" />
        {/* Face */}
        <circle cx="32" cy="35" r="16" fill="#fcd34d" />
        {/* Eyes */}
        <circle cx="26" cy="32" r="2.8" fill="#1f2937" />
        <circle cx="38" cy="32" r="2.8" fill="#1f2937" />
        <circle cx="25" cy="31" r="1" fill="#fff" />
        <circle cx="37" cy="31" r="1" fill="#fff" />
        {/* Cheeks */}
        <ellipse cx="21" cy="37" rx="3" ry="1.8" fill="#fb7185" opacity="0.55" />
        <ellipse cx="43" cy="37" rx="3" ry="1.8" fill="#fb7185" opacity="0.55" />
        {/* Snout & smile */}
        <ellipse cx="32" cy="39" rx="6" ry="4.5" fill="#fef3c7" />
        <polygon points="29,36 35,36 32,39.5" fill="#78350f" />
        <path d="M29 41.5 Q32 44 35 41.5" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'owl-wise',
    label: 'ינשוף חכם',
    gradient: 'linear-gradient(135deg, #492691, #7c3aed)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Body */}
        <ellipse cx="32" cy="37" rx="19" ry="20" fill="#6d28d9" />
        {/* Ear tufts */}
        <polygon points="16,22 21,12 27,21" fill="#5b21b6" />
        <polygon points="48,22 43,12 37,21" fill="#5b21b6" />
        {/* Belly */}
        <ellipse cx="32" cy="45" rx="11" ry="10" fill="#ede9fe" />
        {/* Eye circles */}
        <circle cx="24.5" cy="29" r="8" fill="#fff" />
        <circle cx="39.5" cy="29" r="8" fill="#fff" />
        {/* Glasses rim */}
        <circle cx="24.5" cy="29" r="8.2" stroke="#fbbf24" strokeWidth="2.2" />
        <circle cx="39.5" cy="29" r="8.2" stroke="#fbbf24" strokeWidth="2.2" />
        <line x1="32.5" y1="29" x2="31.5" y2="29" stroke="#fbbf24" strokeWidth="2.2" />
        {/* Pupils */}
        <circle cx="25" cy="29" r="3.4" fill="#1e1b4b" />
        <circle cx="39" cy="29" r="3.4" fill="#1e1b4b" />
        <circle cx="24" cy="27.8" r="1.2" fill="#fff" />
        <circle cx="38" cy="27.8" r="1.2" fill="#fff" />
        {/* Beak */}
        <polygon points="29,34 35,34 32,40" fill="#f59e0b" />
        {/* Mini graduation cap */}
        <polygon points="32,8 46,13 32,18 18,13" fill="#1f2937" stroke="#fbbf24" strokeWidth="1.2" />
        <line x1="44" y1="14" x2="46" y2="21" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'bear-biu',
    label: 'דובי בקמפוס',
    gradient: 'linear-gradient(135deg, #0d9488, #0f766e)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Ears */}
        <circle cx="17" cy="20" r="8" fill="#92400e" />
        <circle cx="47" cy="20" r="8" fill="#92400e" />
        <circle cx="17" cy="20" r="4.5" fill="#fde68a" />
        <circle cx="47" cy="20" r="4.5" fill="#fde68a" />
        {/* Head */}
        <circle cx="32" cy="36" r="19" fill="#b45309" />
        {/* Cute Purple Kippah */}
        <path d="M21 19 Q32 10 43 19 Z" fill="#492691" stroke="#fbbf24" strokeWidth="1.5" />
        {/* Snout */}
        <ellipse cx="32" cy="41" rx="8.5" ry="6.5" fill="#fef3c7" />
        {/* Eyes */}
        <circle cx="25" cy="32" r="2.8" fill="#111827" />
        <circle cx="39" cy="32" r="2.8" fill="#111827" />
        <circle cx="24" cy="31" r="1" fill="#fff" />
        <circle cx="38" cy="31" r="1" fill="#fff" />
        {/* Cheeks */}
        <ellipse cx="20" cy="37" rx="3" ry="1.8" fill="#f472b6" opacity="0.6" />
        <ellipse cx="44" cy="37" rx="3" ry="1.8" fill="#f472b6" opacity="0.6" />
        {/* Nose & Smile */}
        <ellipse cx="32" cy="38.5" rx="3" ry="2" fill="#451a03" />
        <path d="M28.5 43 Q32 46 35.5 43" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'flame-buddy',
    label: 'להבה שמחה',
    gradient: 'linear-gradient(135deg, #dd6755, #f97316)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Outer Flame */}
        <path
          d="M32 7 C40 17 50 26 50 38 C50 49 42 56 32 56 C22 56 14 49 14 38 C14 27 24 20 26 14 C27 17 29 18 32 7 Z"
          fill="#fbbf24"
          stroke="#fff"
          strokeWidth="1.8"
        />
        {/* Inner warm core */}
        <path
          d="M32 24 C37 30 43 35 43 42 C43 49 38 53 32 53 C26 53 21 49 21 42 C21 35 27 30 32 24 Z"
          fill="#fef08a"
        />
        {/* Cute Eyes */}
        <circle cx="26.5" cy="39" r="2.8" fill="#1f2937" />
        <circle cx="37.5" cy="39" r="2.8" fill="#1f2937" />
        <circle cx="25.7" cy="38" r="1" fill="#fff" />
        <circle cx="36.7" cy="38" r="1" fill="#fff" />
        {/* Rosy cheeks */}
        <ellipse cx="22" cy="43" rx="2.6" ry="1.6" fill="#f43f5e" opacity="0.55" />
        <ellipse cx="42" cy="43" rx="2.6" ry="1.6" fill="#f43f5e" opacity="0.55" />
        {/* Big happy smile */}
        <path d="M27.5 44.5 Q32 49.5 36.5 44.5" stroke="#9a3412" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'fox-campus',
    label: 'שועל זריז',
    gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Ears */}
        <polygon points="14,30 17,11 29,22" fill="#ea580c" />
        <polygon points="50,30 47,11 35,22" fill="#ea580c" />
        <polygon points="17,26 19,15 26,22" fill="#fed7aa" />
        <polygon points="47,26 45,15 38,22" fill="#fed7aa" />
        {/* Head */}
        <ellipse cx="32" cy="37" rx="20" ry="16" fill="#f97316" />
        {/* White cheek patches */}
        <path d="M13 38 Q22 36 32 48 Q20 53 13 38 Z" fill="#fff7ed" />
        <path d="M51 38 Q42 36 32 48 Q44 53 51 38 Z" fill="#fff7ed" />
        {/* Cute winking eye & open eye */}
        <circle cx="24" cy="34" r="2.8" fill="#1f2937" />
        <circle cx="23" cy="33" r="1" fill="#fff" />
        <path d="M36.5 34.5 Q40 31.5 43.5 34.5" stroke="#1f2937" strokeWidth="2.4" strokeLinecap="round" />
        {/* Nose & smile */}
        <circle cx="32" cy="43" r="2.8" fill="#1f2937" />
        <path d="M28.5 47 Q32 50 35.5 47" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'penguin-scholar',
    label: 'פינגווין חמוד',
    gradient: 'linear-gradient(135deg, #2563eb, #4338ca)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Body */}
        <ellipse cx="32" cy="37" rx="19" ry="21" fill="#1e293b" />
        {/* White face heart */}
        <ellipse cx="26" cy="34" rx="8" ry="10" fill="#fff" />
        <ellipse cx="38" cy="34" rx="8" ry="10" fill="#fff" />
        <ellipse cx="32" cy="45" rx="12" ry="11" fill="#fff" />
        {/* Eyes */}
        <circle cx="25.5" cy="31" r="2.8" fill="#0f172a" />
        <circle cx="38.5" cy="31" r="2.8" fill="#0f172a" />
        <circle cx="24.5" cy="30" r="1" fill="#fff" />
        <circle cx="37.5" cy="30" r="1" fill="#fff" />
        {/* Cheeks */}
        <ellipse cx="20" cy="36" rx="2.8" ry="1.8" fill="#fb7185" opacity="0.65" />
        <ellipse cx="44" cy="36" rx="2.8" ry="1.8" fill="#fb7185" opacity="0.65" />
        {/* Orange beak */}
        <polygon points="28,36 36,36 32,42" fill="#f59e0b" />
        {/* Cute Purple Bow-tie */}
        <polygon points="24,47 32,50 24,53" fill="#7c3aed" />
        <polygon points="40,47 32,50 40,53" fill="#7c3aed" />
        <circle cx="32" cy="50" r="2" fill="#fbbf24" />
      </svg>
    )
  },
  {
    id: 'panda-niggun',
    label: 'פנדה מוזיקלי',
    gradient: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Ears */}
        <circle cx="17" cy="21" r="7.5" fill="#1f2937" />
        <circle cx="47" cy="21" r="7.5" fill="#1f2937" />
        {/* Headphone arc */}
        <path d="M12 34 C12 16 52 16 52 34" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
        {/* Head */}
        <circle cx="32" cy="36" r="18.5" fill="#ffffff" />
        {/* Headphone cups */}
        <rect x="9" y="29" width="6.5" height="13" rx="3.2" fill="#492691" stroke="#fbbf24" strokeWidth="1.5" />
        <rect x="48.5" y="29" width="6.5" height="13" rx="3.2" fill="#492691" stroke="#fbbf24" strokeWidth="1.5" />
        {/* Eye patches */}
        <ellipse cx="24.5" cy="34" rx="5.2" ry="6.2" transform="rotate(-15 24.5 34)" fill="#1f2937" />
        <ellipse cx="39.5" cy="34" rx="5.2" ry="6.2" transform="rotate(15 39.5 34)" fill="#1f2937" />
        {/* Eye shine */}
        <circle cx="25" cy="33" r="1.8" fill="#fff" />
        <circle cx="39" cy="33" r="1.8" fill="#fff" />
        {/* Nose & smile */}
        <ellipse cx="32" cy="41" rx="3.2" ry="2" fill="#1f2937" />
        <path d="M28 45 Q32 48.5 36 45" stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'coffee-buddy',
    label: 'קפה של רביעי',
    gradient: 'linear-gradient(135deg, #9333ea, #db2777)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Steam */}
        <path d="M24 17 Q22 12 26 9" stroke="#fde68a" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M33 15 Q31 10 35 7" stroke="#fde68a" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M41 17 Q39 12 43 9" stroke="#fde68a" strokeWidth="2.4" strokeLinecap="round" />
        {/* Handle */}
        <path d="M45 29 C53 29 53 43 45 43" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        {/* Cup Body */}
        <path d="M16 23 H46 L43 49 C42.5 53 39 55 31 55 C23 55 19.5 53 19 49 Z" fill="#fff7ed" />
        {/* Purple sleeve */}
        <rect x="17.5" y="31" width="27" height="16" rx="4" fill="#492691" />
        {/* Cute Face on sleeve */}
        <circle cx="25.5" cy="37.5" r="2.3" fill="#fff" />
        <circle cx="36.5" cy="37.5" r="2.3" fill="#fff" />
        <ellipse cx="22" cy="41" rx="2.2" ry="1.4" fill="#fb7185" opacity="0.8" />
        <ellipse cx="40" cy="41" rx="2.2" ry="1.4" fill="#fb7185" opacity="0.8" />
        <path d="M28 41.5 Q31 44.5 34 41.5" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'tanya-buddy',
    label: 'ספר תניא חי',
    gradient: 'linear-gradient(135deg, #7f1d1d, #dc2626)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Book cover */}
        <rect x="14" y="13" width="36" height="40" rx="6" fill="#7c2d12" stroke="#fbbf24" strokeWidth="2.4" />
        {/* Spine */}
        <rect x="14" y="13" width="8" height="40" rx="4" fill="#451a03" stroke="#fbbf24" strokeWidth="1.8" />
        {/* Gold decorative frame */}
        <rect x="25" y="19" width="20" height="28" rx="3" fill="#9a3412" stroke="#fde68a" strokeWidth="1.4" />
        {/* Cute Eyes & Smile */}
        <circle cx="31" cy="31" r="2.5" fill="#fff" />
        <circle cx="40" cy="31" r="2.5" fill="#fff" />
        <circle cx="31.3" cy="31" r="1.2" fill="#1f2937" />
        <circle cx="39.7" cy="31" r="1.2" fill="#1f2937" />
        <path d="M31.5 37.5 Q35.5 41.5 39.5 37.5" stroke="#fde68a" strokeWidth="2.1" strokeLinecap="round" />
        {/* Bookmark */}
        <polygon points="33,53 38,53 38,60 35.5,58 33,60" fill="#fbbf24" />
      </svg>
    )
  },
  {
    id: 'star-buddy',
    label: 'כוכב מאיר',
    gradient: 'linear-gradient(135deg, #eab308, #ca8a04)',
    renderSvg: () => (
      <svg viewBox="0 0 64 64" fill="none">
        {/* Star body */}
        <path
          d="M32 7 L39.2 21.8 L55.5 24.2 L43.7 35.6 L46.5 51.8 L32 44.1 L17.5 51.8 L20.3 35.6 L8.5 24.2 L24.8 21.8 Z"
          fill="#fde047"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Cute Eyes */}
        <circle cx="27" cy="31" r="2.6" fill="#1f2937" />
        <circle cx="37" cy="31" r="2.6" fill="#1f2937" />
        <circle cx="26.2" cy="30" r="1" fill="#fff" />
        <circle cx="36.2" cy="30" r="1" fill="#fff" />
        {/* Cheeks */}
        <ellipse cx="22.5" cy="35" rx="2.4" ry="1.5" fill="#fb7185" opacity="0.65" />
        <ellipse cx="41.5" cy="35" rx="2.4" ry="1.5" fill="#fb7185" opacity="0.65" />
        {/* Smile */}
        <path d="M28 36.5 Q32 40.5 36 36.5" stroke="#854d0e" strokeWidth="2.1" strokeLinecap="round" />
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

  const iconPad = Math.max(2, Math.round(size * 0.08));

  return (
    <span
      title={def.label}
      style={{
        width: size,
        height: size,
        padding: iconPad,
        borderRadius: Math.round(size * 0.34),
        background: def.gradient,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        border: '1.5px solid rgba(255, 255, 255, 0.38)'
      }}
    >
      <span style={{ width: '100%', height: '100%', display: 'flex' }}>{def.renderSvg()}</span>
    </span>
  );
};
