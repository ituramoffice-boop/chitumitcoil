import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Radar,
  Zap,
  Landmark,
  Users,
  TrendingUp,
  Activity,
  Crown,
  BarChart3,
  Globe,
  DollarSign,
  Heart,
  Shield,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Radar as RechartsRadar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/* ══════════════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════════════ */

const PIPELINE_TOTAL = 1_450_230_000;
const AVG_SCORE = 76.4;
const ACTIVE_ADVISORS = 187;
const TOTAL_DEALS_TODAY = 34;

const CITIES: { name: string; x: number; y: number; volume: number; trend: number }[] = [
  { name: "תל אביב", x: 28, y: 53, volume: 98, trend: 4.2 },
  { name: "ירושלים", x: 52, y: 60, volume: 82, trend: 2.1 },
  { name: "חיפה", x: 28, y: 20, volume: 65, trend: 3.5 },
  { name: "באר שבע", x: 38, y: 82, volume: 42, trend: 6.8 },
  { name: "רעננה", x: 26, y: 40, volume: 58, trend: 1.9 },
  { name: "הרצליה", x: 25, y: 46, volume: 71, trend: 3.1 },
  { name: "נתניה", x: 24, y: 34, volume: 45, trend: 5.2 },
  { name: "ראשל\"צ", x: 30, y: 58, volume: 55, trend: 2.4 },
  { name: "פ\"ת", x: 34, y: 52, volume: 48, trend: 1.7 },
  { name: "אשדוד", x: 28, y: 70, volume: 38, trend: 7.1 },
  { name: "עכו", x: 30, y: 14, volume: 22, trend: 4.5 },
  { name: "אילת", x: 42, y: 97, volume: 12, trend: 8.3 },
];

const LEADERBOARD = [
  { rank: 1, name: "יוסי כהן", volume: "₪48.2M", deals: 23, avatar: "YK" },
  { rank: 2, name: "מיכל לוי", volume: "₪42.1M", deals: 19, avatar: "ML" },
  { rank: 3, name: "אבי גולד", volume: "₪38.7M", deals: 17, avatar: "AG" },
  { rank: 4, name: "רונית שרון", volume: "₪31.5M", deals: 14, avatar: "RS" },
  { rank: 5, name: "דני פרץ", volume: "₪28.9M", deals: 12, avatar: "DP" },
];

const BANK_SENTIMENT = [
  { bank: "הפועלים", openness: 82, speed: 70, volume: 90 },
  { bank: "לאומי", openness: 65, speed: 55, volume: 78 },
  { bank: "דיסקונט", openness: 88, speed: 75, volume: 60 },
  { bank: "מזרחי", openness: 72, speed: 80, volume: 85 },
  { bank: "בינלאומי", openness: 90, speed: 68, volume: 45 },
];

const REVENUE_DATA = Array.from({ length: 12 }, (_, i) => ({
  month: ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"][i],
  volume: Math.round((800 + Math.random() * 650) * 1_000_000),
}));

const TICKER_ITEMS = [
  "יועץ #1042 סגר עסקה של ₪2.4M בחיפה",
  "שיעור אישורים בלאומי עלה ב-2% בשעה האחרונה",
  "ציון חיתומית ממוצע עלה ל-76.4 — שיא חודשי",
  "סניף דיסקונט ת\"א פתח מסלול הטבה חדש",
  "יועצת #873 שברה שיא — 5 תיקים ביום אחד",
  "בנק הפועלים מרכז: זמן אישור ממוצע ירד ל-8 ימים",
];

/* ══════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════ */

/* Animated counter */
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { start = value; clearInterval(timer); }
      setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* Digital grid background */
function DigitalGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
      <motion.div
        animate={{ backgroundPosition: ["0px 0px", "40px 40px"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--cyan-glow) / 0.4) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--cyan-glow) / 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}

/* HUD stat card */
function HUDStat({ icon: Icon, label, value, color, glow }: {
  icon: typeof Activity; label: string; value: React.ReactNode; color: string; glow: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-5 rounded-xl border backdrop-blur-md",
        "bg-card/40 border-border/20",
        glow
      )}
    >
      <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-transparent to-current" style={{ color: `hsl(var(--${color === "cyan" ? "cyan-glow" : color}))` }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
          <div className="text-2xl lg:text-3xl font-black text-foreground">{value}</div>
        </div>
        <div className={cn("p-2.5 rounded-lg", color === "cyan" ? "bg-[hsl(var(--cyan-glow))]/10" : `bg-${color}/10`)}>
          <Icon className={cn("w-5 h-5", color === "cyan" ? "text-[hsl(var(--cyan-glow))]" : `text-${color}`)} />
        </div>
      </div>
    </motion.div>
  );
}

/* City dot on map */
function CityDot({ city, delay }: { city: typeof CITIES[0]; delay: number }) {
  const intensity = city.volume / 100;
  const size = 12 + intensity * 24;
  const glowColor = intensity > 0.7 ? "hsl(0 80% 55%)" : intensity > 0.4 ? "hsl(var(--gold))" : "hsl(var(--cyan-glow))";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      className="absolute group cursor-pointer"
      style={{ left: `${city.x}%`, top: `${city.y}%`, transform: "translate(-50%,-50%)" }}
    >
      {/* Pulse ring */}
      <motion.div
        animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: delay * 2 }}
        className="absolute inset-0 rounded-full"
        style={{ width: size, height: size, backgroundColor: glowColor }}
      />
      {/* Core dot */}
      <div
        className="rounded-full border border-white/20 relative"
        style={{
          width: size,
          height: size,
          backgroundColor: glowColor,
          boxShadow: `0 0 ${size}px ${glowColor}, 0 0 ${size * 2}px ${glowColor}`,
        }}
      />
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div className="bg-card/95 backdrop-blur-sm border border-border/30 rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
          <p className="text-xs font-bold text-foreground">{city.name}</p>
          <p className="text-[10px] text-muted-foreground">נפח: {city.volume}% | מגמה: +{city.trend}%</p>
        </div>
      </div>
    </motion.div>
  );
}

/* Live tape ticker */
function LiveTape() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % TICKER_ITEMS.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-t border-[hsl(var(--cyan-glow))]/20">
      <div className="flex items-center h-10 px-4 gap-3">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
        />
        <span className="text-[10px] font-bold text-[hsl(var(--cyan-glow))] shrink-0 uppercase tracking-widest">Live</span>
        <div className="h-4 w-px bg-border/30 shrink-0" />
        <div className="flex-1 overflow-hidden relative h-5">
          <AnimatePresence mode="wait">
            <motion.p
              key={idx}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-muted-foreground font-mono absolute inset-0 leading-5 whitespace-nowrap"
            >
              {TICKER_ITEMS[idx]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
const MasterAdminPage = () => {
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const radarData = useMemo(() => {
    const bank = selectedBank ? BANK_SENTIMENT.find(b => b.bank === selectedBank) : null;
    if (bank) {
      return [
        { metric: "פתיחות", value: bank.openness },
        { metric: "מהירות", value: bank.speed },
        { metric: "נפח", value: bank.volume },
      ];
    }
    return BANK_SENTIMENT.map(b => ({
      metric: b.bank,
      openness: b.openness,
      speed: b.speed,
      volume: b.volume,
    }));
  }, [selectedBank]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-14" dir="rtl">
      <DigitalGrid />

      {/* ── Header ── */}
      <header className="relative z-10 border-b border-border/20 bg-card/30 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Shield className="w-7 h-7 text-[hsl(var(--cyan-glow))]" />
            </motion.div>
            <div>
              <h1 className="text-lg font-black text-foreground tracking-tight">CHITUMIT COMMAND CENTER</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Master Admin • Real-time Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] gap-1">
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              SYSTEM ONLINE
            </Badge>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-6 space-y-6">

        {/* ── HUD Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HUDStat
            icon={DollarSign}
            label="Total Pipeline Volume"
            value={<AnimatedNumber value={PIPELINE_TOTAL} prefix="₪" />}
            color="cyan"
            glow="shadow-[0_0_30px_-8px_hsl(var(--cyan-glow)/0.3)]"
          />
          <HUDStat
            icon={Heart}
            label="Avg Chitumit Score"
            value={<>{AVG_SCORE}<span className="text-sm text-emerald-400 mr-1">▲</span></>}
            color="gold"
            glow="shadow-[0_0_30px_-8px_hsl(var(--gold)/0.3)]"
          />
          <HUDStat
            icon={Users}
            label="Active Advisors"
            value={<AnimatedNumber value={ACTIVE_ADVISORS} />}
            color="cyan"
            glow="shadow-[0_0_30px_-8px_hsl(var(--cyan-glow)/0.3)]"
          />
          <HUDStat
            icon={Zap}
            label="Deals Closed Today"
            value={<AnimatedNumber value={TOTAL_DEALS_TODAY} />}
            color="gold"
            glow="shadow-[0_0_30px_-8px_hsl(var(--gold)/0.3)]"
          />
        </div>

        {/* ── Main Grid: Map + Leaderboard ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Israel Heatmap */}
          <div className="lg:col-span-2 rounded-xl border border-border/20 bg-card/30 backdrop-blur-md p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[hsl(var(--cyan-glow))]" />
                <h2 className="font-bold text-sm text-foreground">Israel Money Heatmap</h2>
              </div>
              <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">Live Mortgage Volume</Badge>
            </div>

            {/* Map container */}
            <div className="relative w-full" style={{ paddingBottom: "120%" }}>
              {/* Israel silhouette approximation */}
              <div className="absolute inset-0">
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-10">
                  <path
                    d="M30 5 L38 3 L42 8 L40 15 L35 18 L30 17 L28 22 L25 28 L22 35 L20 45 L22 50 L20 55 L22 60 L25 65 L30 70 L35 78 L38 85 L40 92 L42 98 L38 97 L35 90 L30 82 L25 75 L20 68 L18 60 L16 52 L18 45 L20 38 L22 30 L25 22 L28 15 L30 8 Z"
                    fill="hsl(var(--cyan-glow))"
                    stroke="hsl(var(--cyan-glow))"
                    strokeWidth="0.5"
                  />
                </svg>
                {/* City dots */}
                {CITIES.map((city, i) => (
                  <CityDot key={city.name} city={city} delay={0.1 + i * 0.08} />
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[hsl(0_80%_55%)] shadow-[0_0_8px_hsl(0_80%_55%)]" />
                <span className="text-[10px] text-muted-foreground">ביקוש גבוה</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gold shadow-[0_0_8px_hsl(var(--gold))]" />
                <span className="text-[10px] text-muted-foreground">בינוני</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--cyan-glow))] shadow-[0_0_8px_hsl(var(--cyan-glow))]" />
                <span className="text-[10px] text-muted-foreground">שוק מתפתח</span>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="rounded-xl border border-border/20 bg-card/30 backdrop-blur-md p-6">
            <div className="flex items-center gap-2 mb-5">
              <Crown className="w-4 h-4 text-gold" />
              <h2 className="font-bold text-sm text-foreground">Top Earners — מובילי החודש</h2>
            </div>
            <div className="space-y-3">
              {LEADERBOARD.map((advisor, i) => (
                <motion.div
                  key={advisor.rank}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    i === 0
                      ? "bg-gold/5 border-gold/20 shadow-[0_0_15px_-5px_hsl(var(--gold)/0.2)]"
                      : "bg-secondary/20 border-border/15 hover:bg-secondary/30"
                  )}
                >
                  {/* Rank */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                    i === 0 ? "bg-gold/20 text-gold" : i === 1 ? "bg-muted text-muted-foreground" : "bg-secondary text-muted-foreground"
                  )}>
                    {i === 0 ? <Crown className="w-4 h-4" /> : `#${advisor.rank}`}
                  </div>
                  {/* Avatar */}
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    i === 0 ? "bg-gold/15 text-gold border border-gold/30" : "bg-primary/10 text-primary border border-primary/20"
                  )}>
                    {advisor.avatar}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{advisor.name}</p>
                    <p className="text-[10px] text-muted-foreground">{advisor.deals} עסקאות</p>
                  </div>
                  {/* Volume */}
                  <span className={cn("text-sm font-bold shrink-0", i === 0 ? "text-gold" : "text-foreground")}>{advisor.volume}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom Grid: Revenue Chart + Bank Sentiment ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border border-border/20 bg-card/30 backdrop-blur-md p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-sm text-foreground">Pipeline Volume — Trend</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--cyan-glow))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--cyan-glow))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(v: number) => [`₪${(v / 1_000_000).toFixed(0)}M`, "נפח"]}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="hsl(var(--cyan-glow))"
                  strokeWidth={2}
                  fill="url(#volumeGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Bank Sentiment */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl border border-border/20 bg-card/30 backdrop-blur-md p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Radar className="w-4 h-4 text-gold" />
                <h2 className="font-bold text-sm text-foreground">Bank Sentiment Matrix — 24h</h2>
              </div>
            </div>

            {/* Bank buttons */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {BANK_SENTIMENT.map(b => (
                <button
                  key={b.bank}
                  onClick={() => setSelectedBank(selectedBank === b.bank ? null : b.bank)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border",
                    selectedBank === b.bank
                      ? "bg-gold/15 text-gold border-gold/30"
                      : "bg-secondary/30 text-muted-foreground border-border/20 hover:bg-secondary/50"
                  )}
                >
                  <Landmark className="w-2.5 h-2.5 inline ml-1" />
                  {b.bank}
                </button>
              ))}
            </div>

            {/* Sentiment bars */}
            <div className="space-y-3">
              {(selectedBank ? BANK_SENTIMENT.filter(b => b.bank === selectedBank) : BANK_SENTIMENT).map((bank, i) => (
                <motion.div
                  key={bank.bank}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{bank.bank}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px]",
                        bank.openness >= 80 ? "border-emerald-500/30 text-emerald-400" :
                        bank.openness >= 60 ? "border-gold/30 text-gold" :
                        "border-destructive/30 text-destructive"
                      )}
                    >
                      {bank.openness >= 80 ? "פתוח" : bank.openness >= 60 ? "נורמלי" : "מחמיר"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "פתיחות", val: bank.openness },
                      { label: "מהירות", val: bank.speed },
                      { label: "נפח", val: bank.volume },
                    ].map(metric => (
                      <div key={metric.label}>
                        <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${metric.val}%` }}
                            transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
                            className={cn(
                              "h-full rounded-full",
                              metric.val >= 80 ? "bg-emerald-400" : metric.val >= 60 ? "bg-gold" : "bg-destructive"
                            )}
                          />
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5 text-center">{metric.label} {metric.val}%</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Live Tape */}
      <LiveTape />
    </div>
  );
};

export default MasterAdminPage;
