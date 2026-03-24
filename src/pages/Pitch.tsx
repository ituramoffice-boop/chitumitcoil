import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import {
  Phone, FileSignature, ScanSearch, Calculator, Zap, Shield, Brain,
  TrendingUp, CheckCircle2, XCircle, ArrowLeft, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ── Animated Section Wrapper ── */
function AnimSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Feature Card ── */
function FeatureCard({ icon: Icon, title, desc, color, delay }: { icon: any; title: string; desc: string; color: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.04, y: -4 }}
      className="glass-card p-6 relative overflow-hidden group cursor-default"
    >
      {/* glow */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${color}`} />
      <div className="relative z-10 flex flex-col items-center text-center gap-3">
        <motion.div
          animate={{ boxShadow: ["0 0 0px 0px transparent", `0 0 18px 4px ${color === "bg-primary" ? "hsl(var(--primary)/0.35)" : color === "bg-success" ? "hsl(var(--success)/0.35)" : color === "bg-warning" ? "hsl(var(--warning)/0.35)" : "hsl(var(--destructive)/0.35)"}`, "0 0 0px 0px transparent"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className={`p-3 rounded-xl ${color} bg-opacity-15`}
        >
          <Icon className="w-7 h-7 text-primary" />
        </motion.div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ── Comparison Row ── */
function CompRow({ label, old_, new_ }: { label: string; old_: string; new_: string }) {
  return (
    <tr className="border-b border-border/40">
      <td className="p-4 text-sm font-medium text-foreground">{label}</td>
      <td className="p-4 text-center">
        <span className="inline-flex items-center gap-1 text-destructive text-sm"><XCircle className="w-4 h-4" />{old_}</span>
      </td>
      <td className="p-4 text-center">
        <span className="inline-flex items-center gap-1 text-success text-sm"><CheckCircle2 className="w-4 h-4" />{new_}</span>
      </td>
    </tr>
  );
}

export default function Pitch() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <StarField />

      {/* ═══════ HERO ═══════ */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="text-center max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" /> המהפכה של 2026
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight"
          >
            <span className="bg-gradient-to-l from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              בינה מלאכותית
            </span>
            <br />
            בשירות יועץ המשכנתאות
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            לא עוד כלי — <strong className="text-foreground">שותף דיגיטלי</strong> שמנהל לידים, מנתח שיחות, חותם מסמכים ומייצר לקוחות חדשים. הכל תחת קורת גג אחת חכמה.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-lg shadow-primary/25" onClick={() => navigate("/auth")}>
              הצטרף למהפכה — התחל עכשיו
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-10 py-6 rounded-xl" onClick={() => navigate("/calculator")}>
              נסה את המחשבון בחינם
            </Button>
          </motion.div>
        </motion.div>

        {/* scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full bg-primary/60" />
          </div>
        </motion.div>
      </section>

      {/* ═══════ VALUE PROP ═══════ */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              תחסוך <span className="text-primary">אלפי שקלים</span> בחודש
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              מערכת אחת שמחליפה 4 כלים יקרים. בלי מנויים מיותרים, בלי הגדרות מסובכות.
            </p>
          </AnimSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard delay={0} icon={Phone} color="bg-primary" title="חייגן תותח (Power Dialer)" desc="חיוג אוטומטי עם תמלול AI בזמן אמת. סיכום שיחה, ציון רגש ומשימות — הכל אוטומטי." />
            <FeatureCard delay={0.1} icon={FileSignature} color="bg-success" title="חתימה דיגיטלית מרחוק" desc="שלח קישור ללקוח — הוא חותם מהנייד תוך שניות. בלי הדפסות, בלי סריקות." />
            <FeatureCard delay={0.2} icon={ScanSearch} color="bg-warning" title="סורק מסמכים AI" desc="העלה תלוש משכורת או דף בנק — ה-AI מזהה הכנסות, הלוואות וחריגות אוטומטית." />
            <FeatureCard delay={0.3} icon={Calculator} color="bg-destructive" title="מחשבונים חכמים (Lead Magnets)" desc="מחשבון משכנתא ושווי נכס שהופכים גולשים ללידים חמים ישירות ל-CRM שלך." />
          </div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimSection>
            <div className="glass-card p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { val: "60 שנ׳", label: "זמן ייצור ליד", icon: Zap },
                { val: "99.8%", label: "דיוק תמלול עברית", icon: Brain },
                { val: "4→1", label: "מערכות מאוחדות", icon: Shield },
                { val: "+340%", label: "שיפור בהמרות", icon: TrendingUp },
              ].map((s, i) => (
                <AnimSection key={i} delay={i * 0.1}>
                  <s.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl md:text-3xl font-black text-foreground">{s.val}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </AnimSection>
              ))}
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ═══════ COMPARISON TABLE ═══════ */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
              הדרך <span className="text-destructive line-through">הישנה</span> vs הדרך <span className="text-primary">החכמה</span>
            </h2>
          </AnimSection>

          <AnimSection delay={0.2}>
            <div className="glass-card overflow-hidden rounded-2xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/30">
                    <th className="p-4 text-right text-sm font-bold text-foreground">קריטריון</th>
                    <th className="p-4 text-center text-sm font-bold text-destructive">הדרך הישנה 😤</th>
                    <th className="p-4 text-center text-sm font-bold text-primary">SmartMortgage AI 🚀</th>
                  </tr>
                </thead>
                <tbody>
                  <CompRow label="ניהול לידים" old_="אקסל / מערכת יקרה" new_="CRM חכם עם AI" />
                  <CompRow label="הקלטת שיחות" old_="הקלטה ידנית + תמלול" new_="תמלול אוטומטי + ניתוח" />
                  <CompRow label="חתימת מסמכים" old_="הדפסה → סריקה → מייל" new_="חתימה דיגיטלית מהנייד" />
                  <CompRow label="ניתוח מסמכים" old_="קריאה ידנית, שעות עבודה" new_="OCR + AI בשניות" />
                  <CompRow label="יצירת לידים" old_="פרסום יקר" new_="מחשבונים חכמים אורגניים" />
                  <CompRow label="עלות חודשית" old_="₪2,000+ על 4 כלים" new_="הכל באחד, מחיר אחד" />
                </tbody>
              </table>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold">איך זה עובד?</h2>
            <p className="text-muted-foreground mt-3">שלושה צעדים פשוטים לעסק חכם יותר</p>
          </AnimSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "הירשם וקבל קישור ייחודי", desc: "צור חשבון, העלה לוגו וקבל קישור מחשבון ממותג שלך." },
              { step: "02", title: "שתף את המחשבון", desc: "שלח את הקישור ללקוחות פוטנציאליים — הם ימלאו את הנתונים וייכנסו ישירות ל-CRM." },
              { step: "03", title: "סגור עסקאות מהר יותר", desc: "קבל התראות, נתח שיחות עם AI וחתום מסמכים — הכל ממקום אחד." },
            ].map((item, i) => (
              <AnimSection key={i} delay={i * 0.15}>
                <div className="glass-card p-6 text-center space-y-3 h-full">
                  <div className="text-4xl font-black text-primary/30">{item.step}</div>
                  <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="relative z-10 py-32 px-4">
        <AnimSection className="text-center max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-black">
            מוכן <span className="text-primary">למהפכה</span>?
          </h2>
          <p className="text-lg text-muted-foreground">
            הצטרף למאות יועצי משכנתאות שכבר עברו לעבוד חכם. התחל בחינם, שדרג כשתרצה.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-12 py-7 rounded-xl shadow-lg shadow-primary/25" onClick={() => navigate("/auth")}>
              <Sparkles className="w-5 h-5 ml-2" />
              הצטרף למהפכה — התחל עכשיו
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">ללא כרטיס אשראי • 10 לידים בחינם • ביטול בכל עת</p>
        </AnimSection>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="relative z-10 border-t border-border/30 py-8 px-4 text-center text-sm text-muted-foreground">
        <p>© 2026 SmartMortgage AI — כל הזכויות שמורות</p>
      </footer>
    </div>
  );
}
