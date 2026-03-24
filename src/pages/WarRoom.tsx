import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Swords,
  Share2,
  FileCheck,
  Copy,
  Check,
  X,
  CheckCircle,
  Clock,
  Mail,
  Brain,
  Zap,
  Shield,
  Smile,
  Frown,
  ArrowLeft,
  Eye,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChitumitLogo } from "@/components/ChitumitLogo";

/* ── Comparison Engine ───────────────────────── */
const ComparisonEngine = () => {
  const oldWay = [
    { icon: Mail, label: "מיילים אינסופיים", desc: "מחכים לתשובה שלא מגיעה" },
    { icon: Clock, label: "אולי... נקווה", desc: "שבועות של חוסר ודאות" },
    { icon: Frown, label: "חרדה ולחץ", desc: "הלקוח מתקשר כל יום" },
    { icon: X, label: "סירוב מפתיע", desc: "אחרי חודשיים של עבודה" },
  ];
  const newWay = [
    { icon: Brain, label: "AI חיתומי", desc: "ניתוח אוטומטי תוך 60 שניות" },
    { icon: Shield, label: "ודאות מלאה", desc: "ציון 0-100 לפני הגשה" },
    { icon: Zap, label: "מיידי ומדויק", desc: "נרטיב בנקאי מותאם אישית" },
    { icon: Smile, label: "אישור שמח", desc: "הבנקאי רק לוחץ 'אשר'" },
  ];

  return (
    <section className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2
          className="text-3xl md:text-4xl font-black leading-tight mb-3"
          style={{ fontFamily: "Heebo, sans-serif" }}
        >
          הם מוכרים לך <span className="text-destructive">תקווה</span>.
          <br />
          אנחנו מפיקים לך{" "}
          <span className="text-gold">אישור</span>.
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          ההבדל בין יועץ רגיל ליועץ חיתומית הוא ההבדל בין ניחוש לוודאות.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Old Way */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <X className="h-5 w-5 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-destructive">הדרך הישנה</h3>
          </div>
          {oldWay.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-background/50"
            >
              <item.icon className="h-5 w-5 text-destructive/60 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-sm">{item.label}</span>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Chitumit Way */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gold/20 bg-gold/5 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gold/10">
              <CheckCircle className="h-5 w-5 text-gold" />
            </div>
            <h3 className="text-lg font-bold text-gold">הדרך של חיתומית</h3>
          </div>
          {newWay.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-gold/10"
            >
              <item.icon className="h-5 w-5 text-gold mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-sm">{item.label}</span>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* ── Viral Share Cards ───────────────────────── */
const ViralShareCards = () => {
  const [advisorName, setAdvisorName] = useState("דני כהן");
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleShare = () => {
    const text = `עוד 'אולי' שהפך ל'ברור'.\n\n🏆 ${advisorName}\nחיתומית — תהיה מאושר.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "הועתק! מוכן לשיתוף" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `chitumit-share-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "הכרטיס הורד בהצלחה!" });
    } catch {
      toast({ title: "שגיאה בהורדה", variant: "destructive" });
    }
  };

  return (
    <Card className="border-gold/20 bg-card/80 overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Share2 className="h-5 w-5 text-gold" />
          שתף את ההצלחה שלך
        </h3>
        <Input
          value={advisorName}
          onChange={(e) => setAdvisorName(e.target.value)}
          placeholder="שם היועץ"
          className="bg-secondary/50 border-gold/10"
          dir="rtl"
        />

        {/* Share Card Preview */}
        <div ref={cardRef} className="relative rounded-xl overflow-hidden bg-[hsl(222,47%,5%)] p-8 border border-gold/30 shadow-[0_0_40px_rgba(212,175,55,0.1)]">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 70%, hsl(43 74% 52% / 0.4), transparent 60%)`,
            }}
          />
          <div className="relative text-center space-y-4">
            <p className="text-xl font-black text-foreground leading-relaxed" dir="rtl">
              עוד <span className="text-destructive/80">'אולי'</span> שהפך ל
              <span className="text-gold">'ברור'</span>.
            </p>
            <div className="w-16 h-px bg-gold/30 mx-auto" />
            <p className="text-gold font-bold text-sm">{advisorName}</p>
            <p className="text-[10px] text-gold/50 tracking-widest font-semibold">
              חיתומית — תהיה מאושר.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleShare} className="flex-1 bg-gold hover:bg-gold/90 text-gold-foreground">
            {copied ? <Check className="h-4 w-4 ml-2" /> : <Copy className="h-4 w-4 ml-2" />}
            {copied ? "הועתק!" : "שתף בוואטסאפ / אינסטגרם"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ── Banker's View Simulator ─────────────────── */
const BankersViewSimulator = () => {
  const [revealed, setRevealed] = useState(false);

  return (
    <Card className="border-gold/20 bg-card/80 overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Eye className="h-5 w-5 text-gold" />
          סימולטור: מה הבנקאי רואה
        </h3>
        <p className="text-sm text-muted-foreground">
          תצוגה מקדימה של המסמך שהבנקאי מקבל — כל כך מקצועי שכל מה שנשאר זה ללחוץ 'אשר'.
        </p>

        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div
              key="cover"
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-center py-8"
            >
              <Button
                onClick={() => setRevealed(true)}
                size="lg"
                className="bg-gradient-to-r from-gold via-[hsl(43,74%,42%)] to-gold text-gold-foreground font-bold shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                <Eye className="h-5 w-5 ml-2" />
                חשוף את מה שהבנקאי רואה
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="document"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-gold/20 bg-white text-[hsl(222,47%,7%)] p-6 space-y-4"
              dir="rtl"
            >
              {/* Document Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <p className="text-[10px] text-gray-400 tracking-widest font-bold">
                    CHITUMIT AI UNDERWRITING REPORT
                  </p>
                  <p className="text-lg font-black mt-1">דו״ח חיתום מקצועי</p>
                </div>
                <div className="text-left">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                    ציון 87 — Golden Opportunity
                  </Badge>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "הכנסה חודשית", value: "₪32,000" },
                  { label: "יחס החזר", value: "28%" },
                  { label: "נפח בקשה", value: "₪1,800,000" },
                ].map((m) => (
                  <div key={m.label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">{m.label}</p>
                    <p className="text-sm font-black">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Narrative Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border-r-4 border-emerald-400">
                <p className="text-xs font-bold text-gray-600 mb-2">נרטיב AI:</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  "הלווה מציג פרופיל יציב עם הכנסה עקבית של ₪32,000 לאורך 36 חודשים.
                  יחס ההחזר של 28% נמוך משמעותית מהסף. אין הערות BDI שליליות.
                  המלצה: אישור מלא."
                </p>
              </div>

              {/* Verified Seal */}
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
                <Shield className="h-4 w-4 text-gold" />
                <span className="text-[10px] text-gray-400 font-bold tracking-wider">
                  VERIFIED BY CHITUMIT AI • {new Date().toLocaleDateString("he-IL")}
                </span>
              </div>

              {/* Approve Button */}
              <div className="pt-2">
                <Button className="w-full h-12 bg-gradient-to-r from-gold via-[hsl(43,74%,45%)] to-gold text-gold-foreground font-bold text-base shadow-[0_4px_20px_rgba(212,175,55,0.4)]">
                  <CheckCircle className="h-5 w-5 ml-2" />
                  אשר תיק — Approved
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

/* ── Launch Animation (Israel pulse) ─────────── */
const LaunchAnimation = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-[hsl(222,47%,3%)] flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2.5, duration: 0.5 }}
      onAnimationComplete={onComplete}
    >
      {/* Golden pulse ring */}
      <motion.div
        className="absolute rounded-full border-2 border-gold/40"
        style={{ width: 200, height: 300 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 0.8, 0.4] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 180,
          height: 280,
          background: "radial-gradient(ellipse, hsl(43 74% 52% / 0.3), transparent 70%)",
        }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.5] }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Text sequence */}
      <div className="relative text-center z-10">
        <motion.p
          className="text-gold font-black text-3xl md:text-4xl"
          style={{ fontFamily: "Heebo, sans-serif" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -10] }}
          transition={{ duration: 2.2, times: [0, 0.3, 0.7, 1] }}
        >
          חיתומית. המלך הגיע.
        </motion.p>
        <motion.p
          className="text-gold/60 text-lg mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1] }}
          transition={{ duration: 2.5, times: [0, 0.6, 1] }}
        >
          תהיה מאושר.
        </motion.p>
      </div>
    </motion.div>
  );
};

/* ── Main War Room Page ──────────────────────── */
const WarRoom = () => {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Launch Animation */}
      <AnimatePresence>
        {showIntro && <LaunchAnimation onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="relative overflow-hidden border-b border-gold/10">
        <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5" />
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: showIntro ? 3 : 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-gold/10 border border-gold/20">
              <Swords className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h1
                className="text-2xl font-black"
                style={{ fontFamily: "Heebo, sans-serif" }}
              >
                חדר המלחמה
              </h1>
              <p className="text-sm text-muted-foreground">
                Market Authority Terminal
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <ComparisonEngine />

        <div className="grid lg:grid-cols-2 gap-6">
          <ViralShareCards />
          <BankersViewSimulator />
        </div>
      </div>
    </div>
  );
};

export default WarRoom;
