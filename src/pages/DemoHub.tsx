import { useNavigate } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Users, User, ShieldCheck, Home, FileText, Calculator, 
  Briefcase, BarChart3, Phone, Settings, MessageCircle, 
  TrendingUp, Store, ArrowLeft, Sparkles, Shield
} from "lucide-react";

const ROLE_SECTIONS = [
  {
    role: "client" as const,
    title: "👤 לקוח",
    description: "צפייה בדשבורד הלקוח — מעקב תיק, מסמכים, ציון אשראי",
    icon: User,
    color: "from-cyan-500 to-blue-600",
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
      <div className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChitumitLogo className="h-8" />
            <div>
              <h1 className="text-lg font-bold">מרכז הדמו</h1>
              <p className="text-xs text-muted-foreground">בחרו תפקיד ונווטו לכל עמוד</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 ml-1" />
            חזרה לאתר
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
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
                className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-right group"
              >
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
            <div className={`p-5 rounded-2xl bg-gradient-to-l ${section.color} mb-4`}>
              <div className="flex items-center gap-3 text-white">
                <section.icon className="w-7 h-7" />
                <div>
                  <h2 className="text-xl font-bold">{section.title}</h2>
                  <p className="text-sm opacity-90">{section.description}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {section.pages.map((page) => (
                <button
                  key={page.path}
                  onClick={() => goTo(section.role, page.path)}
                  className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 text-right group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <page.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold mb-0.5">{page.label}</p>
                      <p className="text-xs text-muted-foreground">{page.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.section>
        ))}

        {/* Demo Banner */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-center"
        >
          <p className="text-sm text-warning font-medium">
            ⚠️ מצב דמו — כל הנתונים מדומים ואינם נשמרים. לחוויה מלאה, הירשמו למערכת.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
