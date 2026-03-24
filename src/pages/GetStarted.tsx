import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Upload,
  Shield,
  Zap,
  Users,
  FileText,
  ChevronDown,
  Star,
  TrendingUp,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Brain,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

/* ══════════════════════════════════════════════
   SCORE GAUGE
   ══════════════════════════════════════════════ */

function ScoreGauge({ score, revealed }: { score: number; revealed: boolean }) {
  const [animScore, setAnimScore] = useState(0);

  useEffect(() => {
    if (!revealed) return;
    let f = 0;
    const t = setInterval(() => {
      f++;
      setAnimScore(Math.round(score * (1 - Math.pow(1 - f / 60, 3))));
      if (f >= 60) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [revealed, score]);

  const pct = animScore / 100;
  const isHigh = animScore >= 80;
  const isMid = animScore >= 60 && animScore < 80;
  const color = isHigh ? "#D4AF37" : isMid ? "#3B82F6" : "#EF4444";
  const circumference = 2 * Math.PI * 80;
  const dashOffset = circumference * (1 - pct * 0.75);

  return (
    <div className="relative w-56 h-56 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-[135deg]">
        <circle cx="100" cy="100" r="80" fill="none" stroke="#E5E7EB" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} />
        {revealed && (
          <motion.circle
            cx="100" cy="100" r="80" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            initial={{ strokeDashoffset: circumference * 0.75 }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {revealed ? (
          <>
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-5xl font-black"
              style={{ color }}
            >
              {animScore}
            </motion.span>
            <span className="text-xs text-neutral-400 mt-1">Chitumit Score</span>
          </>
        ) : (
          <div className="text-center">
            <Lock className="w-6 h-6 text-neutral-300 mx-auto mb-1" />
            <span className="text-[10px] text-neutral-400">העלה מסמכים לגילוי</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   UPLOAD ZONE
   ══════════════════════════════════════════════ */

function UploadZone({ onComplete }: { onComplete: () => void }) {
  const [files, setFiles] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  const scanSteps = ["קורא מטא-דאטה...", "מנתח BDI...", "סורק עו\"ש...", "מחשב ציון Chitumit..."];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const names = Array.from(e.dataTransfer.files).map(f => f.name);
    if (names.length) startScan(names);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(e.target.files || []).map(f => f.name);
    if (names.length) startScan(names);
  }, []);

  const startScan = (names: string[]) => {
    setFiles(names);
    setScanning(true);
    setScanStep(0);
  };

  useEffect(() => {
    if (!scanning) return;
    if (scanStep >= scanSteps.length) {
      setTimeout(onComplete, 500);
      return;
    }
    const t = setTimeout(() => setScanStep(s => s + 1), 1200);
    return () => clearTimeout(t);
  }, [scanning, scanStep]);

  const simulateUpload = () => {
    startScan(["BDI_Report_2024.pdf", "Bank_Statement_Q4.pdf"]);
  };

  return (
    <div className="relative">
      {!scanning ? (
        <motion.div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          className="border-2 border-dashed border-blue-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          onClick={simulateUpload}
        >
          <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileInput} />
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Upload className="w-10 h-10 text-blue-400 mx-auto mb-4 group-hover:text-blue-600 transition-colors" />
          </motion.div>
          <p className="text-neutral-700 font-semibold text-sm mb-1 font-heebo">גרור לכאן את דוח ה-BDI ודפי העו"ש</p>
          <p className="text-neutral-400 text-xs font-heebo">PDF בלבד • עד 10MB • מוצפן AES-256</p>
          <Button
            className="mt-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold gap-2 px-8 shadow-lg shadow-blue-500/20"
            onClick={(e) => { e.stopPropagation(); simulateUpload(); }}
          >
            <FileText className="w-4 h-4" />
            או לחץ לבחירת קבצים
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-blue-100 rounded-2xl p-8 bg-blue-50/30"
        >
          <div className="space-y-3 mb-6">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-blue-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-neutral-700 truncate font-heebo">{f}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {scanSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: i <= scanStep ? 1 : 0.3, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                {i < scanStep ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : i === scanStep ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Zap className="w-4 h-4 text-blue-500 shrink-0" />
                  </motion.div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-neutral-200 shrink-0" />
                )}
                <span className={cn("text-xs font-heebo", i <= scanStep ? "text-neutral-700" : "text-neutral-300")}>{step}</span>
              </motion.div>
            ))}
          </div>
          {/* Laser scan line */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-0.5 mt-4 rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, #3B82F6, transparent)" }}
          />
        </motion.div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   SCORE RESULT
   ══════════════════════════════════════════════ */

function ScoreResult({ score }: { score: number }) {
  const isHigh = score >= 80;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl p-6 text-center border",
        isHigh ? "bg-amber-50/50 border-amber-200" : "bg-blue-50/50 border-blue-200"
      )}
    >
      <Badge className={cn(
        "mb-3 text-xs font-bold border-0",
        isHigh ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
      )}>
        {isHigh ? "🏆 Golden Opportunity" : "📋 Roadmap to Recovery"}
      </Badge>
      <p className="text-sm text-neutral-600 font-heebo leading-relaxed">
        {isHigh
          ? "הציון שלך גבוה — הבנקים ירוצו אחריך. היועצים שלנו יכולים להשיג לך תנאים מעולים."
          : "יש תוכנית לשיפור הציון שלך. עם מספר פעולות קטנות, תוכל לחסוך מאות שקלים בחודש בריבית."
        }
      </p>
      <Button
        className={cn(
          "mt-4 font-bold gap-2 px-8 shadow-lg",
          isHigh
            ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20"
            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-500/20"
        )}
      >
        <Users className="w-4 h-4" />
        {isHigh ? "מצא יועץ שיסגור לך עסקה" : "קבל תוכנית שיפור אישית"}
      </Button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   POWER-UP SECTION
   ══════════════════════════════════════════════ */

function PowerUpSection() {
  const [currentScore] = useState(78);
  const targetScore = 85;
  const savingsPerMonth = 400;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          <Badge className="bg-amber-400/20 text-amber-300 text-[10px] font-bold border-0">Power-Up</Badge>
        </div>
        <h3 className="text-xl font-black mb-4 font-heebo">הציון שלך {currentScore}? הנה איך להגיע ל-{targetScore}</h3>

        <div className="space-y-3 mb-6">
          {[
            { action: "סגור הלוואה של ₪5,000 שנשארה", impact: "+3 נקודות" },
            { action: "המתן 3 חודשים לעדכון BDI", impact: "+4 נקודות" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-sm text-white/80 flex-1 font-heebo">{item.action}</span>
              <Badge className="bg-emerald-400/20 text-emerald-300 text-[9px] border-0">{item.impact}</Badge>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-400/10 border border-amber-400/20">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-200 font-heebo">חיסכון פוטנציאלי: ₪{savingsPerMonth}/חודש בריבית</p>
            <p className="text-xs text-amber-200/50 font-heebo">₪{(savingsPerMonth * 12 * 25).toLocaleString()} לאורך חיי המשכנתא</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   FEATURE CARD
   ══════════════════════════════════════════════ */

function FeatureCard({ icon: Icon, title, desc, delay }: {
  icon: typeof Zap; title: string; desc: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="p-6 rounded-2xl border border-neutral-100 bg-white hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-100 transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <h3 className="text-sm font-bold text-neutral-900 mb-2 font-heebo">{title}</h3>
      <p className="text-xs text-neutral-500 leading-relaxed font-heebo">{desc}</p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   TESTIMONIAL
   ══════════════════════════════════════════════ */

function Testimonial({ name, text, saved, delay }: {
  name: string; text: string; saved: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="p-6 rounded-2xl border border-neutral-100 bg-white"
    >
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-sm text-neutral-600 leading-relaxed mb-4 font-heebo">"{text}"</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400 font-heebo">— {name}</span>
        <Badge className="bg-emerald-50 text-emerald-700 text-[9px] border-0 font-bold">חסך {saved}</Badge>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

const GetStarted = () => {
  const navigate = useNavigate();
  const [scoreRevealed, setScoreRevealed] = useState(false);
  const mockScore = 78;

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-neutral-100">
        <div className="container mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-white text-[9px] font-black">C</span>
            </div>
            <span className="text-sm font-black text-neutral-900 font-heebo">חיתומית</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-neutral-500 font-heebo"
              onClick={() => navigate("/auth")}
            >
              כניסה ליועצים
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1 font-heebo"
              onClick={() => document.getElementById("upload-zone")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Zap className="w-3 h-3" />
              התחל חינם
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="container mx-auto px-5 pt-16 pb-12 sm:pt-24 sm:pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="bg-blue-50 text-blue-700 text-[10px] font-bold border-0 mb-6">
              🔒 מאובטח • חינם • תוך 60 שניות
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black text-neutral-900 leading-tight mb-5 font-heebo"
          >
            אל תלך לבנק{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-600 to-blue-800">
              בלי הציון שלך
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-neutral-500 leading-relaxed mb-8 max-w-lg mx-auto font-heebo"
          >
            הכוח חוזר אליך. ניתוח AI עמוק של BDI, עו"ש ותלושי שכר תוך 60 שניות. חינם, מאובטח, ומשנה חיים.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-base gap-2 px-10 py-6 shadow-xl shadow-blue-500/20 rounded-xl font-heebo"
              onClick={() => document.getElementById("upload-zone")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Sparkles className="w-5 h-5" />
              גלה את הציון שלך — חינם
            </Button>
            <p className="text-[10px] text-neutral-400 mt-3 font-heebo">ללא כרטיס אשראי • ללא התחייבות</p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex justify-center mt-12"
        >
          <ChevronDown className="w-5 h-5 text-neutral-300" />
        </motion.div>
      </section>

      {/* ── Upload + Score ── */}
      <section id="upload-zone" className="bg-neutral-50/60 py-16 sm:py-20">
        <div className="container mx-auto px-5 max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-neutral-900 mb-2 font-heebo">גלה את הציון שלך</h2>
            <p className="text-sm text-neutral-500 font-heebo">העלה דוח BDI ודפי עו"ש — ה-AI יעשה את השאר</p>
          </div>

          <ScoreGauge score={mockScore} revealed={scoreRevealed} />

          <div className="mt-8">
            {!scoreRevealed ? (
              <UploadZone onComplete={() => setScoreRevealed(true)} />
            ) : (
              <ScoreResult score={mockScore} />
            )}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-neutral-900 mb-2 font-heebo">למה חיתומית?</h2>
            <p className="text-sm text-neutral-500 font-heebo">הכלים שהבנקים משתמשים בהם — עכשיו אצלך</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            <FeatureCard
              icon={Brain}
              title="ניתוח BDI מיידי"
              desc="ה-AI קורא ומפענח את דוח ה-BDI שלך טוב יותר מכל בנקאי. תבין בדיוק איפה אתה עומד."
              delay={0.1}
            />
            <FeatureCard
              icon={FileText}
              title="נרטיב AI לבנק"
              desc="אנחנו הופכים את המספרים שלך לסיפור שהבנק לא יכול לסרב לו. חיתום יצירתי במיטבו."
              delay={0.15}
            />
            <FeatureCard
              icon={Users}
              title="חיבור ל-2,000 יועצים"
              desc="היועצים המובילים בישראל רואים את הציון שלך ורוצים לסגור לך עסקה. התחרות עובדת לטובתך."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ── Power-Up ── */}
      <section className="py-4 sm:py-8">
        <div className="container mx-auto px-5 max-w-2xl">
          <PowerUpSection />
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-16 sm:py-20 bg-neutral-50/60">
        <div className="container mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-neutral-900 mb-2 font-heebo">אנשים כמוך חסכו אלפי שקלים</h2>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            {[
              { icon: Shield, text: "אבטחה Bank-Grade" },
              { icon: Lock, text: "הצפנת AES-256" },
              { icon: Target, text: "תקן ISO 27001" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-100">
                <b.icon className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] text-neutral-600 font-semibold font-heebo">{b.text}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            <Testimonial
              name="שירה כ."
              text="חסכתי ₪150,000 על המשכנתא שלי בזכות ציון חיתומית. הבנק הופתע מהמסמכים שהגשתי."
              saved="₪150,000"
              delay={0.1}
            />
            <Testimonial
              name="אורי ד."
              text="תוך 60 שניות הבנתי למה הבנק סירב לי ומה אני צריך לתקן. חודשיים אחרי — אישור."
              saved="₪85,000"
              delay={0.15}
            />
            <Testimonial
              name="מיכל ר."
              text="היועץ שהתחבר אלי דרך חיתומית הציל לי את העסקה. השירות הזה פשוט חובה."
              saved="₪210,000"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-5 text-center max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-black text-neutral-900 mb-3 font-heebo">מוכן לגלות את הציון שלך?</h2>
            <p className="text-sm text-neutral-500 mb-6 font-heebo">חינם. מאובטח. 60 שניות.</p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-base gap-2 px-10 py-6 shadow-xl shadow-blue-500/20 rounded-xl font-heebo"
              onClick={() => document.getElementById("upload-zone")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Sparkles className="w-5 h-5" />
              התחל ניתוח חינם
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-100 py-8">
        <div className="container mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-white text-[7px] font-black">C</span>
            </div>
            <span className="text-xs text-neutral-400 font-heebo">© 2024 חיתומית. כל הזכויות שמורות.</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => navigate("/dashboard")} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors font-heebo">פורטל יועצים</button>
            <button onClick={() => navigate("/privacy")} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors font-heebo">מדיניות פרטיות</button>
            <button onClick={() => navigate("/terms")} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors font-heebo">תנאי שימוש</button>
            <button onClick={() => navigate("/accessibility")} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors font-heebo">נגישות</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GetStarted;
