import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const Scene1Logo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleShield = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const glowPulse = 0.4 + Math.sin(frame * 0.1) * 0.2;
  const exitOpacity = interpolate(frame, [90, 120], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Gold line sweep
  const lineX = interpolate(frame, [30, 70], [-200, 2100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: opacity * exitOpacity, justifyContent: "center", alignItems: "center" }}>
      {/* Radial glow behind shield */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(212,175,55,${glowPulse}) 0%, transparent 70%)`,
        }}
      />

      {/* Shield SVG */}
      <div style={{ transform: `scale(${scaleShield * 2.5})` }}>
        <svg width={120} height={140} viewBox="0 0 64 64" fill="none">
          <path
            d="M32 4L8 16V34C8 48.36 18.64 58.4 32 62C45.36 58.4 56 48.36 56 34V16L32 4Z"
            fill="url(#sg)"
            stroke="#D4AF37"
            strokeWidth="1.5"
          />
          <path
            d="M32 8L12 18.5V34C12 46.2 21.2 55.2 32 58.2C42.8 55.2 52 46.2 52 34V18.5L32 8Z"
            fill="url(#ig)"
            opacity="0.3"
          />
          <g transform="translate(16, 18)">
            <path d="M4 0V20" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M4 0H24" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M24 0V10L16 20L28 6" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          <defs>
            <linearGradient id="sg" x1="32" y1="4" x2="32" y2="62" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0F172A" />
              <stop offset="1" stopColor="#1E293B" />
            </linearGradient>
            <linearGradient id="ig" x1="32" y1="8" x2="32" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D4AF37" />
              <stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Gold sweep line */}
      <div
        style={{
          position: "absolute",
          left: lineX,
          top: 0,
          width: 200,
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)",
          transform: "skewX(-15deg)",
        }}
      />
    </AbsoluteFill>
  );
};
