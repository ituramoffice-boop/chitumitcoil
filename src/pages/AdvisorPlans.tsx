import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createCheckoutSession, STRIPE_TIERS } from "@/lib/stripe";
import { motion, useInView } from "framer-motion";
import { Check, X, Star, Clock, Calculator, MessageCircle, ArrowRight, Zap, Shield, CreditCard, Users, Brain, FileText, Smartphone, BarChart3, Sparkles, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { PublicFooter } from "@/components/PublicFooter";
import { Link, useNavigate } from "react-router-dom";

/* ───── countdown ───── */
function useCountdown(hours: number) {
  const [end] = useState(() => {
    const k = "plans-countdown-end";
    const stored = localStorage.getItem(k);
    if (stored && Number(stored) > Date.now()) return Number(stored);
    const e = Date.now() + hours * 3600_000;
    localStorage.setItem(k, String(e));
    return e;
  });
  const [left, setLeft] = useState(end - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, end - Date.now())), 1000);
    return () => clearInterval(t);
  }, [end]);
  const h = Math.floor(left / 3600_000);
  const m = Math.floor((left % 3600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return { h, m, s, expired: left <= 0 };
}

/* ───── animated number ───── */
function AnimNum({ value }: { value: number }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    let c = 0;
    const step = Math.max(1, Math.floor(value / 30));
    const id = setInterval(() => { c += step; if (c >= value) { setD(value); clearInterval(id); } else setD(c); }, 30);
    return () => clearInterval(id);
  }, [value]);
  return <>{d.toLocaleString()}</>;
}

/* ───── plans ───── */
const plans = [
  {
    id: "trial",
    name: "Trial",
    nameHe: "ניסיון",
    price: 0,
    label: "חינם",
    period: "",
    tag: null,
    tagColor: "",
    desc: "גלה את הפוטנציאל — בלי כרטיס אשראי",
    glow: false,
    gold: false,
    features: [
      { t: "עד 3 לקוחות", ok: true },
      { t: "ציון חיתומית בסיסי", ok: true },
      { t: "מחשבון היתכנות", ok: true },
      { t: "AI תובנות בסיסיות", ok: true },
      { t: "AI חילוץ מסמכים", ok: false },
      { t: "CRM חזוי מלא", ok: false },
      { t: "ציון חיתומית מתקדם", ok: false },
      { t: "מיתוג אישי", ok: false },
      { t: "לידים פרימיום", ok: false },
    ],
    cta: "התחל בחינם",
    ctaStyle: "outline" as const,
    whatsapp: false,
  },
  {
    id: "pro",
    name: "Professional Advisor",
    nameHe: "יועץ מקצועי",
    price: 370,
    label: "₪370",
    period: "/חודש",
    tag: "הכי פופולרי — מבצע השקה",
    tagColor: "bg-primary text-primary-foreground",
    desc: "כל מה שצריך כדי לסגור יותר עסקאות, מהר יותר",
    glow: true,
    gold: false,
    features: [
      { t: "לקוחות ללא הגבלה", ok: true },
      { t: "AI חילוץ מסמכים מלא", ok: true },
      { t: "ציון חיתומית מתקדם", ok: true },
      { t: "CRM חזוי + Pipeline", ok: true },
      { t: "מיתוג אישי + לוגו", ok: true },
      { t: "סנכרון לקוח בזמן אמת", ok: true },
      { t: "AI חיתום אוטומטי", ok: true },
      { t: "ניתוח BDI מיידי", ok: true },
      { t: "גישה לסנטימנט סניפים בזמן אמת", ok: true },
      { t: "לידים פרימיום", ok: false },
    ],
    cta: "התחל ניסיון חינם",
    ctaStyle: "default" as const,
    whatsapp: false,
  },
  {
    id: "growth",
    name: "Growth Engine",
    nameHe: "מנוע הצמיחה",
    price: 1290,
    label: "₪1,290",
    period: "/חודש",
    tag: "מנוע המיליון ₪",
    tagColor: "bg-accent text-accent-foreground",
    desc: "5 לידים פרימיום מאומתים כל חודש + הכל ב-Pro",
    glow: false,
    gold: true,
    features: [
      { t: "הכל ב-Professional", ok: true },
      { t: "5 לידים מאומתים/חודש", ok: true },
      { t: "תמיכה עדיפה 24/7", ok: true },
      { t: "מנהל הצלחה ייעודי", ok: true },
      { t: "הגשה אוטומטית לבנקים", ok: true },
      { t: "דוחות אנליטיקה", ok: true },
      { t: "API מלא", ok: true },
      { t: "SLA זמן תגובה", ok: true },
      { t: "גישה מוקדמת לפיצ׳רים", ok: true },
    ],
    cta: "דבר עם צוות הצמיחה",
    ctaStyle: "outline" as const,
    whatsapp: true,
  },
];

/* ───── feature matrix ───── */
const matrix = [
  { name: "לקוחות פעילים", trial: "3", pro: "∞", growth: "∞" },
  { name: "ציון חיתומית", trial: "בסיסי", pro: "מתקדם + AI", growth: "מתקדם + AI" },
  { name: "AI חילוץ מסמכים", trial: "—", pro: "✓", growth: "✓" },
  { name: "AI חיתום אוטומטי", trial: "—", pro: "✓", growth: "✓" },
  { name: "ניתוח BDI מיידי", trial: "—", pro: "✓", growth: "✓" },
  { name: "CRM חזוי", trial: "—", pro: "✓", growth: "✓" },
  { name: "סנכרון בזמן אמת", trial: "—", pro: "✓", growth: "✓" },
  { name: "מיתוג אישי", trial: "—", pro: "✓", growth: "✓" },
  { name: "לידים פרימיום/חודש", trial: "—", pro: "—", growth: "5" },
  { name: "תמיכה עדיפה", trial: "קהילה", pro: "אימייל", growth: "24/7 + מנהל" },
  { name: "הגשה לבנקים", trial: "—", pro: "ידנית", growth: "אוטומטית" },
  { name: "API", trial: "—", pro: "בסיסי", growth: "מלא" },
];

/* ───── page ───── */
export default function AdvisorPlans() {
  const { h, m, s, expired } = useCountdown(48);
  const [filesSlider, setFilesSlider] = useState([30]);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const minutesPerFile = 25;
  const hourlyRate = 150;
  const hoursSaved = Math.round((filesSlider[0] * minutesPerFile) / 60);
  const moneySaved = hoursSaved * hourlyRate;

  const handleCheckout = async (planId: string) => {
    if (planId === "trial") {
      navigate("/auth");
      return;
    }
    const priceId = planId === "pro"
      ? STRIPE_TIERS.professional.price_id
      : STRIPE_TIERS.enterprise.price_id;
    setCheckoutLoading(planId);
    try {
      const { url } = await createCheckoutSession(priceId);
      if (url) window.location.href = url;
    } catch (err: any) {
      toast.error(err?.message || "שגיאה ביצירת הזמנה");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const heroRef = useRef(null);
  const heroIn = useInView(heroRef, { once: true });
  const matrixRef = useRef(null);
  const matrixIn = useInView(matrixRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">
      {/* ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-10 right-1/3 w-[600px] h-[600px] rounded-full bg-accent/4 blur-[140px]" />
        <div className="absolute bottom-20 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/4 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* ── Sticky countdown ── */}
        {!expired && (
          <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-accent/15">
            <div className="flex items-center justify-center gap-3 py-2.5 px-4 flex-wrap">
              <Clock className="w-4 h-4 text-accent animate-pulse-glow" />
              <span className="text-sm text-accent font-semibold">מחיר Early Adopter — נותרו</span>
              <div className="flex gap-1 font-heebo font-bold text-accent" style={{ fontVariantNumeric: "tabular-nums" }}>
                {[String(h).padStart(2, "0"), String(m).padStart(2, "0"), String(s).padStart(2, "0")].map((v, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-accent/50">:</span>}
                    <span className="bg-accent/15 rounded px-2 py-0.5 min-w-[2rem] text-center text-sm">{v}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Hero ── */}
        <section ref={heroRef} className="pt-16 pb-10 px-4 text-center max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
              <Badge className="bg-accent/10 text-accent border-accent/20 text-xs px-3 py-1">
                <Award className="w-3 h-3 ml-1" /> מהימן ע״י 100+ יועצי משכנתאות מובילים
              </Badge>
              <Badge variant="outline" className="border-success/30 text-success text-xs px-3 py-1">
                <CreditCard className="w-3 h-3 ml-1" /> ללא כרטיס אשראי להתחלה
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-assistant leading-tight mb-4">
              בחר את <span className="text-accent">מנוע הצמיחה</span> שלך
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              כלי AI, לידים מאומתים ו-CRM חזוי — הפלטפורמה שנבנתה להכפיל את ההכנסות שלך
            </p>
          </motion.div>
        </section>

        {/* ── Plan cards ── */}
        <section className="px-4 pb-16 max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {plans.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                animate={heroIn ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.12 * i }}
                className="flex"
              >
                <Card className={`relative flex flex-col w-full p-6 transition-all duration-300 hover:-translate-y-1.5 group ${
                  p.glow
                    ? "border-primary/40 bg-gradient-to-b from-primary/8 to-card shadow-[0_0_50px_-12px_hsl(234_89%_63%/0.25)] hover:shadow-[0_0_60px_-10px_hsl(234_89%_63%/0.35)]"
                    : p.gold
                    ? "border-accent/30 bg-gradient-to-b from-accent/6 to-card hover:border-accent/50 hover:shadow-[0_0_40px_-12px_hsl(43_74%_52%/0.2)]"
                    : "border-border bg-card/80 hover:border-muted-foreground/20"
                }`}>
                  {p.tag && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shadow-lg ${p.tagColor}`}>
                      {p.tag}
                    </div>
                  )}

                  <div className="text-center mb-5 mt-3">
                    <p className="text-xs text-muted-foreground tracking-wider uppercase mb-1 font-heebo">{p.name}</p>
                    <h3 className="text-sm font-semibold text-foreground mb-3">{p.nameHe}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-5xl font-bold font-heebo ${p.gold ? "text-accent" : "text-foreground"}`}>{p.label}</span>
                      {p.period && <span className="text-muted-foreground text-sm">{p.period}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{p.desc}</p>
                  </div>

                  <div className="flex-1 space-y-2 mb-6">
                    {p.features.map((f) => (
                      <div key={f.t} className="flex items-center gap-2 text-sm">
                        {f.ok ? (
                          <Check className={`w-4 h-4 shrink-0 ${p.gold ? "text-accent" : "text-primary"}`} />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/25 shrink-0" />
                        )}
                        <span className={f.ok ? "text-foreground" : "text-muted-foreground/35 line-through decoration-muted-foreground/20"}>{f.t}</span>
                      </div>
                    ))}
                  </div>

                  {p.whatsapp ? (
                    <Button variant="outline" className="w-full border-accent/40 text-accent hover:bg-accent/10 font-bold" asChild>
                      <a href="https://wa.me/972500000000?text=מעוניין בתוכנית Growth Engine" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-4 h-4 ml-1" />
                        {p.cta}
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant={p.ctaStyle}
                      className={`w-full font-bold ${
                        p.glow
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                          : ""
                      }`}
                      asChild
                    >
                      <Link to="/auth">
                        {p.cta}
                        <ArrowRight className="w-4 h-4 mr-1" />
                      </Link>
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {/* social proof strip */}
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-success" /> אבטחת מידע בנקאית</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-primary" /> 100+ יועצים פעילים</span>
            <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-accent" /> ללא כרטיס אשראי</span>
          </div>
        </section>

        {/* ── Value Calculator ── */}
        <section className="px-4 pb-20 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5 }}>
            <Card className="p-8 border-accent/15 bg-gradient-to-br from-card via-card to-accent/4">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-bold">מחשבון ערך — כמה תחסוך?</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-muted-foreground mb-3 block">
                    כמה תיקים את/ה מעבד/ת בחודש? — <span className="text-accent font-bold">{filesSlider[0]} תיקים</span>
                  </label>
                  <Slider value={filesSlider} onValueChange={setFilesSlider} min={5} max={100} step={1} className="py-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>5</span><span>100</span></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-secondary/50 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">שעות שנחסכות</p>
                    <p className="text-2xl font-bold text-primary font-heebo"><AnimNum value={hoursSaved} /></p>
                    <p className="text-[10px] text-muted-foreground">לחודש</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">חיסכון חודשי</p>
                    <p className="text-2xl font-bold text-accent font-heebo">₪<AnimNum value={moneySaved} /></p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">חיסכון שנתי</p>
                    <p className="text-2xl font-bold text-accent font-heebo">₪<AnimNum value={moneySaved * 12} /></p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">*מבוסס על ~{minutesPerFile} דקות לתיק ותעריף ₪{hourlyRate}/שעה</p>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* ── Feature Matrix ── */}
        <section ref={matrixRef} className="px-4 pb-20 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={matrixIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">השוואת <span className="text-accent">תוכניות</span> מלאה</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="text-right p-4 font-semibold text-muted-foreground">פיצ׳ר</th>
                    <th className="p-4 text-center font-semibold text-muted-foreground">Trial</th>
                    <th className="p-4 text-center font-semibold text-primary bg-primary/5">Professional</th>
                    <th className="p-4 text-center font-semibold text-accent bg-accent/5">Growth Engine</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((r, i) => {
                    const isHighlight = r.name === "AI חיתום אוטומטי" || r.name === "ניתוח BDI מיידי";
                    return (
                      <tr key={r.name} className={`border-b border-border/50 ${isHighlight ? "bg-primary/5" : i % 2 === 0 ? "bg-card/50" : "bg-card/30"}`}>
                        <td className={`p-3 pr-4 font-medium ${isHighlight ? "text-primary font-semibold" : ""}`}>
                          {isHighlight && <Sparkles className="w-3 h-3 text-primary inline ml-1" />}
                          {r.name}
                        </td>
                        {([r.trial, r.pro, r.growth] as string[]).map((v, ci) => (
                          <td key={ci} className={`p-3 text-center ${ci === 1 ? "bg-primary/5" : ci === 2 ? "bg-accent/5" : ""}`}>
                            {v === "✓" ? <Check className={`w-4 h-4 mx-auto ${ci === 2 ? "text-accent" : "text-primary"}`} /> : v === "—" ? <X className="w-4 h-4 text-muted-foreground/25 mx-auto" /> : <span className={ci === 2 ? "text-accent font-medium" : ci === 1 ? "text-primary font-medium" : "text-muted-foreground"}>{v}</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>

        {/* ── Data Flow ── */}
        <section className="px-4 pb-20 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }} className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">איך זה <span className="text-accent">עובד</span></h2>
            <p className="text-muted-foreground">המערכת מחברת יועץ ולקוח בזרימה חכמה אחת</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}>
            <div className="rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto"><BarChart3 className="w-6 h-6 text-primary" /></div>
                  <h3 className="font-bold text-sm">לוח בקרה ליועץ</h3>
                  <p className="text-xs text-muted-foreground">CRM חזוי · AI תובנות · הגשה לבנקים</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="hidden md:flex items-center gap-2">
                    <div className="h-px w-14 bg-gradient-to-l from-accent/50 to-transparent" />
                    <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center animate-pulse-glow"><Zap className="w-5 h-5 text-accent" /></div>
                    <div className="h-px w-14 bg-gradient-to-r from-accent/50 to-transparent" />
                  </div>
                  <span className="text-xs text-accent font-medium">סנכרון בזמן אמת</span>
                  <div className="flex gap-1.5">{[Brain, FileText, Shield].map((I, j) => <div key={j} className="w-7 h-7 rounded bg-secondary/60 flex items-center justify-center"><I className="w-3.5 h-3.5 text-accent/60" /></div>)}</div>
                </div>
                <div className="p-5 rounded-xl border border-accent/20 bg-accent/5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mx-auto"><Smartphone className="w-6 h-6 text-accent" /></div>
                  <h3 className="font-bold text-sm">אפליקציית הלקוח</h3>
                  <p className="text-xs text-muted-foreground">ציון חיתומית · העלאת מסמכים · מעקב</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="px-4 pb-24 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="p-10 rounded-2xl bg-gradient-to-br from-accent/8 via-card to-primary/5 border border-accent/15">
            <TrendingUp className="w-8 h-8 text-accent mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold mb-3">מוכן להפוך את הידע להכנסות?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">הצטרף ליועצים שכבר מכפילים הכנסות עם חיתומית — התחל בחינם, שדרג כשתרצה</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/20 px-8" asChild>
                <Link to="/auth">התחל בחינם<ArrowRight className="w-4 h-4 mr-1" /></Link>
              </Button>
              <Button variant="outline" className="border-accent/30 text-accent hover:bg-accent/10" asChild>
                <a href="https://wa.me/972500000000?text=אשמח לשמוע על חיתומית" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 ml-1" />דבר עם צוות הצמיחה
                </a>
              </Button>
            </div>
          </motion.div>
        </section>

        <PublicFooter />
      </div>
    </div>
  );
}
