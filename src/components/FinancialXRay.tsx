import { useState } from "react";
import {
  ScanLine, Shield, CreditCard, Landmark, Brain, AlertTriangle,
  Sparkles, ArrowRight, TrendingUp, Eye, Zap, CircleDollarSign,
  Activity, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

const INSIGHTS = [
  {
    id: "masleka",
    source: "מסלקה פנסיונית",
    icon: Landmark,
    color: "text-cyan-400",
    borderColor: "border-cyan-400/30",
    glowColor: "shadow-cyan-400/10",
    bgColor: "bg-cyan-400/5",
    iconBg: "bg-cyan-400/10",
    severity: "opportunity" as const,
    title: "נמצאו ₪85,000 בקרן השתלמות נזילה",
    description: "המלצה: ניתן להשתמש כהון עצמי לשיפור תנאי משכנתא. צפי לחיסכון של עד 0.3% בריבית.",
    metric: "₪85,000",
    metricLabel: "קרן השתלמות נזילה",
    action: "הכן הצעה ללקוח",
  },
  {
    id: "har",
    source: "הר הביטוח",
    icon: Shield,
    color: "text-amber-400",
    borderColor: "border-amber-400/30",
    glowColor: "shadow-amber-400/10",
    bgColor: "bg-amber-400/5",
    iconBg: "bg-amber-400/10",
    severity: "warning" as const,
    title: "זוהה ביטוח בריאות כפול (הראל + כלל)",
    description: "חיסכון פוטנציאלי ללקוח: ₪240/חודש. הזדמנות: Cross-sell ביטוח חיים במקום הכפילות.",
    metric: "₪240/חודש",
    metricLabel: "חיסכון פוטנציאלי",
    action: "צור הצעת אופטימיזציה",
  },
  {
    id: "openbanking",
    source: "Open Banking",
    icon: CreditCard,
    color: "text-red-400",
    borderColor: "border-red-400/30",
    glowColor: "shadow-red-400/10",
    bgColor: "bg-red-400/5",
    iconBg: "bg-red-400/10",
    severity: "alert" as const,
    title: "חיוב נסתר ₪89 ל-AIG בכרטיס אשראי",
    description: "ביטוח תאונות אישיות לא רשום בהר הביטוח. יש לבדוק ולבצע אופטימיזציה לתיק הביטוחי.",
    metric: "₪89/חודש",
    metricLabel: "חיוב לא ידוע",
    action: "בדוק ושפר",
  },
];

const SCAN_SOURCES = [
  { id: "masleka", label: "סנכרן מסלקה פנסיונית", icon: Landmark, color: "from-cyan-500 to-blue-600" },
  { id: "har", label: "סנכרן הר הביטוח", icon: Shield, color: "from-amber-500 to-orange-600" },
  { id: "openbanking", label: "סרוק בנק וכרטיסי אשראי", icon: CreditCard, color: "from-emerald-500 to-teal-600" },
];

export function FinancialXRay() {
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanned, setScanned] = useState(false);
  const [activeScan, setActiveScan] = useState<string | null>(null);

  const handleScan = () => {
    setScanning(true);
    setScanProgress(0);
    setActiveScan("all");

    const steps = [0, 15, 35, 52, 68, 80, 92, 100];
    steps.forEach((val, i) => {
      setTimeout(() => {
        setScanProgress(val);
        if (val === 100) {
          setTimeout(() => {
            setScanning(false);
            setScanned(true);
            setActiveScan(null);
          }, 400);
        }
      }, i * 350);
    });
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.4 } }),
  };

  return (
    <Card className="bg-card/60 border-border/40 backdrop-blur-sm overflow-hidden relative">
      {/* Decorative scan-line effect when scanning */}
      {scanning && (
        <motion.div
          className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-10"
          initial={{ top: "0%" }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}

      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-primary/20 border border-cyan-400/20">
            <ScanLine className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <span className="block">Financial X-Ray</span>
            <span className="text-[10px] font-normal text-muted-foreground">360° AI Scanner</span>
          </div>
          {scanned && (
            <Badge className="mr-auto bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
              <Activity className="w-3 h-3" /> 3 ממצאים
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Action Buttons ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SCAN_SOURCES.map((src) => (
            <Button
              key={src.id}
              onClick={handleScan}
              disabled={scanning}
              className={`h-auto py-4 px-4 flex flex-col items-center gap-2 bg-gradient-to-br ${src.color} text-white border-0 hover:opacity-90 transition-all relative overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <src.icon className="w-6 h-6" />
              <span className="text-xs font-medium text-center leading-tight">{src.label}</span>
              {scanning && activeScan === "all" && (
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-white/60"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5 }}
                />
              )}
            </Button>
          ))}
        </div>

        {/* ── Scanning Animation ── */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <div className="absolute inset-0 w-5 h-5 bg-cyan-400/20 rounded-full animate-ping" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">סורק מקורות מידע פיננסיים...</p>
                    <p className="text-[10px] text-muted-foreground">מסלקה • הר הביטוח • Open Banking</p>
                  </div>
                  <span className="mr-auto text-sm font-bold text-cyan-400">{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="h-1.5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AI Discovery Dashboard ── */}
        <AnimatePresence>
          {scanned && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-gold" />
                <h3 className="text-sm font-bold text-foreground">AI Discovery Dashboard</h3>
              </div>

              {INSIGHTS.map((insight, i) => (
                <motion.div
                  key={insight.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  className={`rounded-xl border ${insight.borderColor} ${insight.bgColor} p-4 relative overflow-hidden group hover:shadow-lg hover:${insight.glowColor} transition-all`}
                >
                  {/* Subtle glow line */}
                  <div className={`absolute top-0 right-0 w-1 h-full bg-gradient-to-b ${
                    insight.severity === "opportunity" ? "from-cyan-400 to-transparent" :
                    insight.severity === "warning" ? "from-amber-400 to-transparent" :
                    "from-red-400 to-transparent"
                  } opacity-60`} />

                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${insight.iconBg} flex-shrink-0 mt-0.5`}>
                      <insight.icon className={`w-4 h-4 ${insight.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[9px] ${insight.borderColor} ${insight.color}`}>
                          {insight.source}
                        </Badge>
                        <Badge className={`text-[9px] gap-0.5 ${
                          insight.severity === "alert" ? "bg-red-500/15 text-red-400 border-red-400/20" :
                          insight.severity === "warning" ? "bg-amber-400/15 text-amber-400 border-amber-400/20" :
                          "bg-cyan-400/15 text-cyan-400 border-cyan-400/20"
                        }`}>
                          <AlertTriangle className="w-2.5 h-2.5" />
                          AI Alert
                        </Badge>
                      </div>

                      <p className="text-sm font-semibold text-foreground mb-1">{insight.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{insight.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`px-2.5 py-1 rounded-lg ${insight.bgColor} border ${insight.borderColor}`}>
                            <span className={`text-sm font-bold ${insight.color}`}>{insight.metric}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{insight.metricLabel}</span>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-7 text-[11px] ${insight.color} hover:${insight.bgColor} gap-1`}
                        >
                          {insight.action}
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!scanning && !scanned && (
          <div className="text-center py-6 border border-dashed border-border/40 rounded-xl">
            <Eye className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">לחץ על אחד הכפתורים למעלה כדי להפעיל סריקת AI</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
