import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Radar,
  Zap,
  Landmark,
  Users,
  TrendingUp,
  Crown,
  Globe,
  DollarSign,
  Heart,
  Shield,
  Megaphone,
  Target,
  Play,
  Pause,
  Smartphone,
  Sparkles,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";
import { useNavigate } from "react-router-dom";

/* ══════════════════════════════════════════════
   TYPES & CONSTANTS
   ══════════════════════════════════════════════ */

interface SimEvent {
  id: number;
  city: string;
  cityX: number;
  cityY: number;
  score: number;
  amount: number;
  type: "high" | "recovery" | "vip" | "standard";
  advisorId: number;
  ticker: string;
  ts: number;
}

const CITIES = [
  { name: "תל אביב", x: 28, y: 53 },
  { name: "ירושלים", x: 52, y: 60 },
  { name: "חיפה", x: 28, y: 20 },
  { name: "באר שבע", x: 38, y: 82 },
  { name: "רעננה", x: 26, y: 40 },
  { name: "הרצליה", x: 25, y: 46 },
  { name: "נתניה", x: 24, y: 34 },
  { name: 'ראשל"צ', x: 30, y: 58 },
  { name: 'פ"ת', x: 34, y: 52 },
  { name: "אשדוד", x: 28, y: 70 },
  { name: "עכו", x: 30, y: 14 },
  { name: "אילת", x: 42, y: 97 },
];

const BANKS = ["הפועלים", "לאומי", "דיסקונט", "מזרחי", "בינלאומי"];
const ADVISOR_NAMES = ["כהן", "לוי", "גולד", "שרון", "פרץ", "אביב", "דוד", "מור", "ברק", "רז"];

let eventCounter = 0;

function generateEvent(): SimEvent {
  eventCounter++;
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const score = Math.floor(50 + Math.random() * 50);
  const amount = Math.round((500_000 + Math.random() * 4_500_000) / 100_000) * 100_000;
  const advisorId = Math.floor(100 + Math.random() * 900);
  const bank = BANKS[Math.floor(Math.random() * BANKS.length)];

  const isVip = amount >= 3_000_000;
  const isHigh = score >= 85;
  const isRecovery = score < 70;
  const type: SimEvent["type"] = isVip ? "vip" : isHigh ? "high" : isRecovery ? "recovery" : "standard";

  const tickers = [
    `Advisor #${advisorId}: New ${(amount / 1_000_000).toFixed(1)}M File — ${city.name}`,
    `AI Insight: Narrative generated for Client #${eventCounter}`,
    `Approval Alert: ${bank} ${city.name}`,
    `Score Boost: Client #${eventCounter} +${Math.floor(3 + Math.random() * 12)}pts`,
    `${isVip ? "🔥 VIP DEAL" : "NEW LOAN"}: ₪${(amount / 1_000_000).toFixed(1)}M (${city.name})`,
  ];

  return {
    id: eventCounter,
    city: city.name,
    cityX: city.x + (Math.random() - 0.5) * 6,
    cityY: city.y + (Math.random() - 0.5) * 6,
    score,
    amount,
    type,
    advisorId,
    ticker: tickers[Math.floor(Math.random() * tickers.length)],
    ts: Date.now(),
  };
}

/* ══════════════════════════════════════════════
   ANIMATED NUMBER (smooth counting)
   ══════════════════════════════════════════════ */

function SmoothCounter({ value, prefix = "", className }: { value: number; prefix?: string; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    if (from === to) return;
    let frame = 0;
    const total = 40;
    const timer = setInterval(() => {
      frame++;
      const p = 1 - Math.pow(1 - frame / total, 3);
      setDisplay(Math.round(from + (to - from) * p));
      if (frame >= total) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return <span className={className}>{prefix}{display.toLocaleString()}</span>;
}

/* ══════════════════════════════════════════════
   MATRIX GRID BACKGROUND
   ══════════════════════════════════════════════ */

function MatrixGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <motion.div
        animate={{ backgroundPosition: ["0px 0px", "0px 80px"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--cyan-glow) / 0.6) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--cyan-glow) / 0.6) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      <motion.div
        animate={{ top: ["-5%", "105%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px opacity-10"
        style={{ background: "linear-gradient(90deg, transparent, hsl(var(--cyan-glow)), transparent)" }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════
   EVENT PILLAR (drops on map)
   ══════════════════════════════════════════════ */

function EventPillar({ event }: { event: SimEvent }) {
  const colors = {
    high: "hsl(160 84% 39%)",
    recovery: "hsl(38 92% 50%)",
    vip: "hsl(var(--gold))",
    standard: "hsl(var(--cyan-glow))",
  };
  const c = colors[event.type];
  const h = event.type === "vip" ? 55 : event.type === "high" ? 40 : 25;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="absolute"
      style={{ left: `${event.cityX}%`, top: `${event.cityY}%`, transform: "translate(-50%, -100%)" }}
    >
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: h }}
        exit={{ height: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto rounded-t-sm relative overflow-hidden"
        style={{
          width: event.type === "vip" ? 10 : 6,
          background: `linear-gradient(to top, ${c}, transparent)`,
          boxShadow: `0 0 ${event.type === "vip" ? 30 : 15}px ${c}`,
        }}
      >
        <motion.div
          animate={{ y: [h, -10] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-x-0 h-3 opacity-50"
          style={{ background: "linear-gradient(to top, transparent, white, transparent)" }}
        />
      </motion.div>

      {/* Base pulse */}
      <motion.div
        animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-3 h-3 rounded-full mx-auto -mt-0.5"
        style={{ backgroundColor: c, filter: "blur(3px)" }}
      />

      {/* VIP ring */}
      {event.type === "vip" && (
        <motion.div
          animate={{ scale: [1, 4], opacity: [0.4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2"
          style={{ borderColor: c }}
        />
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   LIVE TICKER
   ══════════════════════════════════════════════ */

function SimTicker({ events }: { events: SimEvent[] }) {
  const latest = events.slice(-8).reverse();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % Math.max(1, latest.length)), 2500);
    return () => clearInterval(t);
  }, [latest.length]);

  const current = latest[idx % latest.length];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[hsl(var(--cyan-glow))]/15 bg-[hsl(var(--navy))]/90 backdrop-blur-xl">
      <div className="flex items-center h-10 px-6 gap-4">
        <motion.div
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
        />
        <span className="text-[9px] font-black tracking-[0.3em] text-[hsl(var(--cyan-glow))] shrink-0">SIM LIVE</span>
        <div className="h-4 w-px bg-border/20 shrink-0" />
        <div className="flex-1 overflow-hidden relative h-5">
          <AnimatePresence mode="wait">
            {current && (
              <motion.p
                key={current.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-[11px] text-muted-foreground font-mono absolute inset-0 leading-5 whitespace-nowrap tracking-wide"
              >
                {current.ticker}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400 shrink-0">
          {events.length} events
        </Badge>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PHONE NOTIFICATION WIDGET (Shofar feedback)
   ══════════════════════════════════════════════ */

function PhoneWidget({ events }: { events: SimEvent[] }) {
  const [notification, setNotification] = useState<SimEvent | null>(null);

  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[events.length - 1];
    if (latest.type === "vip" || Math.random() > 0.7) {
      setNotification(latest);
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [events.length]);

  const tips = [
    "🔥 Insider Tip: Branch X is hungry for deals!",
    "💡 סניף הפועלים ת\"א פתוח לתיקים מורכבים",
    "📊 שיא אישורים בדיסקונט הרצליה — הגש עכשיו",
    "🎯 ציון 85+ מקבל ירוק מיידי בלאומי",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card p-4 w-56"
    >
      <div className="flex items-center gap-2 mb-3">
        <Smartphone className="w-4 h-4 text-[hsl(var(--cyan-glow))]" />
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Advisor Phone</span>
      </div>

      {/* Mock phone frame */}
      <div className="bg-black rounded-2xl p-2 border border-border/20 relative overflow-hidden">
        <div className="bg-neutral-900 rounded-xl p-3 space-y-2 min-h-[180px]">
          {/* Status bar */}
          <div className="flex items-center justify-between text-[8px] text-neutral-500 mb-2">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1.5 border border-neutral-500 rounded-sm">
                <div className="w-2 h-full bg-emerald-400 rounded-sm" />
              </div>
            </div>
          </div>

          {/* Push notification */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ y: -60, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -30, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="bg-neutral-800/90 backdrop-blur-lg rounded-xl p-2.5 border border-neutral-700/50"
              >
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[7px] font-black text-white">C</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] text-neutral-400 mb-0.5">חיתומית</p>
                    <p className="text-[9px] text-white font-medium leading-tight">
                      {tips[Math.floor(Math.random() * tips.length)]}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Idle state */}
          {!notification && (
            <div className="flex flex-col items-center justify-center h-24 text-neutral-600">
              <Bell className="w-5 h-5 mb-1" />
              <span className="text-[8px]">ממתין להתראות...</span>
            </div>
          )}
        </div>

        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black rounded-full" />
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   HUD STAT
   ══════════════════════════════════════════════ */

function HUDStat({ icon: Icon, label, children, color, delay = 0 }: {
  icon: typeof DollarSign; label: string; children: React.ReactNode; color: "cyan" | "gold" | "emerald"; delay?: number;
}) {
  const colorMap = {
    cyan: { text: "text-[hsl(var(--cyan-glow))]", bg: "bg-[hsl(var(--cyan-glow))]/10", glow: "shadow-[0_0_40px_-10px_hsl(var(--cyan-glow)/0.35)]" },
    gold: { text: "text-gold", bg: "bg-gold/10", glow: "shadow-[0_0_40px_-10px_hsl(var(--gold)/0.35)]" },
    emerald: { text: "text-success", bg: "bg-success/10", glow: "shadow-[0_0_40px_-10px_hsl(var(--success)/0.35)]" },
  };
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 150 }}
      className={cn("glass-card p-5 relative overflow-hidden", c.glow)}
    >
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-bold">{label}</p>
          <div className="text-2xl lg:text-3xl font-black text-foreground">{children}</div>
        </div>
        <div className={cn("p-2.5 rounded-xl", c.bg)}>
          <Icon className={cn("w-5 h-5", c.text)} />
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   MAIN SIMULATION PAGE
   ══════════════════════════════════════════════ */

const MasterAdminDemo = () => {
  const navigate = useNavigate();
  const [simActive, setSimActive] = useState(false);
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [pipeline, setPipeline] = useState(1_842_500_000);
  const [mrr, setMrr] = useState(740_000);
  const [advisors, setAdvisors] = useState(187);
  const [avgScore, setAvgScore] = useState(76.4);
  const [mapEvents, setMapEvents] = useState<SimEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulation engine: 50 events/minute = ~1 every 1.2s
  useEffect(() => {
    if (!simActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const ev = generateEvent();
      setEvents(prev => [...prev.slice(-200), ev]);
      setPipeline(p => p + ev.amount);
      setMrr(m => m + Math.round(ev.amount * 0.001));
      setAdvisors(a => a + (Math.random() > 0.85 ? 1 : 0));
      setAvgScore(s => +(s + (Math.random() - 0.45) * 0.3).toFixed(1));

      // Add to map, auto-remove after 8s
      setMapEvents(prev => [...prev.slice(-30), ev]);
      setTimeout(() => {
        setMapEvents(prev => prev.filter(e => e.id !== ev.id));
      }, 8000);
    }, 1200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simActive]);

  // Revenue chart data (grows with simulation)
  const revenueData = Array.from({ length: 12 }, (_, i) => ({
    month: ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"][i],
    volume: Math.round((800 + Math.random() * 650 + (simActive ? events.length * 2 : 0)) * 1_000_000),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground pb-14" dir="rtl">
      <MatrixGrid />

      {/* ── Header ── */}
      <header className="relative z-10 border-b border-border/15 bg-card/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={simActive ? { rotate: [0, 360] } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Radar className="w-8 h-8 text-[hsl(var(--cyan-glow))]" style={{ filter: "drop-shadow(0 0 8px hsl(var(--cyan-glow)))" }} />
            </motion.div>
            <div>
              <h1 className="text-lg font-black text-foreground tracking-tight font-heebo">SIMULATION MODE</h1>
              <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-heebo">Ghost Client Generator • 50 Events/Min</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Simulation Toggle */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-xl border transition-all",
                simActive
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-secondary/20 border-border/20"
              )}
            >
              <Switch
                checked={simActive}
                onCheckedChange={setSimActive}
                className="data-[state=checked]:bg-emerald-500"
              />
              <span className={cn(
                "text-xs font-bold",
                simActive ? "text-emerald-400" : "text-muted-foreground"
              )}>
                {simActive ? "SIMULATION ACTIVE" : "START SIMULATION"}
              </span>
              {simActive ? (
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                  <Zap className="w-4 h-4 text-emerald-400" />
                </motion.div>
              ) : (
                <Play className="w-4 h-4 text-muted-foreground" />
              )}
            </motion.div>

            {/* Legacy Trigger */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                className="border-gold/30 text-gold hover:bg-gold/10 gap-2 font-bold text-xs"
                onClick={() => navigate("/milestone-2000")}
              >
                <Crown className="w-4 h-4" />
                2000th Advisor — Legacy
              </Button>
            </motion.div>

            <Badge variant="outline" className={cn(
              "text-[9px] gap-1.5 py-1",
              simActive ? "border-emerald-500/20 text-emerald-400" : "border-border/20 text-muted-foreground"
            )}>
              <motion.div
                animate={simActive ? { opacity: [1, 0.2, 1] } : { opacity: 0.3 }}
                transition={{ duration: 1, repeat: Infinity }}
                className={cn("w-1.5 h-1.5 rounded-full", simActive ? "bg-emerald-400" : "bg-muted-foreground")}
              />
              {simActive ? "LIVE" : "STANDBY"}
            </Badge>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-6 py-6 space-y-6">

        {/* ── HUD Stats (animated counters) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HUDStat icon={DollarSign} label="Total Pipeline Volume" color="cyan" delay={0.1}>
            <SmoothCounter value={pipeline} prefix="₪" />
          </HUDStat>
          <HUDStat icon={Heart} label="Avg Chitumit Score" color="gold" delay={0.15}>
            <>{avgScore.toFixed(1)}<span className="text-sm text-emerald-400 mr-1">▲</span></>
          </HUDStat>
          <HUDStat icon={Users} label="Active Advisors Now" color="emerald" delay={0.2}>
            <SmoothCounter value={advisors} />
          </HUDStat>
          <HUDStat icon={Zap} label="Sim Events Generated" color="gold" delay={0.25}>
            <SmoothCounter value={events.length} />
          </HUDStat>
        </div>

        {/* ── Map + Phone Widget ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Israel Map with live event drops */}
          <div className="lg:col-span-3 glass-card p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[hsl(var(--cyan-glow))]" />
                <h2 className="font-bold text-sm text-foreground">Israel Capital Flow — Live Simulation</h2>
              </div>
              <Badge variant="outline" className="text-[9px] border-[hsl(var(--cyan-glow))]/20 text-[hsl(var(--cyan-glow))]">
                {mapEvents.length} active pillars
              </Badge>
            </div>

            <div className="relative w-full" style={{ paddingBottom: "90%" }}>
              <div className="absolute inset-0">
                {/* Map outline */}
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-[0.06]" preserveAspectRatio="xMidYMid meet">
                  <path
                    d="M30 3 L38 2 L42 6 L44 10 L40 15 L36 18 L32 17 L28 22 L25 28 L22 35 L20 42 L21 48 L20 55 L22 60 L25 65 L28 72 L32 78 L36 85 L38 90 L40 95 L42 98 L38 97 L34 92 L30 85 L26 78 L22 70 L18 62 L16 55 L15 48 L16 42 L18 35 L20 28 L23 20 L26 14 L28 8 Z"
                    fill="hsl(var(--cyan-glow))"
                    stroke="hsl(var(--cyan-glow))"
                    strokeWidth="0.3"
                  />
                </svg>

                {/* Static city labels */}
                {CITIES.map(c => (
                  <div
                    key={c.name}
                    className="absolute text-[7px] text-muted-foreground/40 font-medium pointer-events-none"
                    style={{ left: `${c.x}%`, top: `${c.y + 3}%`, transform: "translateX(-50%)" }}
                  >
                    {c.name}
                  </div>
                ))}

                {/* Live event pillars */}
                <AnimatePresence>
                  {mapEvents.map(ev => (
                    <EventPillar key={ev.id} event={ev} />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-3 justify-center">
              {[
                { color: "bg-emerald-500", shadow: "shadow-[0_0_6px_hsl(160_84%_39%)]", label: "High Score (85+)" },
                { color: "bg-amber-500", shadow: "shadow-[0_0_6px_hsl(38_92%_50%)]", label: "Recovery Required" },
                { color: "bg-gold", shadow: "shadow-[0_0_6px_hsl(var(--gold))]", label: "VIP (>₪3M)" },
                { color: "bg-[hsl(var(--cyan-glow))]", shadow: "shadow-[0_0_6px_hsl(var(--cyan-glow))]", label: "Standard" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={cn("w-2.5 h-2.5 rounded-full", l.color, l.shadow)} />
                  <span className="text-[9px] text-muted-foreground tracking-wide">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phone Widget */}
          <PhoneWidget events={events} />
        </div>

        {/* ── Revenue Chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-sm text-foreground">Revenue Velocity</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">MRR:</span>
              <span className="text-sm font-black text-gold">
                <SmoothCounter value={mrr} prefix="₪" />
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--cyan-glow))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--cyan-glow))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(v: number) => [`₪${(v / 1_000_000).toFixed(1)}M`, "Volume"]}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="hsl(var(--cyan-glow))"
                strokeWidth={2}
                fill="url(#simGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ── Recent Events Log ── */}
        {events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm text-foreground">Event Stream</h2>
              <Badge variant="outline" className="text-[9px] mr-auto">{events.length} total</Badge>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
              {events.slice(-15).reverse().map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-secondary/10 text-[11px]"
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    ev.type === "vip" ? "bg-gold shadow-[0_0_6px_hsl(var(--gold))]" :
                    ev.type === "high" ? "bg-emerald-500 shadow-[0_0_6px_hsl(160_84%_39%)]" :
                    ev.type === "recovery" ? "bg-amber-500 shadow-[0_0_6px_hsl(38_92%_50%)]" :
                    "bg-[hsl(var(--cyan-glow))] shadow-[0_0_6px_hsl(var(--cyan-glow))]"
                  )} />
                  <span className="text-muted-foreground flex-1 truncate font-mono">{ev.ticker}</span>
                  <span className="text-muted-foreground/50 shrink-0">
                    ₪{(ev.amount / 1_000_000).toFixed(1)}M
                  </span>
                  <Badge variant="outline" className={cn(
                    "text-[8px] shrink-0",
                    ev.type === "vip" ? "border-gold/30 text-gold" :
                    ev.type === "high" ? "border-emerald-500/30 text-emerald-400" :
                    ev.type === "recovery" ? "border-amber-500/30 text-amber-400" :
                    "border-border/30 text-muted-foreground"
                  )}>
                    {ev.type === "vip" ? "VIP" : ev.type === "high" ? "HIGH" : ev.type === "recovery" ? "RECOVERY" : "STD"}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Live Ticker */}
      {simActive && <SimTicker events={events} />}
    </div>
  );
};

export default MasterAdminDemo;
