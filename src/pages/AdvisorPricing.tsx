import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, X, Star, Clock, Calculator, MessageCircle, ArrowRight, Zap, Shield, Users, Brain, FileText, Smartphone, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from "react-router-dom";

/* ───── countdown helpers ───── */
function useCountdown(hours: number) {
  const [end] = useState(() => {
    const stored = localStorage.getItem("pricing-countdown-end");
    if (stored && Number(stored) > Date.now()) return Number(stored);
    const e = Date.now() + hours * 3600_000;
    localStorage.setItem("pricing-countdown-end", String(e));
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

/* ───── animated counter ───── */
function AnimNum({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.floor(value / 40));
    const id = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(id); }
      else setDisplay(start);
    }, 25);
    return () => clearInterval(id);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

/* ───── tiers data ───── */
const tiers = [
  {
    name: "Starter",
    nameHe: "סטארטר",
    price: 0,
    priceLabel: "חינם",
    period: "",
    badge: null,
    description: "התחל להשתמש בכלים חכמים — בלי התחייבות",
    highlight: false,
    features: [
      { text: "עד 3 לקוחות פעילים", included: true },
      { text: "ציון חיתומית בסיסי", included: true },
      { text: "מחשבון היתכנות", included: true },
      { text: "תמיכה קהילתית", included: true },
      { text: "AI חילוץ מסמכים", included: false },
      { text: "לוח בקרה מלא", included: false },
      { text: "מיתוג אישי", included: false },
      { text: "סנכרון בזמן אמת", included: false },
      { text: "לידים חמים מה-DB", included: false },
      { text: "תמיכה עדיפה", included: false },
    ],
    cta: "התחל בחינם",
    ctaVariant: "outline" as const,
  },
  {
    name: "Professional",
    nameHe: "מקצועי",
    price: 370,
    priceLabel: "₪370",
    period: "/חודש",
    badge: "הכי משתלם",
    description: "כל מה שצריך כדי לסגור יותר עסקאות — מהר יותר",
    highlight: true,
    features: [
      { text: "לקוחות ללא הגבלה", included: true },
      { text: "ציון חיתומית מתקדם", included: true },
      { text: "AI חילוץ מסמכים", included: true },
      { text: "לוח בקרה מלא ליועץ", included: true },
      { text: "מיתוג אישי + לוגו", included: true },
      { text: "סנכרון בזמן אמת", included: true },
      { text: "התראות WhatsApp", included: true },
      { text: "AI תובנות פרואקטיביות", included: true },
      { text: "לידים חמים מה-DB", included: false },
      { text: "תמיכה עדיפה 24/7", included: false },
    ],
    cta: "התחל ניסיון חינם",
    ctaVariant: "default" as const,
  },
  {
    name: "Enterprise",
    nameHe: "אנטרפרייז / זהב",
    price: 990,
    priceLabel: "₪990",
    period: "/חודש",
    badge: "מנוע המיליון",
    description: "5 לידים חמים ומאומתים כל חודש + תמיכה VIP",
    highlight: false,
    features: [
      { text: "הכל ב-Professional", included: true },
      { text: "5 לידים חמים מאומתים/חודש", included: true },
      { text: "תמיכה עדיפה 24/7", included: true },
      { text: "מנהל הצלחה ייעודי", included: true },
      { text: "דוחות אנליטיקה מתקדמים", included: true },
      { text: "API מלא", included: true },
      { text: "הגשה אוטומטית לבנקים", included: true },
      { text: "SLA זמן תגובה", included: true },
      { text: "הכשרה מותאמת אישית", included: true },
      { text: "גישה מוקדמת לפיצ'רים", included: true },
    ],
    cta: "דבר עם מכירות",
    ctaVariant: "outline" as const,
  },
];

/* ───── comparison table ───── */
const comparisonFeatures = [
  { name: "לקוחות פעילים", starter: "3", pro: "∞", enterprise: "∞" },
  { name: "ציון חיתומית", starter: "בסיסי", pro: "מתקדם + AI", enterprise: "מתקדם + AI" },
  { name: "AI חילוץ מסמכים", starter: "—", pro: "✓", enterprise: "✓" },
  { name: "סנכרון בזמן אמת", starter: "—", pro: "✓", enterprise: "✓" },
  { name: "התראות WhatsApp", starter: "—", pro: "✓", enterprise: "✓" },
  { name: "AI תובנות", starter: "—", pro: "✓", enterprise: "✓" },
  { name: "מיתוג אישי", starter: "—", pro: "✓", enterprise: "✓" },
  { name: "לידים חמים/חודש", starter: "—", pro: "—", enterprise: "5" },
  { name: "תמיכה עדיפה", starter: "—", pro: "—", enterprise: "24/7" },
  { name: "מנהל הצלחה", starter: "—", pro: "—", enterprise: "ייעודי" },
  { name: "הגשה לבנקים", starter: "—", pro: "ידנית", enterprise: "אוטומטית" },
  { name: "API", starter: "—", pro: "בסיסי", enterprise: "מלא" },
];

/* ───── testimonials ───── */
const testimonials = [
  { name: "רועי כהן", title: "יועץ משכנתאות, תל אביב", quote: "חיתומית הכפילה לי את אחוז הסגירות תוך 3 חודשים.", rating: 5 },
  { name: "שירה לוי", title: "יועצת בכירה, ירושלים", quote: "ה-AI חוסך לי 10 שעות בשבוע על ניתוח מסמכים.", rating: 5 },
  { name: "אלון דוד", title: "מנהל סוכנות, חיפה", quote: "הלידים מה-Global DB שווים זהב — כל ליד הוא לקוח פוטנציאלי אמיתי.", rating: 5 },
  { name: "מיכל אברהם", title: "יועצת עצמאית, באר שבע", quote: "הסנכרון בזמן אמת עם הלקוח — Game Changer.", rating: 5 },
  { name: "דני ברקוביץ׳", title: "סמנכ״ל, רמת גן", quote: "התשואה על ההשקעה חזרה כבר בחודש הראשון.", rating: 5 },
];

/* ───── page component ───── */
export default function AdvisorPricing() {
  const { h, m, s, expired } = useCountdown(48);
  const [hoursSlider, setHoursSlider] = useState([15]);
  const hourlyRate = 150; // ₪ per hour
  const monthlySavings = hoursSlider[0] * hourlyRate * 4;

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const tableRef = useRef(null);
  const tableInView = useInView(tableRef, { once: true, margin: "-100px" });
  const testimRef = useRef(null);
  const testimInView = useInView(testimRef, { once: true, margin: "-100px" });
  const flowRef = useRef(null);
  const flowInView = useInView(flowRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">
      {/* ── Ambient glow orbs ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-40 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* ── Countdown banner ── */}
        {!expired && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-l from-accent/20 via-accent/10 to-transparent border-b border-accent/20 py-3 text-center"
          >
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent font-semibold">מחיר Early Adopter — נותרו</span>
              <div className="flex gap-1 font-heebo font-bold text-accent" style={{ fontVariantNumeric: "tabular-nums" }}>
                <span className="bg-accent/20 rounded px-2 py-0.5 min-w-[2rem] text-center">{String(h).padStart(2, "0")}</span>:
                <span className="bg-accent/20 rounded px-2 py-0.5 min-w-[2rem] text-center">{String(m).padStart(2, "0")}</span>:
                <span className="bg-accent/20 rounded px-2 py-0.5 min-w-[2rem] text-center">{String(s).padStart(2, "0")}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Hero ── */}
        <section ref={heroRef} className="pt-16 pb-12 px-4 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-accent/10 text-accent border-accent/20 mb-6 text-sm px-4 py-1">
              <Sparkles className="w-3.5 h-3.5 ml-1" />
              תוכניות ליועצי משכנתאות
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold font-assistant leading-tight mb-4">
              הפוך את <span className="text-accent">הידע שלך</span> ל
              <span className="bg-gradient-to-l from-accent to-amber-400 bg-clip-text text-transparent">מנוע הכנסות</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              כלי AI חכמים, לידים מאומתים ומערכת CRM חזויה — הכל בפלטפורמה אחת שנבנתה עבורך
            </p>
          </motion.div>
        </section>

        {/* ── Pricing cards ── */}
        <section className="px-4 pb-16 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 40 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 * i }}
                className="flex"
              >
                <Card className={`relative flex flex-col w-full p-6 border transition-all duration-300 hover:-translate-y-1 ${
                  tier.highlight
                    ? "border-accent/40 bg-gradient-to-b from-accent/5 to-card shadow-[0_0_40px_-10px_hsl(43_74%_52%/0.2)]"
                    : "border-border bg-card/80 hover:border-accent/20"
                }`}>
                  {tier.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${
                      tier.highlight
                        ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30"
                        : "bg-secondary text-accent border border-accent/30"
                    }`}>
                      {tier.badge}
                    </div>
                  )}

                  <div className="text-center mb-6 mt-2">
                    <h3 className="text-sm text-muted-foreground mb-1">{tier.nameHe}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-foreground font-heebo">{tier.priceLabel}</span>
                      {tier.period && <span className="text-muted-foreground text-sm">{tier.period}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>
                  </div>

                  <div className="flex-1 space-y-2.5 mb-6">
                    {tier.features.map((f) => (
                      <div key={f.text} className="flex items-center gap-2 text-sm">
                        {f.included ? (
                          <Check className="w-4 h-4 text-accent shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                        )}
                        <span className={f.included ? "text-foreground" : "text-muted-foreground/40"}>{f.text}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={tier.ctaVariant}
                    className={`w-full ${
                      tier.highlight
                        ? "bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/20"
                        : tier.name === "Enterprise"
                        ? "border-accent/30 text-accent hover:bg-accent/10"
                        : ""
                    }`}
                    asChild={tier.name === "Enterprise"}
                  >
                    {tier.name === "Enterprise" ? (
                      <a href="https://wa.me/972500000000?text=אשמח לשמוע על תוכנית Enterprise" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-4 h-4 ml-1" />
                        {tier.cta}
                      </a>
                    ) : (
                      <Link to="/auth">
                        {tier.cta}
                        <ArrowRight className="w-4 h-4 mr-1" />
                      </Link>
                    )}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Savings Calculator ── */}
        <section className="px-4 pb-20 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 border-accent/20 bg-gradient-to-br from-card to-accent/5">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-bold">כמה תחסוך עם חיתומית?</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm text-muted-foreground mb-3 block">
                    כמה שעות ביורוקרטיה בשבוע? — <span className="text-accent font-bold">{hoursSlider[0]} שעות</span>
                  </label>
                  <Slider
                    value={hoursSlider}
                    onValueChange={setHoursSlider}
                    min={2}
                    max={40}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>2 שעות</span>
                    <span>40 שעות</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/50 text-center">
                    <p className="text-xs text-muted-foreground mb-1">חיסכון חודשי</p>
                    <p className="text-2xl font-bold text-accent font-heebo">₪<AnimNum value={monthlySavings} /></p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 text-center">
                    <p className="text-xs text-muted-foreground mb-1">חיסכון שנתי</p>
                    <p className="text-2xl font-bold text-accent font-heebo">₪<AnimNum value={monthlySavings * 12} /></p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  *מבוסס על ₪{hourlyRate}/שעה — התעריף הממוצע של יועץ משכנתאות
                </p>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* ── Comparison Table ── */}
        <section ref={tableRef} className="px-4 pb-20 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={tableInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              השוואת <span className="text-accent">תוכניות</span> מלאה
            </h2>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="text-right p-4 font-semibold text-muted-foreground">פיצ׳ר</th>
                    <th className="p-4 text-center font-semibold text-muted-foreground">Starter</th>
                    <th className="p-4 text-center font-semibold text-accent bg-accent/5">Professional</th>
                    <th className="p-4 text-center font-semibold text-muted-foreground">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((f, i) => (
                    <tr key={f.name} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-card/50" : "bg-card/30"}`}>
                      <td className="p-3 pr-4 font-medium">{f.name}</td>
                      <td className="p-3 text-center text-muted-foreground">{f.starter === "✓" ? <Check className="w-4 h-4 text-accent mx-auto" /> : f.starter === "—" ? <X className="w-4 h-4 text-muted-foreground/30 mx-auto" /> : f.starter}</td>
                      <td className="p-3 text-center bg-accent/5 font-medium">{f.pro === "✓" ? <Check className="w-4 h-4 text-accent mx-auto" /> : f.pro === "—" ? <X className="w-4 h-4 text-muted-foreground/30 mx-auto" /> : <span className="text-accent">{f.pro}</span>}</td>
                      <td className="p-3 text-center text-muted-foreground">{f.enterprise === "✓" ? <Check className="w-4 h-4 text-accent mx-auto" /> : f.enterprise === "—" ? <X className="w-4 h-4 text-muted-foreground/30 mx-auto" /> : f.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>

        {/* ── Data flow visual ── */}
        <section ref={flowRef} className="px-4 pb-20 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={flowInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              זרימת נתונים <span className="text-accent">חכמה</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              היועץ והלקוח מחוברים בזמן אמת — כל מסמך, ציון ותובנה מסונכרנים אוטומטית
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={flowInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Advisor side */}
                <div className="p-5 rounded-xl border border-accent/20 bg-accent/5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
                    <BarChart3 className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-bold text-sm">לוח בקרה ליועץ</h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>CRM חזוי</p>
                    <p>AI תובנות</p>
                    <p>הגשה לבנקים</p>
                  </div>
                </div>

                {/* Connection */}
                <div className="flex flex-col items-center gap-2">
                  <div className="hidden md:flex items-center gap-2">
                    <div className="h-px w-16 bg-gradient-to-l from-accent/60 to-transparent" />
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center animate-pulse-glow">
                      <Zap className="w-5 h-5 text-accent" />
                    </div>
                    <div className="h-px w-16 bg-gradient-to-r from-accent/60 to-transparent" />
                  </div>
                  <div className="flex md:hidden w-px h-10 bg-gradient-to-b from-accent/60 to-transparent mx-auto" />
                  <span className="text-xs text-accent font-medium">סנכרון בזמן אמת</span>
                  <div className="flex gap-1.5 flex-wrap justify-center">
                    {[Brain, FileText, Shield].map((Icon, j) => (
                      <div key={j} className="w-7 h-7 rounded bg-secondary/60 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-accent/70" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Client side */}
                <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                    <Smartphone className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm">אפליקציית הלקוח</h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>ציון חיתומית</p>
                    <p>העלאת מסמכים</p>
                    <p>מעקב תיק</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Testimonials ── */}
        <section ref={testimRef} className="px-4 pb-20 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={testimInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
              מה אומרים <span className="text-accent">היועצים המובילים</span>
            </h2>
            <p className="text-muted-foreground text-center mb-10">5 מיועצי המשכנתאות המובילים בישראל</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.slice(0, 5).map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={testimInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.1 * i }}
                >
                  <Card className="p-5 border-border bg-card/80 h-full flex flex-col">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground mb-4 flex-1">"{t.quote}"</p>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.title}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="px-4 pb-24 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-10 rounded-2xl bg-gradient-to-br from-accent/10 via-card to-primary/5 border border-accent/20"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              מוכן להכפיל את ההכנסות?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              הצטרף ל-500+ יועצים שכבר משתמשים בחיתומית — התחל בחינם, שדרג כשתהיה מוכן
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/20 px-8" asChild>
                <Link to="/auth">
                  התחל ניסיון חינם
                  <ArrowRight className="w-4 h-4 mr-1" />
                </Link>
              </Button>
              <Button variant="outline" className="border-accent/30 text-accent hover:bg-accent/10" asChild>
                <a href="https://wa.me/972500000000?text=אשמח לשמוע על חיתומית" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 ml-1" />
                  דבר עם מכירות
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
