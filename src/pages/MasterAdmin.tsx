import { useState, useEffect, useMemo, useCallback } from "react";
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
  AlertTriangle,
} from "lucide-react";
import { VIPLeadGenerator } from "@/components/VIPLeadGenerator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

/* ══════════════════════════════════════════════
   CONSTANTS & MOCK DATA
   ══════════════════════════════════════════════ */

const PIPELINE_TOTAL = 1_842_500_000;
const MRR = 740_000;
const MRR_GOAL = 1_000_000;
const AVG_SCORE = 76.4;
const ACTIVE_ADVISORS = 187;
const DEALS_TODAY = 34;

const CITIES = [
  { name: "תל אביב", x: 28, y: 53, volume: 98, trend: 4.2 },
  { name: "ירושלים", x: 52, y: 60, volume: 82, trend: 2.1 },
  { name: "חיפה", x: 28, y: 20, volume: 65, trend: 3.5 },
  { name: "באר שבע", x: 38, y: 82, volume: 42, trend: 6.8 },
  { name: "רעננה", x: 26, y: 40, volume: 58, trend: 1.9 },
  { name: "הרצליה", x: 25, y: 46, volume: 71, trend: 3.1 },
  { name: "נתניה", x: 24, y: 34, volume: 45, trend: 5.2 },
  { name: 'ראשל"צ', x: 30, y: 58, volume: 55, trend: 2.4 },
  { name: 'פ"ת', x: 34, y: 52, volume: 48, trend: 1.7 },
  { name: "אשדוד", x: 28, y: 70, volume: 38, trend: 7.1 },
  { name: "עכו", x: 30, y: 14, volume: 22, trend: 4.5 },
  { name: "אילת", x: 42, y: 97, volume: 12, trend: 8.3 },
];

const LEADERBOARD = [
  { rank: 1, name: "יוסי כהן", volume: "₪48.2M", deals: 23, avatar: "YK", plan: "Gold" },
  { rank: 2, name: "מיכל לוי", volume: "₪42.1M", deals: 19, avatar: "ML", plan: "Pro" },
  { rank: 3, name: "אבי גולד", volume: "₪38.7M", deals: 17, avatar: "AG", plan: "Gold" },
  { rank: 4, name: "רונית שרון", volume: "₪31.5M", deals: 14, avatar: "RS", plan: "Pro" },
  { rank: 5, name: "דני פרץ", volume: "₪28.9M", deals: 12, avatar: "DP", plan: "Pro" },
];

const BANK_SENTIMENT = [
  { bank: "הפועלים", score: 82, label: "Hot" },
  { bank: "לאומי", score: 65, label: "Warm" },
  { bank: "דיסקונט", score: 88, label: "Hot" },
  { bank: "מזרחי", score: 72, label: "Warm" },
  { bank: "בינלאומי", score: 90, label: "Hot" },
];

const REVENUE_DATA = Array.from({ length: 12 }, (_, i) => ({
  month: ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"][i],
  volume: Math.round((800 + Math.random() * 650) * 1_000_000),
}));

const TICKER_ITEMS = [
  "NEW LOAN: ₪3.2M (תל אביב) | SCORE BOOST: User #8293 +15pts",
  "ADVISOR CONNECT: 124 פעילים עכשיו | בנק דיסקונט: מסלול הטבה חדש",
  "TOP DEAL: יועץ #1042 סגר ₪2.4M בחיפה | לאומי: אישורים +2%",
  "MILESTONE: ציון ממוצע 76.4 — שיא חודשי | 34 עסקאות היום",
];

/* ══════════════════════════════════════════════
   SUB COMPONENTS
   ══════════════════════════════════════════════ */

function AnimatedNumber({ value, prefix = "", suffix = "", className }: {
  value: number; prefix?: string; suffix?: string; className?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = 0;
    const total = 80;
    const timer = setInterval(() => {
      frame++;
      const progress = 1 - Math.pow(1 - frame / total, 3); // ease-out cubic
      setDisplay(Math.round(value * progress));
      if (frame >= total) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span className={className}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* Digital Matrix Grid */
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
      {/* Scanline */}
      <motion.div
        animate={{ top: ["-5%", "105%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px opacity-10"
        style={{ background: "linear-gradient(90deg, transparent, hsl(var(--cyan-glow)), transparent)" }}
      />
    </div>
  );
}

/* City pillar on map */
function CityPillar({ city, delay }: { city: typeof CITIES[0]; delay: number }) {
  const intensity = city.volume / 100;
  const pillarH = 10 + intensity * 50;
  const isHot = intensity > 0.7;
  const isWarm = intensity > 0.4;
  const baseColor = isHot ? "hsl(0 80% 55%)" : isWarm ? "hsl(var(--gold))" : "hsl(var(--cyan-glow))";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 15 }}
      className="absolute group cursor-pointer"
      style={{ left: `${city.x}%`, top: `${city.y}%`, transform: "translate(-50%, -100%)" }}
    >
      {/* Pillar of light */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: pillarH }}
        transition={{ delay: delay + 0.3, duration: 0.8, ease: "easeOut" }}
        className="mx-auto rounded-t-sm relative overflow-hidden"
        style={{
          width: 6 + intensity * 6,
          background: `linear-gradient(to top, ${baseColor}, transparent)`,
          boxShadow: `0 0 ${12 + intensity * 20}px ${baseColor}`,
        }}
      >
        {/* Shimmer */}
        <motion.div
          animate={{ y: [pillarH, -10] }}
          transition={{ duration: 1.5 + Math.random(), repeat: Infinity, delay: delay }}
          className="absolute inset-x-0 h-3 opacity-50"
          style={{ background: `linear-gradient(to top, transparent, white, transparent)` }}
        />
      </motion.div>

      {/* Base glow */}
      <motion.div
        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="w-4 h-4 rounded-full mx-auto -mt-1"
        style={{ backgroundColor: baseColor, filter: `blur(4px)` }}
      />

      {/* Active advisor pulse ring */}
      {isHot && (
        <motion.div
          animate={{ scale: [1, 3], opacity: [0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border"
          style={{ borderColor: "hsl(0 80% 55% / 0.4)" }}
        />
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
        <div className="bg-card/95 backdrop-blur-xl border border-border/30 rounded-lg px-3 py-2 whitespace-nowrap shadow-2xl">
          <p className="text-xs font-bold text-foreground">{city.name}</p>
          <p className="text-[10px] text-muted-foreground">נפח: {city.volume}% | +{city.trend}%</p>
        </div>
      </div>
    </motion.div>
  );
}

/* Live Tape */
function LiveTape() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % TICKER_ITEMS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[hsl(var(--cyan-glow))]/15 bg-[hsl(var(--navy))]/90 backdrop-blur-xl">
      <div className="flex items-center h-10 px-6 gap-4">
        <motion.div
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
        />
        <span className="text-[9px] font-black tracking-[0.3em] text-[hsl(var(--cyan-glow))] shrink-0">LIVE FEED</span>
        <div className="h-4 w-px bg-border/20 shrink-0" />
        <div className="flex-1 overflow-hidden relative h-5">
          <AnimatePresence mode="wait">
            <motion.p
              key={idx}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[11px] text-muted-foreground font-mono absolute inset-0 leading-5 whitespace-nowrap tracking-wide"
            >
              {TICKER_ITEMS[idx]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* MRR Progress */
function MRRGoal() {
  const pct = Math.round((MRR / MRR_GOAL) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gold" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">MRR — יעד מיליון ₪</span>
        </div>
        <Badge variant="outline" className="border-gold/30 text-gold text-[10px]">{pct}%</Badge>
      </div>
      <div className="text-2xl font-black text-foreground">
        <AnimatedNumber value={MRR} prefix="₪" />
        <span className="text-sm text-muted-foreground mr-1"> / ₪1,000,000</span>
      </div>
      <div className="h-3 rounded-full bg-secondary/40 overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
          className="h-full rounded-full relative overflow-hidden"
          style={{
            background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--cyan-glow)))",
            boxShadow: "0 0 20px hsl(var(--gold) / 0.4)",
          }}
        >
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* Bank Sentiment Gauge */
function BankGauge() {
  const hottest = BANK_SENTIMENT.reduce((a, b) => (a.score > b.score ? a : b));
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card p-5 space-y-3"
    >
      <div className="flex items-center gap-2 mb-1">
        <Landmark className="w-4 h-4 text-[hsl(var(--cyan-glow))]" />
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Bank Sentiment — 24h</span>
      </div>
      <div className="space-y-2.5">
        {BANK_SENTIMENT.map((bank, i) => {
          const isTop = bank.bank === hottest.bank;
          return (
            <motion.div
              key={bank.bank}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="flex items-center gap-3"
            >
              <span className="text-[11px] text-foreground w-20 truncate font-medium">{bank.bank}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary/30 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bank.score}%` }}
                  transition={{ duration: 1, delay: 0.7 + i * 0.1 }}
                  className="h-full rounded-full"
                  style={{
                    background: bank.score >= 80
                      ? "linear-gradient(90deg, hsl(160 84% 39%), hsl(var(--cyan-glow)))"
                      : bank.score >= 60
                        ? "linear-gradient(90deg, hsl(var(--gold)), hsl(43 74% 62%))"
                        : "linear-gradient(90deg, hsl(var(--destructive)), hsl(0 63% 60%))",
                    boxShadow: isTop ? "0 0 12px hsl(var(--cyan-glow) / 0.4)" : undefined,
                  }}
                />
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] w-12 justify-center",
                  bank.score >= 80 ? "border-emerald-500/30 text-emerald-400" :
                    bank.score >= 60 ? "border-gold/30 text-gold" :
                      "border-destructive/30 text-destructive"
                )}
              >
                {bank.score}%
              </Badge>
              {isTop && (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-[9px] text-emerald-400 font-bold"
                >
                  🔥
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* Broadcast Button */
function BroadcastButton() {
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);

  const handleSend = useCallback(() => {
    if (!msg.trim()) return;
    toast({ title: "📡 שידור נשלח", description: `ההודעה נשלחה ל-2,000 יועצים: "${msg.slice(0, 50)}..."` });
    setMsg("");
    setOpen(false);
  }, [msg]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            className="relative bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black gap-2 px-6 py-5 text-sm shadow-[0_0_30px_hsl(var(--destructive)/0.3)] border border-destructive/50"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <Megaphone className="w-5 h-5" />
            </motion.div>
            BROADCAST ALERT
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive border-2 border-card"
            />
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="max-w-md glass-card border-destructive/20" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Megaphone className="w-5 h-5" />
            שידור חירום — כל 2,000 היועצים
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="הזן הודעת שידור..."
            rows={4}
            className="border-destructive/20 focus:border-destructive/40"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">⚠️ פעולה זו תשלח התראה מיידית</p>
            <Button
              onClick={handleSend}
              disabled={!msg.trim()}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold gap-1"
            >
              <Zap className="w-4 h-4" />
              שדר עכשיו
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* Advisor Leaderboard */
function CombatLeaderboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-2 mb-5">
        <Crown className="w-4 h-4 text-gold" />
        <h2 className="font-bold text-sm text-foreground">Combat Leaderboard — מובילי האימפריה</h2>
      </div>
      <div className="space-y-3">
        {LEADERBOARD.map((a, i) => {
          const progress = Math.min(100, (a.deals / 25) * 100);
          const ringColor = i === 0 ? "hsl(var(--gold))" : i < 3 ? "hsl(var(--cyan-glow))" : "hsl(var(--muted-foreground))";
          return (
            <motion.div
              key={a.rank}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                i === 0
                  ? "bg-gold/5 border-gold/20 shadow-[0_0_20px_-6px_hsl(var(--gold)/0.25)]"
                  : "bg-secondary/10 border-border/15 hover:bg-secondary/20"
              )}
            >
              {/* Progress ring */}
              <div className="relative w-10 h-10 shrink-0">
                <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                  <motion.circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="94.25"
                    initial={{ strokeDashoffset: 94.25 }}
                    animate={{ strokeDashoffset: 94.25 - (progress / 100) * 94.25 }}
                    transition={{ duration: 1.2, delay: 0.5 + i * 0.15 }}
                    style={{ filter: `drop-shadow(0 0 4px ${ringColor})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-foreground">
                  {a.avatar}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[8px] px-1.5 py-0",
                      a.plan === "Gold" ? "border-gold/40 text-gold" : "border-primary/30 text-primary"
                    )}
                  >
                    {a.plan}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{a.deals} עסקאות</p>
              </div>

              {/* Volume */}
              <span className={cn("text-sm font-black shrink-0", i === 0 ? "text-gold" : "text-foreground")}>{a.volume}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* HUD Stat */
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
   MAIN PAGE
   ══════════════════════════════════════════════ */

const MasterAdminPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pb-14" dir="rtl">
      <MatrixGrid />

      {/* ── Header ── */}
      <header className="relative z-10 border-b border-border/15 bg-card/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Shield className="w-8 h-8 text-[hsl(var(--cyan-glow))]" style={{ filter: "drop-shadow(0 0 8px hsl(var(--cyan-glow)))" }} />
            </motion.div>
            <div>
              <h1 className="text-lg font-black text-foreground tracking-tight font-heebo">CHITUMIT COMMAND CENTER</h1>
              <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-heebo">Master Admin • Real-time Intelligence HQ</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BroadcastButton />
            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-[9px] gap-1.5 py-1">
              <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              SYSTEM ONLINE
            </Badge>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-6 py-6 space-y-6">

        {/* ── HUD Mega Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HUDStat icon={DollarSign} label="Total Pipeline Volume" color="cyan" delay={0.1}>
            <AnimatedNumber value={PIPELINE_TOTAL} prefix="₪" />
          </HUDStat>
          <HUDStat icon={Heart} label="Avg Chitumit Score" color="gold" delay={0.15}>
            <>{AVG_SCORE}<span className="text-sm text-emerald-400 mr-1">▲</span></>
          </HUDStat>
          <HUDStat icon={Users} label="Active Advisors Now" color="emerald" delay={0.2}>
            <AnimatedNumber value={ACTIVE_ADVISORS} />
          </HUDStat>
          <HUDStat icon={Zap} label="Deals Closed Today" color="gold" delay={0.25}>
            <AnimatedNumber value={DEALS_TODAY} />
          </HUDStat>
        </div>

        {/* ── MRR + Bank Sentiment ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <MRRGoal />
          <BankGauge />
        </div>

        {/* ── Map + Leaderboard ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Israel Capital Flow Map */}
          <div className="lg:col-span-2 glass-card p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[hsl(var(--cyan-glow))]" />
                <h2 className="font-bold text-sm text-foreground">Israel Capital Flow Map</h2>
              </div>
              <Badge variant="outline" className="text-[9px] border-[hsl(var(--cyan-glow))]/20 text-[hsl(var(--cyan-glow))]">Live Mortgage Volume</Badge>
            </div>

            <div className="relative w-full" style={{ paddingBottom: "110%" }}>
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

                {/* City pillars */}
                {CITIES.map((city, i) => (
                  <CityPillar key={city.name} city={city} delay={0.2 + i * 0.06} />
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-3 justify-center">
              {[
                { color: "bg-[hsl(0_80%_55%)]", shadow: "shadow-[0_0_6px_hsl(0_80%_55%)]", label: "Hot Zone" },
                { color: "bg-gold", shadow: "shadow-[0_0_6px_hsl(var(--gold))]", label: "Growing" },
                { color: "bg-[hsl(var(--cyan-glow))]", shadow: "shadow-[0_0_6px_hsl(var(--cyan-glow))]", label: "Emerging" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={cn("w-2.5 h-2.5 rounded-full", l.color, l.shadow)} />
                  <span className="text-[9px] text-muted-foreground tracking-wide">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <CombatLeaderboard />
        </div>

        {/* ── Revenue Trend ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-sm text-foreground">Pipeline Volume Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="cmdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--cyan-glow))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--cyan-glow))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`₪${(v / 1_000_000).toFixed(0)}M`, "נפח"]}
              />
              <Area type="monotone" dataKey="volume" stroke="hsl(var(--cyan-glow))" strokeWidth={2} fill="url(#cmdGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

        {/* ── VIP Lead Generator ── */}
        <VIPLeadGenerator />
      </div>

      <LiveTape />
    </div>
  );
};

export default MasterAdminPage;
