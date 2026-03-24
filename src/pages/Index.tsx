import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, TrendingUp, ArrowLeft, Sparkles, Users, User } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChitumitLogo } from "@/components/ChitumitLogo";

const Index = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  // If already logged in, show appropriate CTA
  const handleDashboard = () => {
    navigate("/dashboard");
  };

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
            {user ? (
              <Button
                onClick={handleDashboard}
                className="bg-gold text-gold-foreground hover:bg-gold/90"
              >
                לדשבורד
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/auth?role=client")}
                  className="border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
                >
                  <User className="w-4 h-4 ml-1" />
                  כניסת לקוחות
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/auth?role=consultant")}
                  className="bg-gold text-gold-foreground hover:bg-gold/90"
                >
                  <Users className="w-4 h-4 ml-1" />
                  כניסה ליועצים
                </Button>
              </div>
            )}
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

          {/* Two entry points */}
          {!user && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
              <button
                onClick={() => navigate("/auth?role=consultant")}
                className="group p-6 rounded-2xl border-2 border-gold/20 bg-gold/5 hover:border-gold/40 hover:bg-gold/10 transition-all duration-300 text-center space-y-3"
              >
                <div className="p-3 rounded-xl bg-gold/10 w-fit mx-auto group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-lg font-bold text-foreground">יועצי משכנתאות</h3>
                <p className="text-xs text-muted-foreground">ניהול לידים, ניתוח תיקים, CRM מתקדם</p>
                <span className="inline-flex items-center gap-1 text-sm text-gold font-medium">
                  כניסה / הרשמה
                  <ArrowLeft className="w-3.5 h-3.5" />
                </span>
              </button>

              <button
                onClick={() => navigate("/auth?role=client")}
                className="group p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 text-center space-y-3"
              >
                <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">לקוחות</h3>
                <p className="text-xs text-muted-foreground">מעקב תיק, העלאת מסמכים, סטטוס בזמן אמת</p>
                <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                  כניסה / הרשמה
                  <ArrowLeft className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          )}

          {user && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={handleDashboard}
                className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold"
              >
                המשך לדשבורד
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          )}

          <div className="pt-2">
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
