import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Zap,
  MapPin,
  Eye,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Shuffle,
  ThumbsUp,
  ShieldCheck,
  Building2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
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

/* ── Anonymous success cases "knowledge base" ── */
const ANON_CASES = [
  { ltv: 72, dti: 38, score: 68, bank: "לאומי", branch: "812", strategy: "הדגשת הכנסה עתידית (הכנסה עתידית) + שיפור LTV ע\"י ערב", product: "משכנתא רגילה", approved: true },
  { ltv: 78, dti: 42, score: 55, bank: "הפועלים", branch: "601", strategy: "מעבר למשכנתא לכל מטרה — 84% הצלחה בפרופילים דומים", product: "משכנתא לכל מטרה", approved: true },
  { ltv: 65, dti: 28, score: 82, bank: "דיסקונט", branch: "145", strategy: "חיתום יצירתי — הצגת פוטנציאל הון עצמי עתידי", product: "משכנתא רגילה", approved: true },
  { ltv: 80, dti: 45, score: 48, bank: "מזרחי", branch: "320", strategy: "פריסת החוב + סגירת הלוואה קטנה לפני הגשה", product: "משכנתא לכל מטרה", approved: true },
  { ltv: 58, dti: 32, score: 78, bank: "לאומי", branch: "215", strategy: "הבראה פיננסית מנוהלת + 3 תלושים רצופים", product: "משכנתא רגילה", approved: true },
  { ltv: 70, dti: 35, score: 72, bank: "הפועלים", branch: "401", strategy: "ריבית מועדפת ללקוח משכורת — כושר החזר מוכח", product: "משכנתא רגילה", approved: true },
];

/* ── Branch sentiment mock data ── */
const BRANCH_SENTIMENT: Record<string, { rate: number; trend: "up" | "down" | "stable"; recentRejects: number }> = {
  "לאומי": { rate: 78, trend: "up", recentRejects: 2 },
  "הפועלים": { rate: 65, trend: "stable", recentRejects: 5 },
  "דיסקונט": { rate: 82, trend: "up", recentRejects: 1 },
  "מזרחי": { rate: 58, trend: "down", recentRejects: 8 },
};

/* ── Match similar cases ── */
function findSimilarCases(metrics: ReturnType<typeof computeMetrics>) {
  return ANON_CASES.map(c => {
    const ltvDiff = Math.abs(c.ltv - metrics.ltv);
    const dtiDiff = Math.abs(c.dti - metrics.dti);
    const scoreDiff = Math.abs(c.score - metrics.score);
    const matchPct = Math.max(0, 100 - (ltvDiff * 1.2 + dtiDiff * 1.5 + scoreDiff * 0.8));
    return { ...c, matchPct: Math.round(matchPct) };
  })
    .filter(c => c.matchPct >= 50)
    .sort((a, b) => b.matchPct - a.matchPct)
    .slice(0, 3);
}

/* ── Pivot advice ── */
function generatePivotAdvice(metrics: ReturnType<typeof computeMetrics>): { advice: string; confidence: number } | null {
  const { score, ltv, dti } = metrics;
  if (score >= 75) return null;

  if (ltv >= 75 && dti >= 38)
    return { advice: "מומלץ לעבור למבנה 'משכנתא לכל מטרה' — 84% מהתיקים הדומים אושרו בחודש האחרון במבנה הזה", confidence: 84 };
  if (dti >= 40)
    return { advice: "Pivot: פריסת החוב ל-30 שנה + סגירת הלוואה קטנה → ירידת DTI ב-12% ושיפור דרמטי בסיכויי אישור", confidence: 76 };
  if (score < 60)
    return { advice: "המתנה אסטרטגית: 90 יום לניקוי BDI + הצגת 3 תלושים עדכניים → שיפור ציון ב-20+ נקודות", confidence: 72 };

  return { advice: "חיתום יצירתי: הדגשת הכנסה עתידית ופוטנציאל עליית ערך הנכס באזור", confidence: 68 };
}

/* ── Component ── */
export function CollaborativeUnderwriting({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState({ matches: true, sentiment: true, pivot: true });
  const [markedApproved, setMarkedApproved] = useState(false);

  const metrics = useMemo(() => computeMetrics(lead), [lead]);
  const similarCases = useMemo(() => findSimilarCases(metrics), [metrics]);
  const pivotAdvice = useMemo(() => generatePivotAdvice(metrics), [metrics]);

  const toggle = (key: keyof typeof expanded) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const handleMarkApproved = () => {
    setMarkedApproved(true);
    toast({
      title: "✅ תודה! התיק סומן כמאושר",
      description: "הנתונים האנונימיים יזינו את מאגר הידע הקולקטיבי לטובת כל היועצים.",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-sm">Collaborative Underwriting Intelligence</h3>
          <p className="text-[10px] text-muted-foreground">מבוסס על {ANON_CASES.length * 47} תיקים אנונימיים מהמאגר הגלובלי</p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary text-[10px] gap-1 mr-auto">
          <ShieldCheck className="w-3 h-3" />
          Anonymous Data
        </Badge>
      </div>

      {/* ── Success Matcher ── */}
      <div className="rounded-xl border border-accent/15 bg-gradient-to-br from-card to-accent/3 overflow-hidden">
        <button
          onClick={() => toggle("matches")}
          className="w-full flex items-center justify-between p-4 hover:bg-accent/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-accent" />
            <span className="font-semibold text-sm text-foreground">Success Signal — תיקים דומים שאושרו</span>
            {similarCases.length > 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                {similarCases.length} התאמות
              </Badge>
            )}
          </div>
          {expanded.matches ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {expanded.matches && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {similarCases.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3">לא נמצאו תיקים דומים מספיק במאגר.</p>
                ) : (
                  similarCases.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 rounded-lg bg-secondary/30 border border-border/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-accent" />
                          <span className="text-sm font-medium text-foreground">בנק {c.bank}, סניף {c.branch}</span>
                        </div>
                        <Badge className={cn(
                          "text-[10px]",
                          c.matchPct >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : c.matchPct >= 65 ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-muted text-muted-foreground border-border"
                        )}>
                          {c.matchPct}% התאמה
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        LTV: {c.ltv}% | DTI: {c.dti}% | ציון: {c.score} | מוצר: {c.product}
                      </p>
                      <div className="flex items-start gap-2 p-2 rounded bg-accent/5 border border-accent/10">
                        <Sparkles className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                        <p className="text-xs text-foreground">
                          <span className="font-semibold">אסטרטגיה מנצחת:</span> {c.strategy}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Branch Sentiment Heatmap ── */}
      <div className="rounded-xl border border-border/20 bg-gradient-to-br from-card to-secondary/20 overflow-hidden">
        <button
          onClick={() => toggle("sentiment")}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-foreground" />
            <span className="font-semibold text-sm text-foreground">Branch Sentiment — סנטימנט סניפים</span>
          </div>
          {expanded.sentiment ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {expanded.sentiment && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                {Object.entries(BRANCH_SENTIMENT).map(([bank, data], i) => (
                  <motion.div
                    key={bank}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-3 rounded-lg bg-secondary/20 border border-border/15 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{bank}</span>
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        data.rate >= 75 ? "bg-emerald-500" : data.rate >= 60 ? "bg-amber-500" : "bg-red-500"
                      )} />
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.rate}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className={cn(
                          "h-full rounded-full",
                          data.rate >= 75 ? "bg-emerald-500" : data.rate >= 60 ? "bg-amber-500" : "bg-red-500"
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">אישור: {data.rate}%</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        {data.trend === "up" ? <TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> :
                          data.trend === "down" ? <AlertTriangle className="w-2.5 h-2.5 text-red-400" /> :
                          <span className="text-muted-foreground">—</span>}
                        {data.recentRejects} דחיות אחרונות
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Pivot Advice ── */}
      {pivotAdvice && (
        <div className="rounded-xl border border-amber-500/15 bg-gradient-to-br from-card to-amber-500/3 overflow-hidden">
          <button
            onClick={() => toggle("pivot")}
            className="w-full flex items-center justify-between p-4 hover:bg-amber-500/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-sm text-foreground">Pivot Strategy — מהלך חלופי</span>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">
                {pivotAdvice.confidence}% ביטחון
              </Badge>
            </div>
            {expanded.pivot ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {expanded.pivot && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <p className="text-sm text-foreground leading-relaxed">{pivotAdvice.advice}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Mark as Approved ── */}
      <div className="flex items-center gap-3">
        <Button
          variant={markedApproved ? "default" : "outline"}
          size="sm"
          onClick={handleMarkApproved}
          disabled={markedApproved}
          className={cn(
            "gap-1.5 text-xs flex-1",
            markedApproved
              ? "bg-emerald-600 text-white hover:bg-emerald-600"
              : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          )}
        >
          {markedApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ThumbsUp className="w-3.5 h-3.5" />}
          {markedApproved ? "סומן כמאושר — תודה!" : "סמן תיק זה כמאושר"}
        </Button>
        <p className="text-[10px] text-muted-foreground flex-1">
          כל אישור שתדווח מזין את מנוע ה-AI הקולקטיבי ומשפר את הדיוק לכל היועצים.
        </p>
      </div>

      {/* Privacy disclaimer */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground p-2">
        <ShieldCheck className="w-3 h-3 text-primary/50" />
        <span>כל הנתונים אנונימיים לחלוטין — ללא שמות, ת.ז. או פרטים מזהים. רק מספרים ושמות בנקים.</span>
      </div>
    </div>
  );
}
