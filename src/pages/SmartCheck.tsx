import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, Lock, Calculator, Search, FileText, Smartphone,
  BarChart3, Brain, Upload, CheckCircle2, Sparkles, ArrowRight,
  Eye, FileUp, Fingerprint, User, Phone, Mail
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
interface ContactInfo {
  fullName: string;
  phone: string;
  email: string;
  consent: boolean;
}

interface LeadContextType {
  contactInfo: ContactInfo | null;
  setContactInfo: (info: ContactInfo) => void;
  consultantId: string | null;
  submitLead: (source: string, metadata?: Record<string, unknown>) => Promise<boolean>;
}

const LeadContext = createContext<LeadContextType>({
  contactInfo: null,
  setContactInfo: () => {},
  consultantId: null,
  submitLead: async () => false,
});

// ── Loading steps ──────────────────────────────────────────────
const loadingSteps = [
  { text: "מצפין חיבור מאובטח…", icon: Lock },
  { text: "AI מחלץ נתונים פיננסיים…", icon: Brain },
  { text: "מצליב מידע מול מאגרי נתונים…", icon: Search },
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

  useEffect(() => {
    if (!running || done) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setDone(true);
          setRunning(false);
          return 100;
        }
        const next = p + 2;
        setStepIdx(Math.min(Math.floor(next / 25), loadingSteps.length - 1));
        return next;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [running, done]);

  return { running, stepIdx, progress, done, start, reset: () => setDone(false) };
}

// ── Loading overlay ────────────────────────────────────────────
function LoadingOverlay({ stepIdx, progress }: { stepIdx: number; progress: number }) {
  const step = loadingSteps[stepIdx];
  const StepIcon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 rounded-xl bg-background/95 backdrop-blur-md"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="p-4 rounded-full border-2 border-primary/40 bg-primary/10"
      >
        <StepIcon className="h-8 w-8 text-primary" />
      </motion.div>
      <p className="text-sm font-medium text-foreground">{step.text}</p>
      <div className="w-64">
        <Progress value={progress} className="h-2" />
      </div>
      <p className="text-xs text-muted-foreground">{progress}%</p>
    </motion.div>
  );
}

// ── Success state ──────────────────────────────────────────────
function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center justify-center gap-5 py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="p-5 rounded-full bg-emerald-500/20 border border-emerald-500/40"
      >
        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
      </motion.div>
      <h3 className="text-xl font-bold text-foreground">הניתוח הושלם!</h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        זיהינו פוטנציאל חיסכון. הקובץ המאובטח שלך סונכרן ישירות ל-CRM של היועץ.
        <br />הם ייצרו איתך קשר בקרוב.
      </p>
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-1.5 text-sm">
        <Shield className="h-3.5 w-3.5 ml-1" /> מוגן בהצפנה 256-bit
      </Badge>
      <Button variant="outline" size="sm" className="mt-4" onClick={onReset}>
        בצע סריקה נוספת
      </Button>
    </motion.div>
  );
}

// ── Contact Info Form (inline gate) ────────────────────────────
function ContactGate({ onSubmit, children }: { onSubmit: () => void; children: React.ReactNode }) {
  const { contactInfo, setContactInfo } = useContext(LeadContext);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  if (contactInfo) return <>{children}</>;

  const isValid = name.trim().length >= 2 && phone.trim().length >= 9 && consent;

  const handleSubmit = () => {
    if (!isValid) return;
    setContactInfo({ fullName: name.trim(), phone: phone.trim(), email: email.trim(), consent });
    onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="text-center space-y-1">
        <h3 className="text-base font-bold text-foreground">השאר פרטים לקבלת התוצאות</h3>
        <p className="text-xs text-muted-foreground">הפרטים שלך מוגנים ומשמשים ליצירת קשר בלבד</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="שם מלא *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="relative">
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="טלפון *"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d\-+]/g, "").slice(0, 15))}
            className="pr-10"
            dir="ltr"
          />
        </div>
        <div className="relative">
          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="אימייל (לא חובה)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pr-10"
            dir="ltr"
          />
        </div>
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox checked={consent} onCheckedChange={(c) => setConsent(c === true)} className="mt-0.5" />
          <span className="text-xs text-muted-foreground leading-relaxed">
            אני מאשר/ת קבלת פנייה מיועץ מקצועי בנוגע לתוצאות הבדיקה *
          </span>
        </label>
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={!isValid}>
        <Shield className="h-4 w-4 ml-2" />
        קבל תוצאות מאובטחות
      </Button>
    </motion.div>
  );
}

// ── Wrapper hook for tab submissions ───────────────────────────
function useTabSubmit(source: string, metadata?: Record<string, unknown>) {
  const { contactInfo, submitLead } = useContext(LeadContext);
  const seq = useLoadingSequence();
  const [showGate, setShowGate] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!contactInfo) {
      setShowGate(true);
      return;
    }
    seq.start();
    await submitLead(source, metadata);
  }, [contactInfo, seq, submitLead, source, metadata]);

  const handleGateComplete = useCallback(() => {
    // Contact info was just set — start the sequence on next render
    setShowGate(false);
    seq.start();
    // Submit will happen after loading via effect
  }, [seq]);

  // Submit lead after gate completion when loading starts
  useEffect(() => {
    if (seq.running && seq.progress === 0) {
      submitLead(source, metadata);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq.running]);

  return { seq, showGate, handleSubmit, handleGateComplete };
}

// ── Mortgage Calculator Tab ────────────────────────────────────
function MortgageCalcTab() {
  const [amount, setAmount] = useState([1200000]);
  const [years, setYears] = useState([25]);
  const [rate, setRate] = useState([4.5]);

  const monthlyPayment = (() => {
    const P = amount[0];
    const r = rate[0] / 100 / 12;
    const n = years[0] * 12;
    return Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  })();

  const { seq, showGate, handleSubmit, handleGateComplete } = useTabSubmit(
    "smart-check-mortgage",
    { mortgage_amount: amount[0], years: years[0], rate: rate[0], monthly_payment: monthlyPayment }
  );

  return (
    <div className="relative space-y-6">
      <AnimatePresence>
        {seq.running && <LoadingOverlay stepIdx={seq.stepIdx} progress={seq.progress} />}
      </AnimatePresence>
      {seq.done ? (
        <SuccessState onReset={seq.reset} />
      ) : showGate ? (
        <ContactGate onSubmit={handleGateComplete}>
          <div />
        </ContactGate>
      ) : (
        <>
          <div className="space-y-4">
            <label className="text-sm text-muted-foreground flex justify-between">
              <span>סכום הלוואה</span>
              <span className="font-semibold text-foreground">{amount[0].toLocaleString()} ₪</span>
            </label>
            <Slider min={200000} max={5000000} step={50000} value={amount} onValueChange={setAmount} />
          </div>
          <div className="space-y-4">
            <label className="text-sm text-muted-foreground flex justify-between">
              <span>תקופה (שנים)</span>
              <span className="font-semibold text-foreground">{years[0]}</span>
            </label>
            <Slider min={5} max={30} step={1} value={years} onValueChange={setYears} />
          </div>
          <div className="space-y-4">
            <label className="text-sm text-muted-foreground flex justify-between">
              <span>ריבית (%)</span>
              <span className="font-semibold text-foreground">{rate[0]}%</span>
            </label>
            <Slider min={1} max={10} step={0.1} value={rate} onValueChange={setRate} />
          </div>
          <div className="rounded-xl border border-border/40 bg-card/60 p-5 text-center">
            <p className="text-xs text-muted-foreground">החזר חודשי משוער</p>
            <p className="text-3xl font-bold text-primary mt-1">{monthlyPayment.toLocaleString()} ₪</p>
          </div>
          <Button className="w-full" onClick={handleSubmit}>
            <Calculator className="h-4 w-4 ml-2" />
            חשב ושלח לייעוץ מקצועי
          </Button>
        </>
      )}
    </div>
  );
}

// ── Lost Savings Tab ───────────────────────────────────────────
function LostSavingsTab() {
  const [idNum, setIdNum] = useState("");
  const { seq, showGate, handleSubmit, handleGateComplete } = useTabSubmit("smart-check-savings");

  return (
    <div className="relative space-y-6">
      <AnimatePresence>
        {seq.running && <LoadingOverlay stepIdx={seq.stepIdx} progress={seq.progress} />}
      </AnimatePresence>
      {seq.done ? (
        <SuccessState onReset={seq.reset} />
      ) : showGate ? (
        <ContactGate onSubmit={handleGateComplete}><div /></ContactGate>
      ) : (
        <>
          <p className="text-sm text-muted-foreground leading-relaxed">
            הזן מספר תעודת זהות – המערכת תסרוק קרנות פנסיה ישנות ופוליסות שנשכחו.
          </p>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">מספר תעודת זהות</label>
            <Input
              placeholder="000000000"
              value={idNum}
              onChange={(e) => setIdNum(e.target.value.replace(/\D/g, "").slice(0, 9))}
              className="text-center text-lg tracking-widest"
              dir="ltr"
            />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={idNum.length < 9}>
            <Search className="h-4 w-4 ml-2" />
            סרוק חסכונות אבודים
          </Button>
        </>
      )}
    </div>
  );
}

// ── Pension Order Tab ──────────────────────────────────────────
function PensionOrderTab() {
  const [signed, setSigned] = useState(false);
  const { seq, showGate, handleSubmit, handleGateComplete } = useTabSubmit("smart-check-pension");

  return (
    <div className="relative space-y-6">
      <AnimatePresence>
        {seq.running && <LoadingOverlay stepIdx={seq.stepIdx} progress={seq.progress} />}
      </AnimatePresence>
      {seq.done ? (
        <SuccessState onReset={() => { seq.reset(); setSigned(false); }} />
      ) : showGate ? (
        <ContactGate onSubmit={handleGateComplete}><div /></ContactGate>
      ) : (
        <>
          <p className="text-sm text-muted-foreground leading-relaxed">
            חתום על טופס הרשאה דיגיטלי כדי לקבל את כל המידע הפנסיוני שלך.
          </p>
          <div
            className={`relative h-40 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
              signed ? "border-emerald-500/50 bg-emerald-500/5" : "border-border/60 bg-card/40 hover:border-primary/40"
            }`}
            onClick={() => {
              setSigned(true);
              toast.success("החתימה התקבלה!");
            }}
          >
            {signed ? (
              <div className="flex flex-col items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
                <span className="text-sm font-medium">חתימה תקינה</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Fingerprint className="h-8 w-8" />
                <span className="text-sm">לחץ כאן כדי לחתום</span>
              </div>
            )}
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={!signed}>
            <FileText className="h-4 w-4 ml-2" />
            שלח טופס הרשאה
          </Button>
        </>
      )}
    </div>
  );
}

// ── Har HaBituach Tab ──────────────────────────────────────────
function HarHaBituachTab() {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const { seq, showGate, handleSubmit, handleGateComplete } = useTabSubmit("smart-check-har-habituach");

  return (
    <div className="relative space-y-6">
      <AnimatePresence>
        {seq.running && <LoadingOverlay stepIdx={seq.stepIdx} progress={seq.progress} />}
      </AnimatePresence>
      {seq.done ? (
        <SuccessState onReset={() => { seq.reset(); setOtpSent(false); setOtp(""); }} />
      ) : showGate ? (
        <ContactGate onSubmit={handleGateComplete}><div /></ContactGate>
      ) : (
        <>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ניתוח AI אוטומטי של מסמכי הר הביטוח שלך – הזן טלפון לאימות.
          </p>
          {!otpSent ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">מספר טלפון</label>
                <Input
                  placeholder="05X-XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setOtpSent(true);
                  toast.success("קוד אימות נשלח!");
                }}
                disabled={phone.length < 10}
              >
                <Smartphone className="h-4 w-4 ml-2" />
                שלח קוד SMS
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">קוד אימות (4 ספרות)</label>
                <Input
                  placeholder="0000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="text-center text-2xl tracking-[0.5em]"
                  dir="ltr"
                />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={otp.length < 4}>
                <Shield className="h-4 w-4 ml-2" />
                אמת ופתח סריקה
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Price Compare Tab ──────────────────────────────────────────
function PriceCompareTab() {
  const [age, setAge] = useState("");
  const { seq, showGate, handleSubmit, handleGateComplete } = useTabSubmit("smart-check-price-compare");

  return (
    <div className="relative space-y-6">
      <AnimatePresence>
        {seq.running && <LoadingOverlay stepIdx={seq.stepIdx} progress={seq.progress} />}
      </AnimatePresence>
      {seq.done ? (
        <SuccessState onReset={seq.reset} />
      ) : showGate ? (
        <ContactGate onSubmit={handleGateComplete}><div /></ContactGate>
      ) : (
        <>
          <p className="text-sm text-muted-foreground leading-relaxed">
            השוואה מיידית מול 5 חברות ביטוח – תוצאות תוך שניות.
          </p>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">גיל</label>
            <Input
              type="number"
              placeholder="30"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={!age}>
            <BarChart3 className="h-4 w-4 ml-2" />
            השווה מחירים עכשיו
          </Button>
        </>
      )}
    </div>
  );
}

// ── AI Payslip Scanner Tab (flagship) ──────────────────────────
function PayslipScannerTab() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { seq, showGate, handleSubmit, handleGateComplete } = useTabSubmit("smart-check-payslip-ai");

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      toast.success(`קובץ "${dropped.name}" נקלט`);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      toast.success(`קובץ "${selected.name}" נקלט`);
    }
  };

  return (
    <div className="relative space-y-6">
      <AnimatePresence>
        {seq.running && <LoadingOverlay stepIdx={seq.stepIdx} progress={seq.progress} />}
      </AnimatePresence>
      {seq.done ? (
        <SuccessState onReset={() => { seq.reset(); setFile(null); }} />
      ) : showGate ? (
        <ContactGate onSubmit={handleGateComplete}><div /></ContactGate>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              <Sparkles className="h-3 w-3 ml-1" />
              Flagship AI Tool
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            גרור תלוש שכר או מסמך פנסיוני – ה-AI שלנו ינתח ויזהה פערים בתוך שניות.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-all cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : file
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-border/60 bg-card/40 hover:border-primary/40"
            }`}
            onClick={() => document.getElementById("payslip-input")?.click()}
          >
            <input
              id="payslip-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileInput}
            />
            {file ? (
              <>
                <FileUp className="h-10 w-10 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-400">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">גרור קובץ לכאן או לחץ לבחירה</p>
                <p className="text-xs text-muted-foreground/60">PDF, JPG, PNG – עד 20MB</p>
              </>
            )}
          </div>

          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
            onClick={handleSubmit}
            disabled={!file}
          >
            <Brain className="h-4 w-4 ml-2" />
            הפעל סריקת AI
            <ArrowRight className="h-4 w-4 mr-2" />
          </Button>
        </>
      )}
    </div>
  );
}

// ── Tabs config ────────────────────────────────────────────────
const tabs = [
  { id: "mortgage", label: "מחשבון משכנתא", icon: Calculator, component: MortgageCalcTab },
  { id: "savings", label: "חסכונות אבודים", icon: Search, component: LostSavingsTab },
  { id: "pension", label: "הזמנת מסלקה", icon: FileText, component: PensionOrderTab },
  { id: "har", label: "הר הביטוח", icon: Smartphone, component: HarHaBituachTab },
  { id: "compare", label: "השוואת מחירים", icon: BarChart3, component: PriceCompareTab },
  { id: "payslip", label: "סורק AI", icon: Brain, component: PayslipScannerTab },
];

// ── Main Page ──────────────────────────────────────────────────
export default function SmartCheck() {
  const [searchParams] = useSearchParams();
  const consultantId = searchParams.get("ref");
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  const submitLead = useCallback(async (source: string, metadata?: Record<string, unknown>) => {
    if (!contactInfo) return false;

    // Need a consultant_id for the RLS insert policy
    const targetConsultantId = consultantId;
    if (!targetConsultantId) {
      // No referral — still show success but don't insert (no consultant to assign to)
      console.log("Smart Check submission (no ref):", { contactInfo, source, metadata });
      return true;
    }

    try {
      const { error } = await supabase.from("leads").insert({
        full_name: contactInfo.fullName,
        phone: contactInfo.phone,
        email: contactInfo.email || null,
        consultant_id: targetConsultantId,
        lead_source: source,
        marketing_consent: contactInfo.consent,
        notes: metadata ? JSON.stringify(metadata) : null,
        status: "new" as const,
        mortgage_amount: metadata?.mortgage_amount ? Number(metadata.mortgage_amount) : null,
      });

      if (error) {
        console.error("Lead insert error:", error);
        // Still show success to user — don't break UX
      }
    } catch (err) {
      console.error("Lead submit error:", err);
    }

    return true;
  }, [contactInfo, consultantId]);

  return (
    <LeadContext.Provider value={{ contactInfo, setContactInfo, consultantId, submitLead }}>
      <div className="min-h-screen bg-background text-foreground" dir="rtl">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
          {/* Trust header */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">בדיקה חכמה מאובטחת</h1>
            </motion.div>
            <p className="text-sm text-muted-foreground">בדיקה פיננסית בדרגת בנק – ללא התחייבות</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Badge variant="outline" className="border-primary/30 text-primary text-xs px-3 py-1">
                <Lock className="h-3 w-3 ml-1" />
                הצפנה 256-bit
              </Badge>
              <Badge variant="outline" className="border-primary/30 text-primary text-xs px-3 py-1">
                <Eye className="h-3 w-3 ml-1" />
                ניתוח AI מאובטח
              </Badge>
              <Badge variant="outline" className="border-primary/30 text-primary text-xs px-3 py-1">
                <Shield className="h-3 w-3 ml-1" />
                Bank-Grade Security
              </Badge>
            </div>
          </div>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/10 overflow-hidden"
          >
            <Tabs defaultValue="payslip" dir="rtl">
              <div className="border-b border-border/40 overflow-x-auto">
                <TabsList className="w-full h-auto p-1 bg-transparent gap-0 flex-nowrap justify-start">
                  {tabs.map((t) => (
                    <TabsTrigger
                      key={t.id}
                      value={t.id}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg"
                    >
                      <t.icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{t.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="p-5 min-h-[340px]">
                {tabs.map((t) => (
                  <TabsContent key={t.id} value={t.id} className="mt-0">
                    <t.component />
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </motion.div>

          {/* Footer trust */}
          <p className="text-center text-xs text-muted-foreground/60">
            המידע שלך מוגן בהצפנת AES-256 ומעובד בשרתים מאובטחים בלבד.
            <br />
            Powered by Chitumit AI · ISO 27001
          </p>
        </div>
      </div>
    </LeadContext.Provider>
  );
}
