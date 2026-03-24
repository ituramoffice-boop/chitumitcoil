import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import IdCardScanner from "@/components/IdCardScanner";
import {
  Shield, Heart, TrendingDown, Sparkles, CheckCircle2, AlertTriangle,
  User, Phone, Mail, Lock, Loader2, ArrowLeft, ArrowRight, Activity,
  Cigarette, Calendar, DollarSign, Target, BadgeCheck, Zap, Users,
  ChevronDown, BarChart3,
} from "lucide-react";

const DEFAULT_CONSULTANT_ID = "a4777786-46d3-44fa-a303-a092ebd70f2d";

/* ── Insurance premium tables (based on Israeli market data 2025) ── */
/* Monthly premium for mortgage life insurance (ביטוח חיים למשכנתא) */
/* Market rates: ₪500K→20-50/mo, ₪1M→40-100/mo, ₪1.5M+→60-150/mo */
/* Smokers pay 2-3x, age 30 vs 45 can be 2-3x difference */
function getMonthlyPremium(mortgageAmount: number, age: number, isSmoker: boolean, termYears: number): number {
  // Base rate per ₪100K of mortgage (bank/market average)
  // Ages 60+ carry significantly higher premiums due to actuarial risk
  const ageBase = age < 30 ? 3.2 : age < 35 ? 4.0 : age < 40 ? 5.5 : age < 45 ? 7.5 : age < 50 ? 10.5 : age < 55 ? 14 : age < 60 ? 19 : age < 63 ? 28 : age < 65 ? 35 : 44;
  const smokerMultiplier = isSmoker ? (age >= 60 ? 2.8 : 2.4) : 1; // higher smoker penalty for 60+
  const termFactor = termYears > 25 ? 1.12 : termYears > 20 ? 1.06 : 1;
  const units = mortgageAmount / 100000;
  return Math.round(ageBase * smokerMultiplier * termFactor * units);
}

function getChitumitPremium(mortgageAmount: number, age: number, isSmoker: boolean, termYears: number): number {
  // Savings margin is slightly lower for 60+ due to higher base risk
  const discountFactor = age >= 60 ? 0.65 : 0.6;
  return Math.round(getMonthlyPremium(mortgageAmount, age, isSmoker, termYears) * discountFactor);
}

function getRiskProfile(age: number, isSmoker: boolean): { label: string; tag: string; color: string } {
  if (!isSmoker && age < 40) return { label: "סיכון נמוך / מודע בריאות", tag: "Low-Risk/Health Conscious", color: "text-emerald-400" };
  if (!isSmoker && age < 55) return { label: "סיכון בינוני / פוליסה מאוזנת", tag: "Moderate-Risk/Balanced", color: "text-cyan-400" };
  if (!isSmoker && age >= 60) return { label: "פרופיל בכיר / פרמיה מוגברת", tag: "Senior Profile/Elevated Premium", color: "text-orange-400" };
  if (isSmoker && age >= 60) return { label: "סיכון גבוה / דורש בדיקה רפואית", tag: "High-Risk/Medical Review Required", color: "text-red-400" };
  if (isSmoker) return { label: "פוליסה בעלת ערך גבוה", tag: "High-Value Policy", color: "text-amber-400" };
  return { label: "פרופיל פרימיום", tag: "Premium Profile", color: "text-purple-400" };
}

/* ── Animated number ── */
function useAnimatedNumber(target: number, duration = 1000) {
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
      const v = Math.round(start + diff * eased);
      setValue(v);
      if (p < 1) requestAnimationFrame(tick);
      else ref.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

/* ── Steps ── */
type StepKey = "calculator" | "comparison" | "profile" | "capture";

const STEPS: { key: StepKey; label: string; icon: React.ElementType }[] = [
  { key: "calculator", label: "פרטי ביטוח", icon: Shield },
  { key: "comparison", label: "השוואת מחירים", icon: BarChart3 },
  { key: "profile", label: "פרופיל סיכון", icon: Activity },
  { key: "capture", label: "קבלת הצעה", icon: Target },
];

const fadeSlide = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

/* ══════════ MAIN COMPONENT ══════════ */
const MortgageInsurance = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Calculator inputs
  const [mortgageAmount, setMortgageAmount] = useState(1500000);
  const [loanTerm, setLoanTerm] = useState(25);
  const [age, setAge] = useState(35);
  const [isSmoker, setIsSmoker] = useState(false);

  // Contact
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  // Scanning animation
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);

  // Calculations — monthly premium in ₪
  const marketMonthly = getMonthlyPremium(mortgageAmount, age, isSmoker, loanTerm);
  const chitumitMonthly = getChitumitPremium(mortgageAmount, age, isSmoker, loanTerm);
  const monthlySavings = marketMonthly - chitumitMonthly;
  const totalSavings = monthlySavings * loanTerm * 12;
  const riskProfile = getRiskProfile(age, isSmoker);
  const scoreBoost = monthlySavings > 50 ? 5 : monthlySavings > 20 ? 4 : 3;

  const animMarket = useAnimatedNumber(marketMonthly);
  const animChitumit = useAnimatedNumber(chitumitMonthly);
  const animSavings = useAnimatedNumber(totalSavings);

  // Scanning effect on step 2
  useEffect(() => {
    if (step === 1 && !scanComplete) {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setScanComplete(true);
            return 100;
          }
          return prev + 2;
        });
      }, 40);
      return () => clearInterval(interval);
    }
  }, [step, scanComplete]);

  const canProceed = () => {
    switch (STEPS[step]?.key) {
      case "calculator": return mortgageAmount > 0 && loanTerm > 0 && age > 18;
      case "comparison": return scanComplete;
      case "profile": return true;
      case "capture": return fullName.trim().length > 1 && phone.trim().length > 5;
      default: return false;
    }
  };

  const goNext = () => { if (step < STEPS.length - 1) setStep(step + 1); };
  const goBack = () => { if (step > 0) setStep(step - 1); };

  const handleSubmit = async () => {
    if (!fullName || !phone) return;
    setSubmitting(true);
    try {
      const notes = [
        `ביטוח משכנתא — הצעת מחיר`,
        `סכום משכנתא: ₪${mortgageAmount.toLocaleString()}`,
        `תקופה: ${loanTerm} שנים`,
        `גיל הלווה הצעיר: ${age}`,
        `מעשן: ${isSmoker ? "כן" : "לא"}`,
        `פרופיל סיכון: ${riskProfile.tag}`,
        `פרמיה בבנק: ₪${marketMonthly}/חודש`,
        `פרמיה דרך חיתומית: ₪${chitumitMonthly}/חודש`,
        `חיסכון חודשי: ₪${monthlySavings}`,
        `חיסכון כולל: ₪${totalSavings.toLocaleString()}`,
        `שיפור ציון חיתומית: +${scoreBoost} נקודות`,
      ].join(". ");

      const leadScore = Math.min(100,
        (mortgageAmount >= 2000000 ? 25 : 15) +
        (totalSavings >= 50000 ? 20 : 10) +
        (email ? 10 : 0) +
        (consent ? 5 : 0) +
        25 // insurance lead = high intent
      );

      const leadId = crypto.randomUUID();
      const { error } = await supabase.from("leads").insert({
        id: leadId,
        consultant_id: DEFAULT_CONSULTANT_ID,
        full_name: fullName,
        phone: phone || null,
        email: email || null,
        mortgage_amount: mortgageAmount,
        monthly_income: monthlySavings, // repurpose for savings
        lead_source: "organic",
        marketing_consent: consent,
        lead_score: leadScore,
        notes,
      } as any);

      if (error) throw error;

      // Notify consultant
      supabase.functions.invoke("notify-new-lead", {
        body: {
          consultantId: DEFAULT_CONSULTANT_ID,
          leadName: fullName,
          leadPhone: phone,
          leadScore,
          calcType: "ביטוח משכנתא",
          calcSummary: `חיסכון ₪${totalSavings.toLocaleString()} | ${riskProfile.tag}`,
        },
      }).catch(() => {});

      // Send email to lead (if email provided)
      if (email) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "insurance-quote",
            recipientEmail: email,
            idempotencyKey: `insurance-quote-${leadId}`,
            templateData: {
              leadName: fullName,
              mortgageAmount: `₪${mortgageAmount.toLocaleString()}`,
              loanTerm: String(loanTerm),
              age: String(age),
              isSmoker: isSmoker ? "כן" : "לא",
              marketPremium: `₪${marketMonthly}`,
              bestPremium: `₪${chitumitMonthly}`,
              monthlySavings: `₪${monthlySavings}`,
              yearlySavings: `₪${(monthlySavings * 12).toLocaleString()}`,
              fiveYearSavings: `₪${(monthlySavings * 60).toLocaleString()}`,
              totalSavings: `₪${totalSavings.toLocaleString()}`,
              riskProfile: riskProfile.label,
              scoreBoost: String(scoreBoost),
            },
          },
        }).catch(() => {});
      }

      // Open WhatsApp with pre-filled message
      const whatsappMsg = encodeURIComponent(
        `שלום ${fullName} 👋\n\n` +
        `תודה שהשתמשת במערכת השוואת ביטוח המשכנתא של חיתומית!\n\n` +
        `📊 סיכום ההצעה שלך:\n` +
        `• סכום משכנתא: ₪${mortgageAmount.toLocaleString()}\n` +
        `• פרמיה ממוצעת בשוק: ₪${marketMonthly}/חודש\n` +
        `• המחיר הטוב ביותר דרכנו: ₪${chitumitMonthly}/חודש\n` +
        `• חיסכון חודשי: ₪${monthlySavings}\n` +
        `• חיסכון כולל: ₪${totalSavings.toLocaleString()}\n\n` +
        `💡 ניתחנו את הנתונים שלך — נוכל לחסוך לך כ-₪${totalSavings.toLocaleString()} לאורך חיי המשכנתא.\n` +
        `רוצה שאנעל את ההצעה? 🔒`
      );
      const cleanPhone = phone.replace(/[-\s]/g, "").replace(/^0/, "972");
      window.open(`https://wa.me/${cleanPhone}?text=${whatsappMsg}`, "_blank");

      setCompleted(true);
      toast.success("🎉 ההצעה נשלחה! ניצור קשר בהקדם.");
    } catch (e: any) {
      toast.error(e.message || "שגיאה בשליחה");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(200,50%,4%)] text-white overflow-hidden" dir="rtl">
      <StarField />

      {/* Ambient glow — teal/blue theme */}
      <div className="fixed inset-0 pointer-events-none z-[2]">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[hsl(180,80%,40%)] opacity-[0.04] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(210,80%,50%)] opacity-[0.04] blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-md" />
              <ChitumitLogo size={40} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">חיתומית</h1>
              <p className="text-[10px] text-cyan-400/60 tracking-wider">ביטוח משכנתא חכם</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
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

      {/* Social proof banner */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full py-2 px-4 text-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-white/70">
            <span className="font-bold text-cyan-300">24 אנשים</span> חסכו{" "}
            <span className="font-bold text-emerald-400">45,000₪</span> החודש על ביטוח דרך חיתומית
          </span>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 border-2",
                    done ? "bg-cyan-500 text-black border-cyan-500 shadow-lg shadow-cyan-500/30" :
                    active ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60 animate-pulse" :
                    "bg-white/5 text-white/30 border-white/10"
                  )}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  </div>
                  <span className={cn(
                    "text-[10px] whitespace-nowrap hidden sm:block",
                    done ? "text-cyan-400" : active ? "text-white/80" : "text-white/30"
                  )}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-1 sm:mx-2 rounded-full transition-all duration-500",
                    done ? "bg-cyan-500" : "bg-white/10"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {completed ? (
          <SuccessState
            totalSavings={totalSavings}
            monthlySavings={monthlySavings}
            riskProfile={riskProfile}
            fullName={fullName}
            navigate={navigate}
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main panel */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div key={step} {...fadeSlide} className="space-y-6">
                  {STEPS[step]?.key === "calculator" && (
                    <CalculatorStep
                      mortgageAmount={mortgageAmount} setMortgageAmount={setMortgageAmount}
                      loanTerm={loanTerm} setLoanTerm={setLoanTerm}
                      age={age} setAge={setAge}
                      isSmoker={isSmoker} setIsSmoker={setIsSmoker}
                    />
                  )}

                  {STEPS[step]?.key === "comparison" && (
                    <ComparisonStep
                      scanProgress={scanProgress}
                      scanComplete={scanComplete}
                      animMarket={animMarket}
                      animChitumit={animChitumit}
                      animSavings={animSavings}
                      monthlySavings={monthlySavings}
                      loanTerm={loanTerm}
                    />
                  )}

                  {STEPS[step]?.key === "profile" && (
                    <ProfileStep
                      riskProfile={riskProfile}
                      age={age}
                      isSmoker={isSmoker}
                      scoreBoost={scoreBoost}
                      monthlySavings={monthlySavings}
                    />
                  )}

                  {STEPS[step]?.key === "capture" && (
                    <CaptureStep
                      fullName={fullName} setFullName={setFullName}
                      phone={phone} setPhone={setPhone}
                      email={email} setEmail={setEmail}
                      consent={consent} setConsent={setConsent}
                      totalSavings={totalSavings}
                    />
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4">
                    <Button variant="outline" onClick={goBack} disabled={step === 0} className="border-white/10 text-white/60 hover:bg-white/5 disabled:opacity-20">
                      <ArrowRight className="w-4 h-4 ml-1" />
                      חזרה
                    </Button>
                    {step < STEPS.length - 1 ? (
                      <Button onClick={goNext} disabled={!canProceed()} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold disabled:opacity-40 px-8">
                        המשך
                        <ArrowLeft className="w-4 h-4 mr-1" />
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} disabled={submitting || !fullName || !phone} className="bg-gradient-to-l from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-black font-bold disabled:opacity-40 px-8">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Sparkles className="w-4 h-4 ml-1" />}
                        {submitting ? "שולח..." : "קבל הצעה מדויקת"}
                      </Button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sidebar — Insurance Optimization */}
            <div className="lg:w-72 space-y-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
                  <Zap className="w-4 h-4" />
                  <span>אופטימיזציית ביטוח</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  פרמיית ביטוח נמוכה יותר = <span className="text-emerald-400 font-medium">הכנסה פנויה גבוהה יותר</span>, מה שמעלה את ציון חיתומית שלך ב-<span className="text-cyan-300 font-bold">{scoreBoost} נקודות</span>.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">חיסכון חודשי</span>
                    <span className="text-emerald-400 font-bold">₪{monthlySavings.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">שיפור ציון</span>
                    <span className="text-cyan-300 font-bold">+{scoreBoost} נקודות</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">חיסכון כולל</span>
                    <span className="text-cyan-300 font-bold">₪{totalSavings.toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-px bg-white/10" />
                <p className="text-[10px] text-white/30 leading-relaxed">
                  ציון גבוה יותר = תנאי משכנתא טובים יותר. הבנק רואה שהלקוח חכם פיננסית.
                </p>
              </div>

              {/* Live badge */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    <span className="text-cyan-300 font-bold">127</span> הצעות ביטוח הופקו השבוע
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Trust section */}
      {!completed && (
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Shield className="w-4 h-4 text-cyan-500/60" />
                <span>הגנה על הפרטיות שלך</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Heart className="w-4 h-4 text-cyan-500/60" />
                <span>ללא התחייבות</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <TrendingDown className="w-4 h-4 text-cyan-500/60" />
                <span>חיסכון ממוצע 38%</span>
              </div>
            </div>
            <TrustBankLogos />
          </div>
        </div>
      )}

      {/* FAQ */}
      {!completed && step === 0 && (
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-12 space-y-4">
          <h3 className="text-center text-lg font-bold text-white/80">שאלות נפוצות על ביטוח משכנתא</h3>
          {[
            { q: "מהו ביטוח משכנתא?", a: "ביטוח משכנתא מגן על הבנק ועליך במקרה של אובדן כושר עבודה או מוות. הוא חובה בכל משכנתא בישראל." },
            { q: "כמה אפשר לחסוך?", a: "רוב הלווים משלמים יותר מדי על ביטוח. באמצעות השוואה חכמה ניתן לחסוך 30-50% מהפרמיה — אלפי שקלים בשנה." },
            { q: "האם אפשר להחליף ביטוח גם אחרי לקיחת המשכנתא?", a: "בהחלט! מאז 2015 ניתן להחליף ביטוח משכנתא בכל עת. אין צורך להישאר עם הביטוח של הבנק." },
            { q: "מה משפיע על מחיר הביטוח?", a: "גיל, מצב בריאותי, עישון, סכום המשכנתא ותקופת ההלוואה. כל אלו מחושבים אצלנו באופן אוטומטי." },
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
  );
};

/* ═══ STEP 1: Calculator ═══ */
function CalculatorStep({ mortgageAmount, setMortgageAmount, loanTerm, setLoanTerm, age, setAge, isSmoker, setIsSmoker }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">
          <span className="text-cyan-400">ביטוח משכנתא חכם</span> — כמה אתה באמת צריך לשלם?
        </h2>
        <p className="text-white/50 text-sm">הזן את פרטי ההלוואה וקבל הצעה מותאמת אישית</p>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
        {/* Mortgage Amount */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60 flex items-center gap-2"><DollarSign className="w-4 h-4 text-cyan-400/60" /> סכום המשכנתא</span>
            <span className="text-xl font-bold text-cyan-300">₪{mortgageAmount.toLocaleString()}</span>
          </div>
          <Slider value={[mortgageAmount]} onValueChange={([v]) => setMortgageAmount(v)} min={300000} max={5000000} step={50000} />
          <div className="flex justify-between text-[10px] text-white/30"><span>₪300K</span><span>₪5M</span></div>
        </div>

        {/* Loan Term */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60 flex items-center gap-2"><Calendar className="w-4 h-4 text-cyan-400/60" /> תקופת הלוואה</span>
            <span className="text-xl font-bold text-white">{loanTerm} שנים</span>
          </div>
          <Slider value={[loanTerm]} onValueChange={([v]) => setLoanTerm(v)} min={5} max={30} step={1} />
          <div className="flex justify-between text-[10px] text-white/30"><span>5 שנים</span><span>30 שנים</span></div>
        </div>

        {/* Age */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60 flex items-center gap-2"><User className="w-4 h-4 text-cyan-400/60" /> גיל הלווה הצעיר ביותר</span>
            <span className="text-xl font-bold text-white">{age}</span>
          </div>
          <Slider value={[age]} onValueChange={([v]) => setAge(v)} min={20} max={67} step={1} />
          <div className="flex justify-between text-[10px] text-white/30"><span>20</span><span>67</span></div>
        </div>

        {/* Smoker Status */}
        <div className="space-y-3">
          <span className="text-sm text-white/60 flex items-center gap-2"><Cigarette className="w-4 h-4 text-cyan-400/60" /> סטטוס עישון</span>
          <div className="flex gap-3">
            <button onClick={() => setIsSmoker(false)} className={cn("flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all flex items-center justify-center gap-2", !isSmoker ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-white/50 hover:border-white/20")}>
              <Heart className="w-4 h-4" /> לא מעשן/ת
            </button>
            <button onClick={() => setIsSmoker(true)} className={cn("flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all flex items-center justify-center gap-2", isSmoker ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-white/10 bg-white/5 text-white/50 hover:border-white/20")}>
              <Cigarette className="w-4 h-4" /> מעשן/ת
            </button>
          </div>
          {isSmoker && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-amber-400/70 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              מעשנים משלמים פרמיה גבוהה יותר — חיתומית תמצא לך את המחיר הטוב ביותר
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ STEP 2: Comparison ═══ */
function ComparisonStep({ scanProgress, scanComplete, animMarket, animChitumit, animSavings, monthlySavings, loanTerm }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">📊 השוואת פרמיות בזמן אמת</h2>

      {/* Scanning animation */}
      {!scanComplete && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-cyan-300">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>סורק מחירי פוליסות בשוק...</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-l from-cyan-400 to-teal-400 rounded-full"
              style={{ width: `${scanProgress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
          <p className="text-xs text-white/40 text-center">{scanProgress}% הושלם</p>
        </div>
      )}

      {/* Comparison cards */}
      {scanComplete && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Market rate */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-wider">פרמיה ממוצעת בשוק</p>
              <p className="text-3xl font-bold text-white/70 line-through decoration-red-400/50">₪{animMarket.toLocaleString()}<span className="text-sm">/חודש</span></p>
              <p className="text-xs text-white/30">ממוצע חברות הביטוח בישראל</p>
            </div>

            {/* Best rate via Chitumit */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 backdrop-blur-xl rounded-2xl border-2 border-cyan-500/40 p-6 space-y-3 relative overflow-hidden">
              <div className="absolute top-3 left-3 bg-cyan-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">מומלץ</div>
              <p className="text-xs text-cyan-300 uppercase tracking-wider">המחיר הטוב ביותר דרכנו</p>
              <p className="text-3xl font-bold text-cyan-300">₪{animChitumit.toLocaleString()}<span className="text-sm">/חודש</span></p>
              <p className="text-xs text-cyan-400/50">השוואה חכמה בין כל חברות הביטוח</p>
            </div>
          </div>

          {/* Savings summary — yearly, 5-year, full term */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20 p-4 text-center space-y-1">
              <p className="text-[11px] text-emerald-300/70">חיסכון שנתי</p>
              <p className="text-2xl font-bold text-emerald-400">₪{(monthlySavings * 12).toLocaleString()}</p>
              <p className="text-[10px] text-white/30">₪{monthlySavings.toLocaleString()} × 12 חודשים</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl border border-emerald-500/25 p-4 text-center space-y-1">
              <p className="text-[11px] text-emerald-300/70">חיסכון ב-5 שנים</p>
              <p className="text-2xl font-bold text-emerald-400">₪{(monthlySavings * 60).toLocaleString()}</p>
              <p className="text-[10px] text-white/30">₪{monthlySavings.toLocaleString()} × 60 חודשים</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-2xl border border-cyan-500/30 p-4 text-center space-y-1">
              <p className="text-[11px] text-cyan-300/70">חיסכון לאורך המשכנתא</p>
              <p className="text-2xl font-bold text-cyan-300">₪{animSavings.toLocaleString()}</p>
              <p className="text-[10px] text-white/30">₪{monthlySavings.toLocaleString()} × {loanTerm * 12} חודשים</p>
            </div>
          </div>

          {/* Insurance companies comparison table */}
          <InsuranceCompaniesTable marketPremium={animMarket} />
        </motion.div>
      )}
    </div>
  );
}

/* ═══ STEP 3: Risk Profile ═══ */
function ProfileStep({ riskProfile, age, isSmoker, scoreBoost, monthlySavings }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">🔍 פרופיל הסיכון שלך</h2>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-3 rounded-xl", isSmoker ? "bg-amber-500/20" : "bg-emerald-500/20")}>
            {isSmoker ? <Cigarette className="w-6 h-6 text-amber-400" /> : <Heart className="w-6 h-6 text-emerald-400" />}
          </div>
          <div>
            <p className={cn("text-lg font-bold", riskProfile.color)}>{riskProfile.label}</p>
            <p className="text-xs text-white/40">Tag: {riskProfile.tag}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-[10px] text-white/40">גיל</p>
            <p className="text-xl font-bold text-white">{age}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-[10px] text-white/40">עישון</p>
            <p className={cn("text-xl font-bold", isSmoker ? "text-amber-400" : "text-emerald-400")}>{isSmoker ? "כן" : "לא"}</p>
          </div>
        </div>
      </div>

      {/* Score impact */}
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
          <BadgeCheck className="w-5 h-5" />
          השפעה על ציון חיתומית
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-cyan-300">+{scoreBoost}</p>
            <p className="text-[10px] text-white/40">נקודות</p>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs text-white/50">חיסכון של ₪{monthlySavings.toLocaleString()}/חודש בביטוח מגדיל את ההכנסה הפנויה שלך, ומשפר את יחס ההחזר להכנסה (DTI).</p>
            <p className="text-xs text-emerald-400/70">→ תנאי משכנתא טובים יותר</p>
            <p className="text-xs text-emerald-400/70">→ סיכוי אישור גבוה יותר</p>
          </div>
        </div>
      </div>

      {/* Health factors */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-3">
        <p className="text-sm font-medium text-white/70">גורמים שנבדקו:</p>
        <div className="space-y-2">
          {[
            { label: "גיל הלווה", ok: age < 50 },
            { label: "סטטוס עישון", ok: !isSmoker },
            { label: "יחס פרמיה להכנסה", ok: true },
            { label: "תקופת כיסוי", ok: true },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {f.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
              <span className={f.ok ? "text-white/60" : "text-amber-400/70"}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ STEP 4: Lead Capture ═══ */
function CaptureStep({ fullName, setFullName, phone, setPhone, email, setEmail, consent, setConsent, totalSavings }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">🎯 קבל הצעה מדויקת</h2>
        <p className="text-white/50 text-sm max-w-md mx-auto">
          ניתחנו את הנתונים שלך — נוכל לחסוך לך כ-<span className="text-emerald-400 font-bold">₪{totalSavings.toLocaleString()}</span> לאורך חיי המשכנתא. רוצה לנעול את ההצעה?
        </p>
      </div>

      {/* ID Card Scanner */}
      <IdCardScanner
        onComplete={(data) => {
          if (data.fullName && !fullName) setFullName(data.fullName);
        }}
      />

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6 space-y-4">
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
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="rounded" />
          <span className="text-xs text-white/40">אני מסכים/ה לקבל עדכונים ותוכן שיווקי</span>
        </label>
      </div>

      <div className="bg-gradient-to-l from-cyan-500/5 to-teal-500/5 rounded-2xl border border-cyan-500/20 p-4 text-center">
        <p className="text-xs text-white/50">
          💬 "ניתחתי את הנתונים שלך — אנחנו יכולים לחסוך לך כ-<span className="text-cyan-300 font-bold">₪{totalSavings.toLocaleString()}</span> לאורך חיי המשכנתא. רוצה שאנעל את ההצעה?"
        </p>
      </div>

      <div className="flex items-center gap-2 justify-center text-[11px] text-white/30">
        <Lock className="w-3 h-3" />
        <span>הפרטים מוצפנים ומאובטחים בתקן AES-256</span>
      </div>
    </div>
  );
}

/* ═══ Insurance Companies Comparison Table ═══ */
function InsuranceCompaniesTable({ marketPremium }: { marketPremium: number }) {
  const companies = [
    { name: "הראל ביטוח", factor: 1.08, color: "text-blue-400" },
    { name: "הפניקס ביטוח", factor: 1.02, color: "text-orange-400" },
    { name: "מגדל ביטוח", factor: 0.97, color: "text-red-400" },
    { name: "מנורה מבטחים", factor: 1.05, color: "text-purple-400" },
    { name: "כלל ביטוח", factor: 0.99, color: "text-sky-400" },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          השוואת חברות ביטוח
        </h3>
        <span className="text-[10px] text-white/30">מעודכן למרץ 2026</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-right py-2 px-3 text-[11px] text-white/40 font-medium">חברת ביטוח</th>
              <th className="text-center py-2 px-3 text-[11px] text-white/40 font-medium">פרמיה חודשית</th>
              <th className="text-center py-2 px-3 text-[11px] text-white/40 font-medium">יחס לממוצע</th>
              <th className="text-center py-2 px-3 text-[11px] text-white/40 font-medium hidden sm:table-cell">דירוג</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c, i) => {
              const premium = Math.round(marketPremium * c.factor);
              const diff = ((c.factor - 1) * 100).toFixed(1);
              const isAbove = c.factor > 1;
              return (
                <motion.tr
                  key={c.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-3">
                    <span className={cn("font-medium text-xs", c.color)}>{c.name}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-white/80 font-bold text-xs">₪{premium.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full",
                      isAbove ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                    )}>
                      {isAbove ? `+${diff}%` : `${diff}%`}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center hidden sm:table-cell">
                    <div className="flex justify-center gap-0.5">
                      {Array.from({ length: 5 }, (_, s) => (
                        <div key={s} className={cn("w-1.5 h-1.5 rounded-full", s < (5 - Math.abs(Math.round((c.factor - 1) * 20))) ? "bg-cyan-400" : "bg-white/10")} />
                      ))}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-white/20 text-center">* המחירים הם הערכה בלבד ומבוססים על נתוני שוק ממוצעים. המחיר הסופי ייקבע בהתאם לבדיקה רפואית ותנאים אישיים.</p>
    </div>
  );
}

/* ═══ SUCCESS STATE ═══ */
function SuccessState({ totalSavings, monthlySavings, riskProfile, fullName, navigate }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 space-y-6">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/30 to-teal-500/30 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-12 h-12 text-cyan-400" />
      </div>
      <h2 className="text-3xl font-bold">ההצעה נשלחה בהצלחה! 🎉</h2>
      <p className="text-white/60 max-w-md mx-auto">
        יועץ ביטוח מוסמך ייצור איתך קשר תוך מספר שעות עם הצעה מותאמת אישית.
      </p>

      <div className="max-w-md mx-auto bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-3 text-right">
        <h3 className="text-sm font-bold text-cyan-300">סיכום הצעה</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-white/40">שם:</span><p className="text-white font-medium">{fullName}</p></div>
          <div><span className="text-white/40">פרופיל:</span><p className={cn("font-medium", riskProfile.color)}>{riskProfile.label}</p></div>
          <div><span className="text-white/40">חיסכון חודשי:</span><p className="text-emerald-400 font-bold">₪{monthlySavings.toLocaleString()}</p></div>
          <div><span className="text-white/40">חיסכון כולל:</span><p className="text-cyan-300 font-bold">₪{totalSavings.toLocaleString()}</p></div>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button onClick={() => navigate("/")} variant="outline" className="border-white/10 text-white/70 hover:bg-white/5">
          חזרה לדף הבית
        </Button>
        <Button onClick={() => navigate("/calculator")} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
          מחשבון משכנתא
        </Button>
      </div>
    </motion.div>
  );
}

export default MortgageInsurance;
