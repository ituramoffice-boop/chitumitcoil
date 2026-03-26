import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Home, Shield, ArrowRight, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "login" | "signup";
type ProfessionType = "mortgage_advisor" | "insurance_agent";
type Step = "select" | "form";

const ProAuth = () => {
  const [step, setStep] = useState<Step>("select");
  const [profession, setProfession] = useState<ProfessionType>("mortgage_advisor");
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, role, profession: userProfession, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user && role) {
      if (userProfession === "insurance_agent") {
        navigate("/insurance-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
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
            data: { full_name: fullName, profession },
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background effects */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, hsl(var(--gold)), transparent 60%)", top: "-15%", right: "-10%" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center"
          >
            <ChitumitLogo size={48} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gold">Chitumit</h1>
              <span className="text-xs font-bold text-gold-foreground bg-gold px-2 py-0.5 rounded-md">PRO</span>
            </div>
            <p className="text-sm text-muted-foreground">פלטפורמה מקצועית ליועצים וסוכנים</p>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {step === "select" ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <p className="text-center text-sm text-muted-foreground">בחר את התחום המקצועי שלך</p>
              <div className="grid grid-cols-1 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setProfession("mortgage_advisor"); setStep("form"); }}
                  className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border bg-card hover:border-gold/50 hover:bg-gold/5 transition-all text-right group"
                >
                  <div className="p-3 rounded-xl bg-gold/10 group-hover:bg-gold/20 transition-colors">
                    <Home className="w-7 h-7 text-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-foreground">יועץ משכנתאות</p>
                    <p className="text-xs text-muted-foreground mt-0.5">CRM חכם, ניתוח תיקים, חייגן, ניהול לידים</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setProfession("insurance_agent"); setStep("form"); }}
                  className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-right group"
                >
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-foreground">סוכן ביטוח</p>
                    <p className="text-xs text-muted-foreground mt-0.5">פוליסות, Gap Analyzer, AI Pitch, דוחות</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => navigate("/")}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <ArrowRight className="w-3 h-3" />
                  חזרה לדף הבית
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Selected profession badge */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep("select")}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ArrowRight className="w-3 h-3" />
                  שנה בחירה
                </button>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  profession === "mortgage_advisor"
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}>
                  {profession === "mortgage_advisor" ? <Home className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  {profession === "mortgage_advisor" ? "יועץ משכנתאות" : "סוכן ביטוח"}
                </div>
              </div>

              {/* Info banner */}
              <div className="rounded-xl p-3 text-xs text-center border bg-gold/5 border-gold/20 text-gold">
                {profession === "mortgage_advisor"
                  ? "גישה מלאה ל-CRM, ניתוח תיקים, חייגן, ניהול לידים ודוחות"
                  : "גישה מלאה לניהול פוליסות, Gap Analyzer, AI Pitch ודוחות"
                }
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
                  <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90" disabled={loading}>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProAuth;
