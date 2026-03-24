import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, FileText, TrendingUp, ArrowLeft, Sparkles, Users, User,
  ChevronDown, Zap, Brain, Lock, BarChart3, CheckCircle2, Star,
  ArrowUpRight, Shield, HeartPulse, Search, Eye, Layers, Globe,
  Building2, Award, BadgeCheck, Cpu, Smartphone, ChevronRight,
} from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, useInView, useMotionValue, useTransform, animate, useScroll } from "framer-motion";

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);

  useEffect(() => {
    if (isInView) animate(count, target, { duration: 2, ease: "easeOut" });
  }, [isInView, target, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

/* ─── Floating Particles ─── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 4) * 1.5,
            height: 2 + (i % 4) * 1.5,
            left: `${(i * 13.7) % 100}%`,
            top: `${(i * 7.3) % 100}%`,
            background: i % 3 === 0 ? "hsl(var(--gold))" : "hsl(var(--cyan-glow))",
          }}
          animate={{ y: [0, -30, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 4 + (i % 3) * 2, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Glow Orbs ─── */
function GlowOrbs() {
  return (
    <>
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, hsl(var(--gold)), transparent 60%)", top: "-10%", right: "-10%" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05]"
        style={{ background: "radial-gradient(circle, hsl(var(--cyan-glow)), transparent 60%)", bottom: "-15%", left: "-10%" }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </>
  );
}

/* ─── Section Wrapper ─── */
function FadeSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Chitumit Score Gauge (SVG) ─── */
function ScoreGauge({ score }: { score: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const animScore = useMotionValue(0);
  const displayScore = useTransform(animScore, (v) => Math.round(v));

  useEffect(() => {
    if (isInView) animate(animScore, score, { duration: 2.2, ease: "easeOut" });
  }, [isInView, score, animScore]);

  const radius = 110;
  const stroke = 12;
  const circumference = Math.PI * radius; // half circle
  const progress = score / 100;

  return (
    <div ref={ref} className="relative flex flex-col items-center">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full opacity-20 blur-2xl" style={{ background: "radial-gradient(circle, hsl(var(--gold)), transparent 70%)" }} />
      
      <svg width="260" height="150" viewBox="0 0 260 150" className="drop-shadow-2xl">
        {/* Background arc */}
        <path
          d="M 20 140 A 110 110 0 0 1 240 140"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(0, 84%, 60%)" />
            <stop offset="35%" stopColor="hsl(38, 92%, 50%)" />
            <stop offset="65%" stopColor="hsl(var(--gold))" />
            <stop offset="100%" stopColor="hsl(var(--success))" />
          </linearGradient>
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Active arc */}
        <motion.path
          d="M 20 140 A 110 110 0 0 1 240 140"
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset: circumference * (1 - progress) } : {}}
          transition={{ duration: 2.2, ease: "easeOut" }}
          filter="url(#gauge-glow)"
        />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = Math.PI - (tick / 100) * Math.PI;
          const x = 130 + 95 * Math.cos(angle);
          const y = 140 - 95 * Math.sin(angle);
          return (
            <text key={tick} x={x} y={y} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="Heebo">
              {tick}
            </text>
          );
        })}
      </svg>
      
      {/* Central score */}
      <div className="absolute top-[60px] flex flex-col items-center">
        <motion.span className="text-5xl font-black text-gold tabular-nums">{displayScore}</motion.span>
        <span className="text-xs text-muted-foreground mt-1">Chitumit Score</span>
      </div>
    </div>
  );
}

/* ══════════ MAIN COMPONENT ══════════ */
const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ═══════ STICKY HEADER ═══════ */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-2xl">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ rotate: 8, scale: 1.1 }} transition={{ type: "spring" }}>
              <ChitumitLogo size={36} />
            </motion.div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gold">חיתומית</h1>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">תהיה מאושר.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="relative" ref={menuRef}>
              <Button
                onClick={() => user ? navigate("/dashboard") : setMenuOpen(!menuOpen)}
                className="bg-gold text-gold-foreground hover:bg-gold/90 gap-1.5 gold-glow-btn text-sm h-9 px-4 sm:h-10 sm:px-5"
              >
                <span className="hidden sm:inline">התחל בחינם</span>
                <span className="sm:hidden">התחל</span>
                {!user && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />}
                {user && <ArrowLeft className="w-3.5 h-3.5" />}
              </Button>
              {menuOpen && !user && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-gold/20 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                >
                  <button onClick={() => { navigate("/auth?role=consultant"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gold/10 transition-colors text-right">
                    <div className="p-2 rounded-lg bg-gold/10"><Users className="w-4 h-4 text-gold" /></div>
                    <div><p className="text-sm font-semibold text-foreground">פורטל יועצים</p><p className="text-[10px] text-muted-foreground">CRM, ניתוח תיקים, לידים</p></div>
                  </button>
                  <div className="border-t border-border/50" />
                  <button onClick={() => { navigate("/auth?role=client"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-primary/10 transition-colors text-right">
                    <div className="p-2 rounded-lg bg-primary/10"><User className="w-4 h-4 text-primary" /></div>
                    <div><p className="text-sm font-semibold text-foreground">אזור אישי</p><p className="text-[10px] text-muted-foreground">מעקב תיק, מסמכים, סטטוס</p></div>
                  </button>
                  <div className="border-t border-border/50" />
                  <button onClick={() => { navigate("/self-check"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent/10 transition-colors text-right">
                    <div className="p-2 rounded-lg bg-accent/10"><Sparkles className="w-4 h-4 text-accent" /></div>
                    <div><p className="text-sm font-semibold text-foreground">בדיקת היתכנות</p><p className="text-[10px] text-muted-foreground">חינם ללא הרשמה</p></div>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═══════ HERO SECTION ═══════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <FloatingParticles />
        <GlowOrbs />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />

        <div className="relative z-10 container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Text side */}
            <div className="text-center lg:text-right order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs sm:text-sm font-semibold mb-6 backdrop-blur-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>60 שניות לתוצאה</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-foreground leading-[1.08] mb-5 tracking-tight"
              >
                הסטנדרט הבנקאי
                <br />
                למשכנתא שלך.
                <br />
                <span className="bg-gradient-to-l from-gold via-gold to-[hsl(var(--cyan-glow))] bg-clip-text text-transparent">
                  בחינם.
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
              >
                קבל את ציון חיתומית שלך תוך 60 שניות. ייעל את הפרופיל, הפחת ריביות, וראה מה הבנקים רואים.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
              >
                <Button
                  size="lg"
                  onClick={() => navigate("/self-check")}
                  className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold text-base h-14 px-10 animate-cta-pulse"
                >
                  התחל בחינם
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/mortgage-calculator")}
                  className="group hover:border-gold/50 text-base h-14 px-8 border-border/60"
                >
                  <Sparkles className="w-5 h-5 ml-2 text-gold group-hover:animate-pulse" />
                  מחשבון משכנתא חינמי
                </Button>
              </motion.div>

              {/* Trust line */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-[10px] sm:text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold" /> הצפנת קצה-לקצה</span>
                <span className="w-1 h-1 rounded-full bg-gold/30 hidden sm:block" />
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold" /> תקן ISO 27001</span>
                <span className="w-1 h-1 rounded-full bg-gold/30 hidden sm:block" />
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold" /> GDPR</span>
              </motion.div>
            </div>

            {/* Score Gauge side */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex justify-center order-1 lg:order-2"
            >
              <div className="relative p-8">
                {/* Decorative ring */}
                <div className="absolute inset-4 rounded-full border border-gold/10" />
                <div className="absolute inset-8 rounded-full border border-gold/5" />
                <ScoreGauge score={82} />
                {/* Floating badge */}
                <motion.div
                  className="absolute -bottom-2 right-4 sm:right-8 bg-card/90 backdrop-blur-xl border border-gold/20 rounded-xl px-3 py-2 shadow-xl"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-xs font-bold text-success">+5 נקודות</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">שיפור פוטנציאלי</p>
                </motion.div>
                {/* Left badge */}
                <motion.div
                  className="absolute top-4 -left-2 sm:left-0 bg-card/90 backdrop-blur-xl border border-border/30 rounded-xl px-3 py-2 shadow-xl"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-gold" />
                    <span className="text-[10px] font-semibold text-foreground">סיכוי אישור גבוה</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ THREE PILLARS ═══════ */}
      <section className="relative py-20 sm:py-28 border-y border-border/50 bg-card/20">
        <div className="container mx-auto px-4 sm:px-6">
          <FadeSection>
            <div className="text-center mb-14 sm:mb-20">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-xs font-semibold mb-4 border border-gold/20">
                למה חיתומית
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
                שלושה עמודים.{" "}
                <span className="text-gold">מהפכה אחת.</span>
              </h3>
            </div>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Brain,
                title: "ניתוח מיידי",
                desc: "העלה תלוש שכר ודוח BDI, וקבל דוח AI מלא תוך שניות — עם זיהוי סיכונים ותובנות שחוסכות שעות.",
                color: "gold",
                badge: "AI מתקדם",
              },
              {
                icon: TrendingUp,
                title: "ייעול משכנתא",
                desc: "אנחנו מוצאים את הפערים הנסתרים בפרופיל שלך כדי לחסוך לך מאות אלפי שקלים לאורך תקופת ההלוואה.",
                color: "cyan-glow",
                badge: "חיסכון מוכח",
              },
              {
                icon: Shield,
                title: "אבטחה בנקאית",
                desc: "המידע שלך מוצפן ופרטי לחלוטין. אנחנו לא שומרים נתונים רגישים — תקן ISO 27001 ועמידה ב-GDPR.",
                color: "gold",
                badge: "100% פרטי",
              },
            ].map((pillar, i) => (
              <FadeSection key={i} delay={i * 0.12}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="group relative glass-card p-7 sm:p-9 space-y-5 hover:border-gold/30 transition-colors text-center h-full"
                >
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gold/[0.02]" />
                  <div className="relative mx-auto p-4 rounded-2xl w-fit bg-gold/10 group-hover:bg-gold/15 transition-colors">
                    <pillar.icon className={`w-7 h-7 ${pillar.color === "gold" ? "text-gold" : "text-[hsl(var(--cyan-glow))]"}`} />
                  </div>
                  <span className={`relative inline-block px-3 py-1 rounded-full text-[10px] font-bold ${pillar.color === "gold" ? "bg-gold/10 text-gold" : "bg-[hsl(var(--cyan-glow))]/10 text-[hsl(var(--cyan-glow))]"}`}>
                    {pillar.badge}
                  </span>
                  <h4 className="relative text-xl font-black text-foreground">{pillar.title}</h4>
                  <p className="relative text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
                </motion.div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className="relative bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { value: 12400, suffix: "+", label: "משכנתאות נותחו" },
              { value: 98, suffix: "%", label: "דיוק בזיהוי סיכונים" },
              { value: 47, suffix: "x", label: "מהיר מבדיקה ידנית" },
              { value: 850, prefix: "₪", suffix: "K+", label: "חיסכון ממוצע ללקוח" },
            ].map((stat, i) => (
              <FadeSection key={i} delay={i * 0.1}>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gold tabular-nums">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WHY CHITUMIT — DATA REVOLUTION ═══════ */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <GlowOrbs />
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Illustration side */}
            <FadeSection className="order-2 lg:order-1">
              <div className="relative max-w-md mx-auto">
                {/* Abstract data flow visual */}
                <div className="relative bg-card/40 backdrop-blur-xl border border-border/30 rounded-2xl p-6 sm:p-8 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gold/10"><Eye className="w-5 h-5 text-gold" /></div>
                    <div>
                      <p className="text-sm font-bold text-foreground">מה הבנק רואה</p>
                      <p className="text-[10px] text-muted-foreground">ניתוח חיתום בזמן אמת</p>
                    </div>
                  </div>
                  {/* Mock data rows */}
                  {[
                    { label: "יכולת החזר", value: "34%", status: "success" },
                    { label: "יחס חוב-הכנסה", value: "28%", status: "success" },
                    { label: "ותק תעסוקתי", value: "4 שנים", status: "success" },
                    { label: "דירוג BDI", value: "A+", status: "gold" },
                  ].map((row, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.15 }}
                      className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0"
                    >
                      <span className="text-xs text-muted-foreground">{row.label}</span>
                      <span className={`text-sm font-bold tabular-nums ${row.status === "gold" ? "text-gold" : "text-success"}`}>{row.value}</span>
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    className="mt-4 p-3 rounded-lg bg-gold/5 border border-gold/20"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gold" />
                      <span className="text-xs font-semibold text-gold">סיכוי אישור: 94%</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </FadeSection>

            {/* Text side */}
            <FadeSection delay={0.15} className="order-1 lg:order-2">
              <span className="inline-block px-4 py-1.5 rounded-full bg-[hsl(var(--cyan-glow))]/10 text-[hsl(var(--cyan-glow))] text-xs font-semibold mb-5 border border-[hsl(var(--cyan-glow))]/20">
                מהפכת הנתונים
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-6 leading-tight">
                הכלים של החתם —{" "}
                <span className="text-gold">בידיים שלך</span>
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                עד היום, רק חתמי הבנקים ידעו מה באמת עומד מאחורי אישור או דחייה של משכנתא. חיתומית מעבירה את הכוח הזה אליך — עם אותם הכלים, אותם הנתונים, ואותו הניתוח שהחתם עצמו עושה.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Layers, text: "הצלבת נתונים בין מסמכים כמו שהחתם עושה" },
                  { icon: Search, text: "זיהוי פערים נסתרים שיכולים לחסוך לך ריבית" },
                  { icon: Cpu, text: "AI שמנתח את התיק שלך בזמן אמת" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-gold/10 mt-0.5">
                      <item.icon className="w-4 h-4 text-gold" />
                    </div>
                    <p className="text-sm text-foreground/80">{item.text}</p>
                  </div>
                ))}
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ═══════ LEAD MAGNETS ROW ═══════ */}
      <section className="relative py-20 sm:py-28 border-y border-border/50 bg-card/20">
        <div className="container mx-auto px-4 sm:px-6">
          <FadeSection>
            <div className="text-center mb-14 sm:mb-20">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-xs font-semibold mb-4 border border-gold/20">
                כלים חינמיים
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
                התחל עכשיו.{" "}
                <span className="text-gold">בלי עלות.</span>
              </h3>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
                שלושה כלים חינמיים שנותנים לך יתרון מיידי לפני שאתה בכלל מדבר עם יועץ.
              </p>
            </div>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: FileText,
                title: "בדיקת היתכנות",
                desc: "גלה בדיוק כמה משכנתא תוכל לקבל על נכס שאתה רוצה — עם ניתוח מלא של יכולת ההחזר.",
                cta: "בדוק עכשיו",
                href: "/property-loan",
                color: "gold",
                badge: "הכי פופולרי",
              },
              {
                icon: HeartPulse,
                title: "השוואת ביטוח משכנתא",
                desc: "השווה פרמיות בין כל חברות הביטוח וחסוך עד 40% — עם ניתוח פרופיל סיכון אישי.",
                cta: "השווה מחירים",
                href: "/mortgage-insurance",
                color: "cyan-glow",
                badge: "חיסכון ממוצע ₪420/שנה",
              },
              {
                icon: BarChart3,
                title: "דוח אשראי AI",
                desc: "העלה דוח BDI וקבל ניתוח AI מלא עם המלצות לשיפור הציון שלך לפני הגשת הבקשה.",
                cta: "העלה דוח",
                href: "/self-check",
                color: "gold",
                badge: "AI מתקדם",
              },
            ].map((card, i) => (
              <FadeSection key={i} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => navigate(card.href)}
                  className="group relative glass-card p-6 sm:p-8 space-y-4 hover:border-gold/30 transition-all cursor-pointer h-full flex flex-col"
                >
                  {/* Badge */}
                  <span className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-[9px] font-bold ${card.color === "gold" ? "bg-gold/10 text-gold" : "bg-[hsl(var(--cyan-glow))]/10 text-[hsl(var(--cyan-glow))]"}`}>
                    {card.badge}
                  </span>
                  <div className={`p-3.5 rounded-xl w-fit ${card.color === "gold" ? "bg-gold/10" : "bg-[hsl(var(--cyan-glow))]/10"}`}>
                    <card.icon className={`w-6 h-6 ${card.color === "gold" ? "text-gold" : "text-[hsl(var(--cyan-glow))]"}`} />
                  </div>
                  <h4 className="text-lg font-black text-foreground">{card.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{card.desc}</p>
                  <div className="flex items-center gap-2 text-gold font-bold text-sm group-hover:gap-3 transition-all pt-2">
                    <span>{card.cta}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                </motion.div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ BANKER'S RADAR — STRATEGIC INTELLIGENCE ═══════ */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <GlowOrbs />
        <div className="container mx-auto px-4 sm:px-6">
          <FadeSection>
            <div className="text-center mb-14 sm:mb-20">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-xs font-semibold mb-4 border border-gold/20">
                🎯 ליועצי משכנתאות
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
                תפסיק לנחש,{" "}
                <span className="text-gold">תתחיל לאשר.</span>
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                רתום את הכוח של 2,000 יועצים. חיתומית AI מזהה אילו סניפי בנק מאשרים את הפרופיל של הלקוח שלך <span className="text-foreground font-semibold">עכשיו</span>. אם הוא עבר בלאומי כפר-סבא, נגיד לך בדיוק איך לשווק אותו לדיסקונט תל-אביב.
              </p>
            </div>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Search,
                title: "רדאר בנקאי",
                desc: "זיהוי בזמן אמת של סניפים עם שיעורי אישור גבוהים לפרופיל הלקוח שלך. חיתום יצירתי מבוסס נתונים.",
                badge: "Real-time",
                color: "gold",
              },
              {
                icon: Users,
                title: "מודיעין קולקטיבי",
                desc: "כל אישור של יועץ במערכת מזין את ה-AI. אנונימי לחלוטין — רק מספרים ואסטרטגיות מנצחות.",
                badge: "2,000+ יועצים",
                color: "cyan-glow",
              },
              {
                icon: Zap,
                title: "נרטיב מנצח",
                desc: "AI שכותב מכתב חיתום בשפת הבנקאים — 'כושר החזר מוכח', 'טיב בטוחה גבוה'. מוכן להגשה בלחיצה.",
                badge: "One-Click",
                color: "gold",
              },
            ].map((card, i) => (
              <FadeSection key={i} delay={i * 0.12}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="group relative glass-card p-7 sm:p-9 space-y-5 hover:border-gold/30 transition-colors text-center h-full"
                >
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gold/[0.02]" />
                  <span className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-[9px] font-bold ${card.color === "gold" ? "bg-gold/10 text-gold" : "bg-[hsl(var(--cyan-glow))]/10 text-[hsl(var(--cyan-glow))]"}`}>
                    {card.badge}
                  </span>
                  <div className="relative mx-auto p-4 rounded-2xl w-fit bg-gold/10 group-hover:bg-gold/15 transition-colors">
                    <card.icon className={`w-7 h-7 ${card.color === "gold" ? "text-gold" : "text-[hsl(var(--cyan-glow))]"}`} />
                  </div>
                  <h4 className="relative text-xl font-black text-foreground">{card.title}</h4>
                  <p className="relative text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </motion.div>
              </FadeSection>
            ))}
          </div>

          {/* Success Feed Ticker */}
          <FadeSection delay={0.4}>
            <div className="mt-10 max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 flex items-center gap-3 border-gold/20"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 rounded-full bg-emerald-500/10 shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-emerald-400 font-bold">Success Alert:</span>{" "}
                    פרופיל עם ציון 72 אושר כרגע בבנק הפועלים באמצעות אסטרטגיית הנרטיב של חיתומית
                  </p>
                </div>
                <Badge variant="outline" className="border-gold/30 text-gold text-[9px] shrink-0">Live</Badge>
              </motion.div>
            </div>
          </FadeSection>

          {/* CTA */}
          <FadeSection delay={0.5}>
            <div className="text-center mt-10">
              <Button
                onClick={() => navigate("/advisor-plans")}
                className="bg-gold hover:bg-gold/90 text-black font-bold px-8 py-5 text-base gap-2 shadow-lg shadow-gold/20"
              >
                <Zap className="w-5 h-5" />
                הצטרף לרשת המודיעין
              </Button>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══════ SOCIAL PROOF ═══════ */}
      <section className="py-20 sm:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <FadeSection>
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-xs font-semibold mb-4 border border-gold/20">
                הלקוחות שלנו
              </span>
              <h3 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
                אלפי לווים ישראלים{" "}
                <span className="text-gold">סומכים עלינו</span>
              </h3>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                יועצים ולווים שכבר משתמשים בחיתומית לקבלת החלטות חכמות יותר.
              </p>
            </div>
          </FadeSection>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto mb-16">
            {[
              { name: "רונית כהן", role: "יועצת משכנתאות, ת״א", quote: "חיתומית חסכה לי 3 שעות על כל תיק. הזיהוי האוטומטי של סיכונים מדהים — תפסה דברים שלי היו לוקח ימים.", stars: 5 },
              { name: "אבי לוי", role: "משרד לייעוץ משכנתאות, חיפה", quote: "מאז שהתחלנו להשתמש בחיתומית, שיעור האישורים שלנו עלה ב-34%. הלקוחות מרגישים את המקצועיות.", stars: 5 },
              { name: "מיכל ברק", role: "יועצת עצמאית, ירושלים", quote: "הכלים החינמיים לבד שווים זהב. הלקוחות שלי מגיעים מוכנים יותר, והתהליך קצר ויעיל יותר.", stars: 5 },
            ].map((t, i) => (
              <FadeSection key={i} delay={i * 0.1}>
                <div className="glass-card p-6 sm:p-7 space-y-4 hover:border-gold/20 transition-colors h-full flex flex-col">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed flex-1">"{t.quote}"</p>
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>

          {/* Trust logos bar */}
          <FadeSection>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-6">אבטחת מידע ותקנים</p>
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
                {[
                  { icon: ShieldCheck, label: "ISO 27001" },
                  { icon: Lock, label: "SSL/TLS" },
                  { icon: Globe, label: "GDPR" },
                  { icon: BadgeCheck, label: "SOC 2" },
                  { icon: Award, label: "PCI DSS" },
                ].map((cert, i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground/60">
                    <cert.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{cert.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.03] to-transparent" />
        <FloatingParticles />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center max-w-3xl">
          <FadeSection>
            <motion.div whileHover={{ rotate: 3 }} className="inline-block mb-6">
              <ChitumitLogo size={56} />
            </motion.div>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-5">
              מוכן לדעת מה{" "}
              <span className="text-gold">הבנק יגיד</span>?
            </h3>
            <p className="text-muted-foreground text-base sm:text-lg mb-10 max-w-lg mx-auto">
              בדוק את הפרופיל שלך בחינם תוך 60 שניות — בלי הרשמה, בלי התחייבות.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/self-check")}
                className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold text-base h-14 px-10 animate-cta-pulse"
              >
                קבל ציון חיתומית בחינם
                <ArrowUpRight className="w-5 h-5 mr-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => user ? navigate("/dashboard") : navigate("/auth?role=consultant")}
                className="h-14 px-10 text-base border-border/60 hover:border-gold/40"
              >
                כניסה ליועצים
              </Button>
            </div>
          </FadeSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Index;
