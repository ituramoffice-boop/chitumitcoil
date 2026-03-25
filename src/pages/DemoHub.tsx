import { useNavigate } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, User, ShieldCheck, Home, FileText, Calculator,
  Briefcase, BarChart3, Phone, Settings, MessageCircle,
  TrendingUp, Store, ArrowLeft, Sparkles, Shield, Crown, Zap, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ROLE_SECTIONS = [
  {
    role: "client" as const,
    title: "👤 לקוח",
    description: "צפייה בדשבורד הלקוח — מעקב תיק, מסמכים, ציון אשראי",
    icon: User,
    color: "from-cyan-500 to-blue-600",
    ticker: null,
    pages: [
      { path: "/client-dashboard", label: "דשבורד לקוח", icon: Home, description: "מעקב תיק משכנתא, העלאת מסמכים, ציון אשראי, צ'אט עם יועץ" },
    ],
  },
  {
    role: "consultant" as const,
    title: "💼 יועץ משכנתאות",
    description: "דשבורד CRM מלא — ניהול לידים, שיחות, מסמכים",
    icon: Briefcase,
    color: "from-amber-500 to-orange-600",
    ticker: "שכר טרחה פוטנציאלי בצבר: ₪1,240,000",
    pages: [
      { path: "/dashboard", label: "דשבורד יועץ (CRM)", icon: Home, description: "סקירת לידים, KPI, גרף מכירות" },
      { path: "/dashboard/clients", label: "ניהול לידים", icon: Users, description: "רשימת לידים, סטטוסים, פעולות" },
      { path: "/dashboard/upload", label: "מסמכים חכמים", icon: FileText, description: "העלאה וסיווג מסמכים עם AI" },
      { path: "/dashboard/dialer", label: "חייגן מכירות", icon: Phone, description: "חייגן אוטומטי עם AI" },
      { path: "/dashboard/signatures", label: "חתימות דיגיטליות", icon: ShieldCheck, description: "ניהול חתימות מרחוק" },
      { path: "/dashboard/sales-results", label: "לוח תוצאות", icon: BarChart3, description: "תוצאות מכירות ולידרבורד" },
      { path: "/dashboard/market-trends", label: "מגמות שוק", icon: TrendingUp, description: "ניתוח שוק הנדל\"ן" },
      { path: "/dashboard/marketplace", label: "שוק לידים", icon: Store, description: "רכישת לידים איכותיים" },
      { path: "/dashboard/consultant-settings", label: "הגדרות יועץ", icon: Settings, description: "לוגו, WhatsApp, ברנדינג" },
    ],
  },
  {
    role: "admin" as const,
    title: "🛡️ מנהל מערכת",
    description: "גישה מלאה — CRM + ניהול צוות + דוחות סוכנות",
    icon: ShieldCheck,
    color: "from-purple-500 to-pink-600",
    ticker: "תיקים מאושרים החודש: 342 | חיתומית AI",
    pages: [
      { path: "/dashboard", label: "דשבורד CRM", icon: Home, description: "סקירת מערכת מלאה" },
      { path: "/dashboard/team", label: "ניהול צוות", icon: Users, description: "חברי צוות, הרשאות, צ'אט" },
      { path: "/dashboard/agency-reports", label: "דוחות סוכנות", icon: BarChart3, description: "ביצועי צוות ודוחות" },
      { path: "/dashboard/client-management", label: "ניהול לקוחות", icon: User, description: "כל הלקוחות במערכת" },
    ],
  },
];

const PUBLIC_PAGES = [
  { path: "/", label: "דף נחיתה ראשי", icon: Home },
  { path: "/self-check", label: "בדיקה עצמית", icon: Calculator },
  { path: "/calculator", label: "מחשבון משכנתא", icon: Calculator },
  { path: "/property-value", label: "מחשבון שווי נכס", icon: TrendingUp },
  { path: "/property-loan", label: "הלוואה כנגד נכס", icon: Briefcase },
  { path: "/mortgage-insurance", label: "ביטוח משכנתא חכם", icon: Shield },
  { path: "/directory", label: "מדריך יועצים", icon: Users },
  { path: "/pitch", label: "מצגת Pitch", icon: Sparkles },
  { path: "/investors", label: "עמוד משקיעים", icon: Briefcase },
];

/* ── Hover badges per card ── */
const CARD_BADGES: Record<string, string> = {
  "מסמכים חכמים": "חיתומית דיגיטלית — בדיקה מול מדיניות 2026 של בנק ישראל ✓",
  "שוק לידים": "זוהו 5 לידים חמים עם הון עצמי גבוה 🔥",
  "חייגן מכירות": "AI מנתח שיחות בזמן אמת — סגירה ב-47% יותר",
  "דוחות סוכנות": "דוח מנכ\"ל שבועי מוכן להורדה",
  "ניהול צוות": "3 יועצים פעילים כרגע במערכת",
};

/* ── Animated counter ── */
function AnimCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    const dur = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setDisplay(Math.round(p * p * value));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, value]);
  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function DemoHub() {
  const navigate = useNavigate();
  const { enableDemo } = useDemo();

  const goTo = (role: "client" | "consultant" | "admin", path: string) => {
    enableDemo(role);
    navigate(path);
  };

  const goPublic = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-xl border-b border-gold/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ filter: ["drop-shadow(0 0 8px hsl(43 74% 52% / 0.3))", "drop-shadow(0 0 20px hsl(43 74% 52% / 0.6))", "drop-shadow(0 0 8px hsl(43 74% 52% / 0.3))"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <ChitumitLogo className="h-8" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-gold">חיתומית</h1>
              <p className="text-[10px] text-muted-foreground">תהיה מאושר.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 ml-1" />
            חזרה לאתר
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Imperial hero badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold">
            <Crown className="w-4 h-4" />
            Imperial Authority Mode — שליטה מלאה במערכת
          </div>
        </motion.div>

        {/* Public Pages */}
        <motion.section {...fadeUp} transition={{ delay: 0 }}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            עמודים ציבוריים (ללא התחברות)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {PUBLIC_PAGES.map((page) => (
              <button
                key={page.path}
                onClick={() => goPublic(page.path)}
                className="p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/30 hover:border-gold/30 hover:bg-gold/5 hover:shadow-[0_0_20px_hsl(43,74%,52%,0.1)] transition-all duration-300 text-right group relative"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Shield className="absolute top-2 left-2 w-3 h-3 text-gold/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px]">מוגן משפטית על ידי Chitumit Guard</TooltipContent>
                </Tooltip>
                <page.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                <p className="text-sm font-medium">{page.label}</p>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Role-based Sections */}
        {ROLE_SECTIONS.map((section, si) => (
          <motion.section
            key={section.role}
            {...fadeUp}
            transition={{ delay: 0.1 * (si + 1) }}
          >
            <div className={`p-5 rounded-2xl bg-gradient-to-l ${section.color} mb-4 relative overflow-hidden`}>
              {/* Subtle shimmer overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-l from-white/10 via-transparent to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
              />
              <div className="flex items-center gap-3 text-white">
                <section.icon className="w-7 h-7 relative z-10" />
                <div className="relative z-10 flex-1">
                  <h2 className="text-xl font-bold">{section.title}</h2>
                  <p className="text-sm opacity-90">{section.description}</p>
                </div>
              </div>
              {/* Live ticker */}
              {section.ticker && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + si * 0.2 }}
                  className="mt-3 flex items-center gap-2 text-white/90 relative z-10"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm">
                    {section.ticker}
                  </span>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {section.pages.map((page) => (
                <HoverCard
                  key={page.path}
                  page={page}
                  badge={CARD_BADGES[page.label]}
                  onClick={() => goTo(section.role, page.path)}
                />
              ))}
            </div>
          </motion.section>
        ))}

        {/* Imperial footer badge */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.5 }}
          className="p-5 rounded-2xl bg-card/60 backdrop-blur-sm border border-gold/20 text-center relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-l from-gold/5 via-transparent to-gold/5"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="relative z-10 flex items-center justify-center gap-3">
            <Shield className="w-5 h-5 text-gold" />
            <p className="text-sm font-bold text-foreground">
              חיתומית. <span className="text-gold">תהיה מאושר.</span>
            </p>
            <span className="text-[10px] px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/20 font-semibold">
              מערכת מבצעית — שליטה מלאה
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── HoverCard with glassmorphism + badge + shield ── */
function HoverCard({ page, badge, onClick }: { page: { path: string; label: string; icon: any; description: string }; badge?: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const isImportant = !!badge;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "p-4 rounded-xl bg-card/60 backdrop-blur-sm border transition-all duration-300 text-right group relative overflow-hidden",
        isImportant
          ? "border-gold/20 hover:border-gold/40 hover:shadow-[0_0_25px_hsl(43,74%,52%,0.15)]"
          : "border-border/30 hover:border-border/60 hover:shadow-lg hover:shadow-primary/5"
      )}
    >
      {/* Shield tooltip */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Shield className="absolute top-2.5 left-2.5 w-3.5 h-3.5 text-gold/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[10px]">מוגן משפטית על ידי Chitumit Guard</TooltipContent>
      </Tooltip>

      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg transition-colors shrink-0",
          isImportant ? "bg-gold/10 group-hover:bg-gold/20" : "bg-primary/10 group-hover:bg-primary/20"
        )}>
          <page.icon className={cn("w-4 h-4", isImportant ? "text-gold" : "text-primary")} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold mb-0.5">{page.label}</p>
          <p className="text-xs text-muted-foreground">{page.description}</p>
        </div>
      </div>

      {/* Dynamic hover badge */}
      <AnimatePresence>
        {hovered && badge && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="mt-3 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-[10px] text-gold font-semibold"
          >
            {badge}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
