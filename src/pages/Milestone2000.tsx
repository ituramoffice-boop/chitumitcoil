import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/* ══════════════════════════════════════════════
   TYPEWRITER
   ══════════════════════════════════════════════ */

function Typewriter({ text, delay = 0, speed = 40, className, onDone }: {
  text: string; delay?: number; speed?: number; className?: string; onDone?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) { onDone?.(); return; }
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
    return () => clearTimeout(t);
  }, [started, displayed, text, speed, onDone]);

  return (
    <span className={className}>
      {displayed}
      {started && displayed.length < text.length && (
        <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="inline-block w-[2px] h-[1em] bg-current align-middle mr-0.5" />
      )}
    </span>
  );
}

/* ══════════════════════════════════════════════
   FILM GRAIN OVERLAY
   ══════════════════════════════════════════════ */

function FilmGrain({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[60]"
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: "150px",
        mixBlendMode: "overlay",
      }}
    />
  );
}

/* ══════════════════════════════════════════════
   FLOATING PARTICLES
   ══════════════════════════════════════════════ */

function WarmParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      dur: 8 + Math.random() * 12,
      delay: Math.random() * 5,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0], y: [0, -40, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay }}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: "radial-gradient(circle, hsl(35 80% 70% / 0.6), transparent)",
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   LATE NIGHT SCENE (Developer & Entrepreneur)
   ══════════════════════════════════════════════ */

function LateNightScene() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      className="relative w-full max-w-md mx-auto"
    >
      {/* Desk scene — stylized SVG illustration */}
      <svg viewBox="0 0 400 280" className="w-full opacity-70" style={{ filter: "sepia(0.4)" }}>
        {/* Room */}
        <rect x="0" y="0" width="400" height="280" fill="#0a0a08" />

        {/* Window with moonlight */}
        <rect x="250" y="20" width="80" height="60" rx="3" fill="none" stroke="#333" strokeWidth="1.5" />
        <rect x="255" y="25" width="35" height="25" fill="#1a1a2e" />
        <rect x="292" y="25" width="35" height="25" fill="#1a1a2e" />
        <rect x="255" y="52" width="35" height="24" fill="#1a1a2e" />
        <rect x="292" y="52" width="35" height="24" fill="#1a1a2e" />
        <circle cx="310" cy="38" r="8" fill="#D4AF37" opacity="0.3" />

        {/* Desk */}
        <rect x="60" y="180" width="280" height="8" rx="2" fill="#2a2015" />
        <rect x="80" y="188" width="8" height="70" fill="#2a2015" />
        <rect x="312" y="188" width="8" height="70" fill="#2a2015" />

        {/* Laptop */}
        <rect x="155" y="140" width="90" height="40" rx="3" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
        <rect x="160" y="145" width="80" height="30" rx="1" fill="#0d1117" />
        {/* Code lines on screen */}
        <rect x="165" y="150" width="30" height="2" rx="1" fill="#D4AF37" opacity="0.6" />
        <rect x="165" y="155" width="45" height="2" rx="1" fill="#4a9" opacity="0.4" />
        <rect x="165" y="160" width="25" height="2" rx="1" fill="#D4AF37" opacity="0.5" />
        <rect x="165" y="165" width="55" height="2" rx="1" fill="#4a9" opacity="0.3" />
        {/* Laptop glow */}
        <ellipse cx="200" cy="160" rx="60" ry="30" fill="#D4AF37" opacity="0.04" />

        {/* Person 1 — developer (left) */}
        <circle cx="140" cy="120" r="14" fill="#222" />
        <rect x="128" y="134" width="24" height="30" rx="8" fill="#1a1a1a" />
        {/* Arm reaching to laptop */}
        <line x1="148" y1="150" x2="165" y2="160" stroke="#222" strokeWidth="4" strokeLinecap="round" />

        {/* Person 2 — entrepreneur (right) */}
        <circle cx="260" cy="118" r="14" fill="#2a2015" />
        <rect x="248" y="132" width="24" height="30" rx="8" fill="#2a2015" />
        {/* Arm */}
        <line x1="252" y1="148" x2="235" y2="158" stroke="#2a2015" strokeWidth="4" strokeLinecap="round" />

        {/* Coffee cups */}
        <rect x="120" y="172" width="12" height="8" rx="2" fill="#333" />
        <rect x="268" y="172" width="12" height="8" rx="2" fill="#333" />
      </svg>

      {/* Laptop glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 w-32 h-16 rounded-full bg-[hsl(var(--gold))] opacity-[0.03] blur-2xl" />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   FAMILY SCENE
   ══════════════════════════════════════════════ */

function FamilyScene() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2 }}
      className="relative w-full max-w-sm mx-auto"
    >
      <svg viewBox="0 0 360 260" className="w-full">
        {/* Warm background */}
        <rect x="0" y="0" width="360" height="260" rx="16" fill="#1a1208" />

        {/* Warm glow from center */}
        <ellipse cx="180" cy="160" rx="140" ry="80" fill="#D4AF37" opacity="0.06" />

        {/* Table */}
        <ellipse cx="180" cy="180" rx="100" ry="25" fill="#2a1f10" />
        <ellipse cx="180" cy="178" rx="95" ry="22" fill="#3a2f1a" />

        {/* Plates */}
        <ellipse cx="140" cy="175" rx="18" ry="6" fill="#4a3f28" stroke="#5a4f38" strokeWidth="0.5" />
        <ellipse cx="220" cy="175" rx="18" ry="6" fill="#4a3f28" stroke="#5a4f38" strokeWidth="0.5" />
        <ellipse cx="180" cy="168" rx="14" ry="5" fill="#4a3f28" stroke="#5a4f38" strokeWidth="0.5" />

        {/* Candle */}
        <rect x="177" y="140" width="6" height="20" rx="2" fill="#D4AF37" opacity="0.7" />
        <ellipse cx="180" cy="138" rx="5" ry="7" fill="#ffcc44" opacity="0.4" />
        <ellipse cx="180" cy="130" rx="12" ry="14" fill="#D4AF37" opacity="0.05" />

        {/* Father */}
        <circle cx="120" cy="115" r="16" fill="#3a2f1a" />
        <rect x="106" y="131" width="28" height="35" rx="10" fill="#2a1f10" />

        {/* Mother */}
        <circle cx="240" cy="113" r="16" fill="#3a2f1a" />
        {/* Hair */}
        <ellipse cx="240" cy="107" rx="18" ry="12" fill="#2a1f10" />
        <rect x="226" y="129" width="28" height="35" rx="10" fill="#352a18" />

        {/* Child 1 */}
        <circle cx="160" cy="125" r="11" fill="#3a2f1a" />
        <rect x="150" y="136" width="20" height="25" rx="8" fill="#3a2510" />

        {/* Child 2 */}
        <circle cx="200" cy="127" r="10" fill="#3a2f1a" />
        <rect x="191" y="137" width="18" height="22" rx="7" fill="#3a2510" />

        {/* Hearts floating up */}
        <g opacity="0.3">
          <text x="160" y="90" fontSize="12" fill="#D4AF37">♥</text>
          <text x="195" y="80" fontSize="10" fill="#D4AF37">♥</text>
          <text x="175" y="70" fontSize="14" fill="#D4AF37">♥</text>
        </g>
      </svg>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   CITY GLOW MAP (mini)
   ══════════════════════════════════════════════ */

function MiniMoneyMap() {
  const cities = [
    { x: 28, y: 53, s: 8 }, { x: 52, y: 60, s: 6 }, { x: 28, y: 20, s: 5 },
    { x: 38, y: 82, s: 4 }, { x: 26, y: 40, s: 5 }, { x: 25, y: 46, s: 6 },
    { x: 30, y: 58, s: 4 }, { x: 28, y: 70, s: 3 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5 }}
      className="relative w-48 h-64 mx-auto"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
        <path
          d="M30 3 L38 2 L42 6 L44 10 L40 15 L36 18 L32 17 L28 22 L25 28 L22 35 L20 42 L21 48 L20 55 L22 60 L25 65 L28 72 L32 78 L36 85 L38 90 L40 95 L42 98 L38 97 L34 92 L30 85 L26 78 L22 70 L18 62 L16 55 L15 48 L16 42 L18 35 L20 28 L23 20 L26 14 L28 8 Z"
          fill="hsl(var(--gold))"
          opacity="0.15"
        />
      </svg>
      {cities.map((c, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
          className="absolute rounded-full"
          style={{
            left: `${c.x}%`, top: `${c.y}%`,
            width: c.s, height: c.s,
            background: "hsl(var(--gold))",
            boxShadow: `0 0 ${c.s * 2}px hsl(var(--gold) / 0.4)`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   STAGES
   ══════════════════════════════════════════════ */

type Stage = "intro" | "story1" | "story2" | "story3" | "map" | "pivot" | "family" | "final1" | "final2" | "final3" | "end";

const STAGE_ORDER: Stage[] = ["intro", "story1", "story2", "story3", "map", "pivot", "family", "final1", "final2", "final3", "end"];

function useStageSequence() {
  const [stageIdx, setStageIdx] = useState(0);
  const stage = STAGE_ORDER[stageIdx];

  const advance = () => {
    if (stageIdx < STAGE_ORDER.length - 1) setStageIdx(i => i + 1);
  };

  return { stage, advance, stageIdx };
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

const Milestone2000 = () => {
  const navigate = useNavigate();
  const { stage, advance } = useStageSequence();

  // Background color transition
  const isWarm = ["pivot", "family", "final1", "final2", "final3", "end"].includes(stage);
  const bgColor = isWarm ? "#0f0c06" : "#050505";

  // Auto-advance intro after 3s
  useEffect(() => {
    if (stage === "intro") {
      const t = setTimeout(advance, 3000);
      return () => clearTimeout(t);
    }
    if (stage === "map") {
      const t = setTimeout(advance, 4000);
      return () => clearTimeout(t);
    }
    if (stage === "pivot") {
      const t = setTimeout(advance, 2000);
      return () => clearTimeout(t);
    }
  }, [stage]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden transition-colors duration-[3000ms]"
      style={{ backgroundColor: bgColor }}
      dir="rtl"
    >
      <FilmGrain opacity={isWarm ? 0.04 : 0.06} />
      {isWarm && <WarmParticles />}

      <div className="relative z-10 max-w-xl w-full text-center space-y-8">

        <AnimatePresence mode="wait">

          {/* ── INTRO: Counter ── */}
          {stage === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="space-y-4"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold"
              >
                Milestone Achieved
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 100 }}
                className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[hsl(var(--gold))] to-[hsl(43_74%_35%)]"
                style={{ textShadow: "0 0 60px hsl(var(--gold) / 0.2)" }}
              >
                2,000
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-white/30 text-sm font-heebo"
              >
                יועצים בפלטפורמה
              </motion.p>
            </motion.div>
          )}

          {/* ── STORY 1 ── */}
          {stage === "story1" && (
            <motion.div
              key="story1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="space-y-8"
            >
              <LateNightScene />
              <div className="text-right px-2">
                <Typewriter
                  text="זוכר את הלילה הראשון? רק רעיון ושורה אחת של קוד..."
                  delay={1000}
                  speed={55}
                  className="text-white/60 text-base leading-relaxed font-heebo"
                  onDone={() => setTimeout(advance, 2000)}
                />
              </div>
            </motion.div>
          )}

          {/* ── STORY 2 ── */}
          {stage === "story2" && (
            <motion.div
              key="story2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="text-right px-2"
            >
              <Typewriter
                text="דיברנו על לשנות את השוק, על לבנות משהו גדול..."
                delay={500}
                speed={55}
                className="text-white/60 text-base leading-relaxed font-heebo"
                onDone={() => setTimeout(advance, 2000)}
              />
            </motion.div>
          )}

          {/* ── STORY 3 ── */}
          {stage === "story3" && (
            <motion.div
              key="story3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="text-right px-2"
            >
              <Typewriter
                text="והנה אנחנו כאן. 2,000 יועצים. מיליארדים בצנרת."
                delay={500}
                speed={55}
                className="text-white/70 text-lg leading-relaxed font-heebo font-bold"
                onDone={() => setTimeout(advance, 2000)}
              />
            </motion.div>
          )}

          {/* ── MAP ── */}
          {stage === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="space-y-4"
            >
              <MiniMoneyMap />
              <p className="text-[10px] text-[hsl(var(--gold))]/40 uppercase tracking-[0.2em] font-bold">
                Israel Capital Flow — Live Network
              </p>
            </motion.div>
          )}

          {/* ── PIVOT (map fades, warmth begins) ── */}
          {stage === "pivot" && (
            <motion.div
              key="pivot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Heart className="w-12 h-12 text-[hsl(var(--gold))]/40" />
              </motion.div>
            </motion.div>
          )}

          {/* ── FAMILY ── */}
          {stage === "family" && (
            <motion.div
              key="family"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="space-y-6"
            >
              <FamilyScene />
              <div className="h-4" />
              <Typewriter
                text="בנינו אימפריה, חביבי. אבל האימפריה הכי חשובה היא זו שמחכה לך בבית."
                delay={2000}
                speed={55}
                className="text-amber-200/60 text-base leading-relaxed font-heebo block"
                onDone={() => setTimeout(advance, 2500)}
              />
            </motion.div>
          )}

          {/* ── FINAL 1 ── */}
          {stage === "final1" && (
            <motion.div
              key="final1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="text-right px-4"
            >
              <Typewriter
                text="הכסף הוא רק כלי. המשפחה היא המטרה."
                delay={500}
                speed={60}
                className="text-amber-100/70 text-lg leading-relaxed font-heebo font-bold block"
                onDone={() => setTimeout(advance, 2500)}
              />
            </motion.div>
          )}

          {/* ── FINAL 2 ── */}
          {stage === "final2" && (
            <motion.div
              key="final2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="text-right px-4"
            >
              <Typewriter
                text="קח נשימה. תתקשר אליהם. תחבק אותם. עשינו את זה."
                delay={500}
                speed={60}
                className="text-amber-100/80 text-lg leading-relaxed font-heebo font-bold block"
                onDone={() => setTimeout(advance, 3000)}
              />
            </motion.div>
          )}

          {/* ── FINAL 3 ── */}
          {stage === "final3" && (
            <motion.div
              key="final3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="space-y-6"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="flex items-center justify-center"
              >
                <Heart className="w-8 h-8 text-amber-400/50 fill-amber-400/20" />
              </motion.div>
              <p className="text-amber-200/40 text-xs font-heebo">— בהצלחה, חביבי. תמיד.</p>
              <div className="h-2" />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
              >
                <Button
                  onClick={() => navigate("/dashboard")}
                  variant="outline"
                  className="border-amber-800/20 text-amber-300/50 hover:text-amber-200/70 hover:bg-amber-900/10 gap-2 text-xs font-heebo"
                >
                  חזרה לדשבורד
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ── END (same as final3 but static) ── */}
          {stage === "end" && (
            <motion.div
              key="end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="space-y-6"
            >
              <Heart className="w-8 h-8 text-amber-400/40 fill-amber-400/15 mx-auto" />
              <p className="text-amber-200/40 text-xs font-heebo">— בהצלחה, חביבי. תמיד.</p>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="border-amber-800/20 text-amber-300/50 hover:text-amber-200/70 hover:bg-amber-900/10 gap-2 text-xs font-heebo"
              >
                חזרה לדשבורד
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[55]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
};

export default Milestone2000;
