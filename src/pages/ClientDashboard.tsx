import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import SmartIngestion from "@/components/SmartIngestion";
import { ClientProgressTracker } from "@/components/ClientProgressTracker";
import { AIInsightCard } from "@/components/AIInsightCard";
import { TamhilComparison } from "@/components/TamhilComparison";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: "חדש", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  contacted: { label: "נוצר קשר", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  in_progress: { label: "בטיפול", color: "bg-primary/10 text-primary" },
  submitted: { label: "הוגש לבנק", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  approved: { label: "אושר", color: "bg-success/10 text-success" },
  rejected: { label: "נדחה", color: "bg-destructive/10 text-destructive" },
  closed: { label: "סגור", color: "bg-muted text-muted-foreground" },
};

const REQUIRED_DOCS = ["תלושי שכר", 'דפי עו"ש', 'דו"ח BDI', 'צילום ת"ז'];

const ClientDashboard = () => {
  const { user, signOut } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myLead } = useQuery({
    queryKey: ["my-lead", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("client_user_id", user!.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  const { data: myDocuments = [] } = useQuery({
    queryKey: ["my-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("uploaded_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const uploadedClassifications = myDocuments.map((d: any) => d.classification);
  const completedDocs = REQUIRED_DOCS.filter((doc) => uploadedClassifications.includes(doc));
  const completionPercent = Math.round((completedDocs.length / REQUIRED_DOCS.length) * 100);

  // Determine progress step
  const hasDocuments = myDocuments.length > 0;
  const hasAnalysis = myDocuments.some((d: any) => d.extracted_data?.analyzed_at);
  const currentStep = !hasDocuments ? 0 : !hasAnalysis ? 1 : completionPercent < 100 ? 2 : 3;

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const status = myLead ? STATUS_MAP[myLead.status] || STATUS_MAP.new : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">SmartMortgage AI</h1>
              <p className="text-xs text-muted-foreground">האזור האישי שלך</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 ml-2" />
              <span className="hidden sm:inline">יציאה</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Welcome + Status */}
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="p-3 rounded-full bg-primary/10">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                שלום, {profile?.full_name || "לקוח"}!
              </h2>
              <p className="text-muted-foreground text-sm truncate">{profile?.email}</p>
            </div>
            {status && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">סטטוס:</span>
                <Badge className={cn("text-sm", status.color)}>{status.label}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Progress Tracker */}
        <ClientProgressTracker currentStep={currentStep} />

        {/* AI Insight Card */}
        <AIInsightCard
          monthlyIncome={myLead?.monthly_income ? Number(myLead.monthly_income) : null}
          mortgageAmount={myLead?.mortgage_amount ? Number(myLead.mortgage_amount) : null}
          propertyValue={myLead?.property_value ? Number(myLead.property_value) : null}
          documentsCount={myDocuments.length}
          completionPercent={completionPercent}
        />

        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card p-4 sm:p-5 text-center space-y-1 hover:shadow-md hover:scale-[1.02] transition-all">
            <div className="text-2xl sm:text-3xl font-bold text-primary">{myDocuments.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">מסמכים הועלו</div>
          </div>
          <div className="glass-card p-4 sm:p-5 text-center space-y-1 hover:shadow-md hover:scale-[1.02] transition-all">
            <div className="text-2xl sm:text-3xl font-bold text-primary">{completionPercent}%</div>
            <div className="text-xs sm:text-sm text-muted-foreground">השלמת תיק</div>
          </div>
          <div className="glass-card p-4 sm:p-5 text-center space-y-1 hover:shadow-md hover:scale-[1.02] transition-all">
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {completedDocs.length}/{REQUIRED_DOCS.length}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">מסמכים נדרשים</div>
          </div>
        </div>

        {/* Tamhil Comparison */}
        <TamhilComparison
          mortgageAmount={myLead?.mortgage_amount ? Number(myLead.mortgage_amount) : null}
          monthlyIncome={myLead?.monthly_income ? Number(myLead.monthly_income) : null}
        />

        {/* Document Checklist */}
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            סטטוס מסמכים נדרשים
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REQUIRED_DOCS.map((doc) => {
              const found = uploadedClassifications.includes(doc);
              return (
                <div key={doc} className={cn(
                  "flex items-center gap-2 p-3 rounded-lg text-sm transition-all hover:scale-[1.01]",
                  found ? "bg-success/10 text-success" : "bg-destructive/5 text-destructive"
                )}>
                  {found ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  <span className="font-medium">{doc}</span>
                  <span className="text-xs mr-auto opacity-70">{found ? "✓ הועלה" : "חסר"}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* My Documents */}
        {myDocuments.length > 0 && (
          <div className="glass-card p-5 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              המסמכים שלי ({myDocuments.length})
            </h3>
            <div className="space-y-2">
              {myDocuments.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 hover:shadow-sm transition-all">
                  {doc.file_type?.includes("pdf") ? (
                    <FileText className="w-5 h-5 text-destructive shrink-0" />
                  ) : doc.file_type?.includes("image") ? (
                    <Image className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <File className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{doc.classification || "לא מסווג"}</span>
                      <span>•</span>
                      <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{new Date(doc.created_at).toLocaleDateString("he-IL")}</span>
                    </div>
                  </div>
                  {doc.extracted_data?.analyzed_at && (
                    <Badge variant="outline" className="text-success border-success/30 text-xs">נותח</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Section */}
        <SmartIngestion />
      </main>
    </div>
  );
};

export default ClientDashboard;
