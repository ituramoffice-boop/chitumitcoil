import { useEffect, useRef, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface StarData {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleDelay: number;
  twinkleDuration: number;
  depth: number; // 1=far, 3=close — for parallax
}

const STAR_COUNT = 100;

function generateStars(count: number): StarData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.5 + 0.2,
    twinkleDelay: Math.random() * 6,
    twinkleDuration: Math.random() * 3 + 2,
    depth: Math.random() < 0.3 ? 3 : Math.random() < 0.6 ? 2 : 1,
  }));
}

function Star({ star, mouseX, mouseY }: { star: StarData; mouseX: any; mouseY: any }) {
  const factor = star.depth * 8;
  const sx = useTransform(mouseX, [-1, 1], [factor, -factor]);
  const sy = useTransform(mouseY, [-1, 1], [factor, -factor]);
  const springX = useSpring(sx, { stiffness: 50, damping: 20 });
  const springY = useSpring(sy, { stiffness: 50, damping: 20 });

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${star.x}%`,
        top: `${star.y}%`,
        width: star.size,
        height: star.size,
        x: springX,
        y: springY,
        backgroundColor: `rgba(210, 230, 255, ${star.opacity})`,
        boxShadow: star.size > 1.2
          ? `0 0 ${star.size * 4}px ${star.size}px rgba(180, 210, 255, ${star.opacity * 0.3})`
          : undefined,
      }}
      animate={{ opacity: [star.opacity, star.opacity * 0.3, star.opacity] }}
      transition={{
        duration: star.twinkleDuration,
        delay: star.twinkleDelay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

const StarField = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stars = useMemo(() => generateStars(STAR_COUNT), []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const cx = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 … 1
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseX.set(cx);
      mouseY.set(cy);
    };
    const handleLeave = () => { mouseX.set(0); mouseY.set(0); };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
      aria-hidden="true"
    >
      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.35)_100%)]" />

      {stars.map((star) => (
        <Star key={star.id} star={star} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  );
};

export default StarField;
