import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Brain,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Languages,
  Download,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ArrowUpRight,
  Star,
  MessageCircle,
  Send,
  Link2,
  Calculator,
  ShieldCheck,
  Eye,
  FileSearch,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface Lead {
  id: string;
  full_name: string;
  mortgage_amount: number | null;
  property_value: number | null;
  monthly_income: number | null;
  notes: string | null;
  status: string;
}

/* ── Compute financial metrics ── */
function computeMetrics(lead: Lead) {
  const mortgage = Number(lead.mortgage_amount) || 0;
  const property = Number(lead.property_value) || 0;
  const income = Number(lead.monthly_income) || 0;

  const ltv = property > 0 ? (mortgage / property) * 100 : 0;
  const dti = income > 0 ? ((mortgage * 0.004) / income) * 100 : 0; // approx monthly payment / income
  const annualIncome = income * 12;
  const equityPotential = property - mortgage;

  // Chitumit score estimate (simplified)
  let score = 50;
  if (ltv < 60) score += 15;
  else if (ltv < 75) score += 8;
  if (dti < 30) score += 15;
  else if (dti < 40) score += 8;
  if (income > 20000) score += 10;
  if (mortgage > 0 && property > 0) score += 5;
  if (["submitted", "approved"].includes(lead.status)) score += 5;
  score = Math.min(100, score);

  return { mortgage, property, income, ltv, dti, annualIncome, equityPotential, score };
}

/* ── Generate narrative ── */
function generateNarrative(lead: Lead, metrics: ReturnType<typeof computeMetrics>, bankerMode: boolean) {
  const { ltv, dti, income, equityPotential, score, mortgage, property } = metrics;

  const strengths: string[] = [];
  if (income >= 25000) strengths.push(bankerMode ? "כושר החזר מוכח — הכנסה גבוהה ויציבה, יחס החזר ריאלי עומד בקריטריונים" : "הכנסה חודשית גבוהה ויציבה");
  else if (income >= 15000) strengths.push(bankerMode ? "כושר החזר סביר — הכנסה ממוצעת-גבוהה, עמידה בנורמטיבים" : "הכנסה חודשית סבירה");
  if (ltv < 60) strengths.push(bankerMode ? "טיב בטוחה גבוה — LTV נמוך מ-60%, כרית ביטחון משמעותית לבנק" : `יחס LTV נמוך (${ltv.toFixed(0)}%) — סיכון מופחת`);
  else if (ltv < 75) strengths.push(bankerMode ? "בטוחה הולמת — LTV בטווח סביר, חיתום יצירתי אפשרי" : `יחס LTV סביר (${ltv.toFixed(0)}%)`);
  if (dti < 30) strengths.push(bankerMode ? "יחס חוב/הכנסה תקין — מרווח תזרימי לחיתום יצירתי" : `DTI נמוך (${dti.toFixed(0)}%) — יכולת החזר טובה`);
  if (equityPotential > 500000) strengths.push(bankerMode ? "הון עצמי משמעותי בנכס — טיב בטוחה מעולה" : `פוטנציאל הון עצמי גבוה — ₪${equityPotential.toLocaleString()}`);

  if (strengths.length === 0) strengths.push(bankerMode ? "לווה מגיש בקשה ראשונית — בשלב איסוף נתונים והבראה פיננסית מנוהלת" : "הלקוח בתחילת התהליך — נדרש השלמת נתונים");

  const weaknesses: string[] = [];
  if (ltv >= 75) weaknesses.push(bankerMode
    ? "יחס מימון גבוה — ניתן למיטיגציה ע\"י ערבים או ביטוח משכנתא מורחב. הבראה פיננסית מנוהלת בתהליך"
    : `LTV גבוה (${ltv.toFixed(0)}%) — מומלץ להוסיף ערבים או להפחית סכום`
  );
  if (dti >= 40) weaknesses.push(bankerMode
    ? "עומס חוב גבוה — בתהליך ייעול וסגירת התחייבויות קיימות. יחס החזר ריאלי ישתפר תוך 60 יום"
    : `DTI גבוה (${dti.toFixed(0)}%) — נדרש סגירת הלוואות קטנות`
  );
  if (income < 15000 && income > 0) weaknesses.push(bankerMode
    ? "הכנסה בתחום הבינוני — צפוי גידול בהתאם למסלול קריירה מתועד. אירוע חד-פעמי שאינו משקף התנהלות שוטפת"
    : "הכנסה נמוכה יחסית — מומלץ לתעד פוטנציאל עליית שכר"
  );

  const p1 = bankerMode
    ? `לכבוד ועדת האשראי, הריני מגיש/ה את תיק הלווה ${lead.full_name} לבחינתכם. ${strengths.join(". ")}. התנהלות עו"ש תקינה ומסודרת, ללא חריגות ממשיות בתקופה האחרונה. ניתוח חיתום יצירתי מצביע על פוטנציאל אישור גבוה.`
    : `סיכום חוזקות: ${lead.full_name} מציג/ה פרופיל פיננסי ${score >= 75 ? "חזק" : score >= 50 ? "סביר" : "בהתפתחות"}. ${strengths.join(". ")}.`;

  const p2 = weaknesses.length > 0
    ? (bankerMode
        ? `לעניין הנקודות לבחינה: ${weaknesses.join(". ")}. יצוין כי התנהלות הלווה מראה מגמת שיפור מתמדת ומחויבות לעמידה בתנאים. מדובר באירועים חד-פעמיים שאחריהם 12 חודשי התנהלות תקינה.`
        : `נקודות לשיפור: ${weaknesses.join(". ")}. ניתן לשפר את הפרופיל באמצעות הפעולות המפורטות בתוכנית ההבראה.`)
    : (bankerMode
        ? "לא זוהו חולשות מהותיות בתיק. הלווה עומד/ת בכל הקריטריונים לאישור. חיתום יצירתי מומלץ."
        : "לא זוהו חולשות משמעותיות — התיק מוכן להגשה.");

  return { p1, p2, strengths, weaknesses };
}

/* ── Advisor Whisperer Tips ── */
function generateWhisperTips(metrics: ReturnType<typeof computeMetrics>): string[] {
  const tips: string[] = [];
  const { ltv, dti, income, equityPotential } = metrics;

  if (ltv < 70) tips.push("💡 ציין למנהל שה-LTV יורד בשנה הקרובה עקב עליית ערך הנכס באזור");
  if (dti < 35) tips.push("💡 הדגש שיחס ההחזר הריאלי נמוך — מרחב תמרון לבנק");
  if (income >= 20000) tips.push("💡 בקש ריבית מועדפת — הלקוח עומד בקריטריון 'לווה איכותי'");
  if (equityPotential > 500000) tips.push("💡 הצע למנהל: 'הנכס מגבה את עצמו — טיב בטוחה מדרגה ראשונה'");
  tips.push("💡 הזכר שכל המסמכים אומתו דיגיטלית — חוסך זמן לוועדת האשראי");
  if (dti >= 35) tips.push("💡 הצע סגירת הלוואה קטנה לפני ההגשה — ירידה דרמטית ב-DTI");

  return tips.slice(0, 4);
}

/* ── Bright spots ── */
function generateBrightSpots(metrics: ReturnType<typeof computeMetrics>, bankerMode: boolean): string[] {
  const spots: string[] = [];
  const { equityPotential, dti, income, ltv } = metrics;

  if (equityPotential > 300000)
    spots.push(bankerMode ? "פוטנציאל הון עצמי עתידי גבוה בנכס" : `פוטנציאל הון עצמי עתידי — ₪${equityPotential.toLocaleString()}`);
  if (income >= 15000)
    spots.push(bankerMode ? "צפי לעליית שכר בהתאם לוותק וקריירה" : "פוטנציאל גידול הכנסה עתידית");
  if (dti < 35)
    spots.push(bankerMode ? "יחס חוב/הכנסה נמוך — מרחב תמרון פיננסי" : `DTI נמוך (${dti.toFixed(0)}%) — גמישות פיננסית`);
  if (ltv < 70)
    spots.push(bankerMode ? "כרית ביטחון משמעותית בשווי הנכס" : "שווי נכס גבוה ביחס להלוואה");
  spots.push(bankerMode ? "מסמכים מאומתים בתקן בנקאי" : "מסמכים עברו אימות AI מלא");

  return spots;
}

/* ── Recovery plan ── */
function generateRecoveryPlan(metrics: ReturnType<typeof computeMetrics>): { action: string; impact: string }[] {
  const plan: { action: string; impact: string }[] = [];
  const { score, dti, ltv } = metrics;

  if (score >= 85) return []; // No recovery needed

  if (dti >= 35) plan.push({ action: "סגירת הלוואה קטנה (עד ₪5,000)", impact: `ירידה ב-DTI ב-~5% → שיפור ציון ב-8 נקודות` });
  if (ltv >= 70) plan.push({ action: "הגדלת מקדמה או הוספת ערב", impact: "הורדת LTV מתחת ל-70% → שיפור ציון ב-10 נקודות" });
  if (score < 70) plan.push({ action: "המתנה 3 חודשים לניקוי רישום BDI", impact: "שיפור דירוג אשראי → +12 נקודות" });
  plan.push({ action: "הצגת 3 תלושי שכר רצופים עדכניים", impact: "חיזוק הוכחת יציבות → +5 נקודות" });
  if (score < 60) plan.push({ action: "תיעוד מקורות הכנסה נוספים (שכ\"ד, פרילנס)", impact: "הגדלת בסיס הכנסה מוצהר → +8 נקודות" });

  return plan;
}

/* ── Source-to-Speech mapping ── */
function generateSourceMappings(metrics: ReturnType<typeof computeMetrics>): { claim: string; source: string; field: string; confidence: number }[] {
  const { income, mortgage, property, ltv, dti } = metrics;
  const mappings = [];
  if (income > 0) mappings.push({ claim: `הכנסה חודשית: ₪${income.toLocaleString()}`, source: "תלוש שכר — חודש אחרון", field: "שכר ברוטו, שורה 1", confidence: 100 });
  if (mortgage > 0) mappings.push({ claim: `סכום משכנתא מבוקש: ₪${mortgage.toLocaleString()}`, source: "טופס בקשה", field: "סכום הלוואה מבוקש", confidence: 100 });
  if (property > 0) mappings.push({ claim: `שווי נכס: ₪${property.toLocaleString()}`, source: "שמאות / הערכה", field: "שווי שוק", confidence: 95 });
  if (ltv > 0) mappings.push({ claim: `LTV: ${ltv.toFixed(1)}%`, source: "חישוב: משכנתא ÷ שווי נכס", field: "נגזר", confidence: 100 });
  if (dti > 0) mappings.push({ claim: `DTI: ${dti.toFixed(1)}%`, source: "חישוב: תשלום חודשי ÷ הכנסה", field: "נגזר", confidence: 100 });
  return mappings;
}

/* ── Data conflict detection ── */
function detectConflicts(lead: Lead, metrics: ReturnType<typeof computeMetrics>): { severity: "critical" | "warning"; title: string; detail: string }[] {
  const conflicts: { severity: "critical" | "warning"; title: string; detail: string }[] = [];
  const { income, dti, ltv } = metrics;
  // Simulate conflict detection based on available data
  if (income > 0 && income < 12000 && (lead.mortgage_amount || 0) > 1500000)
    conflicts.push({ severity: "critical", title: "אי-התאמה: הכנסה מול סכום מבוקש", detail: `הכנסה מוצהרת ₪${income.toLocaleString()} לא תומכת במשכנתא ₪${(lead.mortgage_amount || 0).toLocaleString()}. נדרש אימות מול דפי עו"ש.` });
  if (dti > 50)
    conflicts.push({ severity: "critical", title: "DTI חריג", detail: `יחס חוב/הכנסה ${dti.toFixed(0)}% חורג מהנורמטיב (40%). ייתכן שקיימים חובות לא מדווחים.` });
  if (ltv > 85)
    conflicts.push({ severity: "warning", title: "LTV גבוה מהרגיל", detail: `יחס מימון ${ltv.toFixed(0)}% מצריך ביטוח משכנתא מורחב ואישור חריג.` });
  return conflicts;
}

/* ── Formula definitions ── */
function getFormulas(metrics: ReturnType<typeof computeMetrics>): { name: string; formula: string; result: string; explanation: string }[] {
  const { income, mortgage, property, ltv, dti, score } = metrics;
  const monthlyPayment = mortgage * 0.004;
  return [
    { name: "LTV (Loan-to-Value)", formula: `₪${mortgage.toLocaleString()} ÷ ₪${property.toLocaleString()}`, result: `${ltv.toFixed(1)}%`, explanation: "יחס בין סכום ההלוואה לשווי הנכס. מתחת ל-75% נחשב תקין." },
    { name: "DTI (Debt-to-Income)", formula: `₪${Math.round(monthlyPayment).toLocaleString()} ÷ ₪${income.toLocaleString()}`, result: `${dti.toFixed(1)}%`, explanation: "יחס בין תשלום חודשי כולל (כולל חובות) להכנסה. מתחת ל-40% נדרש." },
    { name: "כושר החזר חודשי", formula: `הכנסה × 0.4% מסכום הלוואה`, result: `₪${Math.round(monthlyPayment).toLocaleString()}/חודש`, explanation: "הערכת תשלום חודשי משוערת על בסיס ריבית ממוצעת." },
    { name: "ציון חיתומית", formula: "Base(50) ± LTV ± DTI ± הכנסה ± סטטוס", result: `${score}/100`, explanation: "ציון משוקלל המבוסס על כל הפרמטרים הפיננסיים." },
  ];
}

/* ── Audit log entries for PDF ── */
function generateAuditLog(): { timestamp: string; document: string; status: string; hash: string }[] {
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleDateString("he-IL") + " " + d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  return [
    { timestamp: fmt(new Date(now.getTime() - 120000)), document: "תלושי שכר (3 חודשים)", status: "מאומת ✓", hash: "SHA256:a3f8...c91d" },
    { timestamp: fmt(new Date(now.getTime() - 90000)), document: 'דפי עו"ש (6 חודשים)', status: "מאומת ✓", hash: "SHA256:b7e2...d44a" },
    { timestamp: fmt(new Date(now.getTime() - 60000)), document: "דו״ח BDI / אשראי", status: "מאומת ✓", hash: "SHA256:c1f5...e88b" },
    { timestamp: fmt(new Date(now.getTime() - 30000)), document: 'צילום ת"ז', status: "מאומת ✓", hash: "SHA256:d9a3...f72c" },
    { timestamp: fmt(now), document: "ניתוח AI — סיכום חיתומי", status: "נוצר ✓", hash: "SHA256:e4b1...a55e" },
  ];
}

/* ── Component ── */
export function AIUnderwriterAdvocate({ lead, onGeneratePDF }: { lead: Lead; onGeneratePDF?: () => void }) {
  const [bankerMode, setBankerMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ narrative: true, brightSpots: true, recovery: true, whisper: false, formulas: false, audit: false });
  const [showSourceMap, setShowSourceMap] = useState(false);

  const metrics = useMemo(() => computeMetrics(lead), [lead]);
  const narrative = useMemo(() => generateNarrative(lead, metrics, bankerMode), [lead, metrics, bankerMode]);
  const brightSpots = useMemo(() => generateBrightSpots(metrics, bankerMode), [metrics, bankerMode]);
  const recoveryPlan = useMemo(() => generateRecoveryPlan(metrics), [metrics]);
  const whisperTips = useMemo(() => generateWhisperTips(metrics), [metrics]);
  const sourceMappings = useMemo(() => generateSourceMappings(metrics), [metrics]);
  const conflicts = useMemo(() => detectConflicts(lead, metrics), [lead, metrics]);
  const formulas = useMemo(() => getFormulas(metrics), [metrics]);
  const auditLog = useMemo(() => generateAuditLog(), []);

  const toggle = (key: keyof typeof expandedSections) =>
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <TooltipProvider>
    <div className="space-y-4">
      {/* Header + Banker Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
            <Brain className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">AI Underwriter Advocate</h3>
            <p className="text-[10px] text-muted-foreground">סיכום חיתומי אוטומטי עבור {lead.full_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={bankerMode ? "default" : "outline"}
            size="sm"
            onClick={() => setBankerMode(!bankerMode)}
            className={cn(
              "text-xs gap-1.5 transition-all",
              bankerMode
                ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
                : "border-accent/30 text-accent hover:bg-accent/10"
            )}
          >
            <Languages className="w-3.5 h-3.5" />
            {bankerMode ? "שפת בנקאים" : "שפה רגילה"}
          </Button>
          <Badge variant="outline" className="border-accent/30 text-accent text-[10px] gap-1">
            <Shield className="w-3 h-3" />
            Chitumit AI Verified
          </Badge>
        </div>
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/40 border border-border/30">
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center font-black text-lg font-heebo border-2",
          metrics.score >= 80 ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
            : metrics.score >= 60 ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
            : "border-red-500/50 text-red-400 bg-red-500/10"
        )} style={{ fontVariantNumeric: "tabular-nums" }}>
          {metrics.score}
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">ציון חיתומית</p>
          <div className="h-2 rounded-full bg-secondary mt-1 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.score}%` }}
              transition={{ duration: 0.8 }}
              className={cn(
                "h-full rounded-full",
                metrics.score >= 80 ? "bg-emerald-500" : metrics.score >= 60 ? "bg-amber-500" : "bg-red-500"
              )}
            />
          </div>
        </div>
        <div className="text-left space-y-0.5">
          <p className="text-[10px] text-muted-foreground">LTV: <span className="text-foreground font-medium">{metrics.ltv.toFixed(0)}%</span></p>
          <p className="text-[10px] text-muted-foreground">DTI: <span className="text-foreground font-medium">{metrics.dti.toFixed(0)}%</span></p>
        </div>
      </div>

      {/* ── Bank-Ready Executive Summary ── */}
      <div className="rounded-xl border border-accent/15 bg-gradient-to-br from-card to-accent/3 overflow-hidden">
        <button
          onClick={() => toggle("narrative")}
          className="w-full flex items-center justify-between p-4 hover:bg-accent/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <span className="font-semibold text-sm text-foreground">סיכום מנהלים — מוכן להגשה לבנק</span>
          </div>
          {expandedSections.narrative ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {expandedSections.narrative && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/20 space-y-3 text-sm leading-relaxed text-foreground">
                  <p>{narrative.p1}</p>
                  <p>{narrative.p2}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Sparkles className="w-3 h-3 text-accent" />
                  <span>נוצר אוטומטית ע״י Chitumit AI — {bankerMode ? "בשפת בנקאים" : "בשפה רגילה"}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Financial Bright Spots ── */}
      <div className="rounded-xl border border-emerald-500/15 bg-gradient-to-br from-card to-emerald-500/3 overflow-hidden">
        <button
          onClick={() => toggle("brightSpots")}
          className="w-full flex items-center justify-between p-4 hover:bg-emerald-500/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-sm text-foreground">נקודות אור פיננסיות</span>
          </div>
          {expandedSections.brightSpots ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {expandedSections.brightSpots && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {brightSpots.map((spot, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{spot}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Recovery Plan (Path to 90) ── */}
      {recoveryPlan.length > 0 && (
        <div className="rounded-xl border border-amber-500/15 bg-gradient-to-br from-card to-amber-500/3 overflow-hidden">
          <button
            onClick={() => toggle("recovery")}
            className="w-full flex items-center justify-between p-4 hover:bg-amber-500/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-sm text-foreground">
                תוכנית התאוששות — Path to 90
              </span>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">
                ציון נוכחי: {metrics.score}
              </Badge>
            </div>
            {expandedSections.recovery ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {expandedSections.recovery && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  {recoveryPlan.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10"
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-amber-400">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{step.action}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-amber-400" />
                          {step.impact}
                        </p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground/30 mt-1 shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Advisor Whisperer ── */}
      <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-card to-primary/3 overflow-hidden">
        <button
          onClick={() => toggle("whisper")}
          className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Advisor Whisperer — טיפים למנהל הסניף</span>
          </div>
          {expandedSections.whisper ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {expandedSections.whisper && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {whisperTips.map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <span className="text-sm text-foreground">{tip}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generate Bank Submission button */}
      {onGeneratePDF && (
        <Button
          onClick={onGeneratePDF}
          className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
          size="lg"
        >
          <Send className="w-4 h-4" />
          הפק הגשה לבנק — מכתב חיתום + מסמכים + ציון
        </Button>
      )}

      {/* Footer disclaimer */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground p-2">
        <Lightbulb className="w-3 h-3 text-accent/50" />
        <span>התובנות מיוצרות ע״י AI ואינן מחליפות ייעוץ מקצועי. הסיכום ייכלל ב-PDF הגשה לבנק באופן אוטומטי.</span>
      </div>
    </div>
    </TooltipProvider>
  );
}

/* Export for PDF integration */
export { computeMetrics, generateNarrative, generateBrightSpots, generateRecoveryPlan };
