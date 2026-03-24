import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, TrendingUp, ArrowLeft, Sparkles, Users, User, ChevronDown, Zap, Brain, Lock, BarChart3, CheckCircle2, Star, ArrowUpRight } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { useState, useRef, useEffect } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);

  useEffect(() => {
    if (isInView) {
      animate(count, target, { duration: 2, ease: "easeOut" });
    }
  }, [isInView, target, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

/* ─── Floating Particles ─── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 4) * 2,
            height: 2 + (i % 4) * 2,
            left: `${(i * 13.7) % 100}%`,
            top: `${(i * 7.3) % 100}%`,
            background: i % 3 === 0 ? "hsl(var(--gold))" : "hsl(var(--cyan-glow))",
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 4 + (i % 3) * 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
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
        style={{
          background: "radial-gradient(circle, hsl(var(--gold)), transparent 60%)",
          top: "-10%",
          right: "-10%",
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, hsl(var(--cyan-glow)), transparent 60%)",
          bottom: "-15%",
          left: "-10%",
        }}
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
      {/* ═══════ HEADER ═══════ */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-2xl">
        <div className="container mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ rotate: 8, scale: 1.1 }} transition={{ type: "spring" }}>
              <ChitumitLogo size={38} />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gold">חיתומית</h1>
              <p className="text-[10px] text-muted-foreground">הבינה שמאחורי האישור</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="relative" ref={menuRef}>
              <Button
                onClick={() => user ? navigate("/dashboard") : setMenuOpen(!menuOpen)}
                className="bg-gold text-gold-foreground hover:bg-gold/90 gap-1.5 gold-glow-btn"
              >
                האזור שלי
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
                    <div><p className="text-sm font-semibold text-foreground">בדיקה עצמאית</p><p className="text-[10px] text-muted-foreground">בדיקת היתכנות חינם ללא הרשמה</p></div>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <FloatingParticles />
        <GlowOrbs />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />

        <div className="relative z-10 container mx-auto px-6 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold/30 bg-gold/5 text-gold text-sm font-semibold mb-8 backdrop-blur-sm"
          >
            <Zap className="w-4 h-4" />
            <span>מערכת ה-AI הראשונה בישראל לחיתום משכנתאות</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-5xl lg:text-7xl font-black text-foreground leading-[1.1] mb-6 tracking-tight"
          >
            מישהו הגיע לעשות
            <br />
            <span className="relative">
              <span className="bg-gradient-to-l from-gold via-gold to-[hsl(var(--cyan-glow))] bg-clip-text text-transparent">
                שינוי טכנולוגי
              </span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-l from-gold to-[hsl(var(--cyan-glow))]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                style={{ transformOrigin: "right" }}
              />
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            ניתוח תיקי משכנתא בשניות, זיהוי סיכונים אוטומטי, ומעקב מלא על כל ליד — הכל במקום אחד.
            <br className="hidden lg:block" />
            <span className="text-gold font-medium">הטכנולוגיה שמגנה על ההחלטות שלך.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={() => user ? navigate("/dashboard") : setMenuOpen(true)}
              className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold text-base h-13 px-8 animate-cta-pulse"
            >
              התחל עכשיו
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/self-check")}
              className="group hover:border-gold/50 text-base h-13 px-8 border-border/60"
            >
              <Sparkles className="w-5 h-5 ml-2 text-gold group-hover:animate-pulse" />
              בדיקת היתכנות חינמית
            </Button>
          </motion.div>

          {/* Trust line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 flex items-center justify-center gap-6 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-gold" /> הצפנת קצה-לקצה</span>
            <span className="w-1 h-1 rounded-full bg-gold/30" />
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-gold" /> תקן ISO 27001</span>
            <span className="w-1 h-1 rounded-full bg-gold/30" />
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold" /> GDPR Compliant</span>
          </motion.div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className="relative border-y border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 2400, suffix: "+", label: "תיקים נותחו" },
              { value: 98, suffix: "%", label: "דיוק זיהוי סיכונים" },
              { value: 47, suffix: "x", label: "מהיר מניתוח ידני" },
              { value: 350, suffix: "+", label: "יועצים פעילים" },
            ].map((stat, i) => (
              <FadeSection key={i} delay={i * 0.1}>
                <div className="space-y-1">
                  <div className="text-3xl lg:text-4xl font-black text-gold">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section className="relative py-24 overflow-hidden">
        <GlowOrbs />
        <div className="container mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-xs font-semibold mb-4 border border-gold/20">
                יכולות המערכת
              </span>
              <h3 className="text-3xl lg:text-4xl font-black text-foreground mb-4">
                כל מה שצריך.{" "}
                <span className="text-gold">במקום אחד.</span>
              </h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                פלטפורמת AI מתקדמת שמייעלת את כל תהליך החיתום — מהליד הראשון ועד לאישור הסופי.
              </p>
            </div>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "ניתוח AI חכם", desc: "זיהוי אוטומטי של סיכונים, הצלבת נתונים בין מסמכים, וחישוב סיכויי אישור בזמן אמת.", color: "gold" },
              { icon: FileText, title: "סיווג מסמכים", desc: "העלה מסמכים והמערכת מזהה ומסווגת אוטומטית — תלושי שכר, דוחות אשראי, עו״ש ועוד.", color: "cyan-glow" },
              { icon: ShieldCheck, title: "זיהוי סיכונים", desc: "סריקת אכ״מ, הלוואות נסתרות, בדיקות אמינות מתקדמות ודגלים אדומים אוטומטיים.", color: "gold" },
              { icon: TrendingUp, title: "ניהול לידים מלא", desc: "CRM מובנה עם מעקב סטטוסים, תזכורות, דשבורד ניתוח עסקי ו-pipeline חכם.", color: "cyan-glow" },
              { icon: BarChart3, title: "דשבורד אנליטיקס", desc: "תמונת מצב מלאה על הביצועים שלך — שיעורי המרה, זמני טיפול, ומגמות שוק.", color: "gold" },
              { icon: Zap, title: "אוטומציות חכמות", desc: "התראות בזמן אמת, שליחת מסמכים אוטומטית, ותזכורות מותאמות ללקוחות.", color: "cyan-glow" },
            ].map((f, i) => (
              <FadeSection key={i} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="group relative glass-card p-7 space-y-4 hover:border-gold/30 transition-colors cursor-default"
                >
                  {/* Glow on hover */}
                  <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${f.color === "gold" ? "bg-gold/[0.03]" : "bg-[hsl(var(--cyan-glow))]/[0.03]"}`} />
                  <div className={`relative p-3 rounded-xl w-fit ${f.color === "gold" ? "bg-gold/10" : "bg-[hsl(var(--cyan-glow))]/10"}`}>
                    <f.icon className={`w-6 h-6 ${f.color === "gold" ? "text-gold" : "text-[hsl(var(--cyan-glow))]"}`} />
                  </div>
                  <h4 className="relative text-lg font-bold text-foreground">{f.title}</h4>
                  <p className="relative text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-24 border-y border-border/50 bg-card/20">
        <div className="container mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-[hsl(var(--cyan-glow))]/10 text-[hsl(var(--cyan-glow))] text-xs font-semibold mb-4 border border-[hsl(var(--cyan-glow))]/20">
                איך זה עובד
              </span>
              <h3 className="text-3xl lg:text-4xl font-black text-foreground">
                שלושה צעדים.{" "}
                <span className="text-gold">תוצאה מיידית.</span>
              </h3>
            </div>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "העלה מסמכים", desc: "העלה תלושי שכר, דוחות אשראי ומסמכים נוספים. המערכת מזהה ומסווגת אוטומטית." },
              { step: "02", title: "קבל ניתוח AI", desc: "בתוך שניות — ניתוח סיכונים, הצלבת נתונים, חישוב יכולת החזר וציון היתכנות." },
              { step: "03", title: "קבל החלטה", desc: "דוח ברור עם המלצות, דגלים אדומים ותרחישי תמהיל — מוכן להגשה לבנק." },
            ].map((s, i) => (
              <FadeSection key={i} delay={i * 0.15}>
                <div className="relative text-center space-y-4">
                  <div className="text-6xl font-black text-gold/10 select-none">{s.step}</div>
                  <h4 className="text-xl font-bold text-foreground -mt-8">{s.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  {i < 2 && (
                    <div className="hidden md:block absolute left-0 top-8 -translate-x-full">
                      <ArrowLeft className="w-6 h-6 text-gold/20" />
                    </div>
                  )}
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-xs font-semibold mb-4 border border-gold/20">
                מה אומרים עלינו
              </span>
              <h3 className="text-3xl lg:text-4xl font-black text-foreground">
                יועצים שכבר{" "}
                <span className="text-gold">עלו כיתה</span>
              </h3>
            </div>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "רונית כהן", role: "יועצת משכנתאות, ת״א", quote: "חיתומית חסכה לי 3 שעות על כל תיק. הזיהוי האוטומטי של סיכונים מדהים — תפסה דברים שלי היו לוקח ימים.", stars: 5 },
              { name: "אבי לוי", role: "משרד לייעוץ משכנתאות, חיפה", quote: "מאז שהתחלנו להשתמש בחיתומית, שיעור האישורים שלנו עלה ב-34%. הלקוחות מרגישים את המקצועיות.", stars: 5 },
              { name: "מיכל ברק", role: "יועצת עצמאית, ירושלים", quote: "ה-CRM המובנה עם ניתוח הלידים שינה לי את העסק. הכל במקום אחד, בלי אקסלים אינסופיים.", stars: 5 },
            ].map((t, i) => (
              <FadeSection key={i} delay={i * 0.12}>
                <div className="glass-card p-7 space-y-4 hover:border-gold/20 transition-colors h-full flex flex-col">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed flex-1">"{t.quote}"</p>
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.03] to-transparent" />
        <FloatingParticles />
        <div className="relative z-10 container mx-auto px-6 text-center max-w-3xl">
          <FadeSection>
            <motion.div whileHover={{ rotate: 3 }} className="inline-block mb-6">
              <ChitumitLogo size={64} />
            </motion.div>
            <h3 className="text-3xl lg:text-5xl font-black text-foreground mb-6">
              מוכן לעלות{" "}
              <span className="text-gold">כיתה</span>?
            </h3>
            <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
              הצטרף למאות יועצי המשכנתאות שכבר עובדים חכם יותר עם חיתומית.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => user ? navigate("/dashboard") : navigate("/auth?role=consultant")}
                className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold text-base h-14 px-10 animate-cta-pulse"
              >
                הרשם חינם
                <ArrowUpRight className="w-5 h-5 mr-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/self-check")}
                className="h-14 px-10 text-base border-border/60 hover:border-gold/40"
              >
                נסה בדיקה חינמית
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
