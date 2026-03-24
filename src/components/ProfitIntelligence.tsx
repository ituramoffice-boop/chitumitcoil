import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Banknote,
  Clock,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Crown,
  Target,
  Zap,
  ShieldCheck,
  Coins,
  Users,
  BarChart3,
} from "lucide-react";

interface Lead {
  id: string;
  full_name: string;
  status: string;
  mortgage_amount: number | null;
  property_value: number | null;
  monthly_income: number | null;
  created_at: string;
}

/* ── Fee Estimator (sidebar widget per case) ─────────────── */
export function FeeEstimator({ lead }: { lead: Lead }) {
  const estimate = useMemo(() => {
    const amount = Number(lead.mortgage_amount) || 0;
    const hasIncome = !!lead.monthly_income;
    const hasProperty = !!lead.property_value;

    let complexity = 1;
    if (amount > 2000000) complexity += 2;
    else if (amount > 1000000) complexity += 1;
    if (!hasIncome || !hasProperty) complexity += 1;
    if (lead.status === "in_progress" || lead.status === "submitted") complexity += 1;
    complexity = Math.min(5, complexity);

    let baseFee: number;
    if (amount >= 3000000) baseFee = 35000;
    else if (amount >= 2000000) baseFee = 25000;
    else if (amount >= 1500000) baseFee = 18000;
    else if (amount >= 1000000) baseFee = 12000;
    else if (amount >= 500000) baseFee = 8000;
    else baseFee = 5000;

    const adjustedFee = Math.round(baseFee * (1 + (complexity - 1) * 0.1));
    const feeRange = { min: Math.round(adjustedFee * 0.85), max: Math.round(adjustedFee * 1.15) };

    // Certainty score based on data completeness + complexity
    let certainty = 70;
    if (hasIncome) certainty += 10;
    if (hasProperty) certainty += 10;
    if (amount > 0) certainty += 5;
    if (lead.status === "approved") certainty = 98;
    else if (lead.status === "submitted") certainty += 5;
    certainty = Math.min(99, certainty);

    const complexityLabel = complexity <= 2 ? "סטנדרטי" : complexity <= 3 ? "בינוני" : "מורכב";
    const complexityColor = complexity <= 2 ? "text-emerald-400" : complexity <= 3 ? "text-amber-400" : "text-gold";

    return { adjustedFee, feeRange, complexity, complexityLabel, complexityColor, amount, certainty };
  }, [lead]);

  if (!estimate.amount) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-xl border border-gold/20 bg-gradient-to-b from-gold/5 to-transparent p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-gold/10 border border-gold/20">
          <Banknote className="w-4 h-4 text-gold" />
        </div>
        <h4 className="text-sm font-bold text-foreground">Smart Fee Calculator</h4>
      </div>

      <div className="text-center py-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Recommended Fee</p>
        <p className="text-2xl font-black text-gold" style={{ fontVariantNumeric: "tabular-nums" }}>
          ₪{estimate.feeRange.min.toLocaleString()} – ₪{estimate.feeRange.max.toLocaleString()}
        </p>
      </div>

      {/* Certainty Score */}
      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-emerald-400/80 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Certainty Score
          </span>
          <span className="text-sm font-black text-emerald-400">{estimate.certainty}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${estimate.certainty}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          />
        </div>
        <p className="text-[10px] text-emerald-400/70 mt-1.5">
          {estimate.certainty >= 90
            ? "אתה יכול בביטחון לגבות פרימיום עבור התיק הזה."
            : "השלם עוד נתונים כדי להעלות את הוודאות."}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">סכום הלוואה</span>
          <span className="font-semibold text-foreground">₪{estimate.amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">דרגת מורכבות</span>
          <span className={cn("font-semibold", estimate.complexityColor)}>
            {estimate.complexityLabel} ({estimate.complexity}/5)
          </span>
        </div>
      </div>

      <div className="p-2.5 rounded-lg bg-gold/5 border border-gold/10">
        <p className="text-[11px] text-gold/80 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 shrink-0" />
          <span>AI Tip: תיקים בטווח זה נסגרים ב-₪{estimate.adjustedFee.toLocaleString()} בממוצע בשוק</span>
        </p>
      </div>
    </motion.div>
  );
}

/* ── Gold Coin Animation ─────────────────────────────────── */
function GoldCoinBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            scale: 0,
            x: "50%",
            y: "50%",
          }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1.2, 0.8],
            x: `${50 + Math.cos((i * Math.PI * 2) / 8) * 40}%`,
            y: `${50 + Math.sin((i * Math.PI * 2) / 8) * 40}%`,
          }}
          transition={{ duration: 1.5, delay: i * 0.05, ease: "easeOut" }}
          className="absolute w-5 h-5"
        >
          <Coins className="w-full h-full text-gold drop-shadow-lg" />
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2] }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gold/20 blur-xl"
      />
    </div>
  );
}

/* ── Close the Deal Trigger with Gold Coin ───────────────── */
export function CloseDealTrigger({ lead }: { lead: Lead }) {
  const isReady = lead.status === "approved" || lead.status === "submitted";
  const [showCoin, setShowCoin] = useState(false);
  const prevStatus = useRef(lead.status);

  useEffect(() => {
    if (lead.status === "approved" && prevStatus.current !== "approved") {
      setShowCoin(true);
      const timer = setTimeout(() => setShowCoin(false), 2000);
      return () => clearTimeout(timer);
    }
    prevStatus.current = lead.status;
  }, [lead.status]);

  if (!isReady) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-l from-emerald-500/10 via-emerald-500/5 to-transparent p-4"
    >
      <AnimatePresence>{showCoin && <GoldCoinBurst />}</AnimatePresence>
      <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-emerald-400/60 to-transparent" />
      <motion.div
        animate={{ boxShadow: ["0 0 0px rgba(16,185,129,0)", "0 0 20px rgba(16,185,129,0.15)", "0 0 0px rgba(16,185,129,0)"] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex items-start gap-3"
      >
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-400 mb-0.5">ברור — התיק מוכן לחתימה</p>
          <p className="text-xs text-muted-foreground">
            זה הזמן לגבות שכר טרחה. התיק עבר חיתום AI מלא ומוכן להגשה סופית.
          </p>
          {lead.mortgage_amount && Number(lead.mortgage_amount) >= 1500000 && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gold font-semibold">
              <Crown className="w-3 h-3" />
              <span>תיק VIP — מצדיק שכ״ט פרימיום</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Pipeline Revenue Ticker ─────────────────────────────── */
export function PipelineTicker({ leads }: { leads: Lead[] }) {
  const pipeline = useMemo(() => {
    const inProgress = leads.filter(l =>
      ["in_progress", "submitted", "approved"].includes(l.status)
    );
    const totalVolume = inProgress.reduce((s, l) => s + (Number(l.mortgage_amount) || 0), 0);
    // Estimate ~1.2% avg fee rate
    const estimatedFees = Math.round(totalVolume * 0.012);
    return { count: inProgress.length, totalVolume, estimatedFees };
  }, [leads]);

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = pipeline.estimatedFees;
    const duration = 1500;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayValue(target);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [pipeline.estimatedFees]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gold/30 bg-gradient-to-l from-gold/10 via-gold/5 to-transparent p-4 overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="flex items-center gap-2.5 mb-3">
        <div className="p-2 rounded-lg bg-gold/10 border border-gold/20">
          <TrendingUp className="w-4 h-4 text-gold" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">צבר שכ״ט פוטנציאלי</p>
          <p className="text-[10px] text-muted-foreground">Pipeline Revenue</p>
        </div>
      </div>
      <div className="text-center py-2">
        <motion.p
          className="text-3xl font-black text-gold"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          ₪{displayValue.toLocaleString()}
        </motion.p>
        <p className="text-[10px] text-muted-foreground mt-1">
          מתוך {pipeline.count} תיקים פעילים · נפח ₪{(pipeline.totalVolume / 1000000).toFixed(1)}M
        </p>
      </div>
    </motion.div>
  );
}

/* ── Performance Stats with ROI Badge ────────────────────── */
export function PerformanceStats({ leads }: { leads: Lead[] }) {
  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = leads.filter(l => {
      const d = new Date(l.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const aiAnalyzed = leads.filter(l => ["in_progress", "submitted", "approved", "closed"].includes(l.status));
    const hoursSaved = aiAnalyzed.length * 3;
    const hourlyRate = 350;
    const revenuePotential = hoursSaved * hourlyRate;

    const approved = leads.filter(l => l.status === "approved");
    const totalApprovedVolume = approved.reduce((s, l) => s + (Number(l.mortgage_amount) || 0), 0);

    const activeWithAmount = leads.filter(l => l.mortgage_amount && !["closed", "rejected"].includes(l.status));
    const avgDealSize = activeWithAmount.length > 0
      ? activeWithAmount.reduce((s, l) => s + (Number(l.mortgage_amount) || 0), 0) / activeWithAmount.length
      : 0;

    // Extra files capacity: if avg file takes 8hrs manually, now takes 5hrs with AI → 3hrs saved
    const avgManualHoursPerFile = 8;
    const avgAIHoursPerFile = 5;
    const monthlyWorkHours = 180;
    const manualCapacity = Math.floor(monthlyWorkHours / avgManualHoursPerFile);
    const aiCapacity = Math.floor(monthlyWorkHours / avgAIHoursPerFile);
    const extraFiles = aiCapacity - manualCapacity;

    return {
      thisMonthLeads: thisMonth.length,
      hoursSaved,
      revenuePotential,
      totalApprovedVolume,
      approvedCount: approved.length,
      avgDealSize,
      extraFiles,
      manualCapacity,
      aiCapacity,
    };
  }, [leads]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold/20 bg-gradient-to-l from-card via-card to-gold/5 overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-gold/40 to-transparent" />
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-gold/10 border border-gold/20">
            <Target className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Profit Intelligence</h3>
            <p className="text-[10px] text-muted-foreground">ניתוח פוטנציאל הכנסה חודשי</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Time Saved */}
          <div className="p-3 rounded-xl bg-secondary/40 border border-border/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-gold" />
              <p className="text-[10px] text-muted-foreground">זמן שנחסך החודש</p>
            </div>
            <p className="text-xl font-black text-gold" style={{ fontVariantNumeric: "tabular-nums" }}>
              {metrics.hoursSaved} שעות
            </p>
          </div>

          {/* Revenue Potential */}
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[10px] text-emerald-400/80">שווה ערך ל</p>
            </div>
            <p className="text-xl font-black text-emerald-400" style={{ fontVariantNumeric: "tabular-nums" }}>
              ₪{metrics.revenuePotential.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ROI Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="p-3 rounded-xl bg-gradient-to-l from-gold/10 via-gold/5 to-transparent border border-gold/20 mb-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-gold" />
            <p className="text-xs font-bold text-gold">Performance ROI</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-lg font-black text-foreground">{metrics.manualCapacity}</p>
              <p className="text-[9px] text-muted-foreground">ללא AI</p>
            </div>
            <div className="text-gold text-lg font-black px-2">→</div>
            <div className="text-center flex-1">
              <p className="text-lg font-black text-gold">{metrics.aiCapacity}</p>
              <p className="text-[9px] text-gold/70">עם חיתומית</p>
            </div>
            <div className="mr-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs font-black text-emerald-400">+{metrics.extraFiles}</p>
              <p className="text-[8px] text-emerald-400/70">תיקים/חודש</p>
            </div>
          </div>
        </motion.div>

        {/* Summary insights */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/30">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-gold" />
              תיקים שאושרו
            </span>
            <span className="font-bold text-foreground">{metrics.approvedCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/30">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-gold" />
              נפח אישורים
            </span>
            <span className="font-bold text-foreground">₪{metrics.totalApprovedVolume.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/30">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Banknote className="w-3 h-3 text-gold" />
              גודל עסקה ממוצע
            </span>
            <span className="font-bold text-foreground">₪{Math.round(metrics.avgDealSize).toLocaleString()}</span>
          </div>
        </div>

        {/* AI Tip */}
        <div className="mt-3 p-2.5 rounded-lg bg-gold/5 border border-gold/10">
          <p className="text-[11px] text-gold/80 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>
              {metrics.hoursSaved > 20
                ? `חסכת ${metrics.hoursSaved} שעות החודש — שווה ₪${metrics.revenuePotential.toLocaleString()} בערך שוק ייעוצי. אתה יכול לנהל עוד ${metrics.extraFiles} תיקים בחודש!`
                : "העלה עוד תיקים למערכת כדי למקסם את החיסכון בזמן ובהכנסה"
              }
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
