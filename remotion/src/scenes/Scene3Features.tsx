import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const features = [
  { icon: "🛡️", title: "Risk Detection", desc: "AI-powered analysis" },
  { icon: "📄", title: "Smart Documents", desc: "Auto-classification" },
  { icon: "📊", title: "Lead Management", desc: "Built-in CRM" },
];

export const Scene3Features = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const exitOp = interpolate(frame, [120, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: enterOp * exitOp, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
        {features.map((f, i) => {
          const delay = i * 12;
          const s = spring({ frame: frame - delay - 10, fps, config: { damping: 15, stiffness: 120 } });
          const cardScale = interpolate(s, [0, 1], [0.7, 1]);
          const cardOp = interpolate(frame, [delay + 10, delay + 25], [0, 1], { extrapolateRight: "clamp" });
          const hover = Math.sin((frame - delay) * 0.04) * 6;

          return (
            <div
              key={i}
              style={{
                width: 340,
                padding: "50px 40px",
                borderRadius: 24,
                background: "linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))",
                border: "1px solid rgba(212,175,55,0.2)",
                textAlign: "center",
                transform: `scale(${cardScale}) translateY(${hover}px)`,
                opacity: cardOp,
                boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,175,55,0.1)",
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 20 }}>{f.icon}</div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#D4AF37",
                  fontFamily: "sans-serif",
                  marginBottom: 12,
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: "#94A3B8",
                  fontFamily: "sans-serif",
                  fontWeight: 300,
                }}
              >
                {f.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gold accent line at top */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: "50%",
          transform: "translateX(-50%)",
          width: interpolate(frame, [0, 40], [0, 600], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)",
        }}
      />
    </AbsoluteFill>
  );
};
