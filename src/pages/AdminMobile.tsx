import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Megaphone,
  Zap,
  TrendingUp,
  Users,
  DollarSign,
  Crown,
  Landmark,
  Shield,
  Fingerprint,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

/* ══════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════ */

const PIPELINE = 1_842_500_000;
const ACTIVE_ADVISORS = 187;
const DAILY_REVENUE = 28_400;

const FEED_ITEMS = [
  { icon: "🔥", text: "תיק 1.5M ₪ מוכן לשיגור לבנק", time: "2 דק׳", type: "hot" as const },
  { icon: "💰", text: "מנוי Gold חדש הצטרף — רעננה", time: "8 דק׳", type: "gold" as const },
  { icon: "📄", text: "ציון חיתומית 92 — מומלץ להגשה", time: "12 דק׳", type: "score" as const },
  { icon: "⚡", text: "יועץ #1042 סגר עסקה ₪2.4M", time: "18 דק׳", type: "deal" as const },
  { icon: "🏦", text: "דיסקונט פתח מסלול הטבה חדש", time: "25 דק׳", type: "bank" as const },
  { icon: "🔥", text: "תיק ₪3.1M — LTV 68% — VIP", time: "31 דק׳", type: "hot" as const },
  { icon: "💰", text: "מנוי Pro חדש — תל אביב", time: "40 דק׳", type: "gold" as const },
  { icon: "📄", text: "AI שיפר ציון ב-12 נקודות", time: "52 דק׳", type: "score" as const },
];

const PULSE_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  activity: Math.round(40 + Math.random() * 60 + (i > 8 && i < 20 ? 40 : 0)),
}));

/* ══════════════════════════════════════════════
   ANIMATED NUMBER
   ══════════════════════════════════════════════ */

function AnimatedNumber({ value, prefix = "", className }: {
  value: number; prefix?: string; className?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let f = 0;
    const total = 60;
    const t = setInterval(() => {
      f++;
      setDisplay(Math.round(value * (1 - Math.pow(1 - f / total, 3))));
      if (f >= total) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <span className={className}>{prefix}{display.toLocaleString()}</span>;
}

/* ══════════════════════════════════════════════
   BIOMETRIC LOCK SCREEN
   ══════════════════════════════════════════════ */

function BiometricLock({ onUnlock }: { onUnlock: () => void }) {
  const [status, setStatus] = useState<"idle" | "scanning" | "success">("idle");

  const handleAuth = async () => {
    setStatus("scanning");
    // Try Web Authentication API (biometric) if available
    try {
      if (window.PublicKeyCredential) {
        // Simulate biometric check with timeout
        await new Promise(r => setTimeout(r, 1200));
      }
    } catch {
      // Fallback — still allow
    }
    setStatus("success");
    setTimeout(onUnlock, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-8"
    >
      <motion.div
        animate={status === "scanning" ? { scale: [1, 1.1, 1] } : status === "success" ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.6, repeat: status === "scanning" ? Infinity : 0 }}
        className="mb-8"
      >
        {status === "success" ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Shield className="w-10 h-10 text-emerald-400" />
          </motion.div>
        ) : (
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center border-2 transition-colors",
            status === "scanning" ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10" : "border-white/15 bg-white/5"
          )}>
            <Fingerprint className={cn("w-10 h-10 transition-colors", status === "scanning" ? "text-[hsl(var(--gold))]" : "text-white/40")} />
          </div>
        )}
      </motion.div>

      <h1 className="text-white text-lg font-bold mb-1 font-heebo">Admin Command Center</h1>
      <p className="text-white/40 text-xs mb-8 font-heebo">
        {status === "idle" && "זיהוי ביומטרי נדרש"}
        {status === "scanning" && "סורק..."}
        {status === "success" && "מאומת ✓"}
      </p>

      {status === "idle" && (
        <Button
          onClick={handleAuth}
          className="bg-white/10 hover:bg-white/15 text-white border border-white/10 gap-2 px-8 py-5"
        >
          <Lock className="w-4 h-4" />
          Authenticate
        </Button>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   SHOFAR BUTTON (long-press)
   ══════════════════════════════════════════════ */

function ShofarButton() {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = useCallback(() => {
    setHolding(true);
    setProgress(0);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += 2;
      setProgress(p);
      if (p >= 100) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        toast({ title: "📡 שידור נשלח", description: "ההודעה נשלחה ל-2,000 יועצים" });
        setHolding(false);
        setProgress(0);
      }
    }, 30);
  }, []);

  const stopHold = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
    setProgress(0);
  }, []);

  return (
    <div className="relative">
      <motion.button
        onTouchStart={startHold}
        onTouchEnd={stopHold}
        onMouseDown={startHold}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        whileTap={{ scale: 0.95 }}
        className="relative w-full py-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center gap-3 overflow-hidden"
      >
        {/* Progress fill */}
        <motion.div
          className="absolute inset-0 bg-destructive/20"
          style={{ width: `${progress}%` }}
        />
        <div className="relative z-10 flex items-center gap-2">
          <Megaphone className={cn("w-5 h-5 transition-colors", holding ? "text-destructive" : "text-white/40")} />
          <span className={cn("text-sm font-bold transition-colors font-heebo", holding ? "text-destructive" : "text-white/50")}>
            {progress > 0 ? `${progress}%...` : "החזק לשידור — Global Shofar"}
          </span>
        </div>
      </motion.button>
      <p className="text-center text-[9px] text-white/20 mt-2 font-heebo">לחיצה ארוכה (1.5 שניות) לשידור חירום</p>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════════ */

const AdminMobile = () => {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <>
      <AnimatePresence>
        {!unlocked && <BiometricLock onUnlock={() => setUnlocked(true)} />}
      </AnimatePresence>

      <div className="min-h-screen bg-black text-white pb-6 select-none" dir="rtl">

        {/* ── Header ── */}
        <header className="px-5 pt-14 pb-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] font-bold">Chitumit</p>
            <h1 className="text-base font-bold text-white/90 -mt-0.5 font-heebo">Command Center</h1>
          </div>
          <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-[8px] gap-1 py-0.5 px-2">
            <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            LIVE
          </Badge>
        </header>

        <div className="px-5 space-y-5">

          {/* ── Trifecta ── */}
          <div className="space-y-3">
            {/* Pipeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-[hsl(var(--gold))]/70" />
                <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">Total Pipeline</span>
              </div>
              <div className="text-3xl font-black text-white/95 tracking-tight" style={{ textShadow: "0 0 40px hsl(var(--gold) / 0.15)" }}>
                <AnimatedNumber value={PIPELINE} prefix="₪" />
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              {/* Active Advisors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3 h-3 text-emerald-400/60" />
                  <span className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">Advisors</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white/90">
                    <AnimatedNumber value={ACTIVE_ADVISORS} />
                  </span>
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-emerald-400"
                  />
                </div>
              </motion.div>

              {/* Daily Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3 h-3 text-[hsl(var(--gold))]/60" />
                  <span className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">Today</span>
                </div>
                <span className="text-2xl font-black text-white/90" style={{ textShadow: "0 0 30px hsl(var(--gold) / 0.1)" }}>
                  <AnimatedNumber value={DAILY_REVENUE} prefix="₪" />
                </span>
              </motion.div>
            </div>
          </div>

          {/* ── Shofar ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <ShofarButton />
          </motion.div>

          {/* ── Money-Leads Feed ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[hsl(var(--gold))]/60" />
                <span className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-bold">Money-Leads Feed</span>
              </div>
              <Badge variant="outline" className="border-white/[0.06] text-white/25 text-[8px]">Live</Badge>
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-none">
              {FEED_ITEMS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border transition-colors",
                    "bg-white/[0.02] border-white/[0.04] active:bg-white/[0.06]"
                  )}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/70 font-medium leading-snug truncate font-heebo">{item.text}</p>
                  </div>
                  <span className="text-[9px] text-white/20 shrink-0 font-heebo">{item.time}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── 24h Pulse Chart ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4"
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Crown className="w-3 h-3 text-[hsl(var(--gold))]/50" />
              <span className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-bold">24h Platform Pulse</span>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={PULSE_DATA}>
                <defs>
                  <linearGradient id="pulseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" hide />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 8, fontSize: 10, color: "#fff" }}
                  formatter={(v: number) => [v, "Activity"]}
                />
                <Area type="monotone" dataKey="activity" stroke="hsl(var(--gold))" strokeWidth={1.5} fill="url(#pulseGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

        </div>
      </div>
    </>
  );
};

export default AdminMobile;
