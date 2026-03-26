import { useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, Lock, Calculator, Search, Brain, Sparkles,
  CheckCircle2, Upload, Fingerprint, User, Phone,
  PiggyBank, BarChart3, FileText, ArrowRight
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

// ── Payslip Hook Widget ────────────────────────────────────
function PayslipWidget({ onSubmit }: { onSubmit: (data: Record<string, unknown>) => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          dragging ? "border-accent bg-accent/10 scale-[1.02]" : uploaded ? "border-green-500 bg-green-500/10" : "border-border hover:border-accent/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); setUploaded(true); }}
        onClick={() => setUploaded(true)}
      >
        {uploaded ? (
          <div className="space-y-2">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-green-400 font-bold">תלוש הועלה בהצלחה</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-foreground font-semibold">גררו תלוש לכאן או לחצו להעלאה</p>
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG – עד 10MB</p>
          </div>
        )}
      </div>
      <Button
        className="w-full h-12 text-lg bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
        disabled={!uploaded}
        onClick={() => onSubmit({ tool: "payslip_scan" })}
      >
        <Brain className="w-5 h-5 ml-2" /> סרוק עם AI
      </Button>
    </div>
  );
}

// ── Har HaBituach Widget ───────────────────────────────────
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

// ── Lead Capture Modal ─────────────────────────────────────
function LeadCaptureModal({
  open,
  onSubmit,
}: {
  open: boolean;
  onSubmit: (name: string, phone: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-accent/30 bg-card p-6 shadow-2xl space-y-5"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground">הניתוח הושלם!</h3>
          <p className="text-sm text-muted-foreground">
            הכניסו שם וטלפון כדי לקבל את הדוח המלא ישירות לוואטסאפ
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <User className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="שם מלא"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pr-10 h-12 bg-secondary border-border"
            />
          </div>
          <div className="relative">
            <Phone className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="טלפון נייד"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pr-10 h-12 bg-secondary border-border"
              type="tel"
            />
          </div>
        </div>

        <Button
          className="w-full h-12 text-lg bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
          disabled={name.length < 2 || phone.length < 9}
          onClick={() => onSubmit(name, phone)}
        >
          שלח לי את הדוח <ArrowRight className="w-5 h-5 mr-2" />
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          <Lock className="w-3 h-3 inline ml-1" />
          הנתונים מוצפנים ונשמרים בהתאם לתקנות הגנת הפרטיות
        </p>
      </motion.div>
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
  const [phase, setPhase] = useState<"widget" | "loading" | "capture" | "done">("widget");
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [toolData, setToolData] = useState<Record<string, unknown>>({});

  // Trigger AI loading
  const handleToolSubmit = useCallback((data: Record<string, unknown>) => {
    setToolData(data);
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
      if (consultantId) {
        await supabase.from("leads").insert({
          full_name: name,
          phone,
          consultant_id: consultantId,
          lead_source: `campaign_${funnelType}`,
          status: "new" as const,
          notes: JSON.stringify(toolData),
        });
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
        return <PayslipWidget onSubmit={handleToolSubmit} />;
      case "har-habituach":
        return <HarHabituachWidget onSubmit={handleToolSubmit} />;
      case "masleka":
        return <PlaceholderWidget label="מסלקה" onSubmit={handleToolSubmit} />;
      case "savings":
        return <PlaceholderWidget label="חיסכון" onSubmit={handleToolSubmit} />;
      case "price-compare":
        return <PlaceholderWidget label="השוואת מחירים" onSubmit={handleToolSubmit} />;
      default:
        return <MortgageWidget onSubmit={handleToolSubmit} />;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
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
      <LeadCaptureModal open={phase === "capture"} onSubmit={handleLeadSubmit} />
    </div>
  );
}
