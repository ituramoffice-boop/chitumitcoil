import { useState, useEffect, useRef } from "react";
import StarField from "@/components/StarField";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Calculator, Shield, TrendingUp, CheckCircle2, ArrowLeft,
  Sparkles, Building2, Phone, Mail, User, ChevronDown,
  Lock, Award, Star, Zap, BarChart3, Clock, FileCheck, Upload,
  Target, Gauge, Brain, ArrowRight, Briefcase, Home, CreditCard,
  Download,
} from "lucide-react";
import ConversationalLeadCapture from "@/components/ConversationalLeadCapture";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";

// Mortgage calculator logic
function calculateMortgage(amount: number, years: number, rate: number) {
  const monthlyRate = rate / 100 / 12;
  const payments = years * 12;
  if (monthlyRate === 0) return { monthly: amount / payments, total: amount, interest: 0 };
  const monthly = (amount * monthlyRate * Math.pow(1 + monthlyRate, payments)) / (Math.pow(1 + monthlyRate, payments) - 1);
  const total = monthly * payments;
  return { monthly: Math.round(monthly), total: Math.round(total), interest: Math.round(total - amount) };
}

// Animated counter hook
function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setValue(current);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = target;
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return value;
}

const DEFAULT_CONSULTANT_ID = "a4777786-46d3-44fa-a303-a092ebd70f2d";

const MortgageCalculatorLanding = () => {
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [years, setYears] = useState(25);
  const [rate, setRate] = useState(4.5);
  const [step, setStep] = useState<"calc" | "form" | "success" | "journey">("calc");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ full_name: "", phone: "", email: "" });
  const [marketingConsent, setMarketingConsent] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [lastSliderTouched, setLastSliderTouched] = useState<string>("");
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);

  const result = calculateMortgage(loanAmount, years, rate);
  const animatedMonthly = useAnimatedNumber(result.monthly);
  const animatedTotal = useAnimatedNumber(result.total);
  const animatedInterest = useAnimatedNumber(result.interest);

  // Financing ratio (rough estimate)
  const financingRatio = Math.min(Math.round((loanAmount / (loanAmount * 1.35)) * 100), 75);

  // Calculate lead score based on calculator values
  const calcLeadScore = (email?: string, consent?: boolean) => {
    let score = 0;
    if (loanAmount >= 2000000) score += 30;
    else if (loanAmount >= 1000000) score += 20;
    else if (loanAmount >= 500000) score += 10;
    if (financingRatio <= 50) score += 25;
    else if (financingRatio <= 65) score += 15;
    else score += 5;
    if (rate <= 4) score += 15;
    else if (rate <= 5.5) score += 10;
    else score += 5;
    if (lastSliderTouched) score += 10;
    if (email) score += 10;
    if (consent) score += 5;
    return Math.min(score, 100);
  };

  // Determine lead category from calc inputs
  const getLeadCategory = (userCategory?: string) => {
    if (userCategory === "investor") return "משקיע";
    if (userCategory === "refinance") return "מחזר הלוואה";
    if (userCategory === "first_buyer") return "רוכש ראשון";
    if (loanAmount >= 2000000 && financingRatio < 50) return "משקיע";
    if (rate > 5 && years > 20) return "מחזר הלוואה";
    return "רוכש ראשון";
  };

  // Lead tags for CRM
  const getLeadTags = () => {
    const tags: string[] = [];
    if (financingRatio > 75) tags.push("High Risk / High Sensitivity");
    if (loanAmount >= 2000000) tags.push("VIP Lead");
    if (rate > 6) tags.push("Rate Sensitive");
    return tags;
  };

  // (old getLeadCategory removed — merged above)

  // Generate PDF report
  const generatePDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setR2L(true);
    
    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 45, "F");
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 42, 210, 3, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("SmartMortgage AI", 105, 18, { align: "center" });
    doc.setFontSize(11);
    doc.text("Mortgage Feasibility Report", 105, 28, { align: "center" });
    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString("he-IL"), 105, 36, { align: "center" });

    // Body
    doc.setTextColor(30, 41, 59);
    let y = 58;
    
    doc.setFontSize(14);
    doc.text("Summary", 105, y, { align: "center" });
    y += 12;
    
    doc.setFontSize(11);
    const lines = [
      [`Loan Amount: ${loanAmount.toLocaleString()} ILS`, ""],
      [`Period: ${years} years`, ""],
      [`Annual Rate: ${rate}%`, ""],
      [`Monthly Payment: ${result.monthly.toLocaleString()} ILS`, ""],
      [`Total Payment: ${result.total.toLocaleString()} ILS`, ""],
      [`Total Interest: ${result.interest.toLocaleString()} ILS`, ""],
      [`Financing Ratio: ~${financingRatio}%`, ""],
      [`Lead Category: ${getLeadCategory()}`, ""],
    ];
    
    lines.forEach(([text]) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(25, y - 5, 160, 9, 2, 2, "F");
      doc.text(text, 105, y, { align: "center" });
      y += 12;
    });

    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("AI Tip: " + (activeTip?.tip || ""), 105, y, { align: "center", maxWidth: 150 });
    
    y += 20;
    // WhatsApp CTA
    doc.setFillColor(37, 211, 102);
    doc.roundedRect(55, y, 100, 14, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("Contact us on WhatsApp", 105, y + 9, { align: "center" });
    doc.link(55, y, 100, 14, { url: "https://wa.me/972501234567" });

    // Footer
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text("This report is for estimation purposes only. SmartMortgage AI (c) 2026", 105, 285, { align: "center" });

    doc.save(`SmartMortgage_Report_${formData.full_name || "Client"}.pdf`);
  };

  const handleConversationalSubmit = async (data: { full_name: string; phone: string; email: string; category: string }) => {
    setFormData({ full_name: data.full_name, phone: data.phone, email: data.email });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const consultantId = session?.user?.id || DEFAULT_CONSULTANT_ID;
      const leadScore = calcLeadScore(data.email, marketingConsent);
      const category = getLeadCategory(data.category);
      const tags = getLeadTags();
      
      const { data: insertedLead, error } = await supabase.from("leads").insert({
        consultant_id: consultantId,
        full_name: data.full_name,
        phone: data.phone || null,
        email: data.email || null,
        mortgage_amount: loanAmount,
        property_value: Math.round(loanAmount * 1.35),
        lead_source: "organic",
        marketing_consent: marketingConsent,
        lead_score: leadScore,
        notes: `מחשבון הלוואה: ₪${loanAmount.toLocaleString()} ל-${years} שנה, ריבית ${rate}%. החזר חודשי: ₪${result.monthly.toLocaleString()}. קטגוריה: ${category}. ${tags.length ? `תגיות: ${tags.join(", ")}. ` : ""}סליידר אחרון: ${lastSliderTouched}. ציון: ${leadScore}`,
      } as any).select("id").single();
      if (error) throw error;
      
      if (insertedLead?.id) {
        setSavedLeadId(insertedLead.id);
        if (session?.user?.id) {
          const tagLabel = tags.length ? ` [${tags.join(", ")}]` : "";
          supabase.from("notifications").insert({
            user_id: session.user.id,
            title: `🔥 ליד חם חדש: ${data.full_name}${tagLabel}`,
            body: `₪${loanAmount.toLocaleString()} ל-${years} שנה • ציון ${leadScore} • ${category}`,
            type: leadScore >= 70 ? "urgent" : "info",
            link: "/dashboard/leads",
          } as any).then(() => {});
        }
      }
      
      setIsUnlocked(true);
    } catch (e: any) {
      toast({ title: "שגיאה בשליחה", description: e.message, variant: "destructive" });
      throw e;
    }
  };

  const scrollToForm = () => {
    setStep("form");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const aiTips = [
    { condition: rate > 5, tip: "הריבית גבוהה מהממוצע בשוק. שקלו מסלול משתנה כל 5 שנים להוזלת העלות.", icon: "📉" },
    { condition: years > 25, tip: "תקופה ארוכה מגדילה את סך הריבית. נסו לקצר ל-20 שנה ולחסוך אלפי שקלים.", icon: "⏱️" },
    { condition: loanAmount > 2000000, tip: "בהלוואה גדולה, פיצול ל-2 מסלולים יכול לחסוך עד 15% מהריבית.", icon: "💡" },
    { condition: financingRatio > 60, tip: "אחוז מימון גבוה עלול להעלות את הריבית. שקלו הון עצמי נוסף.", icon: "🏦" },
    { condition: rate <= 5 && years <= 25, tip: "הפרמטרים שלך טובים! זה הזמן לנעול ריבית קבועה לטווח ארוך.", icon: "✅" },
  ];
  const activeTip = aiTips.find(t => t.condition) || aiTips[aiTips.length - 1];

  const faqItems = [
    { q: "כמה הון עצמי צריך למשכנתא?", a: "בדרך כלל נדרש לפחות 25% הון עצמי מערך הנכס לדירה ראשונה, ו-30% לדירה שנייה. למשפרי דיור – לפחות 30%." },
    { q: "מה ההבדל בין ריבית קבועה למשתנה?", a: "ריבית קבועה נשארת זהה לאורך כל תקופת ההלוואה ומספקת ודאות. ריבית משתנה מתעדכנת בהתאם למדד או לפריים ויכולה לרדת או לעלות." },
    { q: "האם כדאי לקחת משכנתא ל-30 שנה?", a: "תקופה ארוכה מקטינה את ההחזר החודשי אך מגדילה משמעותית את סך הריבית. מומלץ לבחון תקופה של 20-25 שנה כנקודת איזון." },
    { q: "מה זה פריים ואיך הוא משפיע על המשכנתא?", a: "ריבית הפריים היא ריבית בסיסית שנקבעת על ידי בנק ישראל. מסלולי פריים במשכנתא צמודים לריבית זו, כך ששינויים בפריים ישפיעו ישירות על ההחזר החודשי." },
    { q: "כמה זמן לוקח לקבל אישור משכנתא?", a: "תהליך אישור עקרוני לוקח 1-3 ימי עסקים. אישור מלא עם כל המסמכים – בין שבוע לשלושה שבועות, תלוי במורכבות התיק." },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": "מחשבון משכנתא חכם 2026 – SmartMortgage AI",
    "description": "מחשבון משכנתא עם בינה מלאכותית לחישוב החזר חודשי, ריבית והשוואת מסלולים",
    "url": "https://chitumitcoil.lovable.app/calculator",
    "provider": {
      "@type": "Organization",
      "name": "SmartMortgage AI"
    },
    "category": "Mortgage Calculator"
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": { "@type": "Answer", "text": item.a }
    }))
  };

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    <style>{`
      @keyframes loading {
        from { width: 0%; }
        to { width: 100%; }
      }
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
    <div className="min-h-screen bg-[hsl(222,47%,4%)] text-white overflow-hidden" dir="rtl">
      {/* Star particles background */}
      <StarField />

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none z-[2]">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[hsl(217,91%,50%)] opacity-[0.07] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(160,84%,39%)] opacity-[0.05] blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-[hsl(38,92%,50%)] opacity-[0.03] blur-[80px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-[hsl(217,91%,50%)] rounded-xl blur-md opacity-50" />
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-[hsl(217,91%,50%)] to-[hsl(217,91%,40%)]">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">SmartMortgage</h1>
              <p className="text-[10px] text-white/40 tracking-wider uppercase">AI-Powered Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/property-value" className="hidden md:flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>מחשבון שווי נכס</span>
            </Link>
            <div className="hidden md:flex items-center gap-1 text-xs text-white/50">
              <Lock className="w-3 h-3" />
              <span>מאובטח SSL</span>
            </div>
            <Link to="/auth">
              <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs">
                כניסה למערכת
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-16 pb-8 md:pt-24 md:pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-l from-[hsl(270,80%,60%)]/15 to-[hsl(217,91%,50%)]/15 border border-[hsl(270,80%,60%)]/30 text-xs text-[hsl(270,80%,80%)] mb-6 shadow-[0_0_20px_hsl(270,80%,60%,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-[hsl(270,80%,65%)] animate-pulse" />
              <span className="bg-gradient-to-l from-[hsl(270,80%,75%)] to-[hsl(217,91%,70%)] bg-clip-text text-transparent font-semibold">מונע בינה מלאכותית</span>
              <span className="text-white/30">•</span>
              <span className="text-[hsl(160,84%,60%)] font-bold">דיוק של 99.7%</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-[1.1] mb-6">
              <span className="text-white">גלה כמה תשלם</span>
              <br />
              <span className="bg-gradient-to-l from-[hsl(217,91%,60%)] via-[hsl(217,91%,50%)] to-[hsl(160,84%,50%)] bg-clip-text text-transparent">
                על המשכנתא שלך
              </span>
            </h1>
            <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
              המחשבון החכם ביותר בישראל. חישוב מדויק, ניתוח AI, 
              והצעה אישית תוך 60 שניות.
            </p>
          </div>

          {/* Calculator Card */}
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Card glow */}
              <div className="absolute -inset-1 bg-gradient-to-b from-[hsl(217,91%,50%)]/20 to-transparent rounded-3xl blur-xl" />
              
              <div className="relative bg-[hsl(222,47%,8%)] border border-white/10 rounded-3xl overflow-hidden">
                {/* Glass header */}
                <div className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-l from-[hsl(217,91%,50%)]/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[hsl(217,91%,50%)]/10">
                        <Calculator className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">מחשבון משכנתא חכם</h3>
                        <p className="text-xs text-white/40">הזז את הסליידרים וקבל תוצאה מיידית</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-xs text-white/40">
                      <div className="w-2 h-2 rounded-full bg-[hsl(160,84%,39%)] animate-pulse" />
                      חישוב בזמן אמת
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Sliders */}
                    <div className="space-y-8">
                      {/* Loan Amount */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm text-white/60">סכום הלוואה</Label>
                          <span className="text-2xl font-black text-white tabular-nums">
                            ₪{loanAmount.toLocaleString()}
                          </span>
                        </div>
                        <Slider
                          value={[loanAmount]}
                          onValueChange={v => { setLoanAmount(v[0]); setLastSliderTouched("loan_amount"); }}
                          min={100000}
                          max={5000000}
                          step={50000}
                          className="[&_[role=slider]]:bg-[hsl(217,91%,50%)] [&_[role=slider]]:border-0 [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:shadow-[0_0_15px_hsl(217,91%,50%,0.5)] [&_.range]:bg-gradient-to-l [&_.range]:from-[hsl(217,91%,50%)] [&_.range]:to-[hsl(160,84%,50%)]"
                        />
                        <div className="flex justify-between text-[10px] text-white/30">
                          <span>₪100K</span>
                          <span>₪5M</span>
                        </div>
                      </div>

                      {/* Years */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm text-white/60">תקופה</Label>
                          <span className="text-2xl font-black text-white tabular-nums">
                            {years} <span className="text-sm font-normal text-white/40">שנים</span>
                          </span>
                        </div>
                        <Slider
                          value={[years]}
                          onValueChange={v => { setYears(v[0]); setLastSliderTouched("years"); }}
                          min={4}
                          max={30}
                          step={1}
                          className="[&_[role=slider]]:bg-[hsl(217,91%,50%)] [&_[role=slider]]:border-0 [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:shadow-[0_0_15px_hsl(217,91%,50%,0.5)] [&_.range]:bg-gradient-to-l [&_.range]:from-[hsl(217,91%,50%)] [&_.range]:to-[hsl(160,84%,50%)]"
                        />
                        <div className="flex justify-between text-[10px] text-white/30">
                          <span>4 שנים</span>
                          <span>30 שנים</span>
                        </div>
                      </div>

                      {/* Rate */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm text-white/60">ריבית שנתית</Label>
                          <span className="text-2xl font-black text-white tabular-nums">
                            {rate}%
                          </span>
                        </div>
                        <Slider
                          value={[rate * 10]}
                          onValueChange={v => { setRate(v[0] / 10); setLastSliderTouched("rate"); }}
                          min={20}
                          max={80}
                          step={1}
                          className="[&_[role=slider]]:bg-[hsl(217,91%,50%)] [&_[role=slider]]:border-0 [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:shadow-[0_0_15px_hsl(217,91%,50%,0.5)] [&_.range]:bg-gradient-to-l [&_.range]:from-[hsl(217,91%,50%)] [&_.range]:to-[hsl(160,84%,50%)]"
                        />
                        <div className="flex justify-between text-[10px] text-white/30">
                          <span>2.0%</span>
                          <span>8.0%</span>
                        </div>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="flex flex-col justify-between">
                      {/* Monthly Payment - Hero Number */}
                      <div className="text-center md:text-right mb-6">
                        <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">החזר חודשי</p>
                        <div className="relative inline-block">
                          <span className="text-5xl md:text-6xl font-black bg-gradient-to-l from-white via-white to-white/70 bg-clip-text text-transparent tabular-nums">
                            ₪{animatedMonthly.toLocaleString()}
                          </span>
                          <div className="absolute -bottom-1 right-0 left-0 h-1 bg-gradient-to-l from-[hsl(217,91%,50%)] to-[hsl(160,84%,50%)] rounded-full opacity-50" />
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-sm text-white/50">סה"כ תשלום</span>
                          <span className="font-bold tabular-nums">₪{animatedTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-sm text-white/50">סה"כ ריבית</span>
                          <span className="font-bold text-[hsl(38,92%,50%)] tabular-nums">₪{animatedInterest.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-sm text-white/50">אחוז מימון (משוער)</span>
                          <span className="font-bold text-[hsl(160,84%,50%)]">{financingRatio}%</span>
                        </div>
                      </div>

                      {/* Visual bar */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-white/30">
                          <span>קרן</span>
                          <span>ריבית</span>
                        </div>
                        <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
                          <div
                            className="h-full bg-gradient-to-l from-[hsl(217,91%,50%)] to-[hsl(217,91%,60%)] rounded-full transition-all duration-700"
                            style={{ width: `${(loanAmount / result.total) * 100}%` }}
                          />
                          <div
                            className="h-full bg-gradient-to-l from-[hsl(38,92%,50%)] to-[hsl(38,92%,60%)] rounded-full transition-all duration-700"
                            style={{ width: `${(result.interest / result.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="p-6 md:p-8 border-t border-white/5 bg-gradient-to-l from-[hsl(217,91%,50%)]/5 to-transparent">
                  {step === "calc" && (
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <Button
                        onClick={scrollToForm}
                        className="w-full md:w-auto bg-gradient-to-l from-[hsl(217,91%,50%)] to-[hsl(217,91%,40%)] hover:from-[hsl(217,91%,55%)] hover:to-[hsl(217,91%,45%)] text-white border-0 h-14 px-10 text-lg font-bold rounded-2xl shadow-[0_0_30px_hsl(217,91%,50%,0.3)] hover:shadow-[0_0_40px_hsl(217,91%,50%,0.5)] transition-all"
                      >
                        <Sparkles className="w-5 h-5 ml-2" />
                        קבל הצעה אישית חינם
                      </Button>
                      <p className="text-xs text-white/30 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        ללא התחייבות • תוצאות תוך 60 שניות
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Market Tip Badge — Blurred until unlocked */}
      <section className="relative z-10 py-4">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-l from-[hsl(38,92%,50%)]/10 to-transparent border border-[hsl(38,92%,50%)]/20 overflow-hidden">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[hsl(38,92%,50%)]/15 flex items-center justify-center text-lg">
              {activeTip.icon}
            </div>
            <div className={cn("flex-1 transition-all duration-300", !isUnlocked && "blur-sm select-none")}>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-3.5 h-3.5 text-[hsl(38,92%,50%)]" />
                <span className="text-xs font-bold text-[hsl(38,92%,50%)] uppercase tracking-wider">טיפ AI חי</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(160,84%,50%)] animate-pulse" />
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{activeTip.tip}</p>
            </div>
            {!isUnlocked ? (
              <button
                onClick={scrollToForm}
                className="group relative flex-shrink-0 overflow-hidden rounded-xl px-5 py-2.5 text-xs font-bold transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, hsl(38,92%,50%) 0%, hsl(30,95%,45%) 50%, hsl(38,92%,55%) 100%)',
                  boxShadow: '0 0 20px hsla(38,92%,50%,0.4), inset 0 1px 0 hsla(0,0%,100%,0.2)',
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-l from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute inset-0 animate-[shimmer_2s_infinite] bg-gradient-to-l from-transparent via-white/15 to-transparent" style={{ backgroundSize: '200% 100%' }} />
                <span className="relative flex items-center gap-2 text-white drop-shadow-sm">
                  <Lock className="w-3.5 h-3.5" />
                  השאר פרטים לפתיחה
                </span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={generatePDF}
                  className="group relative flex-shrink-0 overflow-hidden rounded-xl px-4 py-2.5 text-xs font-bold bg-[hsl(217,91%,50%)] hover:bg-[hsl(217,91%,55%)] transition-all duration-300 hover:scale-105 text-white"
                >
                  <Download className="w-3.5 h-3.5 inline ml-1" />
                  הורד דוח PDF
                </button>
                <Link to="/self-check">
                  <button
                    className="group relative flex-shrink-0 overflow-hidden rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, hsl(38,92%,50%) 0%, hsl(30,95%,45%) 50%, hsl(38,92%,55%) 100%)',
                      boxShadow: '0 0 20px hsla(38,92%,50%,0.4)',
                    }}
                  >
                    <span className="relative flex items-center gap-2 text-white drop-shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      לעוד טיפים
                    </span>
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Conversational Lead Capture */}
      {step !== "calc" && (
        <section ref={formRef} className="relative z-10 py-12">
          <div className="max-w-lg mx-auto px-6">
            <ConversationalLeadCapture
              onSubmit={handleConversationalSubmit}
              submitting={submitting}
              accent="blue"
              summaryLines={[
                { label: "סכום הלוואה", value: `₪${loanAmount.toLocaleString()}` },
                { label: "תקופה", value: `${years} שנים` },
                { label: "החזר חודשי", value: `₪${result.monthly.toLocaleString()}`, highlight: true },
              ]}
              onDownloadPDF={generatePDF}
            />
          </div>
        </section>
      )}

      {/* Social proof */}
      <section className="relative z-10 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "2,847+", label: "לקוחות מרוצים", icon: Star },
              { value: "₪4.2B", label: "משכנתאות שאושרו", icon: TrendingUp },
              { value: "99.7%", label: "דיוק AI", icon: Sparkles },
              { value: "< 60 שנ׳", label: "זמן תגובה", icon: Clock },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <stat.icon className="w-5 h-5 mx-auto text-[hsl(217,91%,60%)] opacity-50" />
                <p className="text-2xl md:text-3xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-16 border-t border-white/5" itemScope itemType="https://schema.org/FAQPage">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">
            שאלות נפוצות על <span className="text-[hsl(217,91%,60%)]">משכנתא</span>
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors overflow-hidden"
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
              >
                <summary className="flex items-center justify-between cursor-pointer p-5 text-sm font-bold text-white/90 list-none">
                  <span itemProp="name">{item.q}</span>
                  <ChevronDown className="w-4 h-4 text-white/30 transition-transform group-open:rotate-180" />
                </summary>
                <div
                  className="px-5 pb-5 text-sm text-white/50 leading-relaxed"
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <p itemProp="text">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="relative z-10 py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "מאובטח ומוגן", desc: "הצפנה מקצה לקצה. הפרטים שלך בטוחים." },
              { icon: Award, title: "מומחי משכנתאות", desc: "צוות יועצים מנוסה עם מאות אישורים." },
              { icon: BarChart3, title: "ניתוח AI מתקדם", desc: "בינה מלאכותית שמוצאת את העסקה הטובה ביותר." },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[hsl(217,91%,50%)]/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-[hsl(217,91%,60%)]" />
                </div>
                <h4 className="font-bold mb-1">{item.title}</h4>
                <p className="text-xs text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclosure / גילוי נאות */}
      <section className="relative z-10 border-t border-white/5 py-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-5 h-5 text-white/40" />
              <h3 className="text-sm font-bold text-white/60">גילוי נאות</h3>
            </div>
            <div className="space-y-3 text-xs text-white/35 leading-relaxed">
              <p>
                <strong className="text-white/50">הבהרה חשובה:</strong> המחשבון המוצג באתר זה מיועד לצורכי הדגמה והערכה בלבד, ואינו מהווה הצעה למתן אשראי, ייעוץ פיננסי, ייעוץ משכנתאות או כל ייעוץ מקצועי אחר. התוצאות המוצגות הן אומדן בלבד ועשויות להשתנות בהתאם לתנאי השוק, מדיניות הבנקים ונתוני הלווה בפועל.
              </p>
              <p>
                <strong className="text-white/50">ריבית ותנאי הלוואה:</strong> שיעורי הריבית המוצגים הם להמחשה בלבד ואינם מייצגים הצעה בפועל. הריבית בפועל תיקבע על ידי הגוף המלווה בהתאם לבדיקת כשירות אשראי, מסלול ההלוואה, תקופת ההלוואה, גובה ההון העצמי ופרמטרים נוספים.
              </p>
              <p>
                <strong className="text-white/50">לקיחת משכנתא כרוכה בסיכונים:</strong> אי-עמידה בתשלומי ההלוואה עלולה לגרור הליכי גבייה, חיוב בריבית פיגורים ואף מימוש הנכס המשועבד. מומלץ להתייעץ עם יועץ משכנתאות מוסמך לפני קבלת החלטות.
              </p>
              <p>
                <strong className="text-white/50">טיפים ותובנות AI:</strong> ההמלצות המוצגות מבוססות על מודלים סטטיסטיים ואינן מהוות ייעוץ מקצועי. יש לבחון כל החלטה פיננסית עם גורם מוסמך.
              </p>
              <p>
                אתר זה אינו בנק, חברת ביטוח או גוף מוסדי. השירות כולל תיווך והפניה ליועצי משכנתאות מורשים. האתר פועל בהתאם לחוק אשראי הוגן, התשנ"ג-1993 ולהנחיות בנק ישראל.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-link CTA to Property Value Calculator */}
      <section className="relative z-10 py-8 mb-4">
        <div className="max-w-4xl mx-auto px-6">
          <Link to="/property-value">
            <div className="p-6 rounded-2xl bg-gradient-to-l from-[hsl(160,84%,39%)]/10 to-transparent border border-[hsl(160,84%,39%)]/20 hover:border-[hsl(160,84%,39%)]/40 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-[hsl(160,84%,39%)]/10 group-hover:bg-[hsl(160,84%,39%)]/20 transition-colors">
                    <Home className="w-6 h-6 text-[hsl(160,84%,39%)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[hsl(160,84%,39%)] transition-colors">רוצה לדעת כמה שווה הנכס שלך?</h3>
                    <p className="text-sm text-white/50 mt-1">מחשבון שווי נכס חכם עם AI – הערכה מיידית לפי אזור, גודל ומגמות שוק</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-white/30 group-hover:text-[hsl(160,84%,39%)] group-hover:-translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <Building2 className="w-4 h-4" />
            <span>SmartMortgage AI © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/20">
            <span>תנאי שימוש</span>
            <span>מדיניות פרטיות</span>
            <span>נגישות</span>
            <span>גילוי נאות</span>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default MortgageCalculatorLanding;
