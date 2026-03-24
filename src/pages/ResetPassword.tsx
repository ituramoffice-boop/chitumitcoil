import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ChitumitLogo } from "@/components/ChitumitLogo";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Check if we already have a recovery session from hash fragment
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("הסיסמאות אינן תואמות");
      return;
    }

    if (password.length < 6) {
      toast.error("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success("הסיסמה עודכנה בהצלחה!");
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error: any) {
      toast.error(error.message || "שגיאה בעדכון הסיסמה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <ChitumitLogo size={48} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">איפוס סיסמה</h1>
          <p className="text-sm text-muted-foreground">
            {isRecovery ? "הזן סיסמה חדשה" : "בודק הרשאות..."}
          </p>
        </div>

        {success ? (
          <div className="glass-card p-8 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-foreground font-medium">הסיסמה עודכנה בהצלחה!</p>
            <p className="text-sm text-muted-foreground">מעביר אותך לדף ההתחברות...</p>
          </div>
        ) : !isRecovery ? (
          <div className="glass-card p-8 text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              הקישור אינו תקין או שפג תוקפו. נסה לבקש איפוס סיסמה מחדש.
            </p>
            <Button variant="outline" onClick={() => navigate("/auth")}>
              <ArrowRight className="w-4 h-4" />
              חזרה להתחברות
            </Button>
          </div>
        ) : (
          <div className="glass-card p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה חדשה</Label>
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                עדכן סיסמה
              </Button>
            </form>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => navigate("/auth")}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowRight className="w-3 h-3" />
            חזרה להתחברות
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
