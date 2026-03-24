import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

export const Scene4Product = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const exitOp = interpolate(frame, [110, 140], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const s = spring({ frame, fps, config: { damping: 18, stiffness: 60 } });
  const imgScale = interpolate(s, [0, 1], [0.85, 1]);
  const imgY = interpolate(s, [0, 1], [80, 0]);

  // Subtle perspective tilt
  const rotateY = Math.sin(frame * 0.02) * 2;

  return (
    <AbsoluteFill style={{ opacity: enterOp * exitOp, justifyContent: "center", alignItems: "center" }}>
      {/* Glow behind screenshot */}
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
        }}
      />

      <div
        style={{
          transform: `scale(${imgScale}) translateY(${imgY}px) perspective(1200px) rotateY(${rotateY}deg)`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.15)",
        }}
      >
        {/* macOS title bar */}
        <div
          style={{
            height: 36,
            background: "#1E293B",
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
            gap: 8,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F56" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27C93F" }} />
          <div style={{ flex: 1, textAlign: "center", fontSize: 13, color: "#64748B", fontFamily: "sans-serif" }}>
            chitumit.co.il
          </div>
        </div>
        <Img
          src={staticFile("images/app-screenshot.png")}
          style={{ width: 1100, display: "block" }}
        />
      </div>
    </AbsoluteFill>
  );
};
