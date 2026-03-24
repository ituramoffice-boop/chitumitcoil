import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ChitumitLogo } from "@/components/ChitumitLogo";

type Mode = "login" | "signup";
type RoleType = "consultant" | "client";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") as RoleType) || "client";

  const [mode, setMode] = useState<Mode>("login");
  const [roleType, setRoleType] = useState<RoleType>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in users to appropriate dashboard
  useEffect(() => {
    if (!authLoading && user && role) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // If consultant signup, update role after signup
        if (roleType === "consultant" && data.user) {
          // The trigger creates a default 'client' role, update it to 'consultant'
          await supabase
            .from("user_roles")
            .update({ role: "consultant" as any })
            .eq("user_id", data.user.id);
        }

        toast.success("נרשמת בהצלחה! בדוק את המייל לאימות.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast.error(error.message || "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  const isConsultant = roleType === "consultant";

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

        {/* Role Toggle */}
        <div className="flex gap-2 p-1.5 rounded-xl bg-secondary relative z-10">
          <button
            type="button"
            onClick={() => setRoleType("consultant")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer relative z-10 ${
              isConsultant
                ? "bg-gold text-gold-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            <Users className="w-4 h-4" />
            יועץ משכנתאות
          </button>
          <button
            type="button"
            onClick={() => setRoleType("client")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer relative z-10 ${
              !isConsultant
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            <User className="w-4 h-4" />
            לקוח
          </button>
        </div>

        {/* Info banner */}
        <div className={`rounded-xl p-3 text-xs text-center border ${
          isConsultant 
            ? "bg-gold/5 border-gold/20 text-gold" 
            : "bg-primary/5 border-primary/20 text-primary"
        }`}>
          {isConsultant
            ? "גישה מלאה ל-CRM, ניתוח תיקים, חייגן, ניהול לידים ודוחות"
            : "מעקב אחר סטטוס התיק, העלאת מסמכים וצפייה בהתקדמות"
          }
        </div>

        {/* Form */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">שם מלא</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ישראל ישראלי"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className={`w-full ${
                isConsultant
                  ? "bg-gold text-gold-foreground hover:bg-gold/90"
                  : ""
              }`}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "התחבר" : "הירשם"}
              {isConsultant ? " כיועץ" : " כלקוח"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {mode === "login" && (
              <button
                onClick={async () => {
                  if (!email) {
                    toast.error("הזן אימייל קודם");
                    return;
                  }
                  setLoading(true);
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) throw error;
                    toast.success("קישור לאיפוס סיסמה נשלח למייל שלך");
                  } catch (error: any) {
                    toast.error(error.message || "שגיאה בשליחת קישור");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                שכחת סיסמה?
              </button>
            )}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm text-primary hover:underline"
            >
              {mode === "login" ? "אין לך חשבון? הירשם" : "כבר יש לך חשבון? התחבר"}
            </button>
            <br />
            <button
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowRight className="w-3 h-3" />
              חזרה לדף הבית
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
