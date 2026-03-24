import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { Crown, Shield, TrendingUp, Zap, ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ── Mock VIP data (in production this would come from DB) ── */
const VIP_DATA: Record<string, { name: string; message: string; potential: number; logo?: string }> = {
  "yossi-cohen": {
    name: "יוסי כהן",
    message: "יוסי, בוא נכפיל לך את שכר הטרחה החודש.",
    potential: 2_400_000,
  },
  "michal-levi": {
    name: "מיכל לוי",
    message: "מיכל, הצטרפי לנבחרת שמרוויחה יותר.",
    potential: 1_800_000,
  },
};

const PROTOCOL_STEPS = [
  "מאתחל פרוטוקולי AI...",
  "טוען פרופיל יועץ...",
  "מכייל מנוע רווחיות...",
  "מתאים דשבורד אישי...",
];

export default function VIPEntrance() {
  const { advisorSlug } = useParams<{ advisorSlug: string }>();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"loading" | "welcome" | "entered">("loading");
  const [protocolStep, setProtocolStep] = useState(0);

  const advisor = useMemo(() => {
    if (!advisorSlug) return null;
    return VIP_DATA[advisorSlug] || {
      name: decodeURIComponent(advisorSlug).replace(/-/g, " "),
      message: "הצטרף לנבחרת היועצים המובילים בישראל.",
      potential: 2_400_000,
    };
  }, [advisorSlug]);

  // Loading phase — protocol steps
  useEffect(() => {
    if (phase !== "loading") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    PROTOCOL_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setProtocolStep(i), 700 * i));
    });
    timers.push(setTimeout(() => setPhase("welcome"), 3200));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const handleEnter = () => {
    setPhase("entered");
    setTimeout(() => navigate("/get-started"), 1200);
  };

  if (!advisor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <p className="text-muted-foreground">לינק לא תקין</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative" dir="rtl">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(43 74% 52% / 0.2) 0%, transparent 70%)" }}
        />
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: Math.random() * 100 + "%", y: "110%", opacity: 0 }}
            animate={{ y: "-10%", opacity: [0, 0.3, 0] }}
            transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
            className="absolute w-1 h-1 rounded-full bg-gold/40"
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════════ LOADING PHASE ═══════════ */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
          >
            {/* Spinning logo */}
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ perspective: 600 }}
            >
              <ChitumitLogo size={80} className="drop-shadow-[0_0_40px_hsl(43,74%,52%,0.5)]" />
            </motion.div>

            {/* Protocol steps */}
            <div className="space-y-2 text-center">
              {PROTOCOL_STEPS.map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 10 }}
                  animate={i <= protocolStep ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 justify-center"
                >
                  <motion.div
                    animate={i < protocolStep ? { scale: 1 } : i === protocolStep ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.5, repeat: i === protocolStep ? Infinity : 0 }}
                    className={`w-2 h-2 rounded-full ${
                      i < protocolStep ? "bg-emerald-400" : i === protocolStep ? "bg-gold" : "bg-muted"
                    }`}
                  />
                  <span className={`text-xs font-mono ${
                    i <= protocolStep ? "text-foreground" : "text-muted-foreground/30"
                  }`}>
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-48 h-1 rounded-full bg-secondary/30 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "easeInOut" }}
                className="h-full rounded-full bg-gradient-to-r from-gold via-amber-400 to-gold"
              />
            </div>
          </motion.div>
        )}

        {/* ═══════════ WELCOME PHASE ═══════════ */}
        {phase === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 relative z-10"
          >
            {/* Crown icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center border border-gold/20 shadow-[0_0_60px_-15px_hsl(var(--gold)/0.4)]">
                <Crown className="w-10 h-10 text-gold" />
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-8 text-3xl md:text-4xl font-black text-foreground text-center font-heebo leading-tight"
            >
              ברוך הבא לנבחרת,{" "}
              <span className="text-gold">{advisor.name}</span>.
            </motion.h1>

            {/* Sub headline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-4 text-base text-muted-foreground text-center max-w-md leading-relaxed"
            >
              המערכת הותאמה אישית למשרד שלך.
              <br />
              מוכן להיות מאושר?
            </motion.p>

            {/* Personal message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="mt-8 max-w-sm w-full"
            >
              <div className="p-4 rounded-xl border border-gold/15 bg-gold/5 backdrop-blur-sm">
                <p className="text-sm text-foreground text-center italic leading-relaxed">
                  "{advisor.message}"
                </p>
              </div>
            </motion.div>

            {/* Stats preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="mt-8 flex items-center gap-6"
            >
              {[
                { icon: TrendingUp, label: "פוטנציאל שנתי", value: `₪${(advisor.potential / 1_000_000).toFixed(1)}M` },
                { icon: Shield, label: "ציון ודאות AI", value: "95%" },
                { icon: Star, label: "דירוג VIP", value: "Elite" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 + i * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-4 h-4 text-gold mx-auto mb-1" />
                  <p className="text-lg font-black text-foreground">{stat.value}</p>
                  <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              className="mt-10"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px hsl(43 74% 52% / 0.2)",
                    "0 0 50px hsl(43 74% 52% / 0.4)",
                    "0 0 20px hsl(43 74% 52% / 0.2)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded-xl"
              >
                <Button
                  onClick={handleEnter}
                  className="bg-gradient-to-r from-gold via-amber-500 to-gold text-black font-black text-base px-10 py-6 gap-2 rounded-xl"
                >
                  <Zap className="w-5 h-5" />
                  אני רוצה להוביל את השוק — הפעל חיתומית עכשיו
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
              className="mt-8 flex items-center gap-4"
            >
              {["256-bit הצפנה", "תאימות רגולטורית", "גיבוי ענן"].map(badge => (
                <Badge key={badge} variant="outline" className="text-[9px] border-border/20 text-muted-foreground">
                  {badge}
                </Badge>
              ))}
            </motion.div>

            {/* Powered by */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              className="mt-6 flex items-center gap-2"
            >
              <ChitumitLogo size={16} />
              <span className="text-[10px] text-muted-foreground">Powered by חיתומית AI</span>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════ ENTERED — transition out ═══════════ */}
        {phase === "entered" && (
          <motion.div
            key="entered"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 50] }}
              transition={{ duration: 1, ease: "easeIn" }}
              className="w-4 h-4 rounded-full bg-gold"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
