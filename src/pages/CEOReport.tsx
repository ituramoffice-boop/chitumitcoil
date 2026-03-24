import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Crown,
  TrendingUp,
  Users,
  Landmark,
  DollarSign,
  BarChart3,
  Star,
  Send,
  FileText,
  Trophy,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from "recharts";

/* ══════════════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════════════ */

const WEEKLY_REVENUE = 187_400;
const PREV_WEEKLY_REVENUE = 162_800;
const NEW_ADVISORS = 24;
const PREV_NEW_ADVISORS = 18;
const WEEKLY_CREDIT_VOLUME = 312_500_000;
const BILLION_GOAL = 10_000_000_000;
const TOTAL_PROCESSED = 3_842_500_000;

const BANK_DOMINANCE = [
  { name: "הפועלים", value: 32, color: "#D4AF37" },
  { name: "לאומי", value: 26, color: "#C0C0C0" },
  { name: "דיסקונט", value: 18, color: "#B87333" },
  { name: "מזרחי", value: 14, color: "#E8D5B7" },
  { name: "בינלאומי", value: 10, color: "#F5E6CC" },
];

const REVENUE_TREND = [
  { week: "שבוע 1", value: 112_000 },
  { week: "שבוע 2", value: 134_500 },
  { week: "שבוע 3", value: 148_200 },
  { week: "שבוע 4", value: 162_800 },
  { week: "שבוע 5", value: 187_400 },
];

const TOP_ADVISOR = {
  name: "יוסי כהן",
  volume: "₪48.2M",
  deals: 23,
  score: 96,
};

const AI_INSIGHT =
  "השבוע, מנוע הנרטיב החיתומי שיפר את שיעורי האישור ב-14% עבור פרופילים עם ציון 70-80. סניפי בנק הפועלים הראו נטייה חיובית לחיתום יצירתי, בעיקר במרכז הארץ.";

/* ══════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════ */

function AnimatedNumber({ value, prefix = "", suffix = "", className }: {
  value: number; prefix?: string; suffix?: string; className?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = 0;
    const total = 70;
    const timer = setInterval(() => {
      frame++;
      const p = 1 - Math.pow(1 - frame / total, 3);
      setDisplay(Math.round(value * p));
      if (frame >= total) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span className={className}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

function pctChange(curr: number, prev: number) {
  const pct = ((curr - prev) / prev) * 100;
  return { pct: Math.round(pct), positive: pct >= 0 };
}

/* Gold leaf corner SVG */
function GoldCorner({ className }: { className?: string }) {
  return (
    <svg className={cn("absolute w-12 h-12 opacity-20", className)} viewBox="0 0 50 50">
      <path d="M0 0 Q25 0 25 25 Q0 25 0 0 Z" fill="hsl(var(--gold))" />
      <path d="M5 0 Q20 5 20 20 Q5 20 5 0 Z" fill="hsl(var(--gold))" opacity="0.5" />
    </svg>
  );
}

/* ══════════════════════════════════════════════
   STAT CARD
   ══════════════════════════════════════════════ */

function StatCard({ icon: Icon, label, children, change, delay = 0 }: {
  icon: typeof DollarSign; label: string; children: React.ReactNode;
  change?: { pct: number; positive: boolean }; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative bg-white rounded-2xl border border-[hsl(var(--gold))]/15 p-6 shadow-[0_4px_30px_-8px_hsl(var(--gold)/0.1)] overflow-hidden"
    >
      <GoldCorner className="top-0 left-0" />
      <GoldCorner className="bottom-0 right-0 rotate-180" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[hsl(var(--gold))]/10">
              <Icon className="w-4 h-4 text-[hsl(var(--gold))]" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 font-semibold">{label}</span>
          </div>
          {change && (
            <Badge variant="outline" className={cn(
              "text-[9px] font-bold",
              change.positive ? "border-emerald-300 text-emerald-600" : "border-red-300 text-red-500"
            )}>
              {change.positive ? "▲" : "▼"} {Math.abs(change.pct)}%
            </Badge>
          )}
        </div>
        <div className="text-2xl lg:text-3xl font-black text-neutral-900">{children}</div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

const CEOReport = () => {
  const revenueChange = pctChange(WEEKLY_REVENUE, PREV_WEEKLY_REVENUE);
  const advisorChange = pctChange(NEW_ADVISORS, PREV_NEW_ADVISORS);
  const bilPct = Math.round((TOTAL_PROCESSED / BILLION_GOAL) * 100);
  const today = new Date();
  const dateStr = today.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

  const handleSendReport = () => {
    toast({ title: "📧 דוח שבועי נשלח", description: "הדוח נשלח בהצלחה לכל הנמענים." });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]" dir="rtl">

      {/* ── Header ── */}
      <header className="border-b border-[hsl(var(--gold))]/15 bg-white/80 backdrop-blur-sm print:bg-white">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(43_74%_40%)] flex items-center justify-center shadow-lg">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-neutral-900 tracking-tight font-heebo">דוח מנכ״ל שבועי</h1>
              <p className="text-[10px] text-neutral-500 font-heebo">{dateStr} • CHITUMIT INTELLIGENCE</p>
            </div>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-[hsl(var(--gold))]/30 text-neutral-700 gap-1.5 text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              הדפס PDF
            </Button>
            <Button
              onClick={handleSendReport}
              className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(43_74%_40%)] text-white font-bold gap-1.5 text-xs shadow-lg hover:shadow-xl transition-shadow"
            >
              <Send className="w-3.5 h-3.5" />
              שלח דוח יום שישי
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8 max-w-6xl">

        {/* ── Mega Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={DollarSign} label="הכנסה שבועית" change={revenueChange} delay={0.1}>
            <AnimatedNumber value={WEEKLY_REVENUE} prefix="₪" />
          </StatCard>
          <StatCard icon={Users} label="יועצים חדשים" change={advisorChange} delay={0.15}>
            <AnimatedNumber value={NEW_ADVISORS} />
          </StatCard>
          <StatCard icon={Landmark} label="נפח אשראי שבועי" delay={0.2}>
            <AnimatedNumber value={WEEKLY_CREDIT_VOLUME} prefix="₪" />
          </StatCard>
          <StatCard icon={TrendingUp} label="הכנסה חודשית (MRR)" delay={0.25}>
            <AnimatedNumber value={740_000} prefix="₪" />
          </StatCard>
        </div>

        {/* ── 10B Milestone ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative bg-white rounded-2xl border border-[hsl(var(--gold))]/15 p-6 overflow-hidden shadow-sm"
        >
          <GoldCorner className="top-0 left-0" />
          <GoldCorner className="bottom-0 right-0 rotate-180" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[hsl(var(--gold))]" />
                <h2 className="font-bold text-neutral-900 text-sm">יעד 10 מיליארד ₪ — The Billion-Shekel Milestone</h2>
              </div>
              <Badge variant="outline" className="border-[hsl(var(--gold))]/30 text-[hsl(var(--gold))] text-xs font-bold">
                {bilPct}%
              </Badge>
            </div>
            <div className="flex items-end gap-4 mb-3">
              <span className="text-3xl font-black text-neutral-900">
                <AnimatedNumber value={TOTAL_PROCESSED} prefix="₪" />
              </span>
              <span className="text-sm text-neutral-400 mb-1">/ ₪10,000,000,000</span>
            </div>
            <div className="h-4 rounded-full bg-neutral-100 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bilPct}%` }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: "linear-gradient(90deg, hsl(var(--gold)), hsl(43 74% 62%), hsl(var(--gold)))",
                  backgroundSize: "200% 100%",
                }}
              >
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
              </motion.div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-neutral-400">₪0</span>
              <span className="text-[10px] text-neutral-400">₪5B</span>
              <span className="text-[10px] text-neutral-400 font-bold text-[hsl(var(--gold))]">₪10B 🏆</span>
            </div>
          </div>
        </motion.div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Bank Dominance Pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative bg-white rounded-2xl border border-[hsl(var(--gold))]/15 p-6 overflow-hidden shadow-sm"
          >
            <GoldCorner className="top-0 left-0" />
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[hsl(var(--gold))]" />
              <h2 className="font-bold text-neutral-900 text-sm">Bank Dominance — שליטת הבנקים השבוע</h2>
            </div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={BANK_DOMINANCE}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    strokeWidth={2}
                    stroke="#FAFAF8"
                  >
                    {BANK_DOMINANCE.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "נתח"]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e5e5" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {BANK_DOMINANCE.map(b => (
                  <div key={b.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-xs text-neutral-700 font-medium">{b.name}</span>
                    <span className="text-xs text-neutral-400 font-bold">{b.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="relative bg-white rounded-2xl border border-[hsl(var(--gold))]/15 p-6 overflow-hidden shadow-sm"
          >
            <GoldCorner className="top-0 left-0" />
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--gold))]" />
              <h2 className="font-bold text-neutral-900 text-sm">מגמת הכנסות — 5 שבועות אחרונים</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={REVENUE_TREND}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(v: number) => [`₪${v.toLocaleString()}`, "הכנסה"]}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e5e5" }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--gold))" strokeWidth={2.5} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* ── AI Insight + Top Advisor ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* AI Performance Insight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative bg-white rounded-2xl border border-[hsl(var(--gold))]/15 p-6 overflow-hidden shadow-sm"
          >
            <GoldCorner className="top-0 left-0" />
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[hsl(var(--gold))]" />
              <h2 className="font-bold text-neutral-900 text-sm">תובנת AI שבועית</h2>
            </div>
            <div className="bg-gradient-to-br from-[hsl(var(--gold))]/5 to-transparent rounded-xl p-5 border border-[hsl(var(--gold))]/10">
              <p className="text-sm text-neutral-700 leading-relaxed font-heebo">{AI_INSIGHT}</p>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border-0">+14% Approval Rate</Badge>
              <Badge className="bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] text-[10px] font-bold border-0">Score 70-80 Segment</Badge>
            </div>
          </motion.div>

          {/* Top Advisor Spotlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="relative bg-white rounded-2xl border border-[hsl(var(--gold))]/15 p-6 overflow-hidden shadow-sm"
          >
            <GoldCorner className="top-0 left-0" />
            <div className="flex items-center gap-2 mb-5">
              <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" />
              <h2 className="font-bold text-neutral-900 text-sm">יועץ השבוע — Top Advisor Spotlight</h2>
            </div>
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(43_74%_40%)] flex items-center justify-center text-white text-lg font-black shadow-lg">
                  {TOP_ADVISOR.name.split(" ").map(n => n[0]).join("")}
                </div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-[hsl(var(--gold))]"
                />
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
                  <Star className="w-3 h-3 text-white fill-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">{TOP_ADVISOR.name}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-sm text-neutral-500">נפח: <strong className="text-neutral-900">{TOP_ADVISOR.volume}</strong></span>
                  <span className="text-sm text-neutral-500">עסקאות: <strong className="text-neutral-900">{TOP_ADVISOR.deals}</strong></span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] text-[10px] font-bold border-0">⭐ Gold Member</Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border-0">Score {TOP_ADVISOR.score}</Badge>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Digital Signature Footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center py-8 gap-3"
        >
          <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-[hsl(var(--gold))]/30" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--gold))]/20 bg-white/50">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(43_74%_40%)] flex items-center justify-center">
              <span className="text-[8px] text-white font-black">✓</span>
            </div>
            <span className="text-[10px] text-neutral-500 font-semibold tracking-wide">Verified by Chitumit AI</span>
          </div>
          <div className="h-px flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-[hsl(var(--gold))]/30" />
        </motion.div>
      </div>
    </div>
  );
};

export default CEOReport;
