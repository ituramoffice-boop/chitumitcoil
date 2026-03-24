import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const Scene5CTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const s1 = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });
  const s2 = spring({ frame: frame - 15, fps, config: { damping: 20, stiffness: 80 } });
  const s3 = spring({ frame: frame - 30, fps, config: { damping: 20, stiffness: 80 } });

  const titleScale = interpolate(s1, [0, 1], [0.8, 1]);
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const urlOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });

  const glowPulse = 0.3 + Math.sin(frame * 0.08) * 0.15;

  return (
    <AbsoluteFill style={{ opacity: enterOp, justifyContent: "center", alignItems: "center" }}>
      {/* Big radial glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(212,175,55,${glowPulse}) 0%, transparent 60%)`,
        }}
      />

      <div style={{ textAlign: "center", zIndex: 1 }}>
        {/* Shield icon small */}
        <div style={{ marginBottom: 30, opacity: titleOp }}>
          <svg width={80} height={95} viewBox="0 0 64 64" fill="none">
            <path d="M32 4L8 16V34C8 48.36 18.64 58.4 32 62C45.36 58.4 56 48.36 56 34V16L32 4Z" fill="url(#sg2)" stroke="#D4AF37" strokeWidth="1.5" />
            <g transform="translate(16,18)">
              <path d="M4 0V20" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M4 0H24" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M24 0V10L16 20L28 6" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
            <defs>
              <linearGradient id="sg2" x1="32" y1="4" x2="32" y2="62" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0F172A" /><stop offset="1" stopColor="#1E293B" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div
          style={{
            fontSize: 90,
            fontWeight: 800,
            color: "#D4AF37",
            fontFamily: "sans-serif",
            letterSpacing: 4,
            transform: `scale(${titleScale})`,
            opacity: titleOp,
            textShadow: "0 0 60px rgba(212,175,55,0.3)",
          }}
        >
          CHITUMIT
        </div>

        <div
          style={{
            fontSize: 28,
            color: "#94A3B8",
            fontFamily: "sans-serif",
            fontWeight: 300,
            marginTop: 16,
            opacity: subOp,
            letterSpacing: 6,
          }}
        >
          THE FUTURE OF MORTGAGE UNDERWRITING
        </div>

        {/* URL badge */}
        <div
          style={{
            marginTop: 50,
            opacity: urlOp,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "16px 48px",
              borderRadius: 50,
              background: "linear-gradient(135deg, #D4AF37, #C5A028)",
              color: "#0F172A",
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "sans-serif",
              letterSpacing: 2,
              boxShadow: "0 10px 40px rgba(212,175,55,0.3)",
            }}
          >
            chitumit.co.il
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
