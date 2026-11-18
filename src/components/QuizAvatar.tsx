import React from 'react';

export interface QuizAvatarDef {
  id: string;
  label: string;
  gradient: string;
  renderSvg: () => React.ReactNode;
}

export const QUIZ_AVATARS: QuizAvatarDef[] = [
  {
    id: 'chabad-flame',
    label: 'נר נשמה ואור',
    gradient: 'linear-gradient(135deg, #492691, #9333ea)',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c.7 3.2 3.5 5 3.5 8.5a3.5 3.5 0 1 1-7 0C8.5 7 11.3 5.2 12 2z" fill="#fbbf24" stroke="#fde68a" />
        <path d="M8 17h8M9 21h6M10 17v4M14 17v4" stroke="#fff" />
      </svg>
    )
  },
  {
    id: 'star-david',
    label: 'מגן דוד',
    gradient: 'linear-gradient(135deg, #2563eb, #4f46e5)',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinejoin="round">
        <polygon points="12,3 20,17 4,17" />
        <polygon points="12,21 20,7 4,7" />
      </svg>
    )
  },
  {
    id: 'torah-book',
    label: 'ספר תורה ותניא',
    gradient: 'linear-gradient(135deg, #b45309, #f59e0b)',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11v16H4.5A2.5 2.5 0 0 0 2 21V5.5z" fill="rgba(255,255,255,0.18)" />
        <path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H13v16h6.5a2.5 2.5 0 0 1 2.5 2V5.5z" fill="rgba(255,255,255,0.18)" />
        <path d="M12 3v16" />
      </svg>
    )
  },
  {
    id: 'campus-cap',
    label: 'סטודנט בקמפוס',
    gradient: 'linear-gradient(135deg, #0d9488, #0f766e)',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10l-10-5-10 5 10 5 10-5z" fill="rgba(255,255,255,0.2)" />
        <path d="M6 12.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
        <path d="M22 10v5" />
      </svg>
    )
  },
  {
    id: 'menorah',
    label: 'מנורת אור',
    gradient: 'linear-gradient(135deg, #d97706, #ea580c)',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v16M8 20h8" />
        <path d="M5 7v2a7 7 0 0 0 14 0V7" />
        <path d="M8.5 7v1.5a3.5 3.5 0 0 0 7 0V7" />
        <circle cx="12" cy="3" r="0.8" fill="#fde68a" stroke="none" />
        <circle cx="5" cy="5.5" r="0.8" fill="#fde68a" stroke="none" />
        <circle cx="19" cy="5.5" r="0.8" fill="#fde68a" stroke="none" />
      </svg>
    )
  },
  {
    id: 'shabbat-candles',
    label: 'נרות שבת',
    gradient: 'linear-gradient(135deg, #db2777, #9d174d)',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="10" width="4" height="9" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="14" y="10" width="4" height="9" rx="1" fill="rgba(255,255,255,0.22)" />
        <path d="M8 4.5c.8 1.4 1.2 2.2 1.2 3a1.2 1.2 0 1 1-2.4 0c0-.8.4-1.6 1.2-3z" fill="#fde68a" stroke="#fde68a" />
        <path d="M16 4.5c.8 1.4 1.2 2.2 1.2 3a1.2 1.2 0 1 1-2.4 0c0-.8.4-1.6 1.2-3z" fill="#fde68a" stroke="#fde68a" />
        <path d="M4 20h16" />
      </svg>
    )
  },
  {
    id: 'kiddush-cup',
    label: 'גביע קידוש',
    gradient: 'linear-gradient(135deg, #7c3aed, #db2777)',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 4h10l-1 6a4 4 0 0 1-8 0L7 4z" fill="rgba(255,255,255,0.2)" />
        <path d="M12 14v6M8 20h8" />
      </svg>
    )
  },
  {
    id: 'campus-coffee',
    label: 'קפה ושיעור',
    gradient: 'linear-gradient(135deg, #dd6755, #c2410c)',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 10h10v5a5 5 0 0 1-10 0v-5z" fill="rgba(255,255,255,0.2)" />
        <path d="M15 11h2a2 2 0 0 1 0 4h-2" />
        <path d="M8 5c0 1.2 1 1.8 1 2.8M12 4.5c0 1.2 1 1.8 1 2.8" />
      </svg>
    )
  },
  {
    id: 'crown-torah',
    label: 'כתר תורה',
    gradient: 'linear-gradient(135deg, #eab308, #b45309)',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l2-9 5 4 2-6 2 6 5-4 2 9H3z" fill="rgba(255,255,255,0.24)" />
        <path d="M4 20h16" />
      </svg>
    )
  },
  {
    id: 'niggun-note',
    label: 'ניגון חב״ד',
    gradient: 'linear-gradient(135deg, #4338ca, #06b6d4)',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V6l10-2v12" />
        <circle cx="6.5" cy="18" r="2.5" fill="rgba(255,255,255,0.25)" />
        <circle cx="16.5" cy="16" r="2.5" fill="rgba(255,255,255,0.25)" />
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
    // Fallback for legacy emoji avatars
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

  const iconPad = Math.max(4, Math.round(size * 0.2));

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
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.22)',
        border: '1.5px solid rgba(255, 255, 255, 0.35)'
      }}
    >
      <span style={{ width: '100%', height: '100%', display: 'flex' }}>{def.renderSvg()}</span>
    </span>
  );
};
