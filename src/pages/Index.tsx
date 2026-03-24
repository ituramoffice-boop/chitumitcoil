import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, TrendingUp, ArrowLeft, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChitumitLogo } from "@/components/ChitumitLogo";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
            <Button
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              {user ? "לדשבורד" : "התחברות"}
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
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
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
              className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold"
            >
              התחל עכשיו
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
