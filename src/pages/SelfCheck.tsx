import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowRight, Loader2, Upload, CheckCircle2, Sparkles, User, Target, FileText, Rocket, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import SmartIngestion from "@/components/SmartIngestion";
import SelfCheckResults from "@/components/SelfCheckResults";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type MortgagePurpose = "new" | "topup" | "refinance" | "explore";
type MaritalStatus = "single" | "married" | "divorced" | "widowed";

const PURPOSE_OPTIONS: { value: MortgagePurpose; label: string; emoji: string; desc: string }[] = [
  { value: "new", label: "הלוואה חדשה", emoji: "🏠", desc: "רכישת נכס חדש" },
  { value: "topup", label: "תוספת על הקיים", emoji: "📈", desc: "משיכת הון עצמי מנכס קיים" },
  { value: "refinance", label: "מיחזור משכנתא", emoji: "🔄", desc: "שיפור תנאי משכנתא קיימת" },
  { value: "explore", label: "סתם לבדוק — ידע זה כוח", emoji: "💡", desc: "בדיקה כללית ללא התחייבות" },
];

const STATUS_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: "single", label: "רווק/ה" },
  { value: "married", label: "נשוי/אה" },
  { value: "divorced", label: "גרוש/ה" },
  { value: "widowed", label: "אלמן/ה" },
];

const SelfCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"info" | "verify" | "upload" | "result">(user ? "upload" : "info");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | "">("");
  const [purpose, setPurpose] = useState<MortgagePurpose | "">("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose) {
      toast.error("נא לבחור מטרת בדיקה");
      return;
    }
    if (!maritalStatus) {
      toast.error("נא לבחור סטטוס אישי");
      return;
    }
    if (!email) {
      toast.error("נא להזין כתובת אימייל");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            full_name: fullName,
            marital_status: maritalStatus,
            mortgage_purpose: purpose,
            phone,
          },
          emailRedirectTo: window.location.origin + "/self-check",
        },
      });
      if (error) throw error;
      toast.success("קוד אימות נשלח למייל שלך!");
      setResendTimer(60);
      setStep("verify");
    } catch (err: any) {
      toast.error(err.message || "שגיאה בשליחת הקוד");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) throw error;
      toast.success("אומת בהצלחה! בוא נתחיל 🚀");
      setStep("upload");
    } catch (err: any) {
      toast.error("קוד שגוי, נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  const allSteps = [
    { key: "info", label: "פרטים אישיים", icon: User },
    { key: "upload", label: "העלאת מסמכים", icon: Upload },
    { key: "result", label: "תוצאות", icon: Sparkles },
  ];

  const getStepIndex = () => {
    if (step === "info" || step === "verify") return 0;
    if (step === "upload") return 1;
    return 2;
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
              <h1 className="text-xl font-bold text-foreground">חיתומית</h1>
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

      <main className="container mx-auto px-6 py-8 max-w-4xl space-y-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {allSteps.map((s, i) => {
            const currentIdx = getStepIndex();
            const isActive = i === currentIdx;
            const isDone = i < currentIdx;
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-0.5 ${isDone ? "bg-primary" : "bg-border"}`} />}
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" :
                  isDone ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                )}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
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
            <form onSubmit={handleSendOTP} className="space-y-5">
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  פרטים אישיים
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>שם מלא *</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ישראל ישראלי" required />
                  </div>
                  <div className="space-y-2">
                    <Label>טלפון</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" dir="ltr" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>אימייל *</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" required />
                    <p className="text-xs text-muted-foreground">נשלח לך קוד אימות למייל — בלי סיסמאות, בלי סיבוכים ✨</p>
                  </div>
                </div>
              </div>

              {/* Marital Status */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  סטטוס אישי *
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMaritalStatus(opt.value)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-sm font-medium transition-all hover:shadow-md",
                        maritalStatus === opt.value
                          ? "border-primary bg-primary/10 text-primary shadow-md shadow-primary/10"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  מה המטרה שלך? *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PURPOSE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPurpose(opt.value)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-right transition-all hover:shadow-md group",
                        purpose === opt.value
                          ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                          : "border-border bg-card hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{opt.emoji}</span>
                        <div>
                          <p className={cn(
                            "font-semibold text-sm",
                            purpose === opt.value ? "text-primary" : "text-foreground"
                          )}>{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full relative overflow-hidden group text-lg h-14 bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02]"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Rocket className="w-5 h-5 ml-2 group-hover:animate-bounce" />
                    <span>גלה כמה משכנתא מגיע לך</span>
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:translate-x-[-4px] transition-transform" />
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground">
              כבר רשום?{" "}
              <button onClick={() => navigate("/auth")} className="text-primary hover:underline">התחבר</button>
            </p>
          </div>
        )}

        {/* Step: Verify OTP */}
        {step === "verify" && !user && (
          <div className="glass-card p-8 space-y-6 animate-fade-in max-w-md mx-auto">
            <div className="text-center space-y-3">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">בדוק את המייל שלך</h2>
              <p className="text-muted-foreground">
                שלחנו קוד אימות ל-<span className="text-primary font-medium" dir="ltr">{email}</span>
              </p>
            </div>

            <div className="flex justify-center" dir="ltr">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerifyOTP}
              className="w-full h-12 text-lg bg-gradient-to-l from-primary to-primary/80 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-[1.02]"
              disabled={loading || otp.length < 6}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                  אמת והמשך
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <button
                onClick={(e) => { e.preventDefault(); handleSendOTP(e as any); }}
                className={cn(
                  "text-sm transition-colors",
                  resendTimer > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline"
                )}
                disabled={loading || resendTimer > 0}
              >
                {resendTimer > 0
                  ? `שלח שוב בעוד ${resendTimer} שניות`
                  : "לא קיבלת? שלח שוב"}
              </button>
              <br />
              <button
                onClick={() => setStep("info")}
                className="text-xs text-muted-foreground hover:underline"
              >
                חזרה לעריכת פרטים
              </button>
            </div>
          </div>
        )}

        {/* Step: Upload */}
        {(step === "upload" || (step === "info" && user)) && (
          <div className="space-y-6 animate-fade-in">
            {/* Tamhil reminder */}
            <div className="glass-card p-5 border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">מסמכים נדרשים</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                העלה את המסמכים הבאים כדי לקבל ניתוח מדויק. אם יש לך <span className="text-primary font-medium">תמהיל משכנתא קיים</span> — העלה גם אותו כדי שנוכל להשוות ולמצוא חיסכון.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  "תלושי שכר (3 אחרונים)",
                  'דפי עו"ש (6 חודשים)',
                  'דו"ח BDI / אשראי',
                  'צילום ת"ז',
                  "חוזה שכירות / רכישה",
                  "📌 תמהיל משכנתא קיים",
                ].map((doc, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-1.5 p-2 rounded-lg",
                    i === 5 ? "bg-primary/10 text-primary font-medium border border-primary/20" : "bg-secondary text-muted-foreground"
                  )}>
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>

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
        {step === "result" && <SelfCheckResults purpose={purpose || "new"} />}
      </main>
    </div>
  );
};

export default SelfCheck;
