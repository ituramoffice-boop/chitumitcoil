import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  CreditCard,
  Landmark,
  FileSearch,
  ImageIcon,
  BadgeCheck,
  FolderOpen,
  UserPlus,
  Users,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BUCKET_CONFIG = [
  { id: "payslips", label: "תלושי שכר", icon: FileText, color: "text-primary", bg: "bg-primary/10", keywords: ["תלוש", "שכר", "salary", "payslip", "employer", "מעסיק"] },
  { id: "bank", label: 'דפי עו"ש', icon: Landmark, color: "text-emerald-600", bg: "bg-emerald-50", keywords: ["עוש", "בנק", "bank", "statement", "account"] },
  { id: "bdi", label: 'דו"ח BDI', icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50", keywords: ["bdi", "אשראי", "credit", "דירוג"] },
  { id: "id", label: 'צילום ת"ז', icon: BadgeCheck, color: "text-indigo-600", bg: "bg-indigo-50", keywords: ["זהות", "tz", "id", "תעודה"] },
  { id: "property", label: "מסמכי נכס", icon: ImageIcon, color: "text-rose-600", bg: "bg-rose-50", keywords: ["נכס", "property", "שכירות", "lease", "rent", "טאבו"] },
  { id: "other", label: "לא מסווג", icon: FolderOpen, color: "text-muted-foreground", bg: "bg-muted", keywords: [] },
];

const REQUIRED_DOCS = ["תלושי שכר", 'דפי עו"ש', 'דו"ח BDI', 'צילום ת"ז'];

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "classifying" | "analyzing" | "done" | "error";
  classification?: string;
}

function classifyByContent(file: File): { classification: string; bucketId: string; extractedData: Record<string, any> } {
  const lower = file.name.toLowerCase();
  for (const bucket of BUCKET_CONFIG) {
    if (bucket.id === "other") continue;
    for (const kw of bucket.keywords) {
      if (lower.includes(kw)) {
        const extracted: Record<string, any> = {};
        if (bucket.id === "payslips") {
          extracted.employer = "חברת דמו בע״מ";
          extracted.netSalary = Math.floor(12000 + Math.random() * 18000);
          extracted.date = "2025-01";
        } else if (bucket.id === "bank") {
          extracted.bankName = "בנק הפועלים";
          extracted.accountOwner = "ישראל ישראלי";
          extracted.hasReturns = Math.random() > 0.6;
          extracted.returnCount = extracted.hasReturns ? Math.floor(1 + Math.random() * 4) : 0;
        } else if (bucket.id === "bdi") {
          extracted.creditGrade = ["A", "B+", "B", "C+", "C"][Math.floor(Math.random() * 5)];
        }
        return { classification: bucket.label, bucketId: bucket.id, extractedData: extracted };
      }
    }
  }
  if (file.type.includes("image")) return { classification: "מסמכי נכס", bucketId: "property", extractedData: {} };
  return { classification: "לא מסווג", bucketId: "other", extractedData: {} };
}

const SmartBuckets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Lead selection state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [newLeadMode, setNewLeadMode] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [creatingLead, setCreatingLead] = useState(false);

  // Active lead for filtering documents
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  const { data: leads = [] } = useQuery({
    queryKey: ["consultant-leads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("consultant_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["consultant-documents", user?.id, activeLeadId],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select("*")
        .eq("consultant_id", user!.id)
        .order("created_at", { ascending: false });
      if (activeLeadId) query = query.eq("lead_id", activeLeadId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const uploadedClassifications = documents.map((d: any) => d.classification);
  const missingDocs = REQUIRED_DOCS.filter((doc) => !uploadedClassifications.includes(doc));

  const validateFiles = (files: File[]): File[] => {
    const valid = files.filter((f) => {
      const ext = f.name.toLowerCase();
      return ext.endsWith(".pdf") || ext.endsWith(".jpg") || ext.endsWith(".jpeg") || ext.endsWith(".png") || ext.endsWith(".webp");
    });
    if (valid.length < files.length) toast.error("קבצים שאינם PDF או תמונה הוסרו");
    if (valid.length > 50) {
      toast.error("ניתן להעלות עד 50 קבצים בבת אחת");
      return valid.slice(0, 50);
    }
    return valid;
  };

  // When files are dropped/selected, show lead dialog
  const onFilesSelected = (files: File[]) => {
    const valid = validateFiles(files);
    if (valid.length === 0) return;
    setPendingFiles(valid);
    setShowLeadDialog(true);
    setNewLeadMode(leads.length === 0);
    setSelectedLeadId("");
  };

  const createLeadAndUpload = async () => {
    if (!user) return;
    setCreatingLead(true);
    try {
      let leadId = selectedLeadId;

      if (newLeadMode) {
        if (!newLeadName.trim()) {
          toast.error("נא להזין שם לקוח");
          setCreatingLead(false);
          return;
        }
        const { data: newLead, error } = await supabase
          .from("leads")
          .insert({
            consultant_id: user.id,
            full_name: newLeadName.trim(),
            phone: newLeadPhone || null,
            email: newLeadEmail || null,
            status: "new" as any,
          })
          .select("id")
          .single();
        if (error) throw error;
        leadId = newLead.id;
        toast.success(`ליד "${newLeadName}" נוצר בהצלחה!`);
        queryClient.invalidateQueries({ queryKey: ["consultant-leads"] });
      }

      if (!leadId) {
        toast.error("נא לבחור לקוח או ליצור חדש");
        setCreatingLead(false);
        return;
      }

      setShowLeadDialog(false);
      setActiveLeadId(leadId);
      await handleUpload(pendingFiles, leadId);
      setPendingFiles([]);
      setNewLeadName("");
      setNewLeadPhone("");
      setNewLeadEmail("");
    } catch (err: any) {
      toast.error("שגיאה: " + err.message);
    } finally {
      setCreatingLead(false);
    }
  };

  const handleUpload = useCallback(async (files: File[], leadId: string) => {
    if (!user) return;
    const startIndex = uploadingFiles.length;
    const newUploading: UploadingFile[] = files.map((file) => ({
      file, progress: 0, status: "uploading" as const,
    }));
    setUploadingFiles((prev) => [...prev, ...newUploading]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { classification, extractedData } = classifyByContent(file);
      const filePath = `${user.id}/${leadId}/${Date.now()}_${file.name}`;
      const fileIndex = startIndex + i;

      try {
        setUploadingFiles((prev) => prev.map((f, idx) => idx === fileIndex ? { ...f, progress: 20, status: "uploading" } : f));

        const { error: uploadError } = await supabase.storage.from("mortgage-documents").upload(filePath, file);
        if (uploadError) throw uploadError;

        setUploadingFiles((prev) => prev.map((f, idx) => idx === fileIndex ? { ...f, progress: 50, status: "classifying" } : f));

        const { data: insertedDoc, error: dbError } = await supabase.from("documents").insert({
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          classification,
          uploaded_by: user.id,
          consultant_id: user.id,
          lead_id: leadId,
          extracted_data: extractedData,
          risk_flags: extractedData.hasReturns ? [{ type: 'אכ"מ', count: extractedData.returnCount }] : [],
        } as any).select("id").single();

        if (dbError) throw dbError;

        // Trigger AI analysis
        setUploadingFiles((prev) => prev.map((f, idx) => idx === fileIndex ? { ...f, progress: 80, status: "analyzing" } : f));
        try {
          await supabase.functions.invoke("analyze-document", { body: { document_id: insertedDoc.id } });
        } catch {
          // AI analysis is optional
        }

        setUploadingFiles((prev) => prev.map((f, idx) =>
          idx === fileIndex ? { ...f, progress: 100, status: "done", classification } : f
        ));
      } catch (err: any) {
        setUploadingFiles((prev) => prev.map((f, idx) => idx === fileIndex ? { ...f, status: "error" } : f));
      }
    }

    queryClient.invalidateQueries({ queryKey: ["consultant-documents"] });
    queryClient.invalidateQueries({ queryKey: ["consultant-leads"] });
  }, [user, queryClient, uploadingFiles.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onFilesSelected(Array.from(e.dataTransfer.files));
  }, [leads]);

  const deleteDocument = async (doc: any) => {
    await supabase.storage.from("mortgage-documents").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    queryClient.invalidateQueries({ queryKey: ["consultant-documents"] });
    toast.success("מסמך נמחק");
  };

  const bucketGroups = BUCKET_CONFIG.map((bucket) => ({
    ...bucket,
    docs: documents.filter((d: any) => d.classification === bucket.label),
  }));

  const activeLeadName = leads.find((l: any) => l.id === activeLeadId)?.full_name;

  return (
    <div className="space-y-6">
      {/* Lead Filter Bar */}
      <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground text-sm">לקוח פעיל:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeLeadId === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveLeadId(null)}
          >
            כל הלקוחות
          </Button>
          {leads.map((lead: any) => (
            <Button
              key={lead.id}
              variant={activeLeadId === lead.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLeadId(lead.id)}
            >
              {lead.full_name}
            </Button>
          ))}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer relative overflow-hidden",
          isDragOver ? "border-primary bg-primary/5 scale-[1.01] shadow-xl" : "border-border hover:border-primary/50 hover:bg-primary/[0.02]"
        )}
        onClick={() => document.getElementById("file-input-smart")?.click()}
      >
        <input
          id="file-input-smart" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => { if (e.target.files) onFilesSelected(Array.from(e.target.files)); }}
          className="hidden"
        />
        <div className="space-y-4">
          <div className="p-5 rounded-full bg-primary/10 w-fit mx-auto">
            <Upload className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">זרוק מסמכים כאן — ליד ייפתח אוטומטית</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            העלה תעודת זהות, תלושי שכר או כל מסמך — המערכת תסווג ותפתח כרטיס לקוח אוטומטית
          </p>
          <p className="text-sm text-muted-foreground">PDF, JPG, PNG — עד 50 קבצים</p>
        </div>
      </div>

      {/* Lead Selection Dialog */}
      <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              שיוך מסמכים ללקוח
            </DialogTitle>
            <DialogDescription>
              בחר לקוח קיים או צור כרטיס לקוח חדש. {pendingFiles.length} קבצים ממתינים להעלאה.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {leads.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant={!newLeadMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewLeadMode(false)}
                  >
                    לקוח קיים
                  </Button>
                  <Button
                    variant={newLeadMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewLeadMode(true)}
                  >
                    <UserPlus className="w-4 h-4 ml-1" />
                    לקוח חדש
                  </Button>
                </div>
              </div>
            )}

            {!newLeadMode && leads.length > 0 ? (
              <div className="space-y-2">
                <Label>בחר לקוח</Label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר לקוח מהרשימה..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead: any) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.full_name} {lead.phone ? `(${lead.phone})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>שם הלקוח *</Label>
                  <Input value={newLeadName} onChange={(e) => setNewLeadName(e.target.value)} placeholder="ישראל ישראלי" />
                </div>
                <div className="space-y-1.5">
                  <Label>טלפון</Label>
                  <Input value={newLeadPhone} onChange={(e) => setNewLeadPhone(e.target.value)} placeholder="050-1234567" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>אימייל</Label>
                  <Input value={newLeadEmail} onChange={(e) => setNewLeadEmail(e.target.value)} placeholder="email@example.com" dir="ltr" />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeadDialog(false)}>ביטול</Button>
            <Button onClick={createLeadAndUpload} disabled={creatingLead}>
              {creatingLead && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
              {newLeadMode ? "צור לקוח והעלה" : "העלה מסמכים"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-primary" />
            סיווג חכם בתהליך...
          </h3>
          {uploadingFiles.map((uf, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {uf.status === "done" ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" /> :
               uf.status === "error" ? <XCircle className="w-4 h-4 text-destructive shrink-0" /> :
               uf.status === "analyzing" ? <Brain className="w-4 h-4 animate-pulse text-primary shrink-0" /> :
               <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate text-foreground">{uf.file.name}</span>
                  <span className="text-muted-foreground shrink-0 mr-2">
                    {uf.status === "analyzing" ? "🤖 ניתוח AI..." : uf.status === "classifying" ? "🔍 מזהה..." : uf.status === "done" ? `✅ ${uf.classification}` : uf.status === "error" ? "❌ שגיאה" : "⬆️ מעלה..."}
                  </span>
                </div>
                <Progress value={uf.progress} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Lead Banner */}
      {activeLeadId && activeLeadName && (
        <div className="glass-card p-4 bg-primary/5 border border-primary/20 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">📂 מסמכים של: {activeLeadName}</span>
          <Button variant="ghost" size="sm" onClick={() => setActiveLeadId(null)}>הצג הכל</Button>
        </div>
      )}

      {/* Smart Buckets */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {bucketGroups.map((bucket) => (
          <div key={bucket.id} className={cn("glass-card p-5 space-y-3 transition-all", bucket.docs.length > 0 ? "ring-1 ring-primary/20" : "")}>
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", bucket.bg)}>
                <bucket.icon className={cn("w-4 h-4", bucket.color)} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{bucket.label}</h4>
                <p className="text-[11px] text-muted-foreground">{bucket.docs.length} מסמכים</p>
              </div>
            </div>
            {bucket.docs.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {bucket.docs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-secondary/50">
                    <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="truncate text-foreground flex-1">{doc.file_name}</span>
                    <button onClick={() => deleteDocument(doc)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gap Checklist */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">צ׳קליסט מסמכים נדרשים</h3>
        <div className="grid grid-cols-2 gap-2">
          {REQUIRED_DOCS.map((doc) => {
            const found = uploadedClassifications.includes(doc);
            return (
              <div key={doc} className={cn("flex items-center gap-2 p-3 rounded-lg text-sm", found ? "bg-success/10 text-success" : "bg-destructive/5 text-destructive")}>
                {found ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                <span className="font-medium">{doc}</span>
                <span className="text-xs mr-auto opacity-70">{found ? "נמצא" : "חסר"}</span>
              </div>
            );
          })}
        </div>
        {missingDocs.length > 0 && <p className="text-xs text-destructive">חסרים {missingDocs.length} מסמכים — נא להשלים</p>}
      </div>
    </div>
  );
};

export default SmartBuckets;
