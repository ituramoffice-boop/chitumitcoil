import { useState, useEffect } from "react";
import {
  ScanLine, Shield, CreditCard, Landmark, Brain, AlertTriangle,
  Sparkles, Lock, CheckCircle2, Clock, Send, FileDown,
  Activity, ChevronRight, Eye, Fingerprint, MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { exportXRayToPdf } from "@/components/XRayPdfExport";

/* ── Types ── */
interface FinancialXRayProps {
  leadId?: string;
  clientName?: string;
}

interface Insight {
  id: string;
  source: string;
  icon: typeof Landmark;
  color: string;
  borderColor: string;
  bgColor: string;
  iconBg: string;
  severity: "opportunity" | "warning" | "alert";
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  action: string;
}

/* ── Consent Items ── */
const CONSENTS = [
  { id: "poa", label: "ייפוי כוח" },
  { id: "har", label: "הסכמת הר הביטוח" },
  { id: "openbanking", label: "Open Banking API" },
];

const SCAN_SOURCES = [
  { id: "masleka", label: "סנכרן מסלקה פנסיונית", icon: Landmark, color: "from-cyan-500 to-blue-600", whatsappMsg: "שלום {name} 👋\nאני צריך לשלוף את נתוני המסלקה הפנסיונית שלך לצורך ניתוח מקיף. אפשר בבקשה להיכנס לאתר המסלקה ולשתף את הדוח? 📊\nתודה!" },
  { id: "har", label: "סנכרן הר הביטוח", icon: Shield, color: "from-amber-500 to-orange-600", whatsappMsg: "שלום {name} 👋\nאני צריך גישה לנתוני הר הביטוח שלך כדי לזהות כפילויות ולבדוק פוליסות. אפשר להיכנס ל-https://har-habituach.gov.il ולשתף את הדוח? 🛡️\nתודה!" },
  { id: "openbanking", label: "סרוק בנק וכרטיסי אשראי", icon: CreditCard, color: "from-emerald-500 to-teal-600", whatsappMsg: "שלום {name} 👋\nלצורך הניתוח הפיננסי, אני צריך תדפיסי עו\"ש ופירוט כרטיס אשראי (3 חודשים אחרונים). אפשר להוריד מהאפליקציה של הבנק ולשלוח? 🏦\nתודה!" },
];

/* ── Helpers ── */
function formatCurrency(val: number): string {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(val);
}

function buildInsights(
  lead: { full_name: string; mortgage_amount: number | null; property_value: number | null; monthly_income: number | null } | null,
  policies: { policy_type: string; monthly_premium: number | null; insurance_company: string | null; coverage_amount: number | null; status: string }[]
): Insight[] {
  const insights: Insight[] = [];

  // 1. Masleka insight — equity / pension analysis based on lead financials
  if (lead?.mortgage_amount && lead?.property_value) {
    const equity = lead.property_value - lead.mortgage_amount;
    if (equity > 0) {
      insights.push({
        id: "masleka",
        source: "מסלקה פנסיונית",
        icon: Landmark,
        color: "text-cyan-400",
        borderColor: "border-cyan-400/30",
        bgColor: "bg-cyan-400/5",
        iconBg: "bg-cyan-400/10",
        severity: "opportunity",
        title: `נמצא הון עצמי של ${formatCurrency(equity)} (שווי נכס vs. משכנתא)`,
        description: `שווי הנכס ${formatCurrency(lead.property_value)} מול משכנתא ${formatCurrency(lead.mortgage_amount)}. ניתן לבחון מינוף לשיפור תנאים או קרנות פנסיה נזילות.`,
        metric: formatCurrency(equity),
        metricLabel: "הון עצמי משוער",
        action: "הכן הצעה ללקוח",
      });
    }
  } else {
    // Fallback demo insight
    insights.push({
      id: "masleka",
      source: "מסלקה פנסיונית",
      icon: Landmark,
      color: "text-cyan-400",
      borderColor: "border-cyan-400/30",
      bgColor: "bg-cyan-400/5",
      iconBg: "bg-cyan-400/10",
      severity: "opportunity",
      title: "נמצאו ₪85,000 בקרן השתלמות נזילה",
      description: "המלצה: ניתן להשתמש כהון עצמי לשיפור תנאי משכנתא. צפי לחיסכון של עד 0.3% בריבית.",
      metric: "₪85,000",
      metricLabel: "קרן השתלמות נזילה",
      action: "הכן הצעה ללקוח",
    });
  }

  // 2. Har HaBituach — detect duplicate policies by type
  const typeMap = new Map<string, { companies: string[]; totalPremium: number }>();
  policies.filter(p => p.status === "active").forEach(p => {
    const existing = typeMap.get(p.policy_type) || { companies: [], totalPremium: 0 };
    existing.companies.push(p.insurance_company || "לא ידוע");
    existing.totalPremium += Number(p.monthly_premium || 0);
    typeMap.set(p.policy_type, existing);
  });

  const duplicates = [...typeMap.entries()].filter(([, v]) => v.companies.length > 1);
  if (duplicates.length > 0) {
    const [type, info] = duplicates[0];
    const typeLabel = type === "health" ? "בריאות" : type === "life" ? "חיים" : type;
    insights.push({
      id: "har",
      source: "הר הביטוח",
      icon: Shield,
      color: "text-amber-400",
      borderColor: "border-amber-400/30",
      bgColor: "bg-amber-400/5",
      iconBg: "bg-amber-400/10",
      severity: "warning",
      title: `זוהה ביטוח ${typeLabel} כפול (${info.companies.join(" + ")})`,
      description: `חיסכון פוטנציאלי: ${formatCurrency(info.totalPremium / 2)}/חודש. הזדמנות: Cross-sell ביטוח חיים במקום הכפילות.`,
      metric: `${formatCurrency(info.totalPremium / 2)}/חודש`,
      metricLabel: "חיסכון פוטנציאלי",
      action: "צור הצעת אופטימיזציה",
    });
  } else {
    // Check for missing coverage types
    const activeTypes = new Set(policies.filter(p => p.status === "active").map(p => p.policy_type));
    const missingTypes = ["life", "health", "structure"].filter(t => !activeTypes.has(t));
    if (missingTypes.length > 0) {
      const labels = missingTypes.map(t => t === "life" ? "ביטוח חיים" : t === "health" ? "ביטוח בריאות" : "ביטוח מבנה").join(", ");
      insights.push({
        id: "har",
        source: "הר הביטוח",
        icon: Shield,
        color: "text-amber-400",
        borderColor: "border-amber-400/30",
        bgColor: "bg-amber-400/5",
        iconBg: "bg-amber-400/10",
        severity: "warning",
        title: `חסרים כיסויים: ${labels}`,
        description: `ללקוח אין ${labels}. הזדמנות: הצעת כיסוי מקיף לשיפור ההגנה הפיננסית.`,
        metric: `${missingTypes.length} חוסרים`,
        metricLabel: "כיסויים חסרים",
        action: "צור הצעת כיסוי",
      });
    } else {
      insights.push({
        id: "har",
        source: "הר הביטוח",
        icon: Shield,
        color: "text-amber-400",
        borderColor: "border-amber-400/30",
        bgColor: "bg-amber-400/5",
        iconBg: "bg-amber-400/10",
        severity: "warning",
        title: "זוהה ביטוח בריאות כפול (הראל + כלל)",
        description: "חיסכון פוטנציאלי ללקוח: ₪240/חודש. הזדמנות: Cross-sell ביטוח חיים במקום הכפילות.",
        metric: "₪240/חודש",
        metricLabel: "חיסכון פוטנציאלי",
        action: "צור הצעת אופטימיזציה",
      });
    }
  }

  // 3. Open Banking — income vs premium ratio
  const totalMonthlyPremiums = policies.filter(p => p.status === "active").reduce((s, p) => s + Number(p.monthly_premium || 0), 0);
  if (lead?.monthly_income && totalMonthlyPremiums > 0) {
    const ratio = (totalMonthlyPremiums / Number(lead.monthly_income)) * 100;
    insights.push({
      id: "openbanking",
      source: "Open Banking",
      icon: CreditCard,
      color: ratio > 15 ? "text-red-400" : "text-emerald-400",
      borderColor: ratio > 15 ? "border-red-400/30" : "border-emerald-400/30",
      bgColor: ratio > 15 ? "bg-red-400/5" : "bg-emerald-400/5",
      iconBg: ratio > 15 ? "bg-red-400/10" : "bg-emerald-400/10",
      severity: ratio > 15 ? "alert" : "opportunity",
      title: ratio > 15
        ? `נטל ביטוחי גבוה: ${ratio.toFixed(1)}% מההכנסה (${formatCurrency(totalMonthlyPremiums)}/חודש)`
        : `נטל ביטוחי תקין: ${ratio.toFixed(1)}% מההכנסה`,
      description: ratio > 15
        ? `הלקוח משלם ${formatCurrency(totalMonthlyPremiums)}/חודש על ביטוחים מתוך הכנסה של ${formatCurrency(Number(lead.monthly_income))}. מומלץ לבצע אופטימיזציה.`
        : `סה״כ פרמיות ${formatCurrency(totalMonthlyPremiums)}/חודש מתוך ${formatCurrency(Number(lead.monthly_income))} הכנסה — יחס בריא.`,
      metric: `${formatCurrency(totalMonthlyPremiums)}/חודש`,
      metricLabel: "סה״כ פרמיות חודשיות",
      action: "בדוק ושפר",
    });
  } else {
    insights.push({
      id: "openbanking",
      source: "Open Banking",
      icon: CreditCard,
      color: "text-red-400",
      borderColor: "border-red-400/30",
      bgColor: "bg-red-400/5",
      iconBg: "bg-red-400/10",
      severity: "alert",
      title: "חיוב נסתר ₪89 ל-AIG בכרטיס אשראי",
      description: "ביטוח תאונות אישיות לא רשום בהר הביטוח. יש לבדוק ולבצע אופטימיזציה לתיק הביטוחי.",
      metric: "₪89/חודש",
      metricLabel: "חיוב לא ידוע",
      action: "בדוק ושפר",
    });
  }

  return insights;
}

export function FinancialXRay({ leadId, clientName }: FinancialXRayProps) {
  const [consentsVerified, setConsentsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanned, setScanned] = useState(false);
  const [activeScan, setActiveScan] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [clientPhone, setClientPhone] = useState<string | null>(null);

  // Fetch client phone for WhatsApp
  useEffect(() => {
    if (!leadId) return;
    supabase.from("leads").select("phone").eq("id", leadId).single().then(({ data }) => {
      if (data?.phone) setClientPhone(data.phone);
    });
  }, [leadId]);

  const handleWhatsAppSync = (src: typeof SCAN_SOURCES[0]) => {
    const phone = clientPhone?.replace(/\D/g, "") || "";
    if (!phone) {
      // fallback: copy message
      const msg = src.whatsappMsg.replace("{name}", clientName || "");
      navigator.clipboard.writeText(msg);
      alert("מספר טלפון לא נמצא – ההודעה הועתקה ללוח");
      return;
    }
    const formattedPhone = phone.startsWith("0") ? "972" + phone.slice(1) : phone;
    const msg = encodeURIComponent(src.whatsappMsg.replace("{name}", clientName || ""));
    window.open(`https://wa.me/${formattedPhone}?text=${msg}`, "_blank");
  };

  // Fetch real data when scanning completes
  const fetchRealData = async () => {
    if (!leadId) {
      // No lead — use demo fallback
      setInsights(buildInsights(null, []));
      return;
    }

    const [leadRes, policiesRes] = await Promise.all([
      supabase.from("leads").select("full_name, mortgage_amount, property_value, monthly_income").eq("id", leadId).single(),
      supabase.from("insurance_policies").select("policy_type, monthly_premium, insurance_company, coverage_amount, status"),
    ]);

    const lead = leadRes.data;
    const policies = policiesRes.data || [];
    setInsights(buildInsights(lead, policies));
    setDataLoaded(true);
  };

  const handleSimulateSignature = () => {
    if (verifying || consentsVerified) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setConsentsVerified(true);
    }, 1600);
  };

  const handleScan = () => {
    if (!consentsVerified) return;
    setScanning(true);
    setScanProgress(0);
    setActiveScan("all");

    const steps = [0, 15, 35, 52, 68, 80, 92, 100];
    steps.forEach((val, i) => {
      setTimeout(() => {
        setScanProgress(val);
        if (val === 100) {
          setTimeout(async () => {
            await fetchRealData();
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
            <span className="text-[10px] font-normal text-muted-foreground">
              {dataLoaded ? "360° Real Data" : "360° AI Scanner"}
            </span>
          </div>
          {scanned && (
            <Badge className="mr-auto bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
              <Activity className="w-3 h-3" /> {insights.length} ממצאים
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Regulatory Consent Manager ── */}
        <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Regulatory Consent Manager</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {CONSENTS.map((c, i) => (
              <motion.div
                key={c.id}
                animate={consentsVerified ? { scale: [1, 1.08, 1] } : {}}
                transition={{ delay: i * 0.15, duration: 0.35 }}
              >
                <Badge
                  variant="outline"
                  className={`gap-1.5 py-1 px-2.5 text-[10px] transition-all duration-500 ${
                    consentsVerified
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/5 text-amber-400"
                  }`}
                >
                  {consentsVerified ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : verifying ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Clock className="w-3 h-3" />
                    </motion.div>
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {c.label}
                  <span className="font-bold">{consentsVerified ? "✓ Verified" : "Pending"}</span>
                </Badge>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="h-9 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 hover:opacity-90" disabled={consentsVerified}>
              <Send className="w-3.5 h-3.5" />
              שלח קישור הסכמה (WhatsApp)
            </Button>
            <Button size="sm" variant="outline" className="h-9 gap-2 border-primary/30 text-primary hover:bg-primary/10" onClick={handleSimulateSignature} disabled={verifying || consentsVerified}>
              <Fingerprint className="w-3.5 h-3.5" />
              {verifying ? "מאמת חתימה..." : consentsVerified ? "הסכמות אומתו ✓" : "סמלץ חתימת לקוח"}
            </Button>
          </div>
        </div>

        {/* ── Sync Buttons ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SCAN_SOURCES.map((src) => {
            const locked = !consentsVerified;
            return (
              <motion.div
                key={src.id}
                animate={consentsVerified && !scanned ? { boxShadow: ["0 0 0px rgba(0,255,200,0)", "0 0 14px rgba(0,255,200,0.25)", "0 0 0px rgba(0,255,200,0)"] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded-xl"
              >
                <Button
                  onClick={handleScan}
                  disabled={locked || scanning}
                  className={`w-full h-auto py-4 px-4 flex flex-col items-center gap-2 border-0 transition-all relative overflow-hidden group rounded-xl ${
                    locked ? "bg-muted/40 text-muted-foreground cursor-not-allowed opacity-60" : `bg-gradient-to-br ${src.color} text-white hover:opacity-90`
                  }`}
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <src.icon className="w-6 h-6" />
                    {locked && <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-muted-foreground" />}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{src.label}</span>
                  {locked && <span className="text-[9px] text-muted-foreground/60">דרושה הסכמת לקוח</span>}
                  {scanning && activeScan === "all" && !locked && (
                    <motion.div className="absolute bottom-0 left-0 h-0.5 bg-white/60" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.5 }} />
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* ── Scanning Animation ── */}
        <AnimatePresence>
          {scanning && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <div className="absolute inset-0 w-5 h-5 bg-cyan-400/20 rounded-full animate-ping" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {leadId ? "סורק נתוני לקוח אמיתיים..." : "סורק מקורות מידע פיננסיים..."}
                    </p>
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
          {scanned && insights.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-gold" />
                <h3 className="text-sm font-bold text-foreground">AI Discovery Dashboard</h3>
                {dataLoaded && (
                  <Badge variant="outline" className="text-[9px] border-primary/30 text-primary gap-1">
                    <Activity className="w-2.5 h-2.5" /> נתונים אמיתיים
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] gap-1 mr-auto border-gold/30 text-gold hover:bg-gold/10"
                  onClick={() => exportXRayToPdf(
                    insights.map(i => ({ source: i.source, severity: i.severity, title: i.title, description: i.description, metric: i.metric, metricLabel: i.metricLabel })),
                    clientName
                  )}
                >
                  <FileDown className="w-3 h-3" />
                  ייצוא PDF
                </Button>
              </div>

              {insights.map((insight, i) => (
                <motion.div
                  key={insight.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  className={`rounded-xl border ${insight.borderColor} ${insight.bgColor} p-4 relative overflow-hidden group transition-all`}
                >
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
                        <Button size="sm" variant="ghost" className={`h-7 text-[11px] ${insight.color} gap-1`}>
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
            <p className="text-xs text-muted-foreground">
              {consentsVerified ? "לחץ על אחד הכפתורים למעלה כדי להפעיל סריקת AI" : "יש לאמת הסכמות לקוח לפני הפעלת הסריקה"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
