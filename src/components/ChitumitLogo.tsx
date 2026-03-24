export function ChitumitLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield shape */}
      <path
        d="M32 4L8 16V34C8 48.36 18.64 58.4 32 62C45.36 58.4 56 48.36 56 34V16L32 4Z"
        fill="url(#shieldGrad)"
        stroke="#D4AF37"
        strokeWidth="1.5"
      />
      {/* Inner shield glow */}
      <path
        d="M32 8L12 18.5V34C12 46.2 21.2 55.2 32 58.2C42.8 55.2 52 46.2 52 34V18.5L32 8Z"
        fill="url(#innerGrad)"
        opacity="0.3"
      />
      {/* Hebrew ח merged with checkmark */}
      <g transform="translate(16, 18)">
        {/* Left vertical stroke of ח */}
        <path
          d="M4 0V20"
          stroke="#D4AF37"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Top horizontal connecting stroke of ח */}
        <path
          d="M4 0H24"
          stroke="#D4AF37"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Right stroke of ח that becomes checkmark */}
        <path
          d="M24 0V10L16 20L28 6"
          stroke="#D4AF37"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      <defs>
        <linearGradient id="shieldGrad" x1="32" y1="4" x2="32" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id="innerGrad" x1="32" y1="8" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4AF37" />
          <stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
