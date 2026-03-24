import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const Scene2Tagline = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const exitOpacity = interpolate(frame, [100, 130], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const combined = enterOpacity * exitOpacity;

  const line1Y = interpolate(
    spring({ frame, fps, config: { damping: 20, stiffness: 100 } }),
    [0, 1], [60, 0]
  );
  const line2Y = interpolate(
    spring({ frame: frame - 10, fps, config: { damping: 20, stiffness: 100 } }),
    [0, 1], [60, 0]
  );
  const line3Y = interpolate(
    spring({ frame: frame - 20, fps, config: { damping: 20, stiffness: 100 } }),
    [0, 1], [40, 0]
  );

  const line1Op = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const line2Op = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });
  const line3Op = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: combined, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 28,
            color: "#D4AF37",
            letterSpacing: 8,
            fontFamily: "sans-serif",
            fontWeight: 300,
            transform: `translateY(${line1Y}px)`,
            opacity: line1Op,
            marginBottom: 20,
          }}
        >
          INTRODUCING
        </div>
        <div
          style={{
            fontSize: 110,
            color: "#D4AF37",
            fontFamily: "sans-serif",
            fontWeight: 800,
            letterSpacing: 6,
            transform: `translateY(${line2Y}px)`,
            opacity: line2Op,
            textShadow: "0 0 80px rgba(212,175,55,0.3)",
          }}
        >
          CHITUMIT
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#94A3B8",
            fontFamily: "sans-serif",
            fontWeight: 300,
            transform: `translateY(${line3Y}px)`,
            opacity: line3Op,
            marginTop: 20,
            letterSpacing: 4,
          }}
        >
          THE INTELLIGENCE BEHIND THE APPROVAL
        </div>
      </div>

      {/* Bottom gold line */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: "50%",
          transform: "translateX(-50%)",
          width: interpolate(frame, [30, 60], [0, 400], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2,
          background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
        }}
      />
    </AbsoluteFill>
  );
};
