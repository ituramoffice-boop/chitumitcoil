import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Brain, User, Phone, Mail, Sparkles, ArrowLeft,
  Lock, CheckCircle2, Home, RefreshCw, Download,
} from "lucide-react";

interface ConversationalLeadCaptureProps {
  /** Called on final submit with form data + chosen category */
  onSubmit: (data: { full_name: string; phone: string; email: string; category: string }) => Promise<void>;
  /** Whether submission is in progress */
  submitting: boolean;
  /** Summary lines shown on step 2 */
  summaryLines: { label: string; value: string; highlight?: boolean }[];
  /** Color accent – 'blue' for mortgage, 'green' for property */
  accent?: "blue" | "green";
  /** Called when PDF download is requested (after success) */
  onDownloadPDF?: () => void;
}

const typewriterVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.03 },
  }),
};

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayedChars, setDisplayedChars] = useState(0);
  useEffect(() => {
    setDisplayedChars(0);
    const interval = setInterval(() => {
      setDisplayedChars(prev => {
        if (prev >= text.length) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className={className}>
      {text.slice(0, displayedChars)}
      {displayedChars < text.length && (
        <span className="inline-block w-0.5 h-5 bg-current animate-pulse ml-0.5 align-middle" />
      )}
    </span>
  );
}

const ConversationalLeadCapture = ({
  onSubmit,
  submitting,
  summaryLines,
  accent = "blue",
  onDownloadPDF,
}: ConversationalLeadCaptureProps) => {
  const [interviewStep, setInterviewStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [done, setDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(true);

  const accentHsl = accent === "blue" ? "217,91%,50%" : "160,84%,39%";

  // Fake "analyzing" delay at step 0
  useEffect(() => {
    if (interviewStep === 0) {
      setAnalyzing(true);
      const t = setTimeout(() => setAnalyzing(false), 2200);
      return () => clearTimeout(t);
    }
  }, [interviewStep]);

  const handleFinalSubmit = async () => {
    if (!name || !phone) return;
    await onSubmit({ full_name: name, phone, email, category });
    setDone(true);
  };

  const slideVariants = {
    enter: { opacity: 0, x: -40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 40 },
  };

  const categoryOptions = [
    { key: "first_buyer", label: "נכס ראשון 🏠", desc: "קונה דירה לראשונה" },
    { key: "refinance", label: "מחזור משכנתא 🔄", desc: "שיפור תנאים קיימים" },
    { key: "investor", label: "משקיע 📈", desc: "נכס להשקעה" },
  ];

  if (done) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="absolute -inset-1 rounded-3xl blur-xl" style={{ background: `linear-gradient(to bottom, hsl(${accentHsl}) / 0.2, transparent)` }} />
        <div className="relative bg-[hsl(222,47%,8%)] border border-white/10 rounded-3xl p-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
            style={{ background: `hsl(${accentHsl}) / 0.15` }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: `hsl(${accentHsl})` }} />
          </motion.div>
          <h3 className="text-2xl font-black mb-2">הדוח שלך מוכן, {name}! 🎉</h3>
          <p className="text-white/50 text-sm mb-6">יועץ בכיר ייצור איתך קשר תוך שעה</p>
          {onDownloadPDF && (
            <Button
              onClick={onDownloadPDF}
              className="bg-gradient-to-l from-[hsl(217,91%,50%)] to-[hsl(217,91%,40%)] text-white border-0 h-12 px-8 rounded-xl hover:scale-105 transition-transform"
            >
              <Download className="w-4 h-4 ml-2" />
              הורד דוח PDF
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute -inset-1 rounded-3xl blur-xl" style={{ background: `linear-gradient(to bottom, hsl(${accentHsl}) / 0.15, hsl(270,80%,60%) / 0.08)` }} />
      <div className="relative bg-[hsl(222,47%,8%)] border border-white/10 rounded-3xl p-8 overflow-hidden">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              interviewStep >= i
                ? `w-10 shadow-[0_0_8px_hsl(${accentHsl},0.5)]`
                : "w-6 bg-white/10",
            )} style={interviewStep >= i ? { background: `hsl(${accentHsl})` } : undefined} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Name */}
          {interviewStep === 0 && (
            <motion.div
              key="step0"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* AI avatar */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `hsl(${accentHsl}) / 0.15` }}>
                  <Brain className="w-5 h-5" style={{ color: `hsl(${accentHsl})` }} />
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/5">
                  {analyzing ? (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ background: `hsl(${accentHsl})` }}
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-white/50">המערכת מנתחת את הנתונים...</span>
                    </div>
                  ) : (
                    <TypewriterText
                      text="המערכת מנתחת את הנתונים... מה השם שלך כדי שנכין את הדוח?"
                      className="text-sm text-white/80 leading-relaxed"
                    />
                  )}
                </div>
              </div>

              {!analyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      id="lead-full-name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="ישראל ישראלי"
                      className="bg-white/5 border-white/10 text-white pr-10 h-12 rounded-xl placeholder:text-white/20"
                      style={{ borderColor: name ? `hsl(${accentHsl})` : undefined }}
                      autoFocus
                      onKeyDown={e => e.key === "Enter" && name && setInterviewStep(1)}
                    />
                  </div>
                  <Button
                    onClick={() => name && setInterviewStep(1)}
                    disabled={!name}
                    className="w-full h-12 rounded-xl text-white border-0 font-bold transition-all"
                    style={{ background: `linear-gradient(to left, hsl(${accentHsl}), hsl(${accentHsl}) / 0.85)` }}
                  >
                    המשך
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 1: Phone & Email */}
          {interviewStep === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `hsl(${accentHsl}) / 0.15` }}>
                  <Brain className="w-5 h-5" style={{ color: `hsl(${accentHsl})` }} />
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <TypewriterText
                    text={`מעולה ${name}! לאן לשלוח לך את ניתוח החיסכון המלא (PDF)?`}
                    className="text-sm text-white/80 leading-relaxed"
                  />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="space-y-3"
              >
                {/* Summary card */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                  {summaryLines.map((line, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-white/40">{line.label}</span>
                      <span className={cn("font-bold", line.highlight && `text-[hsl(${accentHsl})]`)}>
                        {line.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <Input
                    id="lead-phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="050-1234567"
                    className="bg-white/5 border-white/10 text-white pr-10 h-12 rounded-xl placeholder:text-white/20"
                    dir="ltr"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && phone && setInterviewStep(2)}
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <Input
                    id="lead-email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com (אופציונלי)"
                    type="email"
                    className="bg-white/5 border-white/10 text-white pr-10 h-12 rounded-xl placeholder:text-white/20"
                    dir="ltr"
                  />
                </div>
                <Button
                  onClick={() => phone && setInterviewStep(2)}
                  disabled={!phone}
                  className="w-full h-12 rounded-xl text-white border-0 font-bold transition-all"
                  style={{ background: `linear-gradient(to left, hsl(${accentHsl}), hsl(${accentHsl}) / 0.85)` }}
                >
                  שאלה אחרונה
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Step 2: Category */}
          {interviewStep === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `hsl(${accentHsl}) / 0.15` }}>
                  <Brain className="w-5 h-5" style={{ color: `hsl(${accentHsl})` }} />
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <TypewriterText
                    text="שאלה אחרונה ל-AI: האם מדובר בנכס ראשון או מחזור משכנתא?"
                    className="text-sm text-white/80 leading-relaxed"
                  />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-3 gap-2">
                  {categoryOptions.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setCategory(opt.key)}
                      className={cn(
                        "p-4 rounded-xl border text-center transition-all duration-300 hover:scale-105",
                        category === opt.key
                          ? "border-white/30 bg-white/10 shadow-[0_0_15px_hsl(217,91%,50%,0.2)]"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <p className="text-sm font-bold text-white mb-1">{opt.label}</p>
                      <p className="text-[10px] text-white/40">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleFinalSubmit}
                  disabled={!category || submitting}
                  className="w-full h-14 rounded-2xl text-white text-lg border-0 font-bold shadow-lg transition-all hover:scale-[1.02]"
                  style={{ background: `linear-gradient(to left, hsl(${accentHsl}), hsl(160,84%,39%))` }}
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 ml-2" />
                      קבל דוח אישי חינם
                    </>
                  )}
                </Button>
                <p className="text-center text-[10px] text-white/25 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" />
                  הפרטים שלך מוגנים ולא יועברו לצד שלישי
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConversationalLeadCapture;
