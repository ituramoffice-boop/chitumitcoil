import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import {
  Phone, FileSignature, ScanSearch, Calculator, Zap, Shield, Brain,
  TrendingUp, CheckCircle2, XCircle, Sparkles, Clock, DollarSign,
  HeadphonesIcon, FileX, Users, ArrowDown, MessageCircle, BarChart3,
  Smartphone, Globe, ChevronLeft, Play, Star, Quote
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { PublicFooter } from "@/components/PublicFooter";

/* ── Animated Section ── */
function AnimSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Counter ── */
function Counter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const dur = 1800;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(e * value));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

/* ── Pain Point Card ── */
function PainCard({ icon: Icon, title, desc, delay }: { icon: any; title: string; desc: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex gap-4 items-start p-5 rounded-xl bg-destructive/5 border border-destructive/15 group"
    >
      <div className="p-2.5 rounded-lg bg-destructive/10 shrink-0">
        <Icon className="w-5 h-5 text-destructive" />
      </div>
      <div>
        <h4 className="font-bold text-foreground text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ── Testimonials Carousel ── */
const testimonials = [
  {
    quote: "הייתי משלם ₪2,200 בחודש על 4 מערכות שונות. עכשיו הכל במקום אחד, וה-AI חוסך לי שעתיים ביום.",
    name: "אבי לוי",
    title: "יועץ משכנתאות, תל אביב",
    stars: 5,
    metric: "חיסכון: ₪2,200/חודש",
  },
  {
    quote: "מאז שהתחלתי להשתמש במחשבון הממותג, אני מקבל 3-4 לידים חמים בשבוע בלי להוציא שקל על פרסום.",
    name: "רונית כהן",
    title: "יועצת משכנתאות, חיפה",
    stars: 5,
    metric: "+15 לידים בחודש",
  },
  {
    quote: "החתימה הדיגיטלית שינתה לי את החיים. הלקוח חותם מהנייד תוך דקה — בלי לבוא למשרד.",
    name: "משה דוד",
    title: "יועץ בכיר, ירושלים",
    stars: 5,
    metric: "90% פחות ניירת",
  },
  {
    quote: "הסורק הבין תלוש של עובד עם 3 מעסיקים ושכר משתנה. אני לא מאמין שזה אוטומטי.",
    name: "יעל שמש",
    title: "יועצת משכנתאות, רמת גן",
    stars: 5,
    metric: "חיסכון: 2 שעות/ליד",
  },
];

function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="glass-card p-8 md:p-10"
          >
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 space-y-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: testimonials[current].stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-gold/20" />
                <blockquote className="text-lg md:text-xl font-bold text-foreground leading-relaxed">
                  {testimonials[current].quote}
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold">
                    {testimonials[current].name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm">{testimonials[current].name}</div>
                    <div className="text-xs text-muted-foreground">{testimonials[current].title}</div>
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                <div className="px-4 py-2 rounded-lg bg-success/10 border border-success/20 text-success text-sm font-bold text-center">
                  {testimonials[current].metric}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-gold w-6" : "bg-muted-foreground/30"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Live Demo Mockup (animated screen) ── */
function LiveDemoMockup() {
  const steps = [
    { label: "גולש נכנס למחשבון", detail: "הלקוח מזיז סליידרים ובוחר סכום משכנתא", color: "text-foreground" },
    { label: "AI מנתח את הנתונים", detail: "חישוב ריבית, החזר חודשי ודירוג סיכון", color: "text-gold" },
    { label: "ראיון AI קצר", detail: "שם, טלפון, סוג נכס — ב-3 שלבים", color: "text-gold" },
    { label: "ליד חם נכנס ל-CRM!", detail: "עם ציון AI, פרטי חישוב והתראה ליועץ", color: "text-success" },
  ];
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveStep((s) => (s + 1) % steps.length), 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      {/* Fake browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary/50 border-b border-border/40">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/40" />
          <div className="w-3 h-3 rounded-full bg-warning/40" />
          <div className="w-3 h-3 rounded-full bg-success/40" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-background/60 rounded-md px-3 py-1 text-[11px] text-muted-foreground text-center">
            chitumit.ai/calc?ref=avilevy
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 min-h-[280px] flex flex-col items-center justify-center gap-6">
        {/* Progress bar */}
        <div className="w-full max-w-md flex items-center gap-1">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-secondary">
              <motion.div
                className="h-full rounded-full bg-gold"
                initial={{ width: "0%" }}
                animate={{ width: i <= activeStep ? "100%" : "0%" }}
                transition={{ duration: 0.5 }}
              />
            </div>
          ))}
        </div>

        {/* Active step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="text-center space-y-2"
          >
            <div className="text-sm text-muted-foreground">שלב {activeStep + 1} מתוך {steps.length}</div>
            <div className={`text-xl md:text-2xl font-bold ${steps[activeStep].color}`}>
              {steps[activeStep].label}
            </div>
            <div className="text-sm text-muted-foreground">{steps[activeStep].detail}</div>
          </motion.div>
        </AnimatePresence>

        {/* Animated notification at last step */}
        {activeStep === steps.length - 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-success/10 border border-success/20"
          >
            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-success" />
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-success">🔥 ליד חדש: דני כהן</div>
              <div className="text-xs text-muted-foreground">משכנתא ₪1.2M · ציון AI: 87 · נכס ראשון</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ── Feature Demo Card ── */
function DemoCard({ icon: Icon, badge, title, desc, mockup, delay }: {
  icon: any; badge: string; title: string; desc: string; mockup: React.ReactNode; delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="glass-card overflow-hidden"
    >
      {/* Mock UI */}
      <div className="bg-secondary/30 border-b border-border/40 p-6 min-h-[180px] flex items-center justify-center">
        {mockup}
      </div>
      {/* Info */}
      <div className="p-6 space-y-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 text-gold text-xs font-medium">
          <Icon className="w-3.5 h-3.5" /> {badge}
        </span>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ── Mini Mock UIs ── */
function DialerMock() {
  return (
    <div className="w-full max-w-xs mx-auto space-y-3">
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80 border border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
            <Phone className="w-4 h-4 text-success" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">דני כהן</div>
            <div className="text-[10px] text-muted-foreground">054-XXX-XXXX</div>
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-bold"
        >
          ● מתמלל...
        </motion.div>
      </div>
      <div className="px-3 py-2 rounded-lg bg-background/60 border border-border/30 text-[10px] text-muted-foreground leading-relaxed">
        <span className="text-foreground font-medium">AI סיכום: </span>
        "הלקוח מתעניין במחזור משכנתא, מעוניין להוריד ריבית. רגש: חיובי. מומלץ: לשלוח הצעה תוך 24 שעות."
      </div>
    </div>
  );
}

function SignMock() {
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="rounded-lg bg-background/80 border border-border/50 overflow-hidden">
        <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
          <span className="text-[10px] font-bold text-foreground">הסכם ייעוץ משכנתאות</span>
          <span className="text-[10px] text-success">✓ נשלח ל-SMS</span>
        </div>
        <div className="p-4 flex flex-col items-center gap-3">
          <div className="w-32 h-12 rounded border-2 border-dashed border-gold/30 flex items-center justify-center">
            <motion.svg
              viewBox="0 0 120 30"
              className="w-24 h-8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              <motion.path
                d="M10 20 Q30 5 50 18 Q70 30 90 12 Q100 6 110 15"
                fill="none"
                stroke="hsl(var(--gold))"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            </motion.svg>
          </div>
          <span className="text-[10px] text-muted-foreground">הלקוח חותם מהנייד — בלי הדפסות</span>
        </div>
      </div>
    </div>
  );
}

function ScanMock() {
  return (
    <div className="w-full max-w-xs mx-auto space-y-2">
      <div className="rounded-lg bg-background/80 border border-border/50 p-3">
        <div className="text-[10px] font-bold text-foreground mb-2">📄 תלוש_משכורת_פברואר.pdf</div>
        <div className="space-y-1.5">
          {[
            { label: "שכר ברוטו", val: "₪18,500", color: "text-foreground" },
            { label: "הלוואות פעילות", val: "2 הלוואות", color: "text-warning" },
            { label: "ותק בעבודה", val: "4 שנים", color: "text-success" },
          ].map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.2, duration: 0.4 }}
              className="flex justify-between items-center px-2 py-1 rounded bg-secondary/50 text-[10px]"
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span className={`font-bold ${row.color}`}>{row.val}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-gold">
        <Brain className="w-3 h-3" />
        <span>AI זיהה: כושר החזר חודשי ₪5,200</span>
      </div>
    </div>
  );
}

function CalcMock() {
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="rounded-lg bg-background/80 border border-border/50 p-3 space-y-2">
        <div className="text-[10px] font-bold text-foreground">🧮 מחשבון משכנתא — ליד חדש!</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "סכום", val: "₪1,200,000" },
            { label: "ריבית", val: "4.2%" },
            { label: "תקופה", val: "25 שנה" },
            { label: "החזר", val: "₪6,540/חודש" },
          ].map((item, i) => (
            <div key={i} className="px-2 py-1.5 rounded bg-secondary/50 text-center">
              <div className="text-[9px] text-muted-foreground">{item.label}</div>
              <div className="text-[11px] font-bold text-foreground">{item.val}</div>
            </div>
          ))}
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-1 text-[10px] text-success bg-success/10 rounded px-2 py-1"
        >
          <Sparkles className="w-3 h-3" />
          ליד חם נכנס ל-CRM שלך אוטומטית
        </motion.div>
      </div>
    </div>
  );
}

/* ── Comparison Row ── */
function CompRow({ label, old_, new_ }: { label: string; old_: string; new_: string }) {
  return (
    <tr className="border-b border-border/30">
      <td className="p-3.5 text-sm font-medium text-foreground">{label}</td>
      <td className="p-3.5 text-center">
        <span className="inline-flex items-center gap-1 text-destructive text-xs"><XCircle className="w-3.5 h-3.5" />{old_}</span>
      </td>
      <td className="p-3.5 text-center">
        <span className="inline-flex items-center gap-1 text-success text-xs"><CheckCircle2 className="w-3.5 h-3.5" />{new_}</span>
      </td>
    </tr>
  );
}

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */
export default function Pitch() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden" id="main-content">
      <StarField />

      {/* ═══════ HERO — Personal & Direct ═══════ */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="text-center max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
              <ChitumitLogo size={20} /> חיתומית — הבינה שמאחורי האישור
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight"
          >
            נמאס לך לרדוף
            <br />
            אחרי <span className="text-gold">לידים שמתים</span>?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            אתה משקיע שעות בטלפונים, באקסלים, בהדפסות — ובסוף הלקוח הולך למתחרה שענה לו מהר יותר.
            <br />
            <strong className="text-foreground">הגיע הזמן שהטכנולוגיה תעבוד בשבילך.</strong>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button size="lg" className="text-lg px-10 py-6 rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 shadow-lg shadow-gold/25 glow-gold" onClick={() => navigate("/auth")}>
              אני רוצה לנסות — בחינם
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-10 py-6 rounded-xl" onClick={() => {
              document.getElementById("pain-section")?.scrollIntoView({ behavior: "smooth" });
            }}>
              תראה לי איך <ArrowDown className="w-4 h-4 mr-1" />
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full bg-gold/60" />
          </div>
        </motion.div>
      </section>

      {/* ═══════ PAIN POINTS — The Real Talk ═══════ */}
      <section id="pain-section" className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
              מכירים את <span className="text-gold">הכאבים</span> האלה?
            </h2>
            <p className="text-muted-foreground">אם ענית "כן" על לפחות אחד — המערכת הזו נבנתה בשבילך</p>
          </AnimSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PainCard delay={0} icon={Clock} title="שעות על ניהול אקסלים" desc="כל ליד חדש = שורה חדשה באקסל. סטטוס? תזכורת? איפה הוא עומד? אתה לא זוכר." />
            <PainCard delay={0.1} icon={DollarSign} title="₪2,000+ בחודש על כלים" desc="חייגן ₪199, חתימה דיגיטלית ₪149, CRM ₪299, מחשבון ₪99... וכל אחד מהם חצי עובד." />
            <PainCard delay={0.2} icon={HeadphonesIcon} title="שיחות בלי תיעוד" desc="דיברת עם 15 לקוחות היום. מה כל אחד אמר? מה ההתנגדות? אתה רושם על פתקים." />
            <PainCard delay={0.3} icon={FileX} title="הדפסה → חתימה → סריקה" desc="שולח מייל עם PDF, הלקוח מדפיס, חותם, סורק, שולח בחזרה. בשנת 2026." />
            <PainCard delay={0.4} icon={Users} title="לידים שנופלים בין הכיסאות" desc="גולש נכנס למחשבון, ממלא פרטים, ואתה מקבל את ההודעה 3 ימים אחר כך. מאוחר מדי." />
            <PainCard delay={0.5} icon={BarChart3} title="אין תמונה ברורה של העסק" desc="כמה לידים נכנסו? מה שיעור ההמרה? אתה לא יודע — כי אין דשבורד אמיתי." />
          </div>
        </div>
      </section>

      {/* ═══════ THE SOLUTION — Feature Demos ═══════ */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimSection className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium mb-4">
              <CheckCircle2 className="w-4 h-4" /> הפתרון
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              <span className="text-gold">מערכת אחת</span> שמחליפה את כולן
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              תראה בעצמך איך כל פיצ'ר עובד — לא סתם מילים, הנה ה-Demo:
            </p>
          </AnimSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DemoCard
              delay={0}
              icon={Phone}
              badge="חייגן + AI"
              title="תתקשר — ה-AI ירשום בשבילך"
              desc="חייגן מובנה עם הקלטה אוטומטית. ה-AI מתמלל בעברית, מזהה רגשות, ומכין סיכום + משימות — עוד לפני שסיימת את השיחה."
              mockup={<DialerMock />}
            />
            <DemoCard
              delay={0.15}
              icon={FileSignature}
              badge="חתימה דיגיטלית"
              title="הלקוח חותם מהספה"
              desc="שלח קישור ב-WhatsApp — הלקוח חותם מהנייד תוך 10 שניות. בלי הדפסות, בלי סריקות, בלי סיפורים."
              mockup={<SignMock />}
            />
            <DemoCard
              delay={0.3}
              icon={ScanSearch}
              badge="סורק AI"
              title="תעלה תלוש — ה-AI ינתח"
              desc="העלה תלוש משכורת או דף חשבון. ה-AI שולף הכנסות, הלוואות, ותק וחריגות — ומגיש לך הכל בטבלה נקייה."
              mockup={<ScanMock />}
            />
            <DemoCard
              delay={0.45}
              icon={Calculator}
              badge="מגנט לידים"
              title="מחשבון שמביא לקוחות"
              desc="מחשבון משכנתא ממותג בשם שלך. הגולש ממלא פרטים, מקבל דו&quot;ח PDF — ואתה מקבל ליד חם ישירות ל-CRM."
              mockup={<CalcMock />}
            />
          </div>
        </div>
      </section>

      {/* ═══════ NUMBERS ═══════ */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimSection>
            <div className="glass-card p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { num: 60, suffix: " שנ׳", label: "ליד חדש → ל-CRM", icon: Zap },
                { num: 4, suffix: " מערכות", prefix: "", label: "מוחלפות באחת", icon: Shield },
                { num: 2000, suffix: "₪+", prefix: "", label: "חיסכון חודשי", icon: DollarSign },
                { num: 340, suffix: "%", prefix: "+", label: "שיפור בהמרות", icon: TrendingUp },
              ].map((s, i) => (
                <AnimSection key={i} delay={i * 0.1}>
                  <s.icon className="w-6 h-6 text-gold mx-auto mb-2" />
                  <div className="text-2xl md:text-3xl font-black text-gold">
                    <Counter value={s.num} suffix={s.suffix} prefix={s.prefix || ""} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </AnimSection>
              ))}
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ═══════ COMPARISON ═══════ */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimSection className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold">
              <span className="text-destructive line-through">הדרך הישנה</span> vs <span className="text-gold">הדרך החכמה</span>
            </h2>
          </AnimSection>

          <AnimSection delay={0.15}>
            <div className="glass-card overflow-hidden rounded-2xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/30">
                    <th className="p-3.5 text-right text-sm font-bold text-foreground w-1/3"></th>
                    <th className="p-3.5 text-center text-sm font-bold text-destructive/80 w-1/3">😤 היום</th>
                    <th className="p-3.5 text-center text-sm font-bold text-gold w-1/3">🚀 איתנו</th>
                  </tr>
                </thead>
                <tbody>
                  <CompRow label="ניהול לידים" old_="אקסל + פתקים" new_="CRM חכם עם ציון AI" />
                  <CompRow label="שיחות טלפון" old_="בלי הקלטה" new_="תמלול + סיכום אוטומטי" />
                  <CompRow label="חתימת מסמכים" old_="הדפסה + סריקה" new_="חתימה מהנייד בלינק" />
                  <CompRow label="ניתוח תלושים" old_="קריאה ידנית" new_="AI שמבין עברית" />
                  <CompRow label="יצירת לידים" old_="פרסום יקר" new_="מחשבון ממותג שלך" />
                  <CompRow label="עלות חודשית" old_="₪2,000+ על 4 כלים" new_="הכל באחד" />
                </tbody>
              </table>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimSection className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold">מתחילים ב-3 דקות</h2>
            <p className="text-muted-foreground mt-2">רציני. שלוש דקות.</p>
          </AnimSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "נרשמים ומעלים לוגו", desc: "יוצרים חשבון, מעלים לוגו ומגדירים WhatsApp. מקבלים קישור מחשבון ממותג.", icon: Globe },
              { step: "02", title: "משתפים את המחשבון", desc: "שולחים את הלינק ללקוחות — הם ממלאים פרטים ונכנסים ישירות ל-CRM שלכם.", icon: Smartphone },
              { step: "03", title: "סוגרים עסקאות", desc: "מקבלים התראה, מתקשרים עם חייגן AI, שולחים חתימה דיגיטלית — והעסקה סגורה.", icon: MessageCircle },
            ].map((item, i) => (
              <AnimSection key={i} delay={i * 0.12}>
                <div className="glass-card p-6 text-center space-y-3 h-full relative overflow-hidden">
                  <div className="text-5xl font-black text-gold/10">{item.step}</div>
                  <item.icon className="w-8 h-8 text-gold mx-auto" />
                  <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ LIVE DEMO — Animated Screen Recording ═══════ */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimSection className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium mb-4">
              <Play className="w-4 h-4" /> ראה את זה בפעולה
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold">
              60 שניות — מ<span className="text-gold">גולש אנונימי</span> ל<span className="text-success">ליד חם ב-CRM</span>
            </h2>
          </AnimSection>

          <AnimSection delay={0.15}>
            <LiveDemoMockup />
          </AnimSection>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS CAROUSEL ═══════ */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimSection className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold">מה אומרים <span className="text-gold">יועצים שכבר עברו</span></h2>
          </AnimSection>
          <TestimonialsCarousel />
        </div>

        {/* Trust badges */}
        <AnimSection delay={0.3} className="mt-12">
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
            {["🔒 SSL מאובטח", "🏦 תואם רגולציה", "☁️ גיבוי אוטומטי", "📱 מותאם למובייל"].map((badge, i) => (
              <span key={i} className="text-xs text-muted-foreground font-medium">{badge}</span>
            ))}
          </div>
        </AnimSection>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="relative z-10 py-32 px-4">
        <AnimSection className="text-center max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-5xl font-black">
            מוכן <span className="text-gold">לעבוד חכם</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            10 לידים ראשונים בחינם. בלי כרטיס אשראי. בלי התחייבות.
            <br />
            פשוט תירשם ותראה את ההבדל.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button size="lg" className="text-lg px-12 py-7 rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 shadow-lg shadow-gold/25 glow-gold animate-glow-pulse" onClick={() => navigate("/auth")}>
              <Sparkles className="w-5 h-5 ml-2" />
              אני רוצה לנסות — בחינם
            </Button>
            <Button size="lg" variant="ghost" className="text-lg" onClick={() => navigate("/calculator")}>
              או נסה את המחשבון קודם <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          </div>
        </AnimSection>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <PublicFooter />
    </div>
  );
}
