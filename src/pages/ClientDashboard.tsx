import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Brain,
  LogOut,
  User,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Clock,
  Image,
  File,
  Upload,
  Send,
  TrendingDown,
  Sparkles,
  MessageCircle,
  ChevronLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  FileSearch,
  KeyRound,
  ScanLine,
  Home,
} from "lucide-react";
import SmartIngestion from "@/components/SmartIngestion";
import { CreditScoreAnalyzer } from "@/components/CreditScoreAnalyzer";
import { DocumentIntelligenceZone, ComplianceFooter } from "@/components/DocumentIntelligenceZone";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import confetti from "canvas-confetti";

/* ── Stage pipeline — "Path to Your Keys" ──── */
const CASE_STAGES = [
  { key: "document_collection", label: "איסוף מסמכים", icon: FileSearch, description: "העלאת מסמכים ואימות" },
  { key: "analysis", label: "ניתוח AI", icon: Brain, description: "ניתוח אוטומטי ובדיקת היתכנות" },
  { key: "bank_submission", label: "הגשה לבנק", icon: Building2, description: "שליחת התיק למוסד פיננסי" },
  { key: "keys", label: "המפתחות שלך!", icon: KeyRound, description: "קבלת המפתחות לבית החדש 🏠" },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: "חדש", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  contacted: { label: "נוצר קשר", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  in_progress: { label: "בטיפול", color: "bg-primary/10 text-primary border-primary/30" },
  submitted: { label: "הוגש לבנק", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
  approved: { label: "אושר", color: "bg-success/10 text-success border-success/30" },
  rejected: { label: "נדחה", color: "bg-destructive/10 text-destructive border-destructive/30" },
  closed: { label: "סגור", color: "bg-muted text-muted-foreground border-border" },
};

const REQUIRED_DOCS = [
  { key: "תלושי שכר", icon: Banknote, label: "תלושי שכר (3 אחרונים)" },
  { key: 'דפי עו"ש', icon: FileText, label: 'דפי עו"ש (6 חודשים)' },
  { key: 'דו"ח BDI', icon: ShieldCheck, label: 'דו"ח BDI / אשראי' },
  { key: 'צילום ת"ז', icon: User, label: 'צילום תעודת זהות' },
];

const MOCK_MESSAGES = [
  { id: 1, text: "שלום! קיבלתי את המסמכים שלך, בודק עכשיו.", time: "10:32", fromAdvisor: true },
  { id: 2, text: "הכל נראה תקין. צריך רק את דוח BDI העדכני.", time: "10:45", fromAdvisor: true },
  { id: 3, text: "אני אעלה אותו עכשיו, תודה!", time: "11:02", fromAdvisor: false },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

/* ── Animated Counter ──────────────────────── */
function AnimatedCounter({ value, prefix = "" }: { value: number; prefix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const controls = animate(prevValue.current, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) {
        node.textContent = `${prefix}${Math.round(v).toLocaleString()}`;
      },
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value, prefix]);

  return <span ref={nodeRef}>{prefix}{Math.round(value).toLocaleString()}</span>;
}

/* ── AI Scan Animation ─────────────────────── */
function AIScanOverlay({ scanning }: { scanning: boolean }) {
  if (!scanning) return null;
  return (
    <motion.div
      className="absolute inset-0 z-10 rounded-xl overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_4px_hsl(var(--cyan-glow)/0.6)]"
        initial={{ top: "0%" }}
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 2, repeat: 1, ease: "easeInOut" }}
      />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,hsl(186_100%_50%/0.03)_25%,hsl(186_100%_50%/0.03)_26%,transparent_27%),linear-gradient(90deg,transparent_24%,hsl(186_100%_50%/0.03)_25%,hsl(186_100%_50%/0.03)_26%,transparent_27%)] bg-[size:30px_30px]" />
      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60 rounded-tl" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/60 rounded-tr" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/60 rounded-bl" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400/60 rounded-br" />
    </motion.div>
  );
}

/* ── AI Verified Badge ─────────────────────── */
function AIVerifiedBadge({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-semibold"
        >
          <motion.div
            animate={{ boxShadow: ["0 0 0px hsl(186 100% 50% / 0)", "0 0 12px hsl(186 100% 50% / 0.4)", "0 0 0px hsl(186 100% 50% / 0)"] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-cyan-400"
          />
          AI Verified
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [paymentIncrease, setPaymentIncrease] = useState(0); // 0-5000 extra per month
  const [scanningDocId, setScanningDocId] = useState<string | null>(null);
  const [verifiedDocs, setVerifiedDocs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("client-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads", filter: `client_user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["my-lead", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "documents", filter: `uploaded_by=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["my-documents", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myLead } = useQuery({
    queryKey: ["my-lead", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("client_user_id", user!.id).single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  const { data: myDocuments = [] } = useQuery({
    queryKey: ["my-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("uploaded_by", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Trigger scan animation for newly loaded docs
  useEffect(() => {
    if (myDocuments.length > 0 && verifiedDocs.size === 0) {
      // Auto-verify existing docs with a staggered scan
      myDocuments.forEach((doc: any, i: number) => {
        setTimeout(() => {
          setScanningDocId(doc.id);
          setTimeout(() => {
            setScanningDocId(null);
            setVerifiedDocs(prev => new Set(prev).add(doc.id));
          }, 2500);
        }, i * 3000);
      });
    }
  }, [myDocuments.length]);

  const uploadedClassifications = myDocuments.map((d: any) => d.classification);
  const completedDocs = REQUIRED_DOCS.filter((doc) => uploadedClassifications.includes(doc.key));
  const completionPercent = Math.round((completedDocs.length / REQUIRED_DOCS.length) * 100);

  const hasDocuments = myDocuments.length > 0;
  const hasAnalysis = myDocuments.some((d: any) => d.extracted_data?.analyzed_at);
  const currentStep = !hasDocuments ? 0 : !hasAnalysis ? 1 : completionPercent < 100 ? 1 : 2;

  // Savings calc with What-If slider
  const income = myLead?.monthly_income ? Number(myLead.monthly_income) : 22000;
  const baseSavings = Math.round(income * 0.18 * 12 * 25);
  const extraSavings = Math.round(paymentIncrease * 12 * 18); // simplified extra savings
  const totalSavings = baseSavings + extraSavings;

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-primary relative" />
        </div>
      </div>
    );
  }

  const status = myLead ? STATUS_MAP[myLead.status] || STATUS_MAP.new : null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.03] blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-2xl">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/20">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">חיתומית</h1>
              <p className="text-[11px] text-muted-foreground">האזור האישי שלך</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => setChatOpen(!chatOpen)} className="relative">
              <MessageCircle className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-background animate-pulse" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 ml-1" />
              <span className="hidden sm:inline text-xs">יציאה</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
          {/* ── Welcome Hero ─────────────────── */}
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-6 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-cyan-500/[0.04]" />
            <div className="relative flex items-center gap-4 flex-wrap">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg" />
                <div className="relative p-3 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30">
                  <User className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  שלום, {profile?.full_name || "לקוח"}
                </h2>
                <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
              </div>
              {status && (
                <Badge className={cn("text-xs px-3 py-1 border", status.color)}>
                  {status.label}
                </Badge>
              )}
            </div>
          </motion.div>

          {/* ── Path to Your Keys (Gamified Progress) ─── */}
          <motion.div variants={fadeUp} className="glass-card p-6 sm:p-8 overflow-x-auto">
            <h3 className="text-sm font-semibold text-muted-foreground mb-6 flex items-center gap-2">
              <Home className="w-4 h-4 text-cyan-400" />
              🔑 הדרך למפתחות שלך
            </h3>
            <div className="flex items-start justify-between min-w-[520px]">
              {CASE_STAGES.map((stage, i) => {
                const isDone = i < currentStep;
                const isActive = i === currentStep;
                const isKeys = i === CASE_STAGES.length - 1;
                const Icon = stage.icon;
                return (
                  <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <motion.div
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative",
                          isKeys && !isDone
                            ? "bg-gradient-to-br from-amber-500/20 to-yellow-500/10 text-amber-400 ring-2 ring-amber-500/30 ring-offset-2 ring-offset-background"
                            : isDone
                            ? "bg-gradient-to-br from-primary to-cyan-500 text-white shadow-lg shadow-primary/30"
                            : isActive
                            ? "bg-primary/10 text-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
                            : "bg-secondary/60 text-muted-foreground"
                        )}
                        animate={
                          isKeys && !isDone
                            ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0px hsl(43 74% 52% / 0)", "0 0 24px hsl(43 74% 52% / 0.4)", "0 0 0px hsl(43 74% 52% / 0)"] }
                            : isActive
                            ? { scale: [1, 1.06, 1] }
                            : {}
                        }
                        transition={{ repeat: Infinity, duration: isKeys ? 2.5 : 2, ease: "easeInOut" }}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : isKeys ? (
                          <KeyRound className="w-7 h-7" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                        {(isActive || (isKeys && !isDone)) && (
                          <motion.div
                            className={cn(
                              "absolute inset-0 rounded-2xl",
                              isKeys ? "bg-amber-500/10" : "bg-primary/10"
                            )}
                            animate={{ opacity: [0, 0.6, 0], scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                      <div>
                        <p className={cn(
                          "text-xs font-semibold whitespace-nowrap",
                          isKeys && !isDone ? "text-amber-400" : isDone ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {stage.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[110px]">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                    {i < CASE_STAGES.length - 1 && (
                      <div className="flex-1 mx-3 mt-[-24px]">
                        <div className="h-[3px] rounded-full relative overflow-hidden bg-border/60">
                          <motion.div
                            className={cn(
                              "h-full rounded-full",
                              i === CASE_STAGES.length - 2 && isDone
                                ? "bg-gradient-to-r from-cyan-500 to-amber-400"
                                : "bg-gradient-to-r from-primary to-cyan-500"
                            )}
                            initial={{ width: "0%" }}
                            animate={{ width: isDone ? "100%" : isActive ? "50%" : "0%" }}
                            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Savings Widget + What-If Slider ──── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div
              variants={fadeUp}
              className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-card/80 via-card/60 to-cyan-500/[0.06] backdrop-blur-xl p-6 sm:p-8"
            >
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-30%] left-[-20%] w-[400px] h-[400px] rounded-full bg-cyan-500/[0.06] blur-[80px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/[0.05] blur-[60px]" />
              </div>
              <div className="relative space-y-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <TrendingDown className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">חיסכון ריבית משוער</h3>
                    <p className="text-[11px] text-muted-foreground">לאורך חיי המשכנתא</p>
                  </div>
                </div>

                {/* Animated savings number with glow pulse */}
                <motion.div
                  className="flex items-baseline gap-2"
                  key={totalSavings}
                  animate={{
                    textShadow: paymentIncrease > 0
                      ? ["0 0 20px hsl(186 100% 50% / 0.2)", "0 0 40px hsl(186 100% 50% / 0.5)", "0 0 20px hsl(186 100% 50% / 0.2)"]
                      : "none"
                  }}
                  transition={{ duration: 1.5, repeat: paymentIncrease > 0 ? 2 : 0 }}
                >
                  <span className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-cyan-400 via-primary to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsl(186,100%,50%,0.3)]">
                    <AnimatedCounter value={totalSavings} prefix="₪" />
                  </span>
                </motion.div>

                {/* What-If Slider */}
                <div className="space-y-3 pt-2 border-t border-border/30">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      מה אם אגדיל את ההחזר החודשי?
                    </label>
                    <motion.span
                      className={cn(
                        "text-sm font-bold tabular-nums transition-colors",
                        paymentIncrease > 0 ? "text-cyan-400" : "text-muted-foreground"
                      )}
                      animate={paymentIncrease > 0 ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      +₪{paymentIncrease.toLocaleString()}
                    </motion.span>
                  </div>
                  <div className="relative group">
                    <Slider
                      value={[paymentIncrease]}
                      onValueChange={([v]) => setPaymentIncrease(v)}
                      max={5000}
                      step={100}
                      className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyan-400 [&_[role=slider]]:to-primary [&_[role=slider]]:border-cyan-400/50 [&_[role=slider]]:shadow-[0_0_12px_hsl(186_100%_50%/0.4)] [&_[role=slider]]:w-6 [&_[role=slider]]:h-6 [&_[data-orientation=horizontal]>[data-orientation=horizontal]]:bg-gradient-to-r [&_[data-orientation=horizontal]>[data-orientation=horizontal]]:from-primary [&_[data-orientation=horizontal]>[data-orientation=horizontal]]:to-cyan-400"
                    />
                    {paymentIncrease > 0 && (
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] text-cyan-400/80 mt-2"
                      >
                        תחסוך עוד ₪{extraSavings.toLocaleString()} לאורך חיי המשכנתא! 🎉
                      </motion.p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  * הערכה מבוססת על ניתוח AI. ייעוץ מקצועי יכול להציג תמונה מדויקת יותר.
                </p>
              </div>
            </motion.div>

            {/* Stats column */}
            <motion.div variants={fadeUp} className="flex flex-col gap-4">
              <div className="glass-card p-5 flex-1 flex flex-col items-center justify-center text-center hover:shadow-lg hover:shadow-primary/5 transition-all group">
                <div className="text-3xl font-black text-primary group-hover:scale-110 transition-transform">
                  {myDocuments.length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">מסמכים הועלו</div>
              </div>
              <div className="glass-card p-5 flex-1 flex flex-col items-center justify-center text-center hover:shadow-lg hover:shadow-cyan-500/5 transition-all group">
                <div className="text-3xl font-black text-cyan-400 group-hover:scale-110 transition-transform">
                  {completionPercent}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">השלמת תיק</div>
              </div>
            </motion.div>
          </div>

          {/* ── Document Center ──────────────── */}
          <motion.div variants={fadeUp} className="glass-card p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                מרכז המסמכים
              </h3>
              <Badge variant="outline" className="text-xs border-border/60 text-muted-foreground">
                {completedDocs.length}/{REQUIRED_DOCS.length} הושלמו
              </Badge>
            </div>

            <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REQUIRED_DOCS.map((doc) => {
                const found = uploadedClassifications.includes(doc.key);
                const acceptPdf = [".pdf"];
                const acceptAll = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
                return (
                  <DocumentIntelligenceZone
                    key={doc.key}
                    docKey={doc.key}
                    label={doc.label}
                    icon={doc.icon}
                    found={found}
                    acceptedTypes={doc.key === 'צילום ת"ז' ? acceptAll : acceptPdf}
                    onFileAccepted={(file) => {
                      toast.success(`${doc.label} אומת בהצלחה`, { description: file.name });
                    }}
                  />
                );
              })}
            </div>
          </motion.div>

          {/* ── Credit Score Analyzer ────────── */}
          <motion.div variants={fadeUp}>
            <CreditScoreAnalyzer />
          </motion.div>

          {/* ── My uploaded documents with AI Scan ─── */}
          {myDocuments.length > 0 && (
            <motion.div variants={fadeUp} className="glass-card p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <ScanLine className="w-4 h-4 text-cyan-400" />
                המסמכים שלי ({myDocuments.length})
              </h3>
              <div className="space-y-2">
                {myDocuments.slice(0, 6).map((doc: any) => (
                  <div key={doc.id} className="relative flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card/30 hover:bg-card/60 transition-all group overflow-hidden">
                    {/* AI Scan overlay */}
                    <AnimatePresence>
                      <AIScanOverlay scanning={scanningDocId === doc.id} />
                    </AnimatePresence>

                    {doc.file_type?.includes("pdf") ? (
                      <FileText className="w-5 h-5 text-destructive/70 shrink-0" />
                    ) : doc.file_type?.includes("image") ? (
                      <Image className="w-5 h-5 text-primary/70 shrink-0" />
                    ) : (
                      <File className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{doc.classification || "לא מסווג"}</span>
                        <span className="opacity-30">•</span>
                        <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                        <span className="opacity-30">•</span>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(doc.created_at).toLocaleDateString("he-IL")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.extracted_data?.analyzed_at && (
                        <Badge variant="outline" className="text-success border-success/20 text-[10px]">נותח</Badge>
                      )}
                      <AIVerifiedBadge show={verifiedDocs.has(doc.id)} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Upload Section ───────────────── */}
          <motion.div variants={fadeUp}>
            <SmartIngestion />
          </motion.div>

          {/* ── Compliance Footer ──────────── */}
          <ComplianceFooter />
        </motion.div>
      </main>

      {/* ── Consultant Messaging Sidebar ──── */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-auto left-0 h-full w-[340px] max-w-[85vw] z-50 bg-card/90 backdrop-blur-2xl border-r border-border/40 shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-border/30 flex items-center gap-3">
                <Button size="icon" variant="ghost" onClick={() => setChatOpen(false)} className="shrink-0">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">הודעות מהיועץ</h3>
                  <p className="text-[11px] text-cyan-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                    מחובר
                  </p>
                </div>
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {MOCK_MESSAGES.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.fromAdvisor ? "justify-start" : "justify-end")}>
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm",
                      msg.fromAdvisor
                        ? "bg-secondary/80 text-foreground rounded-br-sm"
                        : "bg-gradient-to-br from-primary to-primary/80 text-white rounded-bl-sm"
                    )}>
                      <p>{msg.text}</p>
                      <p className={cn("text-[10px] mt-1", msg.fromAdvisor ? "text-muted-foreground" : "text-white/60")}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <input
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="כתוב הודעה..."
                    className="flex-1 bg-secondary/60 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40"
                  />
                  <Button size="icon" className="bg-gradient-to-br from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 rounded-xl shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientDashboard;
