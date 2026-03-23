import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowRight, Loader2, Upload, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import SmartIngestion from "@/components/SmartIngestion";
import { ThemeToggle } from "@/components/ThemeToggle";

const SelfCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"info" | "upload" | "result">(user ? "upload" : "info");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast.success("נרשמת בהצלחה! כעת תוכל להעלות מסמכים.");
      setStep("upload");
    } catch (err: any) {
      toast.error(err.message || "שגיאה בהרשמה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SmartMortgage AI</h1>
              <p className="text-xs text-muted-foreground">בדיקת היתכנות עצמאית</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <ArrowRight className="w-4 h-4 ml-1" />
              חזרה
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl space-y-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {[
            { key: "info", label: "פרטים אישיים", icon: "1" },
            { key: "upload", label: "העלאת מסמכים", icon: "2" },
            { key: "result", label: "תוצאות", icon: "3" },
          ].map((s, i) => {
            const isActive = s.key === step;
            const isDone = (step === "upload" && i === 0) || (step === "result" && i <= 1);
            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-0.5 ${isDone ? "bg-primary" : "bg-border"}`} />}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" :
                  isDone ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <span>{s.icon}</span>}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step: Info */}
        {step === "info" && !user && (
          <div className="glass-card p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">בדיקת היתכנות חינם</h2>
              <p className="text-muted-foreground">הזן פרטים, העלה מסמכים ומנוע ה-AI יבדוק עבורך</p>
            </div>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label>שם מלא</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ישראל ישראלי" required />
              </div>
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" required />
              </div>
              <div className="space-y-2">
                <Label>טלפון</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>סיסמה</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" dir="ltr" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 ml-2" />}
                המשך להעלאת מסמכים
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground">
              כבר רשום?{" "}
              <button onClick={() => navigate("/auth")} className="text-primary hover:underline">התחבר</button>
            </p>
          </div>
        )}

        {/* Step: Upload */}
        {(step === "upload" || (step === "info" && user)) && (
          <div className="space-y-6 animate-fade-in">
            <SmartIngestion />
            <div className="text-center">
              <Button size="lg" onClick={() => setStep("result")} className="shadow-lg shadow-primary/25">
                <Sparkles className="w-4 h-4 ml-2" />
                בדוק היתכנות
              </Button>
            </div>
          </div>
        )}

        {/* Step: Result */}
        {step === "result" && <SelfCheckResults />}
      </main>
    </div>
  );
};

export default SelfCheck;
