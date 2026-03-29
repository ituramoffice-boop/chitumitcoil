import { useState, useCallback, useEffect } from "react";
import AIScannerWidget from "@/components/AIScannerWidget";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Shield, Lock, Calculator, Search, Brain, Sparkles,
  CheckCircle2, Upload, Fingerprint, User, Phone,
  PiggyBank, BarChart3, FileText, ArrowRight, AlertTriangle, Building2, Landmark, CreditCard
} from "lucide-react";

// ── Funnel config ──────────────────────────────────────────
const FUNNEL_CONFIG: Record<string, { title: string; subtitle: string; cta: string; icon: React.ElementType }> = {
  mortgage: {
    title: "כמה באמת תשלמו על המשכנתא?",
    subtitle: "סימולציה חכמה עם AI – תוצאות תוך שניות",
    cta: "חשב עכשיו",
    icon: Calculator,
  },
  payslip: {
    title: "סריקת תלוש משכורת חכמה",
    subtitle: "גלו כמה כסף אתם מפסידים כל חודש",
    cta: "סרוק תלוש",
    icon: FileText,
  },
  "har-habituach": {
    title: "בדיקת הר הביטוח – חינם",
    subtitle: "גלו את כל הפוליסות שלכם במקום אחד",
    cta: "בדוק עכשיו",
    icon: Fingerprint,
  },
  masleka: {
    title: "בדיקת מסלקה פנסיונית",
    subtitle: "האם הפנסיה שלכם עובדת בשבילכם?",
    cta: "בדוק מסלקה",
    icon: PiggyBank,
  },
  savings: {
    title: "כמה חיסכון אתם מפספסים?",
    subtitle: "ניתוח AI לחיסכון שנתי אפשרי",
    cta: "נתח חיסכון",
    icon: BarChart3,
  },
  "bank-statement": {
    title: "ביקורת דף חשבון בנק (עו״ש)",
    subtitle: "ה-AI יזהה משכנתא, ביטוחים, הלוואות ויחס התחייבויות",
    cta: "סרוק דף חשבון",
    icon: Landmark,
  },
  "price-compare": {
    title: "השוואת מחירי ביטוח ומשכנתא",
    subtitle: "ההשוואה האמיתית שהבנקים לא רוצים שתראו",
    cta: "השווה מחירים",
    icon: Search,
  },
};

// ── Loading sequence ───────────────────────────────────────
const LOADING_STEPS = [
  { text: "מצפין חיבור מאובטח…", icon: Lock },
  { text: "AI מנתח את הנתונים…", icon: Brain },
  { text: "מצליב מול מאגרים פיננסיים…", icon: Search },
  { text: "מחשב חיסכון פוטנציאלי…", icon: Sparkles },
];

function useLoadingSequence() {
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const start = useCallback(() => {
    setRunning(true);
    setStepIdx(0);
    setProgress(0);
    setDone(false);
  }, []);

  // Drive progress
  useState(() => {
    if (!running) return;
  });

  // Use effect-like via setTimeout pattern
  const tick = useCallback(() => {
    if (!running || done) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setDone(true);
          setRunning(false);
          return 100;
        }
        const newP = p + 2;
        setStepIdx(Math.min(Math.floor(newP / 25), LOADING_STEPS.length - 1));
        return newP;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [running, done]);

  return { running, stepIdx, progress, done, start, tick, setDone };
}

// ── Mortgage Hook Widget ───────────────────────────────────
function MortgageWidget({ onSubmit }: { onSubmit: (data: Record<string, unknown>) => void }) {
  const [amount, setAmount] = useState([1200000]);
  const [years, setYears] = useState([25]);
  const monthly = Math.round((amount[0] * 0.04 / 12) / (1 - Math.pow(1 + 0.04 / 12, -years[0] * 12)));

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">סכום משכנתא</label>
        <Slider dir="ltr" min={200000} max={3000000} step={50000} value={amount} onValueChange={setAmount} />
        <p className="text-accent font-bold text-xl mt-2 text-center">₪{amount[0].toLocaleString()}</p>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">תקופה (שנים)</label>
        <Slider dir="ltr" min={5} max={30} step={1} value={years} onValueChange={setYears} />
        <p className="text-accent font-bold text-xl mt-2 text-center">{years[0]} שנים</p>
      </div>
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-center">
        <p className="text-sm text-muted-foreground">החזר חודשי משוער</p>
        <p className="text-3xl font-black text-accent">₪{monthly.toLocaleString()}</p>
      </div>
      <Button
        className="w-full h-12 text-lg bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
        onClick={() => onSubmit({ mortgage_amount: amount[0], years: years[0], monthly })}
      >
        <Calculator className="w-5 h-5 ml-2" /> חשב עכשיו
      </Button>
    </div>
  );
}


function HarHabituachWidget({ onSubmit }: { onSubmit: (data: Record<string, unknown>) => void }) {
  const [idNumber, setIdNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">תעודת זהות</label>
        <Input
          placeholder="הכנס מספר ת.ז."
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          className="text-center text-lg h-12 bg-secondary border-border"
          maxLength={9}
        />
      </div>
      {!otpSent ? (
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
          disabled={idNumber.length < 7}
          onClick={() => setOtpSent(true)}
        >
          <Fingerprint className="w-5 h-5 ml-2" /> שלח קוד אימות
        </Button>
      ) : (
        <>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">קוד אימות (SMS)</label>
            <Input
              placeholder="הכנס קוד 4 ספרות"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="text-center text-lg h-12 tracking-[0.5em] bg-secondary border-border"
              maxLength={4}
            />
          </div>
          <Button
            className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
            disabled={otp.length < 4}
            onClick={() => onSubmit({ tool: "har_habituach", id_number: idNumber })}
          >
            <Search className="w-5 h-5 ml-2" /> בדוק הר הביטוח
          </Button>
        </>
      )}
    </div>
  );
}

// ── Generic Placeholder Widget ─────────────────────────────
function PlaceholderWidget({ label, onSubmit }: { label: string; onSubmit: (data: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4 text-center py-4">
      <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 mx-auto flex items-center justify-center">
        <BarChart3 className="w-8 h-8 text-accent" />
      </div>
      <p className="text-muted-foreground text-sm">כלי {label} – בקרוב</p>
      <Button
        className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
        onClick={() => onSubmit({ tool: label })}
      >
        <ArrowRight className="w-5 h-5 ml-2" /> התחל ניתוח
      </Button>
    </div>
  );
}

// ── WhatsApp Chat Mockup ───────────────────────────────────
const WA_MESSAGES: { type: "in" | "out"; text: React.ReactNode; time: string; delay: number }[] = [
  {
    type: "in",
    time: "10:42",
    delay: 0.3,
    text: (
      <>
        🤖 <span className="font-semibold text-accent">דוח חיתומית AI</span> - הניתוח הושלם!
        <br /><br />
        היי ישראל, זיהינו כפל ביטוחי (מגדל והראל) עם פוטנציאל חיסכון של <span className="font-bold text-green-400">450 ש״ח בחודש</span>. 💸 התיק הועבר לסוכן שלך.
      </>
    ),
  },
  {
    type: "out",
    time: "10:43",
    delay: 1.2,
    text: <>רגע, באמת? על מה אני משלם כפול?</>,
  },
  {
    type: "in",
    time: "10:43",
    delay: 2.2,
    text: (
      <>
        על סעיף <span className="font-semibold">"תרופות מחוץ לסל"</span> בשתי הפוליסות. דני הסוכן שלך יכול לעזור לך לבטל את הכפילות.
        <br /><br />
        הוא פנוי מחר ב-<span className="font-semibold">10:00</span> או ב-<span className="font-semibold">14:00</span> לשיחה קצרה. מתי נוח לך?
      </>
    ),
  },
  {
    type: "out",
    time: "10:44",
    delay: 3.4,
    text: <>10:00 מצוין לי.</>,
  },
  {
    type: "in",
    time: "10:44",
    delay: 4.4,
    text: (
      <>
        מעולה! הפגישה נקבעה ביומן. 📅
        <br />
        הנה הקישור לתיק המאובטח שלך בינתיים...
      </>
    ),
  },
];

function WhatsAppMockup() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#2a3942] shadow-2xl w-full max-w-[320px] mx-auto">
      {/* Status bar */}
      <div className="bg-[#1f2c34] px-3 py-1.5 flex items-center justify-between text-[10px] text-gray-400">
        <span>10:42</span>
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-2 border border-gray-400 rounded-sm relative">
            <div className="absolute inset-0.5 bg-green-400 rounded-[1px]" style={{ width: '70%' }} />
          </div>
        </div>
      </div>
      {/* Chat header */}
      <div className="bg-[#1f2c34] px-3 py-2.5 flex items-center gap-3 border-b border-[#2a3942]">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-yellow-600 flex items-center justify-center text-xs font-bold text-black shrink-0">
          ח
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#e9edef] truncate">Chitumit AI</p>
          <p className="text-[10px] text-[#8696a0]">online</p>
        </div>
      </div>
      {/* Chat body */}
      <div className="bg-[#0b141a] p-2.5 h-[340px] overflow-y-auto flex flex-col gap-1.5 scroll-smooth" dir="rtl"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'a\' patternUnits=\'userSpaceOnUse\' width=\'20\' height=\'20\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'0.5\' fill=\'%23ffffff06\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'200\' height=\'200\' fill=\'url(%23a)\'/%3E%3C/svg%3E")' }}
      >
        {WA_MESSAGES.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: msg.delay, duration: 0.35, ease: "easeOut" }}
            className={`max-w-[85%] rounded-lg p-2.5 relative ${
              msg.type === "in"
                ? "bg-[#202c33] self-end rounded-tr-none"
                : "bg-[#005c4b] self-start rounded-tl-none"
            }`}
          >
            <p className="text-[12px] leading-[1.55] text-[#e9edef] text-right">
              {msg.text}
            </p>
            <div className={`flex items-center gap-1 mt-1 ${msg.type === "out" ? "justify-end" : "justify-start"}`}>
              <span className="text-[9px] text-[#8696a0]">{msg.time}</span>
              {msg.type === "out" && (
                <span className="text-[10px] text-[#53bdeb]">✓✓</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      {/* Input bar */}
      <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2 border-t border-[#2a3942]">
        <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-1.5 text-[12px] text-[#8696a0]">הקלד הודעה</div>
        <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-white rotate-180" />
        </div>
      </div>
    </div>
  );
}

// ── Lead Capture Modal ─────────────────────────────────────
function LeadCaptureModal({
  open,
  onSubmit,
  initialName = "",
  initialPhone = "",
}: {
  open: boolean;
  onSubmit: (name: string, phone: string) => void;
  initialName?: string;
  initialPhone?: string;
}) {
  const [clientName, setClientName] = useState(initialName);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setClientName(initialName); }, [initialName]);
  useEffect(() => { setPhoneNumber(initialPhone); }, [initialPhone]);

  const handleSubmit = async () => {
    if (!clientName.trim() || !phoneNumber.trim()) {
      setError("יש למלא את כל השדות");
      return;
    }
    setLoading(true);
    setError("");
    onSubmit(clientName, phoneNumber);
    setLoading(false);
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key="form"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md rounded-2xl border border-accent/30 bg-card p-6 shadow-2xl space-y-5"
        >
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-foreground">פרטי הלקוח</h3>
            <p className="text-sm text-muted-foreground">נא למלא לפני תחילת הניתוח</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">שם הלקוח</label>
              <Input
                id="campaign-lead-name"
                placeholder="ישראל ישראלי"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-12 bg-secondary border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">מספר טלפון</label>
              <Input
                id="campaign-lead-phone"
                placeholder="050-0000000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-12 bg-secondary border-border"
                type="tel"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button
            className="w-full h-12 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "שומר..." : "התחל ניתוח"}
          </Button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function CampaignLanding() {
  const { funnelType } = useParams<{ funnelType: string }>();
  const [searchParams] = useSearchParams();
  const rawRef = searchParams.get("ref");

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidRef = rawRef ? UUID_RE.test(rawRef) : false;
  const consultantId = isValidRef ? rawRef : null;

  const config = FUNNEL_CONFIG[funnelType || ""] || FUNNEL_CONFIG.mortgage;
  const FunnelIcon = config.icon;

  // States
  const [phase, setPhase] = useState<"widget" | "loading" | "wow_alerts" | "capture" | "done">("widget");
  const [wowAlerts, setWowAlerts] = useState<string[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [toolData, setToolData] = useState<Record<string, unknown>>({});
  const [prefillName, setPrefillName] = useState("");
  const [prefillPhone, setPrefillPhone] = useState("");

  // Trigger AI loading (for non-payslip funnels) or handle payslip result
  const handleToolSubmit = useCallback((data: Record<string, unknown>) => {
    setToolData(data);

    // If payslip already analyzed (has ai_analysis), skip loading and show audit results
    if (data.ai_analysis) {
      const analysis = data.ai_analysis as any;

      // Pre-fill lead form from AI extraction
      if (analysis.personal?.full_name) setPrefillName(analysis.personal.full_name);
      if (analysis.personal?.phone) setPrefillPhone(analysis.personal.phone);

      const alerts = analysis.wow_alerts || [];
      const hasMissingMoney = (analysis.pension_audit?.total_missing_money || 0) > 0;
      const hasDoubleInsurance = analysis.insurance_audit?.has_double_insurance;
      const hasBankFindings = analysis.financial_summary?.obligation_ratio_percent > 0;
      const hasSalaryDiscrepancy = !!analysis.salary_discrepancy;

      // Show audit results if there are any findings
      if (alerts.length > 0 || hasMissingMoney || hasDoubleInsurance || hasBankFindings || hasSalaryDiscrepancy) {
        setWowAlerts(alerts);
        setPhase("wow_alerts");
        return;
      }
      // No findings, go straight to capture
      setPhase("capture");
      return;
    }

    // For other funnels, show fake loading animation
    setPhase("loading");
    setProgress(0);
    setStepIdx(0);

    let p = 0;
    const iv = setInterval(() => {
      p += 2;
      setProgress(p);
      setStepIdx(Math.min(Math.floor(p / 25), LOADING_STEPS.length - 1));
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(() => setPhase("capture"), 400);
      }
    }, 60);
  }, []);

  // Save lead
  const handleLeadSubmit = useCallback(async (name: string, phone: string) => {
    try {
      const aiAnalysis = toolData.ai_analysis ? toolData.ai_analysis : null;
      const { error } = await supabase.from("leads").insert({
        full_name: name,
        phone,
        consultant_id: consultantId ?? null,
        lead_source: `campaign_${funnelType}`,
        status: "new" as const,
        notes: JSON.stringify(toolData),
        ai_analysis: aiAnalysis,
      } as any);
      if (error) throw error;

      // Send email notification with client name
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "new_lead",
            client_name: name || "לקוח יקר",
            phone,
            lead_source: `campaign_${funnelType}`,
            consultant_id: consultantId ?? null,
          },
        });
      } catch (emailErr) {
        console.warn("Email send failed:", emailErr);
      }

      setPhase("done");
      toast.success("הדוח בדרך אליך!");
    } catch {
      toast.error("שגיאה בשמירת הנתונים");
    }
  }, [consultantId, funnelType, toolData]);

  // Render hook widget
  const renderWidget = () => {
    switch (funnelType) {
      case "mortgage":
        return <MortgageWidget onSubmit={handleToolSubmit} />;
      case "payslip":
        return <AIScannerWidget type="payslip" onSubmit={handleToolSubmit} />;
      case "har-habituach":
        return <HarHabituachWidget onSubmit={handleToolSubmit} />;
      case "masleka":
        return <PlaceholderWidget label="מסלקה" onSubmit={handleToolSubmit} />;
      case "savings":
        return <PlaceholderWidget label="חיסכון" onSubmit={handleToolSubmit} />;
      case "bank-statement":
        return <AIScannerWidget type="bank_statement" onSubmit={handleToolSubmit} extraBody={toolData.ai_analysis ? { payslip_analysis: toolData.ai_analysis } : undefined} />;
      case "price-compare":
        return <PlaceholderWidget label="השוואת מחירים" onSubmit={handleToolSubmit} />;
      default:
        return <MortgageWidget onSubmit={handleToolSubmit} />;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Invalid ref warning */}
      {rawRef && !isValidRef && (
        <div className="bg-destructive/10 border-b border-destructive/30 py-3 px-4">
          <p className="max-w-lg mx-auto text-center text-sm text-destructive font-medium">
            ⚠️ קישור ההפניה אינו תקין — הנתונים לא ישויכו ליועץ. אנא בקש קישור עדכני.
          </p>
        </div>
      )}
      {/* Trust bar */}
      <div className="bg-secondary/50 border-b border-border py-2 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-400" /> הצפנה 256-bit</span>
          <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-accent" /> מאובטח בנקאית</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 mx-auto flex items-center justify-center">
            <FunnelIcon className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">
            {config.title}
          </h1>
          <p className="text-muted-foreground text-sm">{config.subtitle}</p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-xs border-accent/30 text-accent">
              חינם לחלוטין
            </Badge>
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
              ✓ ללא התחייבות
            </Badge>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-xl"
        >
          <AnimatePresence mode="wait">
            {phase === "widget" && (
              <motion.div key="widget" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderWidget()}
              </motion.div>
            )}

            {phase === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 py-4">
                <div className="text-center space-y-1">
                  <Brain className="w-10 h-10 text-accent mx-auto animate-pulse" />
                  <p className="text-foreground font-bold">AI מנתח…</p>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="space-y-2">
                  {LOADING_STEPS.map((step, i) => {
                    const StepIcon = step.icon;
                    const active = i <= stepIdx;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: active ? 1 : 0.3, x: 0 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <StepIcon className={`w-4 h-4 ${active ? "text-accent" : "text-muted-foreground"}`} />
                        <span className={active ? "text-foreground" : "text-muted-foreground"}>{step.text}</span>
                        {i < stepIdx && <CheckCircle2 className="w-3 h-3 text-green-400 mr-auto" />}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {phase === "wow_alerts" && (
              <motion.div key="wow_alerts" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5 py-4" dir="rtl">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-destructive/20 mx-auto flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-destructive" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">ביקורת תלוש – ממצאים</h3>
                  <p className="text-sm text-muted-foreground">סיכום ביקורת AI מקצועית:</p>
                </div>

                {/* Audit Summary Table */}
                {(() => {
                  const analysis = toolData.ai_analysis as any;
                  const pension = analysis?.pension_audit;
                  const insurance = analysis?.insurance_audit;
                  return (
                    <div className="space-y-4">
                      {/* Personal & Salary */}
                      {analysis?.personal?.employer && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          <span>מעסיק: <span className="text-foreground font-medium">{analysis.personal.employer}</span></span>
                        </div>
                      )}

                      {/* Pension Audit Table */}
                      {pension && (
                        <div className="rounded-xl border border-border overflow-hidden">
                          <div className="bg-secondary/50 px-3 py-2 text-sm font-bold text-foreground">בדיקת הפרשות פנסיה</div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right">סעיף</TableHead>
                                <TableHead className="text-right">בפועל</TableHead>
                                <TableHead className="text-right">מינימום חוקי</TableHead>
                                <TableHead className="text-right">פער ₪</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">הפרשת מעסיק</TableCell>
                                <TableCell>{pension.employer_contribution_percent ?? '—'}%</TableCell>
                                <TableCell>6.5%</TableCell>
                                <TableCell className={pension.employer_gap_shekel > 0 ? "text-destructive font-bold" : "text-green-500 font-bold"}>
                                  {pension.employer_gap_shekel > 0 ? `₪${pension.employer_gap_shekel.toLocaleString()}-` : '✓ תקין'}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">הפרשת עובד</TableCell>
                                <TableCell>{pension.employee_contribution_percent ?? '—'}%</TableCell>
                                <TableCell>6.0%</TableCell>
                                <TableCell className={pension.employee_gap_shekel > 0 ? "text-destructive font-bold" : "text-green-500 font-bold"}>
                                  {pension.employee_gap_shekel > 0 ? `₪${pension.employee_gap_shekel.toLocaleString()}-` : '✓ תקין'}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">פיצויים</TableCell>
                                <TableCell>{pension.severance_contribution_percent ?? '—'}%</TableCell>
                                <TableCell>8.33%</TableCell>
                                <TableCell className={pension.severance_gap_shekel > 0 ? "text-destructive font-bold" : "text-green-500 font-bold"}>
                                  {pension.severance_gap_shekel > 0 ? `₪${pension.severance_gap_shekel.toLocaleString()}-` : '✓ תקין'}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          {(pension.destination_institution || pension.destination_institution_hebrew) && (
                            <div className="px-3 py-2 border-t border-border text-xs text-muted-foreground">
                              גוף מנהל: <span className="text-foreground font-medium">{pension.destination_institution_hebrew || pension.destination_institution}</span>
                              {pension.destination_institution_hebrew && pension.destination_institution && (
                                <span className="text-muted-foreground"> ({pension.destination_institution})</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Insurance Findings */}
                      {insurance && (insurance.has_double_insurance || insurance.health_insurance_deduction || insurance.life_risk_deduction || insurance.group_insurance_deduction) && (
                        <div className="rounded-xl border border-border overflow-hidden">
                          <div className="bg-secondary/50 px-3 py-2 text-sm font-bold text-foreground">ממצאי ביטוח</div>
                          <div className="p-3 space-y-2 text-sm">
                            {insurance.health_insurance_deduction != null && (
                              <div className="flex justify-between">
                                <span>ביטוח בריאות</span>
                                <span className="font-medium">₪{insurance.health_insurance_deduction.toLocaleString()}</span>
                              </div>
                            )}
                            {insurance.life_risk_deduction != null && (
                              <div className="flex justify-between">
                                <span>ביטוח חיים/ריסק</span>
                                <span className="font-medium">₪{insurance.life_risk_deduction.toLocaleString()}</span>
                              </div>
                            )}
                            {insurance.group_insurance_deduction != null && (
                              <div className="flex justify-between">
                                <span>ביטוח קבוצתי</span>
                                <span className="font-medium">₪{insurance.group_insurance_deduction.toLocaleString()}</span>
                              </div>
                            )}
                            {insurance.has_double_insurance && (
                              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-2 mt-2">
                                <p className="text-destructive font-bold text-sm">⚠️ כפל ביטוח!</p>
                                {insurance.double_insurance_details && (
                                  <p className="text-xs text-muted-foreground mt-1">{insurance.double_insurance_details}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bank Statement Results */}
                      {analysis?.financial_summary && (
                        <div className="rounded-xl border border-border overflow-hidden">
                          <div className="bg-secondary/50 px-3 py-2 text-sm font-bold text-foreground flex items-center gap-2">
                            <Landmark className="w-4 h-4" /> סיכום דף חשבון בנק
                          </div>
                          <Table>
                            <TableBody>
                              {analysis.income?.average_monthly_net > 0 && (
                                <TableRow>
                                  <TableCell className="font-medium">הכנסה חודשית ממוצעת</TableCell>
                                  <TableCell className="text-green-500 font-bold">₪{analysis.income.average_monthly_net.toLocaleString()}</TableCell>
                                </TableRow>
                              )}
                              {analysis.mortgage?.found && (
                                <TableRow>
                                  <TableCell className="font-medium">תשלום משכנתא {analysis.mortgage.bank_name ? `(${analysis.mortgage.bank_name})` : ''}</TableCell>
                                  <TableCell className="font-bold">₪{(analysis.mortgage.monthly_payment || 0).toLocaleString()}</TableCell>
                                </TableRow>
                              )}
                              {(() => {
                                // Filter out income sources mistakenly counted as obligations
                                const incomeKeywords = ["בנק לאומי", "ביטוח לאומי"];
                                const rawObligations = analysis.financial_summary.total_monthly_obligations || 0;
                                const loans = analysis.existing_loans || [];
                                const standingOrders = analysis.standing_orders || [];
                                const allItems = [...loans, ...standingOrders];
                                const excludedSum = allItems
                                  .filter((item: any) => incomeKeywords.some(kw => (item.description || item.name || item.entity || "").includes(kw)))
                                  .reduce((sum: number, item: any) => sum + Math.abs(item.amount || item.monthly_payment || 0), 0);
                                const adjustedObligations = Math.max(0, rawObligations - excludedSum);
                                const avgIncome = analysis.income?.average_monthly_net || 0;
                                const adjustedDti = avgIncome > 0 ? Math.round((adjustedObligations / avgIncome) * 100) : 0;
                                return (
                                  <>
                                    {adjustedObligations > 0 && (
                                      <TableRow>
                                        <TableCell className="font-medium">סך התחייבויות חודשיות</TableCell>
                                        <TableCell className="font-bold">₪{adjustedObligations.toLocaleString()}</TableCell>
                                      </TableRow>
                                    )}
                                    <TableRow>
                                      <TableCell className="font-medium">יחס התחייבויות</TableCell>
                                      <TableCell className={`font-bold ${adjustedDti > 40 ? 'text-destructive' : 'text-green-500'}`}>
                                        {adjustedDti}%
                                        {adjustedDti > 40 && ' ⚠️'}
                                      </TableCell>
                                    </TableRow>
                                  </>
                                );
                              })()}
                              {analysis.financial_summary.free_cash_flow != null && (
                                <TableRow>
                                  <TableCell className="font-medium">תזרים חופשי</TableCell>
                                  <TableCell className={`font-bold ${analysis.financial_summary.free_cash_flow >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                                    ₪{analysis.financial_summary.free_cash_flow.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Insurance payments from bank statement */}
                      {analysis?.insurance_payments?.length > 0 && (
                        <div className="rounded-xl border border-border overflow-hidden">
                          <div className="bg-secondary/50 px-3 py-2 text-sm font-bold text-foreground flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> תשלומי ביטוח שזוהו
                          </div>
                          <div className="p-3 space-y-2 text-sm">
                            {analysis.insurance_payments.map((p: any, i: number) => (
                              <div key={i} className="flex justify-between items-center">
                                <span>{p.company} {p.type ? `(${p.type})` : ''}</span>
                                <span className="font-medium">₪{(p.monthly_amount || 0).toLocaleString()}/חודש</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Salary Discrepancy */}
                      {analysis?.salary_discrepancy && (
                        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3">
                          <p className="text-destructive font-bold text-sm">⚠️ אי-התאמת שכר</p>
                          <p className="text-xs text-muted-foreground mt-1">{analysis.salary_discrepancy}</p>
                        </div>
                      )}

                      {/* Wow Alerts */}
                      {wowAlerts.length > 0 && (
                        <div className="space-y-2">
                          {wowAlerts.map((alert, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: 15 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.15 }}
                              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2"
                            >
                              <span className="text-lg shrink-0">⚠️</span>
                              <p className="text-sm text-foreground font-medium">{alert}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Total Summary */}
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-1">
                        <p className="text-2xl font-black text-destructive">
                          ₪{(analysis?.total_monthly_waste || analysis?.financial_summary?.total_monthly_obligations || pension?.total_missing_money || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {analysis?.financial_summary ? "סך התחייבויות חודשיות" : "כסף חסר / בזבוז חודשי שזיהינו"}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <Button
                  className="w-full h-12 text-lg bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                  onClick={() => setPhase("capture")}
                >
                  קבל דוח מלא + ייעוץ חינם <ArrowRight className="w-5 h-5 mr-2" />
                </Button>
              </motion.div>
            )}

            {phase === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-6">
                <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground">הדוח נשלח בהצלחה!</h3>
                <p className="text-sm text-muted-foreground">
                  הנתונים סונכרנו ישירות ל-CRM של היועץ שלך.
                  <br />ייצרו איתך קשר בהקדם.
                </p>
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-xs text-muted-foreground">
                  <span className="text-accent font-bold">✓ CRM Sync</span> — הליד נוסף אוטומטית למערכת הניהול
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Social proof */}
        <p className="text-center text-xs text-muted-foreground">
          מעל 12,000 בדיקות בוצעו החודש • דירוג 4.9⭐
        </p>
      </div>

      {/* Lead capture modal */}
      <LeadCaptureModal open={phase === "capture"} onSubmit={handleLeadSubmit} initialName={prefillName} initialPhone={prefillPhone} />
    </div>
  );
}
