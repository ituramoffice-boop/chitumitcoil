import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import SmartIngestion from "@/components/SmartIngestion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/* ── Stage pipeline ─────────────────────────── */
const CASE_STAGES = [
  { key: "document_collection", label: "איסוף מסמכים", icon: FileSearch, description: "העלאת מסמכים ואימות" },
  { key: "analysis", label: "ניתוח AI", icon: Brain, description: "ניתוח אוטומטי ובדיקת היתכנות" },
  { key: "bank_submission", label: "הגשה לבנק", icon: Building2, description: "שליחת התיק למוסד פיננסי" },
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

/* ── Mock advisor messages ─────────────────── */
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

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const [newMsg, setNewMsg] = useState("");

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

  const uploadedClassifications = myDocuments.map((d: any) => d.classification);
  const completedDocs = REQUIRED_DOCS.filter((doc) => uploadedClassifications.includes(doc.key));
  const completionPercent = Math.round((completedDocs.length / REQUIRED_DOCS.length) * 100);

  const hasDocuments = myDocuments.length > 0;
  const hasAnalysis = myDocuments.some((d: any) => d.extracted_data?.analyzed_at);
  const currentStep = !hasDocuments ? 0 : !hasAnalysis ? 1 : completionPercent < 100 ? 1 : 2;

  // Savings calc (mock)
  const income = myLead?.monthly_income ? Number(myLead.monthly_income) : 22000;
  const estimatedSavings = Math.round(income * 0.18 * 12 * 25);

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChatOpen(!chatOpen)}
              className="relative"
            >
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

          {/* ── Case Status Tracker ──────────── */}
          <motion.div variants={fadeUp} className="glass-card p-6 sm:p-8 overflow-x-auto">
            <h3 className="text-sm font-semibold text-muted-foreground mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              סטטוס התיק שלך
            </h3>
            <div className="flex items-start justify-between min-w-[420px]">
              {CASE_STAGES.map((stage, i) => {
                const isDone = i < currentStep;
                const isActive = i === currentStep;
                const Icon = stage.icon;
                return (
                  <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <motion.div
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative",
                          isDone
                            ? "bg-gradient-to-br from-primary to-cyan-500 text-white shadow-lg shadow-primary/30"
                            : isActive
                            ? "bg-primary/10 text-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
                            : "bg-secondary/60 text-muted-foreground"
                        )}
                        animate={isActive ? { scale: [1, 1.06, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      >
                        {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                        {isActive && (
                          <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping" />
                        )}
                      </motion.div>
                      <div>
                        <p className={cn(
                          "text-xs font-semibold whitespace-nowrap",
                          isDone ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {stage.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[100px]">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                    {i < CASE_STAGES.length - 1 && (
                      <div className="flex-1 mx-3 mt-[-24px]">
                        <div className="h-[3px] rounded-full relative overflow-hidden bg-border/60">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
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

          {/* ── Savings Widget + Stats Row ───── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Savings — takes 2 cols on lg */}
            <motion.div
              variants={fadeUp}
              className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-card/80 via-card/60 to-cyan-500/[0.06] backdrop-blur-xl p-6 sm:p-8"
            >
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-30%] left-[-20%] w-[400px] h-[400px] rounded-full bg-cyan-500/[0.06] blur-[80px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/[0.05] blur-[60px]" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <TrendingDown className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">חיסכון ריבית משוער</h3>
                    <p className="text-[11px] text-muted-foreground">לאורך חיי המשכנתא</p>
                  </div>
                </div>
                <motion.div
                  className="flex items-baseline gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-cyan-400 via-primary to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsl(186,100%,50%,0.3)]">
                    ₪{estimatedSavings.toLocaleString()}
                  </span>
                </motion.div>
                <p className="text-xs text-muted-foreground mt-3">
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

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
              />
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REQUIRED_DOCS.map((doc) => {
                const found = uploadedClassifications.includes(doc.key);
                const Icon = doc.icon;
                return (
                  <motion.div
                    key={doc.key}
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border transition-all",
                      found
                        ? "bg-success/5 border-success/20 text-success"
                        : "bg-card/40 border-border/40 text-muted-foreground hover:border-cyan-500/30 hover:bg-cyan-500/[0.03]"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      found ? "bg-success/10" : "bg-secondary/60"
                    )}>
                      {found ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", found ? "text-success" : "text-foreground")}>
                        {doc.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {found ? "✓ הועלה בהצלחה" : "ממתין להעלאה"}
                      </p>
                    </div>
                    {!found && (
                      <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 text-xs gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        העלה
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── My uploaded documents ────────── */}
          {myDocuments.length > 0 && (
            <motion.div variants={fadeUp} className="glass-card p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <File className="w-4 h-4 text-primary" />
                המסמכים שלי ({myDocuments.length})
              </h3>
              <div className="space-y-2">
                {myDocuments.slice(0, 6).map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card/30 hover:bg-card/60 transition-all group">
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
                    {doc.extracted_data?.analyzed_at && (
                      <Badge variant="outline" className="text-success border-success/20 text-[10px]">נותח</Badge>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Upload Section ───────────────── */}
          <motion.div variants={fadeUp}>
            <SmartIngestion />
          </motion.div>
        </motion.div>
      </main>

      {/* ── Consultant Messaging Sidebar ──── */}
      <AnimatePresence>
        {chatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-auto left-0 h-full w-[340px] max-w-[85vw] z-50 bg-card/90 backdrop-blur-2xl border-r border-border/40 shadow-2xl flex flex-col"
            >
              {/* Chat header */}
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

              {/* Messages */}
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
                      <p className={cn(
                        "text-[10px] mt-1",
                        msg.fromAdvisor ? "text-muted-foreground" : "text-white/60"
                      )}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
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
