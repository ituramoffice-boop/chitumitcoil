import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Brain, ShieldCheck, FileText, TrendingUp, ArrowLeft } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">SmartMortgage AI</h1>
          </div>
          <Button onClick={() => navigate(user ? "/dashboard" : "/auth")}>
            {user ? "לדשבורד" : "התחברות"}
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Brain className="w-4 h-4" />
            חיתום דיגיטלי חכם
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            ניתוח תיקי משכנתא
            <br />
            <span className="text-primary">מהיר, מדויק ואוטומטי</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            מערכת AI מתקדמת לזיהוי סיכונים, אימות נתונים והצלבת מסמכים — כל מה שיועץ משכנתאות צריך במקום אחד.
          </p>
          <Button size="lg" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
            התחל עכשיו
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
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
    <div className="glass-card p-8 text-center space-y-4 hover:shadow-md transition-shadow">
      <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default Index;
