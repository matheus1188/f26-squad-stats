/**
 * Premium animated trophy hero — metallic cup, neon outlines,
 * electric green energy inside, floating particles, spotlights.
 */
export function TrophyHero({ size = 260 }: { size?: number }) {
  const particles = Array.from({ length: 14 });
  return (
    <div
      className="trophy-stage relative mx-auto"
      style={{ width: size, height: size }}
      aria-label="Golaço Cup trophy"
      role="img"
    >
      {/* spotlights */}
      <div className="trophy-spot trophy-spot-a" />
      <div className="trophy-spot trophy-spot-b" />

      {/* base glow */}
      <div className="trophy-floor" />

      {/* particles */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        {particles.map((_, i) => (
          <span
            key={i}
            className="trophy-particle"
            style={{
              left: `${(i * 53) % 100}%`,
              animationDelay: `${(i * 0.4) % 5}s`,
              animationDuration: `${5 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      {/* trophy svg */}
      <svg
        viewBox="0 0 200 240"
        width={size}
        height={size}
        className="relative z-10 trophy-rotate trophy-glow"
      >
        <defs>
          <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5f7fb" />
            <stop offset="40%" stopColor="#9aa3b2" />
            <stop offset="60%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#5b6473" />
          </linearGradient>
          <linearGradient id="energy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#39FF14" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#00BFFF" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="ball" cx="0.35" cy="0.35" r="0.7">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#cfd4dc" />
            <stop offset="100%" stopColor="#3b4250" />
          </radialGradient>
          <filter id="neon" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* base */}
        <rect x="55" y="208" width="90" height="14" rx="3" fill="url(#metal)" stroke="#00BFFF" strokeOpacity="0.6" />
        <rect x="68" y="190" width="64" height="20" rx="3" fill="url(#metal)" stroke="#00BFFF" strokeOpacity="0.5" />

        {/* stem */}
        <rect x="92" y="160" width="16" height="34" fill="url(#metal)" stroke="#00BFFF" strokeOpacity="0.5" />

        {/* cup body with energy fill */}
        <g filter="url(#neon)">
          <path
            d="M50 60 Q50 150 100 165 Q150 150 150 60 Z"
            fill="url(#metal)"
            stroke="#00BFFF"
            strokeWidth="1.5"
          />
          {/* energy liquid inside */}
          <clipPath id="cupClip">
            <path d="M55 64 Q55 146 100 160 Q145 146 145 64 Z" />
          </clipPath>
          <g clipPath="url(#cupClip)">
            <rect x="40" y="70" width="120" height="100" fill="url(#energy)" opacity="0.55">
              <animate attributeName="y" values="80;70;80" dur="3.2s" repeatCount="indefinite" />
            </rect>
            <ellipse cx="100" cy="80" rx="50" ry="6" fill="#39FF14" opacity="0.65">
              <animate attributeName="cy" values="86;78;86" dur="3.2s" repeatCount="indefinite" />
            </ellipse>
          </g>
          {/* glass highlight */}
          <path d="M60 70 Q62 120 80 150" stroke="white" strokeOpacity="0.6" strokeWidth="2" fill="none" />
        </g>

        {/* handles */}
        <path d="M50 70 Q20 80 30 130 Q35 145 55 140" fill="none" stroke="url(#metal)" strokeWidth="6" />
        <path d="M150 70 Q180 80 170 130 Q165 145 145 140" fill="none" stroke="url(#metal)" strokeWidth="6" />
        <path d="M50 70 Q20 80 30 130 Q35 145 55 140" fill="none" stroke="#00BFFF" strokeOpacity="0.5" strokeWidth="1" />
        <path d="M150 70 Q180 80 170 130 Q165 145 145 140" fill="none" stroke="#00BFFF" strokeOpacity="0.5" strokeWidth="1" />

        {/* football on top */}
        <g>
          <circle cx="100" cy="36" r="22" fill="url(#ball)" stroke="#0b1322" strokeWidth="1.5" />
          <polygon points="100,22 110,30 106,42 94,42 90,30" fill="#0b1322" />
          <line x1="100" y1="14" x2="100" y2="22" stroke="#0b1322" strokeWidth="1.2" />
          <line x1="118" y1="28" x2="110" y2="30" stroke="#0b1322" strokeWidth="1.2" />
          <line x1="82" y1="28" x2="90" y2="30" stroke="#0b1322" strokeWidth="1.2" />
          <line x1="106" y1="42" x2="114" y2="50" stroke="#0b1322" strokeWidth="1.2" />
          <line x1="94" y1="42" x2="86" y2="50" stroke="#0b1322" strokeWidth="1.2" />
          <circle cx="100" cy="36" r="22" fill="none" stroke="#39FF14" strokeOpacity="0.5" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
