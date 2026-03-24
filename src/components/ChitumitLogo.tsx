export function ChitumitLogo({ size = 40, className = "", showSlogan = false }: { size?: number; className?: string; showSlogan?: boolean }) {
  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Minimal rounded-square background */}
        <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#logoBg)" />
        <rect x="4" y="4" width="56" height="56" rx="14" stroke="url(#logoBorder)" strokeWidth="1" />

        {/* Stylized ח (Het) merging into a checkmark + subtle smile */}
        <g transform="translate(14, 14)">
          {/* Left vertical stroke of ח */}
          <path
            d="M4 2V26"
            stroke="url(#goldStroke)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Top horizontal connecting stroke */}
          <path
            d="M4 2H28"
            stroke="url(#goldStroke)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Right vertical that curves into checkmark */}
          <path
            d="M28 2V14L18 26L34 10"
            stroke="url(#goldStroke)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Subtle smile curve in negative space */}
          <path
            d="M10 30C14 34 22 34 26 30"
            stroke="#D4AF37"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
        </g>

        <defs>
          <linearGradient id="logoBg" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0C1220" />
            <stop offset="1" stopColor="#141E30" />
          </linearGradient>
          <linearGradient id="logoBorder" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D4AF37" stopOpacity="0.5" />
            <stop offset="0.5" stopColor="#D4AF37" stopOpacity="0.15" />
            <stop offset="1" stopColor="#D4AF37" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="goldStroke" x1="4" y1="2" x2="34" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F5D77A" />
            <stop offset="1" stopColor="#D4AF37" />
          </linearGradient>
        </defs>
      </svg>
      {showSlogan && (
        <span className="text-[9px] text-muted-foreground/60 mt-0.5 font-assistant">תהיה מאושר.</span>
      )}
    </span>
  );
}
