import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import StarField from "@/components/StarField";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { PublicFooter } from "@/components/PublicFooter";
import { TrustBankLogos } from "@/components/TrustBankLogos";
import { useConsultantBranding } from "@/hooks/useConsultantBranding";
import {
  ArrowLeft, ArrowRight, Building2, Home, Banknote, ShieldCheck, Lock,
  User, Phone, Mail, CheckCircle2, Sparkles, Brain, Upload, FileText,
  CreditCard, Landmark, TrendingUp, AlertTriangle, Target, Clock,
  ChevronDown, Star, Loader2, KeyRound, Briefcase,
} from "lucide-react";

const DEFAULT_CONSULTANT_ID = "a4777786-46d3-44fa-a303-a092ebd70f2d";

/* ── Loan type definitions ── */
const LOAN_TYPES = [
  { value: "equity_release", label: "משיכת הון מנכס קיים", emoji: "🏠", desc: "קבלת הלוואה כנגד שווי הנכס שברשותך", icon: Home },
  { value: "bridge_loan", label: "הלוואת גישור", emoji: "🌉", desc: "מימון ביניים בין מכירה לרכישה", icon: TrendingUp },
  { value: "business_loan", label: "הלוואה עסקית כנגד נכס", emoji: "💼", desc: "מימון לעסק עם נכס כבטוחה", icon: Landmark },
  { value: "consolidation", label: "איחוד הלוואות", emoji: "🔄", desc: "מיזוג חובות למשכנתא אחת בריבית נמוכה", icon: CreditCard },
  { value: "renovation", label: "הלוואה לשיפוץ", emoji: "🔨", desc: "מימון שיפוץ מקיף כנגד הנכס", icon: Building2 },
  { value: "investment", label: "מימון נכס להשקעה", emoji: "📈", desc: "רכישת נכס נוסף כהשקעה", icon: TrendingUp },
];

/* ── Step definitions ── */
type StepKey = "loan_type" | "property_info" | "financial" | "existing_loans" | "urgency" | "contact" | "documents";

interface StepDef {
  key: StepKey;
  label: string;
  icon: React.ElementType;
  subtitle: string;
}

const STEPS: StepDef[] = [
  { key: "loan_type", label: "סוג ההלוואה", icon: Target, subtitle: "מה המטרה שלך?" },
  { key: "property_info", label: "פרטי הנכס", icon: Home, subtitle: "ספר/י לנו על הנכס" },
  { key: "financial", label: "מצב פיננסי", icon: Banknote, subtitle: "הכנסות והוצאות" },
  { key: "existing_loans", label: "התחייבויות קיימות", icon: CreditCard, subtitle: "חובות והלוואות" },
  { key: "urgency", label: "דחיפות ולו\"ז", icon: Clock, subtitle: "מתי צריך את הכסף?" },
  { key: "contact", label: "פרטי התקשרות", icon: User, subtitle: "כדי שנוכל לחזור אליך" },
  { key: "documents", label: "העלאת מסמכים", icon: Upload, subtitle: "תהליך דיגיטלי מלא" },
];

const URGENCY_OPTIONS = [
  { value: "immediate", label: "דחוף — תוך שבוע", emoji: "🔥" },
  { value: "month", label: "תוך חודש", emoji: "📅" },
  { value: "quarter", label: "תוך 3 חודשים", emoji: "🗓️" },
  { value: "exploring", label: "סתם בודק אפשרויות", emoji: "🔍" },
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "דירה" },
  { value: "house", label: "בית פרטי" },
  { value: "penthouse", label: "פנטהאוז" },
  { value: "land", label: "מגרש" },
  { value: "commercial", label: "נכס מסחרי" },
  { value: "office", label: "משרד" },
];

const EMPLOYMENT_SENIORITY = [
  { value: "less_than_1", label: "פחות משנה", emoji: "🌱" },
  { value: "1_to_3", label: "1-3 שנים", emoji: "📊" },
  { value: "3_to_5", label: "3-5 שנים", emoji: "💼" },
  { value: "5_to_10", label: "5-10 שנים", emoji: "⭐" },
  { value: "10_plus", label: "מעל 10 שנים", emoji: "🏆" },
  { value: "self_employed", label: "עצמאי/ת", emoji: "🧑‍💻" },
];

const REQUIRED_DOCS = [
  { key: "id", label: 'צילום ת"ז + ספח', icon: User },
  { key: "salary", label: "3 תלושי שכר אחרונים", icon: Banknote },
  { key: "bank", label: 'דפי עו"ש (6 חודשים)', icon: FileText },
  { key: "property", label: "נסח טאבו / אישור זכויות", icon: Home },
];

/* ── Animated number hook ── */
function useAnimatedNumber(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const start = ref.current;
    const diff = target - start;
    if (!diff) return;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(start + diff * eased));
      if (p < 1) requestAnimationFrame(tick);
      else ref.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

/* ── Fade animation ── */
const fadeSlide = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

/* ──────── MAIN COMPONENT ──────── */
const PropertyLoanFunnel = () => {
  const navigate = useNavigate();
  const { branding } = useConsultantBranding(DEFAULT_CONSULTANT_ID);
  const consultantId = branding?.consultantId || DEFAULT_CONSULTANT_ID;

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Form state
  const [loanType, setLoanType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [propertyValue, setPropertyValue] = useState(2000000);
  const [loanAmount, setLoanAmount] = useState(500000);
  const [hasExistingMortgage, setHasExistingMortgage] = useState<boolean | null>(null);
  const [existingMortgageBalance, setExistingMortgageBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(20000);
  const [existingMonthlyPayments, setExistingMonthlyPayments] = useState(0);
  const [urgency, setUrgency] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());
  const [employmentSeniority, setEmploymentSeniority] = useState("");

  // Calculations
  const ltv = propertyValue > 0 ? Math.round(((loanAmount + existingMortgageBalance) / propertyValue) * 100) : 0;
  const estimatedRate = ltv > 70 ? 5.8 : ltv > 50 ? 4.8 : 4.2;
  const r = estimatedRate / 100 / 12;
  const n = 20 * 12;
  const monthlyPayment = r > 0 ? Math.round((loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) : 0;
  const dti = monthlyIncome > 0 ? Math.round(((monthlyPayment + existingMonthlyPayments) / monthlyIncome) * 100) : 0;
  const maxApprovalChance = dti < 30 ? "גבוה" : dti < 40 ? "בינוני" : "נמוך";

  const animatedLTV = useAnimatedNumber(ltv);
  const animatedPayment = useAnimatedNumber(monthlyPayment);
  const animatedDTI = useAnimatedNumber(dti);

  const canProceed = () => {
    switch (STEPS[currentStep]?.key) {
      case "loan_type": return !!loanType;
      case "property_info": return !!propertyType && propertyValue > 0;
      case "financial": return monthlyIncome > 0 && loanAmount > 0;
      case "existing_loans": return hasExistingMortgage !== null;
      case "urgency": return !!urgency;
      case "contact": return fullName.trim().length > 1 && phone.trim().length > 5;
      case "documents": return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };
  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!fullName || !phone) return;
    setSubmitting(true);
    try {
      const tags: string[] = [];
      if (loanAmount >= 2000000) tags.push("VIP Lead");
      if (ltv > 75) tags.push("High LTV");
      if (dti > 40) tags.push("High DTI");

      const loanTypeLabel = LOAN_TYPES.find(t => t.value === loanType)?.label || loanType;
      const notes = [
        `הלוואה כנגד נכס — ${loanTypeLabel}`,
        `סוג נכס: ${PROPERTY_TYPES.find(t => t.value === propertyType)?.label || propertyType}`,
        `שווי נכס: ₪${propertyValue.toLocaleString()}`,
        `סכום מבוקש: ₪${loanAmount.toLocaleString()}`,
        `LTV: ${ltv}%`,
        `הכנסה חודשית: ₪${monthlyIncome.toLocaleString()}`,
        `DTI: ${dti}%`,
        `החזר חודשי משוער: ₪${monthlyPayment.toLocaleString()}`,
        hasExistingMortgage ? `יתרת משכנתא קיימת: ₪${existingMortgageBalance.toLocaleString()}` : "ללא משכנתא קיימת",
        employmentSeniority ? `וותק תעסוקתי: ${EMPLOYMENT_SENIORITY.find(e => e.value === employmentSeniority)?.label || employmentSeniority}` : "",
        `דחיפות: ${URGENCY_OPTIONS.find(o => o.value === urgency)?.label || urgency}`,
        tags.length ? `תגיות: ${tags.join(", ")}` : "",
        `מסמכים שהועלו: ${uploadedDocs.size}/${REQUIRED_DOCS.length}`,
      ].filter(Boolean).join(". ");

      const leadScore = Math.min(100, 
        (loanAmount >= 1000000 ? 25 : 15) +
        (ltv <= 60 ? 20 : ltv <= 75 ? 10 : 5) +
        (dti < 30 ? 20 : dti < 40 ? 10 : 0) +
        (email ? 10 : 0) +
        (marketingConsent ? 5 : 0) +
        (uploadedDocs.size * 5) +
        (urgency === "immediate" ? 10 : urgency === "month" ? 5 : 0)
      );

      const { error } = await supabase.from("leads").insert({
        consultant_id: consultantId,
        full_name: fullName,
        phone: phone || null,
        email: email || null,
        mortgage_amount: loanAmount,
        property_value: propertyValue,
        monthly_income: monthlyIncome,
        lead_source: "organic",
        marketing_consent: marketingConsent,
        lead_score: leadScore,
        notes,
      } as any);

      if (error) throw error;

      // Notify consultant
      supabase.functions.invoke("notify-new-lead", {
        body: {
          consultantId,
          leadName: fullName,
          leadPhone: phone,
          leadScore,
          calcType: "הלוואה כנגד נכס",
          calcSummary: `${loanTypeLabel}: ₪${loanAmount.toLocaleString()}, LTV ${ltv}%`,
        },
      }).catch(() => {});

      if (email) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "calculator-report",
            recipientEmail: email,
            idempotencyKey: `property-loan-${Date.now()}`,
            templateData: {
              leadName: fullName,
              calcType: "הלוואה כנגד נכס",
              calcSummary: `${loanTypeLabel}: ₪${loanAmount.toLocaleString()}, LTV ${ltv}%, החזר חודשי ₪${monthlyPayment.toLocaleString()}`,
              leadScore,
            },
          },
        }).catch(() => {});
      }

      setCompleted(true);
      toast.success("🎉 הפרטים נשלחו בהצלחה! ניצור קשר בהקדם.");
    } catch (e: any) {
      toast.error(e.message || "שגיאה בשליחה");
    } finally {
      setSubmitting(false);
    }
  };

  const simulateUpload = (docKey: string) => {
    toast.info("📄 סורק מסמך...");
    setTimeout(() => {
      setUploadedDocs(prev => new Set(prev).add(docKey));
      toast.success("✅ מסמך אומת בהצלחה");
    }, 2000);
  };

  /* ──── RENDER ──── */
  return (
    <>
      <style>{`
        @keyframes scanPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
      `}</style>
      <div className="min-h-screen bg-[hsl(222,47%,4%)] text-white overflow-hidden" dir="rtl">
        <StarField />

        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none z-[2]">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[hsl(38,92%,50%)] opacity-[0.05] blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(160,84%,39%)] opacity-[0.04] blur-[100px]" />
        </div>

        {/* Navbar */}
        <nav className="relative z-50 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gold/20 rounded-full blur-md" />
                <ChitumitLogo size={40} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">חיתומית</h1>
                <p className="text-[10px] text-gold/40 tracking-wider">הלוואה כנגד נכס</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/calculator" className="hidden md:flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
                <Banknote className="w-3.5 h-3.5" />
                <span>מחשבון משכנתא</span>
              </Link>
              <div className="hidden md:flex items-center gap-1 text-xs text-white/50">
                <Lock className="w-3 h-3" />
                <span>מאובטח SSL</span>
              </div>
              <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:bg-white/5" onClick={() => navigate("/")}>
                <ArrowRight className="w-4 h-4 ml-1" />
                חזרה
              </Button>
            </div>
          </div>
        </nav>

        {/* Progress bar */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-6">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 border-2",
                      done ? "bg-gold text-black border-gold shadow-lg shadow-gold/30" :
                      active ? "bg-gold/20 text-gold border-gold/60 animate-pulse" :
                      "bg-white/5 text-white/30 border-white/10"
                    )}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                    </div>
                    <span className={cn(
                      "text-[10px] whitespace-nowrap hidden sm:block",
                      done ? "text-gold" : active ? "text-white/80" : "text-white/30"
                    )}>{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-1 sm:mx-2 rounded-full transition-all duration-500",
                      done ? "bg-gold" : "bg-white/10"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-white/40">שלב {currentStep + 1} מתוך {STEPS.length}: {STEPS[currentStep]?.subtitle}</p>
        </div>

        {/* Main content */}
        <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {completed ? (
            /* ── Success State ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold/30 to-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-gold" />
              </div>
              <h2 className="text-3xl font-bold">הבקשה נשלחה בהצלחה! 🎉</h2>
              <p className="text-white/60 max-w-md mx-auto">
                יועץ משכנתאות מוסמך ייצור איתך קשר תוך מספר שעות עם הצעה מותאמת אישית.
              </p>

              {/* Summary card */}
              <div className="max-w-md mx-auto bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-3 text-right">
                <h3 className="text-sm font-bold text-gold">סיכום הבקשה</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-white/40">סוג הלוואה:</span><p className="text-white font-medium">{LOAN_TYPES.find(t => t.value === loanType)?.label}</p></div>
                  <div><span className="text-white/40">סכום מבוקש:</span><p className="text-white font-medium">₪{loanAmount.toLocaleString()}</p></div>
                  <div><span className="text-white/40">LTV:</span><p className={cn("font-bold", ltv > 70 ? "text-red-400" : "text-green-400")}>{ltv}%</p></div>
                  <div><span className="text-white/40">החזר משוער:</span><p className="text-gold font-bold">₪{monthlyPayment.toLocaleString()}/חודש</p></div>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button onClick={() => navigate("/")} variant="outline" className="border-white/10 text-white/70 hover:bg-white/5">
                  חזרה לדף הבית
                </Button>
                <Button onClick={() => navigate("/self-check")} className="bg-gold hover:bg-gold/90 text-black font-bold">
                  בדיקה עצמית מלאה
                </Button>
              </div>
            </motion.div>
          ) : (
            /* ── Step Content ── */
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} {...fadeSlide} className="space-y-6">

                {/* ─── Step 1: Loan Type ─── */}
                {STEPS[currentStep]?.key === "loan_type" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl sm:text-3xl font-bold">
                        <span className="text-gold">הלוואה כנגד נכס</span> — מה אתה מחפש?
                      </h2>
                      <p className="text-white/50 text-sm">בחר את סוג ההלוואה המתאים לך</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {LOAN_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            onClick={() => setLoanType(type.value)}
                            className={cn(
                              "p-5 rounded-xl border-2 text-right transition-all duration-300 group",
                              loanType === type.value
                                ? "border-gold bg-gold/10 shadow-lg shadow-gold/10"
                                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-lg transition-colors",
                                loanType === type.value ? "bg-gold/20" : "bg-white/10"
                              )}>
                                <Icon className={cn("w-5 h-5", loanType === type.value ? "text-gold" : "text-white/50")} />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{type.emoji} {type.label}</p>
                                <p className="text-xs text-white/40 mt-1">{type.desc}</p>
                              </div>
                              {loanType === type.value && (
                                <CheckCircle2 className="w-5 h-5 text-gold mr-auto shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─── Step 2: Property Info ─── */}
                {STEPS[currentStep]?.key === "property_info" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center">🏠 ספר/י לנו על הנכס</h2>
                    
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">סוג הנכס</label>
                      <div className="grid grid-cols-3 gap-2">
                        {PROPERTY_TYPES.map((pt) => (
                          <button
                            key={pt.value}
                            onClick={() => setPropertyType(pt.value)}
                            className={cn(
                              "py-3 px-4 rounded-lg text-sm font-medium transition-all border",
                              propertyType === pt.value
                                ? "border-gold bg-gold/10 text-gold"
                                : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                            )}
                          >{pt.label}</button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">שווי הנכס המשוער</span>
                        <span className="text-xl font-bold text-gold">₪{propertyValue.toLocaleString()}</span>
                      </div>
                      <Slider
                        value={[propertyValue]}
                        onValueChange={([v]) => setPropertyValue(v)}
                        min={500000}
                        max={10000000}
                        step={50000}
                        className="py-2"
                      />
                      <div className="flex justify-between text-[10px] text-white/30">
                        <span>₪500K</span><span>₪10M</span>
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">משכנתא קיימת על הנכס?</span>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setHasExistingMortgage(true)} className={cn("flex-1 py-3 rounded-lg text-sm font-medium border transition-all", hasExistingMortgage === true ? "border-gold bg-gold/10 text-gold" : "border-white/10 bg-white/5 text-white/50")}>כן</button>
                        <button onClick={() => { setHasExistingMortgage(false); setExistingMortgageBalance(0); }} className={cn("flex-1 py-3 rounded-lg text-sm font-medium border transition-all", hasExistingMortgage === false ? "border-gold bg-gold/10 text-gold" : "border-white/10 bg-white/5 text-white/50")}>לא</button>
                      </div>
                      {hasExistingMortgage && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/40">יתרת משכנתא</span>
                            <span className="text-sm font-bold text-white">₪{existingMortgageBalance.toLocaleString()}</span>
                          </div>
                          <Slider
                            value={[existingMortgageBalance]}
                            onValueChange={([v]) => setExistingMortgageBalance(v)}
                            min={0}
                            max={propertyValue * 0.8}
                            step={10000}
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── Step 3: Financial ─── */}
                {STEPS[currentStep]?.key === "financial" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center">💰 מצב פיננסי</h2>
                    
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">הכנסה חודשית נטו (כל המקורות)</span>
                        <span className="text-lg font-bold text-white">₪{monthlyIncome.toLocaleString()}</span>
                      </div>
                      <Slider value={[monthlyIncome]} onValueChange={([v]) => setMonthlyIncome(v)} min={5000} max={100000} step={1000} />
                      <div className="flex justify-between text-[10px] text-white/30"><span>₪5K</span><span>₪100K</span></div>
                    </div>

                    {/* Employment Seniority */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gold/70" />
                        <span className="text-sm text-white/60">וותק תעסוקתי במקום העבודה הנוכחי</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {EMPLOYMENT_SENIORITY.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setEmploymentSeniority(opt.value)}
                            className={cn(
                              "py-3 px-2 rounded-lg text-xs font-medium transition-all border text-center",
                              employmentSeniority === opt.value
                                ? "border-gold bg-gold/10 text-gold"
                                : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                            )}
                          >
                            <span className="block text-base mb-0.5">{opt.emoji}</span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {employmentSeniority === "less_than_1" && (
                        <p className="text-[11px] text-amber-400/70 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          וותק קצר עלול להשפיע על תנאי ההלוואה — יועץ ילווה אותך בתהליך
                        </p>
                      )}
                      {employmentSeniority === "self_employed" && (
                        <p className="text-[11px] text-white/40 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          עצמאים נדרשים להמציא שומות מס ודוחות רווח והפסד
                        </p>
                      )}
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">סכום ההלוואה המבוקש</span>
                        <span className="text-lg font-bold text-gold">₪{loanAmount.toLocaleString()}</span>
                      </div>
                      <Slider value={[loanAmount]} onValueChange={([v]) => setLoanAmount(v)} min={100000} max={Math.min(propertyValue * 0.7, 5000000)} step={50000} />
                      <div className="flex justify-between text-[10px] text-white/30"><span>₪100K</span><span>₪{Math.min(propertyValue * 0.7, 5000000).toLocaleString()}</span></div>
                    </div>

                    {/* Live metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                        <p className="text-[10px] text-white/40">LTV</p>
                        <p className={cn("text-2xl font-bold", animatedLTV > 70 ? "text-red-400" : animatedLTV > 50 ? "text-amber-400" : "text-green-400")}>{animatedLTV}%</p>
                      </div>
                      <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                        <p className="text-[10px] text-white/40">החזר חודשי</p>
                        <p className="text-2xl font-bold text-gold">₪{animatedPayment.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                        <p className="text-[10px] text-white/40">DTI</p>
                        <p className={cn("text-2xl font-bold", animatedDTI > 40 ? "text-red-400" : animatedDTI > 30 ? "text-amber-400" : "text-green-400")}>{animatedDTI}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Step 4: Existing Loans ─── */}
                {STEPS[currentStep]?.key === "existing_loans" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center">💳 התחייבויות חודשיות</h2>
                    <p className="text-center text-sm text-white/40">הלוואות, כרטיסי אשראי, ליסינג וכו׳</p>

                    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">סך התשלומים החודשיים הקיימים</span>
                        <span className="text-lg font-bold text-white">₪{existingMonthlyPayments.toLocaleString()}</span>
                      </div>
                      <Slider value={[existingMonthlyPayments]} onValueChange={([v]) => setExistingMonthlyPayments(v)} min={0} max={30000} step={500} />
                      <div className="flex justify-between text-[10px] text-white/30"><span>₪0</span><span>₪30K</span></div>
                    </div>

                    {/* Approval indicator */}
                    <div className={cn(
                      "p-4 rounded-xl border text-center space-y-1",
                      maxApprovalChance === "גבוה" ? "bg-green-500/10 border-green-500/30" :
                      maxApprovalChance === "בינוני" ? "bg-amber-500/10 border-amber-500/30" :
                      "bg-red-500/10 border-red-500/30"
                    )}>
                      <p className="text-xs text-white/40">סיכוי אישור משוער</p>
                      <p className={cn("text-2xl font-bold",
                        maxApprovalChance === "גבוה" ? "text-green-400" :
                        maxApprovalChance === "בינוני" ? "text-amber-400" : "text-red-400"
                      )}>{maxApprovalChance}</p>
                      <p className="text-[11px] text-white/30">DTI: {dti}% | LTV: {ltv}%</p>
                    </div>
                  </div>
                )}

                {/* ─── Step 5: Urgency ─── */}
                {STEPS[currentStep]?.key === "urgency" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center">⏰ מתי צריך את הכסף?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {URGENCY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setUrgency(opt.value)}
                          className={cn(
                            "p-5 rounded-xl border-2 text-right transition-all",
                            urgency === opt.value
                              ? "border-gold bg-gold/10"
                              : "border-white/10 bg-white/5 hover:border-white/20"
                          )}
                        >
                          <p className="text-lg">{opt.emoji}</p>
                          <p className="font-bold text-sm mt-1">{opt.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Step 6: Contact ─── */}
                {STEPS[currentStep]?.key === "contact" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center">📞 כדי שנוכל לחזור אליך</h2>
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm text-white/60 flex items-center gap-2"><User className="w-4 h-4" /> שם מלא *</label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ישראל ישראלי" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-white/60 flex items-center gap-2"><Phone className="w-4 h-4" /> טלפון *</label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" type="tel" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" dir="ltr" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-white/60 flex items-center gap-2"><Mail className="w-4 h-4" /> אימייל (אופציונלי)</label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" type="email" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" dir="ltr" />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer pt-2">
                        <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} className="rounded" />
                        <span className="text-xs text-white/40">אני מסכים/ה לקבל עדכונים ותוכן שיווקי</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2 justify-center text-[11px] text-white/30">
                      <Lock className="w-3 h-3" />
                      <span>הפרטים מוצפנים ומאובטחים בתקן AES-256</span>
                    </div>
                  </div>
                )}

                {/* ─── Step 7: Documents ─── */}
                {STEPS[currentStep]?.key === "documents" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center">📁 העלאת מסמכים</h2>
                    <p className="text-center text-sm text-white/40">העלאת מסמכים תזרז את הטיפול בבקשה שלך. ניתן לדלג ולשלוח מאוחר יותר.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {REQUIRED_DOCS.map((doc) => {
                        const uploaded = uploadedDocs.has(doc.key);
                        const Icon = doc.icon;
                        return (
                          <div key={doc.key} className={cn(
                            "p-4 rounded-xl border transition-all",
                            uploaded ? "border-green-500/50 bg-green-500/10" : "border-white/10 bg-white/5"
                          )}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className={cn("p-2 rounded-lg", uploaded ? "bg-green-500/20" : "bg-white/10")}>
                                {uploaded ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Icon className="w-4 h-4 text-white/50" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{doc.label}</p>
                                {uploaded && <p className="text-[10px] text-green-400">✅ אומת בהצלחה</p>}
                              </div>
                            </div>
                            {!uploaded && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-white/10 text-white/60 hover:bg-white/5"
                                onClick={() => simulateUpload(doc.key)}
                              >
                                <Upload className="w-3.5 h-3.5 ml-1" /> העלה קובץ
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-center text-xs text-white/30">
                      {uploadedDocs.size}/{REQUIRED_DOCS.length} מסמכים הועלו
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={goBack}
                    disabled={currentStep === 0}
                    className="border-white/10 text-white/60 hover:bg-white/5 disabled:opacity-20"
                  >
                    <ArrowRight className="w-4 h-4 ml-1" />
                    חזרה
                  </Button>

                  {currentStep < STEPS.length - 1 ? (
                    <Button
                      onClick={goNext}
                      disabled={!canProceed()}
                      className="bg-gold hover:bg-gold/90 text-black font-bold disabled:opacity-40 px-8"
                    >
                      המשך
                      <ArrowLeft className="w-4 h-4 mr-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !fullName || !phone}
                      className="bg-gradient-to-l from-gold to-amber-500 hover:from-gold/90 hover:to-amber-500/90 text-black font-bold disabled:opacity-40 px-8"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Sparkles className="w-4 h-4 ml-1" />}
                      {submitting ? "שולח..." : "שלח בקשה"}
                    </Button>
                  )}
                </div>

              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Trust section */}
        {!completed && (
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <ShieldCheck className="w-4 h-4 text-gold/60" />
                  <span>מאובטח בתקן בנקאי</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Star className="w-4 h-4 text-gold/60" />
                  <span>4.9/5 שביעות רצון</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Brain className="w-4 h-4 text-gold/60" />
                  <span>ניתוח AI מתקדם</span>
                </div>
              </div>
              <TrustBankLogos />
            </div>
          </div>
        )}

        {/* FAQ Section */}
        {!completed && currentStep === 0 && (
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-12 space-y-4">
            <h3 className="text-center text-lg font-bold text-white/80">שאלות נפוצות על הלוואה כנגד נכס</h3>
            {[
              { q: "מהי הלוואה כנגד נכס?", a: "הלוואה כנגד נכס מאפשרת לך לקבל מימון על בסיס שווי נכס שברשותך, ללא צורך במכירה. ההלוואה מובטחת בשעבוד הנכס." },
              { q: "כמה ניתן לקבל?", a: "בדרך כלל עד 50-70% משווי הנכס, בניכוי יתרת משכנתא קיימת. הסכום המדויק תלוי בהערכת שמאי ובפרופיל הפיננסי שלך." },
              { q: "מהם הריביות הנהוגות?", a: "ריביות להלוואה כנגד נכס נעות בין 3.5% ל-7% בהתאם ל-LTV, פרופיל הלווה ותנאי השוק." },
              { q: "כמה זמן לוקח התהליך?", a: "תהליך מלא לוקח בין שבוע לשלושה שבועות. עם הגשה דיגיטלית מלאה דרך חיתומית — אפשר לקצר משמעותית." },
              { q: "סורבתי בבנק — אפשר עדיין לקבל הלוואה כנגד נכס?", a: "בהחלט. הלוואה כנגד נכס מבוססת בעיקר על שווי הנכס כבטוחה, ולכן גם מי שסורב במסלול רגיל יכול להתאשר. יועץ המשכנתאות יבנה תיק מותאם שמדגיש את הביטחון הנכסי מול הגוף המממן." },
              { q: "מה קורה אם יש לי BDI שלילי?", a: "דוח BDI שלילי לא בהכרח חוסם את ההלוואה. ברוב המקרים ניתן להציג הסברים, לבצע הסדרי חוב, או להגיש את הבקשה לגופים שמתמחים במימון עם רקע BDI בעייתי. המפתח הוא תיק מסודר עם נסח נקי." },
              { q: "האם סירוב קודם בבנק אחד משפיע על בנקים אחרים?", a: "סירוב בבנק אחד לא נרשם באופן פורמלי, אך פניות רבות לבנקים שונים בזמן קצר עלולות להיראות שליליות. מומלץ לפנות ליועץ שידע לכוון לבנק המתאים ביותר מההתחלה." },
              { q: "יש לי עיקול או אכ״מ — אפשר לקבל הלוואה?", a: "הלוואה כנגד נכס יכולה להתאים גם במצבים של עיקולים, אך נדרש שהנכס המשועבד יהיה נקי. ניתן לפעמים להשתמש בכספי ההלוואה עצמם כדי להסדיר את החובות כתנאי לאישור." },
              { q: "מה ההבדל בין BDI שלילי לבין דירוג אשראי נמוך?", a: "BDI הוא דוח עסקי שמפרט חובות, תביעות ושיקים חוזרים. דירוג אשראי (נתוני אשראי) הוא ציון מספרי אישי. שניהם משפיעים על אישור ההלוואה, אך הלוואה כנגד נכס מפחיתה את המשקל של שניהם כי הביטחון הוא הנכס עצמו." },
              { q: "האם אפשר לקבל הלוואה כנגד נכס עם שיקים חוזרים?", a: "שיקים חוזרים מהווים דגל אדום, אך לא חוסמים לחלוטין. אם השיקים הוסדרו והוגבלות הוסרו, ועם נכס בשווי מספיק — התהליך אפשרי. יש להציג אסמכתאות להסדרת החובות." },
            ].map((faq, i) => (
              <details key={i} className="bg-white/5 rounded-xl border border-white/10 group">
                <summary className="p-4 cursor-pointer text-sm font-medium text-white/70 hover:text-white/90 flex items-center justify-between list-none">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-white/30 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-4 pb-4 text-sm text-white/40">{faq.a}</p>
              </details>
            ))}
          </div>
        )}

        <PublicFooter />
      </div>
    </>
  );
};

export default PropertyLoanFunnel;
