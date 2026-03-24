import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Scene1Logo } from "./scenes/Scene1Logo";
import { Scene2Tagline } from "./scenes/Scene2Tagline";
import { Scene3Features } from "./scenes/Scene3Features";
import { Scene4Product } from "./scenes/Scene4Product";
import { Scene5CTA } from "./scenes/Scene5CTA";

export const MainVideo = () => {
  const frame = useCurrentFrame();

  // Persistent animated background
  const bgGradientAngle = interpolate(frame, [0, 600], [135, 180]);

  return (
    <AbsoluteFill>
      {/* Persistent dark background with subtle animation */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${bgGradientAngle}deg, #080E1A 0%, #0F172A 40%, #131B2E 70%, #0A1020 100%)`,
        }}
      />

      {/* Floating gold particles */}
      <AbsoluteFill style={{ opacity: 0.15 }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const x = (i * 137.5) % 1920;
          const baseY = (i * 89.3) % 1080;
          const y = baseY + Math.sin((frame + i * 30) * 0.02) * 40;
          const size = 2 + (i % 3) * 2;
          const opacity = 0.3 + Math.sin((frame + i * 20) * 0.03) * 0.3;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: size,
                height: size,
                borderRadius: "50%",
                background: "#D4AF37",
                opacity,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* Scenes */}
      <Sequence from={0} durationInFrames={120}>
        <Scene1Logo />
      </Sequence>
      <Sequence from={100} durationInFrames={130}>
        <Scene2Tagline />
      </Sequence>
      <Sequence from={210} durationInFrames={150}>
        <Scene3Features />
      </Sequence>
      <Sequence from={340} durationInFrames={140}>
        <Scene4Product />
      </Sequence>
      <Sequence from={460} durationInFrames={140}>
        <Scene5CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
