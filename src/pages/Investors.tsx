import { useRef, useState, useEffect } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import {
  TrendingUp, Users, Globe, Zap, Shield, Brain, DollarSign, Target,
  Layers, BarChart3, Sparkles, ArrowDown, Calendar, CheckCircle2,
  Phone, FileSignature, ScanSearch, Calculator, ChevronLeft
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";

/* ── Section wrapper with scroll reveal ── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
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

/* ── Staggered bullet ── */
function Bullet({ children, delay, icon: Icon }: { children: React.ReactNode; delay: number; icon?: any }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex items-start gap-3"
    >
      {Icon && (
        <div className="p-1.5 rounded-lg bg-emerald-500/10 shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-emerald-400" />
        </div>
      )}
      <span className="text-sm md:text-base text-slate-300 leading-relaxed">{children}</span>
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
    const dur = 2000;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(e * value));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);
  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ── Revenue projection data ── */
const revenueData = [
  { month: "Q1 2026", revenue: 50000, users: 20 },
  { month: "Q2 2026", revenue: 180000, users: 75 },
  { month: "Q3 2026", revenue: 450000, users: 200 },
  { month: "Q4 2026", revenue: 900000, users: 400 },
  { month: "Q1 2027", revenue: 1800000, users: 800 },
  { month: "Q2 2027", revenue: 3000000, users: 1300 },
  { month: "Q3 2027", revenue: 4200000, users: 1800 },
  { month: "Q4 2027", revenue: 5000000, users: 2200 },
];

const marketSegments = [
  { name: "משכנתאות", value: 4500, fill: "#6366f1" },
  { name: "ביטוח", value: 3200, fill: "#10b981" },
  { name: "פנסיה", value: 2800, fill: "#f59e0b" },
  { name: "השקעות", value: 1500, fill: "#ef4444" },
];

/* ════════════════════ PAGE ════════════════════ */
export default function Investors() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="relative min-h-screen bg-[#0a0e1a] text-slate-100 overflow-x-hidden" dir="rtl">
      <StarField />

      {/* ═══════ HERO ═══════ */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="text-center max-w-5xl mx-auto space-y-8">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
              <Sparkles className="w-4 h-4" /> Investor Deck · מצגת למשקיעים
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight"
          >
            <span className="bg-gradient-to-l from-indigo-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              SmartMortgage AI
            </span>
            <br />
            <span className="text-slate-200">העתיד של הייעוץ הפיננסי</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            פלטפורמת SaaS מבוססת AI שמחליפה 4 כלים יקרים ליועצי משכנתאות.
            <br />
            <strong className="text-slate-200">שוק של 12,000+ יועצים בישראל. הפוטנציאל: ₪60M ARR.</strong>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button
              size="lg"
              className="text-lg px-10 py-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
              onClick={() => window.open("https://calendly.com", "_blank")}
            >
              <Calendar className="w-5 h-5 ml-2" />
              קבע פגישה עם המייסד
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 py-6 rounded-xl border-slate-600 text-slate-300 hover:bg-slate-800"
              onClick={() => document.getElementById("problem")?.scrollIntoView({ behavior: "smooth" })}
            >
              גלול למצגת <ArrowDown className="w-4 h-4 mr-1" />
            </Button>
          </motion.div>
        </motion.div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full bg-indigo-400/60" />
          </div>
        </motion.div>
      </section>

      {/* ═══════ SLIDE 1: THE PROBLEM ═══════ */}
      <section id="problem" className="relative z-10 py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <Reveal className="mb-4">
            <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">01 — הבעיה</span>
          </Reveal>
          <Reveal className="mb-10" delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
              יועצי משכנתאות <span className="text-red-400">מפסידים לקוחות</span>
              <br />כי הם עובדים עם כלים מהעבר
            </h2>
          </Reveal>

          <div className="space-y-4">
            <Bullet delay={0} icon={DollarSign}>
              <strong className="text-slate-100">₪2,000+ בחודש</strong> על 4 מערכות נפרדות — חייגן, CRM, חתימה דיגיטלית, מחשבונים
            </Bullet>
            <Bullet delay={0.1} icon={Users}>
              <strong className="text-slate-100">12,000+ יועצי משכנתאות</strong> בישראל, רובם עדיין עובדים עם אקסל ופתקים
            </Bullet>
            <Bullet delay={0.2} icon={Target}>
              <strong className="text-slate-100">70% מהלידים נופלים</strong> כי היועץ מגיב אחרי שעות — המתחרה כבר חתם
            </Bullet>
            <Bullet delay={0.3} icon={BarChart3}>
              <strong className="text-slate-100">אין נראות לעסק</strong> — בלי דשבורד, בלי אנליטיקס, בלי תמונה ברורה
            </Bullet>
          </div>
        </div>
      </section>

      {/* ═══════ SLIDE 2: THE SOLUTION ═══════ */}
      <section className="relative z-10 py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-4">
            <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">02 — הפתרון</span>
          </Reveal>
          <Reveal className="mb-14" delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
              מערכת <span className="text-emerald-400">All-in-One</span> שמחליפה
              <br />את כל מה שהיועץ צריך
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: Phone, title: "חייגן AI", desc: "חיוג אוטומטי + תמלול Whisper בעברית + סיכום AI + ציון רגש. היועץ מתקשר — המערכת רושמת.", color: "indigo" },
              { icon: FileSignature, title: "חתימה דיגיטלית", desc: "שלח לינק → הלקוח חותם מהנייד. חוסך הדפסות, סריקות, ונסיעות למשרד.", color: "emerald" },
              { icon: ScanSearch, title: "סורק מסמכים AI", desc: "OCR + AI שמנתח תלושי משכורת ודפי בנק. שולף הכנסות, הלוואות וחריגות בשניות.", color: "amber" },
              { icon: Calculator, title: "מחשבונים ממותגים", desc: "מחשבון משכנתא + שווי נכס שממותגים בשם היועץ. הגולש ממלא → ליד חם נכנס ל-CRM.", color: "rose" },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm space-y-3 h-full">
                  <div className={`p-2.5 rounded-lg w-fit ${
                    f.color === "indigo" ? "bg-indigo-500/15" :
                    f.color === "emerald" ? "bg-emerald-500/15" :
                    f.color === "amber" ? "bg-amber-500/15" : "bg-rose-500/15"
                  }`}>
                    <f.icon className={`w-6 h-6 ${
                      f.color === "indigo" ? "text-indigo-400" :
                      f.color === "emerald" ? "text-emerald-400" :
                      f.color === "amber" ? "text-amber-400" : "text-rose-400"
                    }`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SLIDE 3: MARKET SIZE ═══════ */}
      <section className="relative z-10 py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-4">
            <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">03 — גודל השוק</span>
          </Reveal>
          <Reveal className="mb-14" delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
              שוק של <span className="text-emerald-400">₪60M+ ARR</span>
              <br />רק בישראל — לפני הרחבה גלובלית
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Reveal delay={0}>
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-center space-y-2">
                <div className="text-3xl md:text-4xl font-black text-indigo-400">
                  <Counter value={12000} suffix="+" />
                </div>
                <div className="text-sm text-slate-400">יועצי משכנתאות בישראל</div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-center space-y-2">
                <div className="text-3xl md:text-4xl font-black text-emerald-400">
                  ₪<Counter value={500} />
                </div>
                <div className="text-sm text-slate-400">ARPU חודשי (ממוצע)</div>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-center space-y-2">
                <div className="text-3xl md:text-4xl font-black text-amber-400">
                  ₪<Counter value={60} suffix="M" />
                </div>
                <div className="text-sm text-slate-400">TAM שנתי — ישראל בלבד</div>
              </div>
            </Reveal>
          </div>

          {/* Market segments chart */}
          <Reveal delay={0.3}>
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <h3 className="text-lg font-bold text-slate-200 mb-4">פוטנציאל הרחבה — ייעוץ פיננסי (אלפי יועצים)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={marketSegments} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0" }}
                    formatter={(value: number) => [`${value.toLocaleString()} יועצים`, ""]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ SLIDE 4: REVENUE PROJECTION ═══════ */}
      <section className="relative z-10 py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-4">
            <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">04 — תחזית הכנסות</span>
          </Reveal>
          <Reveal className="mb-14" delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
              ₪<span className="text-emerald-400">5,000,000</span>/חודש
              <br />תוך 24 חודשים
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₪${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0" }}
                    formatter={(value: number) => [`₪${value.toLocaleString()}`, "הכנסה חודשית"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Reveal>

          {/* Unit economics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: "CAC", value: "₪120", sub: "עלות רכישת לקוח" },
              { label: "LTV", value: "₪18,000", sub: "ערך לקוח לאורך חיים" },
              { label: "LTV:CAC", value: "150x", sub: "יחס בריא מאוד" },
              { label: "Churn", value: "2.5%", sub: "נטישה חודשית" },
            ].map((m, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center space-y-1">
                  <div className="text-xl font-black text-emerald-400">{m.value}</div>
                  <div className="text-xs font-bold text-slate-300">{m.label}</div>
                  <div className="text-[10px] text-slate-500">{m.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SLIDE 5: COMPETITIVE ADVANTAGE ═══════ */}
      <section className="relative z-10 py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <Reveal className="mb-4">
            <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">05 — יתרון תחרותי</span>
          </Reveal>
          <Reveal className="mb-10" delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-extrabold">למה אנחנו <span className="text-indigo-400">מנצחים</span>?</h2>
          </Reveal>

          <div className="space-y-4">
            <Bullet delay={0} icon={Brain}>
              <strong className="text-slate-100">AI-First:</strong> Whisper לתמלול עברית מדויק, GPT-4o לניתוח שיחות — לא פיצ'ר נלווה, אלא הליבה
            </Bullet>
            <Bullet delay={0.1} icon={Layers}>
              <strong className="text-slate-100">All-in-One:</strong> מחליפים 4 מערכות נפרדות. חוסכים ליועץ ₪2,000/חודש ו-10 שעות שבועיות
            </Bullet>
            <Bullet delay={0.2} icon={Globe}>
              <strong className="text-slate-100">Viral Engine:</strong> כל יועץ מפיץ מחשבון ממותג — לידים נכנסים אורגנית, בלי עלות רכישה
            </Bullet>
            <Bullet delay={0.3} icon={Shield}>
              <strong className="text-slate-100">Lock-in:</strong> ברגע שהיועץ מעלה לקוחות, מסמכים ותיק שיחות — הוא לא עוזב
            </Bullet>
            <Bullet delay={0.4} icon={TrendingUp}>
              <strong className="text-slate-100">הרחבה:</strong> הארכיטקטורה מוכנה לביטוח, פנסיה, השקעות — אותו DNA בדיוק
            </Bullet>
          </div>
        </div>
      </section>

      {/* ═══════ SLIDE 6: TRACTION ═══════ */}
      <section className="relative z-10 py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <Reveal className="mb-4">
            <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">06 — Traction</span>
          </Reveal>
          <Reveal className="mb-10" delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-extrabold">מה כבר <span className="text-emerald-400">בנינו</span></h2>
          </Reveal>

          <div className="space-y-4">
            {[
              "מוצר MVP עובד — חייגן, חתימה דיגיטלית, סורק AI, מחשבונים",
              "מנוע לידים עם מחשבון ממותג + PDF אוטומטי",
              "מערכת CRM עם Lead Scoring מבוסס AI",
              "תמלול שיחות בעברית עם Whisper + ניתוח GPT-4o",
              "תשתית Multi-tenant — כל יועץ רואה רק את הלידים שלו",
              "Paywall + תוכניות מנוי (Free/Pro/Enterprise)",
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SLIDE 7: THE ASK ═══════ */}
      <section className="relative z-10 py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <Reveal className="mb-4">
            <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">07 — ההזדמנות</span>
          </Reveal>
          <Reveal className="mb-10" delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
              מגייסים <span className="text-emerald-400">סבב Pre-Seed</span>
              <br />לצמיחה אגרסיבית
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-4">
                <h3 className="text-lg font-bold text-indigo-400">שימוש בכספים</h3>
                <div className="space-y-3">
                  {[
                    { label: "פיתוח מוצר + AI", pct: 50 },
                    { label: "שיווק + מכירות", pct: 30 },
                    { label: "תפעול + משפטי", pct: 20 },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">{item.label}</span>
                        <span className="text-slate-400">{item.pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                        <Reveal delay={0.3 + i * 0.1}>
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-emerald-500"
                            initial={{ width: "0%" }}
                            whileInView={{ width: `${item.pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
                          />
                        </Reveal>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-4">
                <h3 className="text-lg font-bold text-emerald-400">יעדים ל-18 חודש</h3>
                <div className="space-y-3">
                  <Bullet delay={0} icon={Users}>500+ יועצים משלמים</Bullet>
                  <Bullet delay={0.1} icon={DollarSign}>₪2M MRR</Bullet>
                  <Bullet delay={0.2} icon={Globe}>פיילוט בשוק האירופאי</Bullet>
                  <Bullet delay={0.3} icon={Brain}>מוצר AI V2 — ייעוץ אוטומטי ללקוחות</Bullet>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="relative z-10 py-32 px-4">
        <Reveal className="text-center max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-black">
            בואו <span className="bg-gradient-to-l from-indigo-400 to-emerald-400 bg-clip-text text-transparent">נדבר</span>
          </h2>
          <p className="text-lg text-slate-400">
            20 דקות של Demo חי — ואתם תבינו למה זה הדבר הבא בפינטק הישראלי.
          </p>

          <motion.div
            animate={{ boxShadow: ["0 0 0 0 rgba(16,185,129,0.4)", "0 0 30px 10px rgba(16,185,129,0.15)", "0 0 0 0 rgba(16,185,129,0.4)"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block rounded-xl"
          >
            <Button
              size="lg"
              className="text-xl px-14 py-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              onClick={() => window.open("https://calendly.com", "_blank")}
            >
              <Calendar className="w-6 h-6 ml-2" />
              קבע פגישה עם המייסד
            </Button>
          </motion.div>

          <p className="text-xs text-slate-600">confidential · for qualified investors only</p>
        </Reveal>
      </section>

      <footer className="relative z-10 border-t border-slate-800 py-8 px-4 text-center text-sm text-slate-600">
        <p>© 2026 SmartMortgage AI · Confidential Investor Materials</p>
      </footer>
    </div>
  );
}
