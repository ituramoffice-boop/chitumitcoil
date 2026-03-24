import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  Trophy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeMetrics } from "@/components/AIUnderwriterAdvocate";

interface Lead {
  id: string;
  full_name: string;
  mortgage_amount: number | null;
  property_value: number | null;
  monthly_income: number | null;
  notes: string | null;
  status: string;
}

/* ── Benchmarking data ── */
function getBenchmark(metrics: ReturnType<typeof computeMetrics>) {
  const { score, ltv, dti } = metrics;

  const scorePercentile = score >= 85 ? 95 : score >= 75 ? 80 : score >= 60 ? 55 : 25;
  const ltvRank = ltv < 60 ? "טוב מ-85% מהתיקים" : ltv < 70 ? "טוב מ-65% מהתיקים" : ltv < 80 ? "טוב מ-35% מהתיקים" : "ב-15% התחתונים";
  const dtiRank = dti < 30 ? "מצוין — Top 10%" : dti < 35 ? "טוב — Top 30%" : dti < 40 ? "ממוצע" : "מתחת לממוצע";

  return { scorePercentile, ltvRank, dtiRank };
}

/* ── Winning strategy cards ── */
function getWinningStrategies(metrics: ReturnType<typeof computeMetrics>): { title: string; desc: string; successRate: number }[] {
  const strategies: { title: string; desc: string; successRate: number }[] = [];
  const { score, ltv, dti } = metrics;

  if (ltv >= 70) strategies.push({
    title: "משכנתא לכל מטרה (Equity Release)",
    desc: "פרופיל זה מצליח בדרך כלל כשמובנה כמשכנתא לכל מטרה. שיעור הצלחה גבוה בסניפים שתומכים בחיתום יצירתי.",
    successRate: 84,
  });
  if (dti >= 35) strategies.push({
    title: "פריסת חוב + סגירת הלוואה",
    desc: "סגור הלוואה קטנה (עד ₪5,000) לפני ההגשה ופרוס את ההחזר ל-30 שנה. ירידת DTI דרמטית.",
    successRate: 78,
  });
  if (score < 75) strategies.push({
    title: "הדגשת הכנסה עתידית",
    desc: "ציין ותק תעסוקתי, מסלול קריירה ופוטנציאל עליית שכר. סניפים רבים מתייחסים להכנסה עתידית בחיתום.",
    successRate: 72,
  });
  strategies.push({
    title: "הגשה עם נרטיב AI מקצועי",
    desc: "תיקים שהוגשו עם סיכום מנהלים מקצועי מחיתומית AI מקבלים תגובה מהירה יותר ב-40%.",
    successRate: 91,
  });

  return strategies.slice(0, 3);
}

export function AdvisorBenchmark({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState({ benchmark: false, strategies: true });
  const metrics = useMemo(() => computeMetrics(lead), [lead]);
  const benchmark = useMemo(() => getBenchmark(metrics), [metrics]);
  const strategies = useMemo(() => getWinningStrategies(metrics), [metrics]);

  const toggle = (key: keyof typeof expanded) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-3">
      {/* How I Rank */}
      <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-card to-primary/3 overflow-hidden">
        <button
          onClick={() => toggle("benchmark")}
          className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">How I Rank — איך התיק שלי מדורג</span>
          </div>
          {expanded.benchmark ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {expanded.benchmark && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {/* Score percentile */}
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">ציון חיתומית — Percentile</span>
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Top {100 - benchmark.scorePercentile}%</Badge>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${benchmark.scorePercentile}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>
                {/* LTV & DTI ranks */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-secondary/20 border border-border/15">
                    <p className="text-[10px] text-muted-foreground mb-1">LTV Ranking</p>
                    <p className="text-xs font-medium text-foreground">{benchmark.ltvRank}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/20 border border-border/15">
                    <p className="text-[10px] text-muted-foreground mb-1">DTI Ranking</p>
                    <p className="text-xs font-medium text-foreground">{benchmark.dtiRank}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Winning Strategy Cards */}
      <div className="rounded-xl border border-accent/15 bg-gradient-to-br from-card to-accent/3 overflow-hidden">
        <button
          onClick={() => toggle("strategies")}
          className="w-full flex items-center justify-between p-4 hover:bg-accent/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="font-semibold text-sm text-foreground">Winning Strategies — אסטרטגיות מנצחות</span>
          </div>
          {expanded.strategies ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {expanded.strategies && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {strategies.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-3 rounded-lg bg-secondary/30 border border-border/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{s.title}</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                        {s.successRate}% הצלחה
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
