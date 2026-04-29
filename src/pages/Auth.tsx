import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ChitumitLogo } from "@/components/ChitumitLogo";

type Mode = "login" | "signup";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, role, profession: userProfession, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || !user) return;
    // Default redirect when role hasn't loaded yet (RLS race) — assume consultant flow
    const effectiveRole = role ?? "consultant";
    if (effectiveRole === "consultant" || effectiveRole === "admin") {
      if (userProfession === "insurance_agent") {
        navigate("/insurance-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } else {
      navigate("/client-dashboard", { replace: true });
    }
  }, [authLoading, user, role, userProfession, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, profession: "client" },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("נרשמת בהצלחה! בדוק את המייל לאימות.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      toast.error(error.message || "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <ChitumitLogo size={48} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">חיתומית</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "התחבר לחשבון שלך" : "צור חשבון חדש"}
          </p>
        </div>

        {/* Info banner */}
        <div className="rounded-xl p-3 text-xs text-center border bg-gold/5 border-gold/20 text-gold">
          מעקב אחר סטטוס התיק, העלאת מסמכים וצפייה בהתקדמות
        </div>

        {/* Form */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">שם מלא</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ישראל ישראלי" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" dir="ltr" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "התחבר" : "הירשם"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {mode === "login" && (
              <button
                onClick={async () => {
                  if (!email) { toast.error("הזן אימייל קודם"); return; }
                  setLoading(true);
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) throw error;
                    toast.success("קישור לאיפוס סיסמה נשלח למייל שלך");
                  } catch (error: any) {
                    toast.error(error.message || "שגיאה בשליחת קישור");
                  } finally { setLoading(false); }
                }}
                className="text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                שכחת סיסמה?
              </button>
            )}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-sm text-primary hover:underline">
              {mode === "login" ? "אין לך חשבון? הירשם" : "כבר יש לך חשבון? התחבר"}
            </button>
            <br />
            <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              חזרה לדף הבית
            </button>
          </div>
        </div>

        {/* PRO link */}
        <div className="text-center">
          <button
            onClick={() => navigate("/pro")}
            className="text-xs text-muted-foreground hover:text-gold transition-colors"
          >
            יועץ משכנתאות או סוכן ביטוח? <span className="text-gold font-semibold underline">כניסת PRO</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
