import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, TrendingUp, ArrowLeft, Sparkles, Users, User, ChevronDown } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { useState, useRef, useEffect } from "react";

const Index = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-[hsl(222,47%,6%)]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChitumitLogo size={38} />
            <div>
              <h1 className="text-xl font-bold text-gold">חיתומית</h1>
              <p className="text-[10px] text-slate-400">הבינה שמאחורי האישור</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Single "האזור שלי" button with dropdown */}
            <div className="relative" ref={menuRef}>
              <Button
                onClick={() => {
                  if (user) {
                    navigate("/dashboard");
                  } else {
                    setMenuOpen(!menuOpen);
                  }
                }}
                className="bg-gold text-gold-foreground hover:bg-gold/90 gap-1.5"
              >
                האזור שלי
                {!user && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />}
                {user && <ArrowLeft className="w-3.5 h-3.5" />}
              </Button>

              {menuOpen && !user && (
                <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-gold/20 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-fade-in">
                  <button
                    onClick={() => { navigate("/auth?role=consultant"); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gold/10 transition-colors text-right"
                  >
                    <div className="p-2 rounded-lg bg-gold/10">
                      <Users className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">פורטל יועצים</p>
                      <p className="text-[10px] text-muted-foreground">CRM, ניתוח תיקים, לידים</p>
                    </div>
                  </button>
                  <div className="border-t border-border/50" />
                  <button
                    onClick={() => { navigate("/auth?role=client"); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-primary/10 transition-colors text-right"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">אזור אישי</p>
                      <p className="text-[10px] text-muted-foreground">מעקב תיק, מסמכים, סטטוס</p>
                    </div>
                  </button>
                  <div className="border-t border-border/50" />
                  <button
                    onClick={() => { navigate("/self-check"); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent/10 transition-colors text-right"
                  >
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Sparkles className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">בדיקה עצמאית</p>
                      <p className="text-[10px] text-muted-foreground">בדיקת היתכנות חינם ללא הרשמה</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            חיתום דיגיטלי חכם
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            ניתוח תיקי משכנתא
            <br />
            <span className="text-gold">מהיר, מדויק ואוטומטי</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            מערכת AI מתקדמת לזיהוי סיכונים, אימות נתונים והצלבת מסמכים — כל מה שיועץ משכנתאות צריך במקום אחד.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => {
                if (user) navigate("/dashboard");
                else setMenuOpen(true);
              }}
              className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold"
            >
              האזור שלי
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/self-check")} className="group hover:border-gold/50 hover:shadow-lg hover:shadow-gold/10 transition-all">
              <Sparkles className="w-4 h-4 ml-2 text-gold group-hover:animate-pulse" />
              בדיקת היתכנות עצמאית
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={FileText}
            title="סיווג אוטומטי"
            description="העלה מסמכים והמערכת תזהה ותמיין אותם אוטומטית — תלושי שכר, עו״ש, דוח אשראי ועוד."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="זיהוי סיכונים"
            description="סריקת אכ״מ, הצלבת נתונים בין מסמכים, זיהוי הלוואות נסתרות ובדיקות אמינות."
          />
          <FeatureCard
            icon={TrendingUp}
            title="ניהול לידים"
            description="ניהול מלא של לקוחות פוטנציאליים, מעקב סטטוסים, ודשבורד ניתוח עסקי."
          />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="glass-card p-8 text-center space-y-4 hover:shadow-md hover:border-gold/20 transition-all">
      <div className="p-3 rounded-xl bg-gold/10 w-fit mx-auto">
        <Icon className="w-7 h-7 text-gold" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default Index;
