import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ShieldAlert,
  Zap,
  Brain,
  ScanLine,
  XCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ── Credit Gauge ──────────────────────────── */
const GAUGE_CX = 150;
const GAUGE_CY = 140;
const GAUGE_R = 110;
const GAUGE_STROKE = 18;
const GAUGE_SWEEP = 180; // semicircle
const GAUGE_START = 180; // left

const polarToSvg = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
};

const arcPath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const start = polarToSvg(cx, cy, r, startAngle);
  const end = polarToSvg(cx, cy, r, endAngle);
  const sweep = startAngle - endAngle;
  const largeArc = Math.abs(sweep) > 180 ? 1 : 0;
  const dir = sweep > 0 ? 1 : 0;
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${r} ${r} 0 ${largeArc} ${dir} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
};

function CreditGauge({ score, animating }: { score: number | null; animating: boolean }) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (score === null || !nodeRef.current) return;
    const controls = animate(0, score, {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) {
        if (nodeRef.current) nodeRef.current.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [score]);

  const displayScore = score ?? 0;
  const scoreAngle = GAUGE_START - (displayScore / 850) * GAUGE_SWEEP;

  const getScoreColor = (s: number) => {
    if (s >= 700) return { color: "hsl(var(--success))", label: "מצוין", labelClass: "text-success" };
    if (s >= 550) return { color: "hsl(var(--warning))", label: "בינוני", labelClass: "text-warning" };
    return { color: "hsl(var(--destructive))", label: "נמוך", labelClass: "text-destructive" };
  };

  const info = score !== null ? getScoreColor(displayScore) : { color: "hsl(var(--muted-foreground))", label: "ממתין לסריקה", labelClass: "text-muted-foreground" };

  // Gradient zones
  const redArc = arcPath(GAUGE_CX, GAUGE_CY, GAUGE_R, 180, 180 - 60);
  const yellowArc = arcPath(GAUGE_CX, GAUGE_CY, GAUGE_R, 120, 120 - 55);
  const greenArc = arcPath(GAUGE_CX, GAUGE_CY, GAUGE_R, 65, 65 - 65);

  // Needle
  const needleTip = polarToSvg(GAUGE_CX, GAUGE_CY, GAUGE_R - GAUGE_STROKE / 2 - 12, score !== null ? scoreAngle : 180);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 165" className="w-full max-w-[320px]">
        {/* Background arc */}
        <path d={arcPath(GAUGE_CX, GAUGE_CY, GAUGE_R, 180, 0)} fill="none" stroke="hsl(var(--border))" strokeWidth={GAUGE_STROKE} strokeLinecap="round" />
        {/* Red zone */}
        <path d={redArc} fill="none" stroke="hsl(var(--destructive))" strokeWidth={GAUGE_STROKE} strokeLinecap="round" opacity="0.3" />
        {/* Yellow zone */}
        <path d={yellowArc} fill="none" stroke="hsl(var(--warning))" strokeWidth={GAUGE_STROKE} strokeLinecap="round" opacity="0.3" />
        {/* Green zone */}
        <path d={greenArc} fill="none" stroke="hsl(var(--success))" strokeWidth={GAUGE_STROKE} strokeLinecap="round" opacity="0.3" />

        {/* Active arc */}
        {score !== null && (
          <motion.path
            d={arcPath(GAUGE_CX, GAUGE_CY, GAUGE_R, 180, scoreAngle)}
            fill="none"
            stroke={info.color}
            strokeWidth={GAUGE_STROKE}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          />
        )}

        {/* Needle */}
        {score !== null && (
          <motion.line
            x1={GAUGE_CX} y1={GAUGE_CY}
            x2={needleTip.x} y2={needleTip.y}
            stroke={info.color}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          />
        )}
        <circle cx={GAUGE_CX} cy={GAUGE_CY} r="6" fill={score !== null ? info.color : "hsl(var(--muted-foreground))"} />

        {/* Score text */}
        <text x={GAUGE_CX} y={GAUGE_CY - 25} textAnchor="middle" fill="currentColor" className="text-foreground" style={{ fontSize: score !== null ? "36px" : "16px", fontWeight: 800 }}>
          {score !== null ? (
            <tspan ref={nodeRef as any}>0</tspan>
          ) : (
            <tspan>—</tspan>
          )}
        </text>
        {score !== null && (
          <text x={GAUGE_CX} y={GAUGE_CY - 5} textAnchor="middle" fill="currentColor" style={{ fontSize: "11px" }} className="text-muted-foreground">
            מתוך 850
          </text>
        )}

        {/* Scale labels */}
        <text x="30" y="148" fill="currentColor" style={{ fontSize: "10px" }} className="text-muted-foreground">300</text>
        <text x="260" y="148" fill="currentColor" style={{ fontSize: "10px" }} className="text-muted-foreground">850</text>
      </svg>
      <div className="text-center -mt-1">
        <span className={cn("text-sm font-bold", info.labelClass)}>{info.label}</span>
      </div>
    </div>
  );
}

/* ── AI Risk Insights ──────────────────────── */
interface RiskInsight {
  id: string;
  type: "warning" | "danger" | "success";
  title: string;
  description: string;
  impact: string;
}

const DEMO_INSIGHTS: RiskInsight[] = [
  {
    id: "1",
    type: "danger",
    title: "פיגור בתשלום אשראי",
    description: "זוהו 2 תשלומי אשראי באיחור של 30+ יום בחצי שנה האחרונה",
    impact: "השפעה גבוהה על דירוג",
  },
  {
    id: "2",
    type: "warning",
    title: "ניצול אשראי גבוה",
    description: "72% מהמסגרת המאושרת מנוצלת — מעל הסף המומלץ של 30%",
    impact: "מוריד דירוג ב-40 נקודות",
  },
  {
    id: "3",
    type: "warning",
    title: "ריבוי בקשות אשראי",
    description: "4 בדיקות אשראי חדשות ב-6 חודשים האחרונים",
    impact: "מוריד דירוג ב-15 נקודות",
  },
  {
    id: "4",
    type: "success",
    title: "היסטוריה ארוכה",
    description: "8+ שנות היסטוריית אשראי — מעולה!",
    impact: "תורם חיובית",
  },
];

const insightStyles = {
  danger: { icon: ShieldAlert, border: "border-destructive/30", bg: "bg-destructive/5", text: "text-destructive", badge: "bg-destructive/10 text-destructive border-destructive/30" },
  warning: { icon: AlertTriangle, border: "border-warning/30", bg: "bg-warning/5", text: "text-warning", badge: "bg-warning/10 text-warning border-warning/30" },
  success: { icon: CheckCircle2, border: "border-success/30", bg: "bg-success/5", text: "text-success", badge: "bg-success/10 text-success border-success/30" },
};

/* ── Main Component ────────────────────────── */
export function CreditScoreAnalyzer() {
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleUpload = useCallback(() => {
    setPdfUploaded(true);
    setScanning(true);
    setAnalyzed(false);
    setScore(null);

    // Simulate AI processing
    setTimeout(() => {
      setScore(623);
      setTimeout(() => {
        setScanning(false);
        setAnalyzed(true);
      }, 1500);
    }, 2500);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload();
  }, [handleUpload]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-primary/20 border border-cyan-500/20">
          <CreditCard className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">מנתח דירוג אשראי</h3>
          <p className="text-[11px] text-muted-foreground">העלה דוח בנק ישראל לניתוח AI מיידי</p>
        </div>
        {analyzed && (
          <Badge className="mr-auto text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            <Brain className="w-3 h-3 ml-1" />
            נותח בהצלחה
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* ── Gauge + Upload Panel (3 cols) ─── */}
        <div className="lg:col-span-3 relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-6">
          {/* Ambient effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-30%] right-[-20%] w-[350px] h-[350px] rounded-full bg-cyan-500/[0.04] blur-[80px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[250px] h-[250px] rounded-full bg-primary/[0.04] blur-[60px]" />
          </div>

          <div className="relative space-y-5">
            {/* Gauge */}
            <div className="relative">
              <CreditGauge score={score} animating={scanning} />
              {/* Scanning overlay on gauge */}
              <AnimatePresence>
                {scanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div
                      className="absolute top-[20%] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_16px_4px_hsl(var(--cyan-glow)/0.5)]"
                      animate={{ top: ["20%", "80%", "20%"] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Upload Drop Zone */}
            {!pdfUploaded ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUpload}
                className={cn(
                  "border-2 border-dashed rounded-xl p-5 text-center transition-all duration-300 cursor-pointer group",
                  isDragging
                    ? "border-cyan-400 bg-cyan-500/[0.06] scale-[1.01]"
                    : "border-border/40 hover:border-cyan-500/40 hover:bg-cyan-500/[0.02]"
                )}
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-primary/10 border border-cyan-500/20 flex items-center justify-center group-hover:shadow-[0_0_20px_hsl(var(--cyan-glow)/0.2)]"
                >
                  <Upload className="w-5 h-5 text-cyan-400" />
                </motion.div>
                <p className="text-sm font-semibold text-foreground">העלה דוח אשראי בנק ישראל (PDF)</p>
                <p className="text-xs text-muted-foreground mt-1">גרור ושחרר או לחץ כאן • קובץ PDF בלבד</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04]"
              >
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">דוח_אשראי_בנק_ישראל_2024.pdf</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>245 KB</span>
                    <span className="opacity-30">•</span>
                    {scanning ? (
                      <motion.span
                        className="text-cyan-400 flex items-center gap-1"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <ScanLine className="w-3 h-3" />
                        סורק...
                      </motion.span>
                    ) : (
                      <span className="text-success flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        ניתוח הושלם
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground text-xs"
                  onClick={() => { setPdfUploaded(false); setAnalyzed(false); setScore(null); setScanning(false); }}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Quick Stats (2 cols) ─── */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {[
            { label: "יחס החזר חודשי", value: analyzed ? "38%" : "—", status: analyzed ? "warning" as const : null, icon: TrendingUp, tip: "מומלץ מתחת ל-33%" },
            { label: "מסגרת אשראי מנוצלת", value: analyzed ? "72%" : "—", status: analyzed ? "danger" as const : null, icon: CreditCard, tip: "מומלץ מתחת ל-30%" },
            { label: "תשלומים בפיגור", value: analyzed ? "2" : "—", status: analyzed ? "danger" as const : null, icon: Clock, tip: "משפיע ישירות על דירוג" },
            { label: "גיל תיק אשראי", value: analyzed ? "8 שנים" : "—", status: analyzed ? "success" as const : null, icon: Zap, tip: "ותק ארוך = יתרון" },
          ].map((stat, i) => {
            const statusColor = stat.status === "danger" ? "text-destructive" : stat.status === "warning" ? "text-warning" : stat.status === "success" ? "text-success" : "text-muted-foreground";
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: analyzed ? 0.2 + i * 0.1 : 0, duration: 0.4 }}
                className="flex-1 rounded-xl border border-border/40 bg-card/40 backdrop-blur-xl p-4 flex items-center gap-3 hover:border-cyan-500/20 transition-all group"
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  stat.status ? (stat.status === "danger" ? "bg-destructive/10" : stat.status === "warning" ? "bg-warning/10" : "bg-success/10") : "bg-secondary/60"
                )}>
                  <Icon className={cn("w-4 h-4", statusColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  <p className={cn("text-lg font-bold tabular-nums", statusColor)}>{stat.value}</p>
                </div>
                {analyzed && (
                  <p className="text-[9px] text-muted-foreground max-w-[80px] text-left leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
                    {stat.tip}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── AI Recommendations ──────────────── */}
      <AnimatePresence>
        {analyzed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-primary/10 border border-cyan-500/20">
                <Brain className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">המלצות AI</h4>
                <p className="text-[11px] text-muted-foreground">ניתוח אוטומטי של גורמי סיכון ושיפור</p>
              </div>
              <Badge className="mr-auto text-[10px] bg-primary/10 text-primary border-primary/30">
                <Zap className="w-3 h-3 ml-1" />
                4 תובנות
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_INSIGHTS.map((insight, i) => {
                const style = insightStyles[insight.type];
                const Icon = style.icon;
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={cn(
                      "rounded-xl border p-4 space-y-2 hover:scale-[1.01] transition-all cursor-default",
                      style.border, style.bg
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", style.text)} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-semibold", style.text)}>{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px]", style.badge)}>
                      {insight.impact}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>

            {/* Action recommendation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/[0.06] to-primary/[0.06] border border-cyan-500/20"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 shrink-0">
                  <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">המלצת שיפור מיידית</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    סגור הלוואת צריכה אחת (₪850/חודש) והורד ניצול אשראי מ-72% ל-45%. 
                    צפוי לשפר את הדירוג ב-55+ נקודות ולהעלות סיכויי אישור משכנתא ל-87%.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="text-[10px] bg-success/10 text-success border-success/30">
                      +55 נקודות דירוג
                    </Badge>
                    <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                      87% סיכויי אישור
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state for insights */}
      {!analyzed && !scanning && (
        <div className="rounded-2xl border border-dashed border-border/30 bg-card/20 backdrop-blur-sm p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-secondary/40 flex items-center justify-center">
            <Brain className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">המלצות AI יופיעו כאן</p>
          <p className="text-xs text-muted-foreground/60 mt-1">העלה דוח אשראי לקבלת ניתוח מעמיק ותובנות מותאמות</p>
        </div>
      )}
    </motion.div>
  );
}
