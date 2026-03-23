import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// AI-simulated classification (ignores filenames, simulates content-based ID)
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
  status: "uploading" | "classifying" | "done" | "error";
  classification?: string;
  targetBucket?: string;
}

function classifyByContent(file: File): { classification: string; bucketId: string; extractedData: Record<string, any> } {
  const lower = file.name.toLowerCase();
  
  // Simulate AI content analysis — in production, this would call OCR + LLM
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
  
  // Fallback: classify images as property, PDFs as unclassified
  if (file.type.includes("image")) {
    return { classification: "מסמכי נכס", bucketId: "property", extractedData: {} };
  }
  return { classification: "לא מסווג", bucketId: "other", extractedData: {} };
}

const SmartBuckets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
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

  const handleUpload = useCallback(async (files: File[]) => {
    if (!user) return;
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    const newUploading: UploadingFile[] = validFiles.map((file) => ({
      file, progress: 0, status: "uploading" as const,
    }));
    setUploadingFiles((prev) => [...prev, ...newUploading]);

    for (const file of validFiles) {
      const { classification, extractedData } = classifyByContent(file);
      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      try {
        setUploadingFiles((prev) => prev.map((f) => f.file === file ? { ...f, progress: 30, status: "uploading" } : f));

        const { error: uploadError } = await supabase.storage.from("mortgage-documents").upload(filePath, file);
        if (uploadError) throw uploadError;

        setUploadingFiles((prev) => prev.map((f) => f.file === file ? { ...f, progress: 70, status: "classifying" } : f));

        // Simulate AI classification delay
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 800));

        const { error: dbError } = await supabase.from("documents").insert({
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          classification,
          uploaded_by: user.id,
          extracted_data: extractedData,
          risk_flags: extractedData.hasReturns ? [{ type: "אכ\"מ", count: extractedData.returnCount }] : [],
        } as any);

        if (dbError) throw dbError;

        setUploadingFiles((prev) => prev.map((f) =>
          f.file === file ? { ...f, progress: 100, status: "done", classification, targetBucket: classification } : f
        ));
      } catch (err: any) {
        setUploadingFiles((prev) => prev.map((f) => f.file === file ? { ...f, status: "error" } : f));
      }
    }

    queryClient.invalidateQueries({ queryKey: ["my-documents"] });
  }, [user, queryClient]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleUpload(Array.from(e.dataTransfer.files));
  }, [handleUpload]);

  const deleteDocument = async (doc: any) => {
    await supabase.storage.from("mortgage-documents").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    queryClient.invalidateQueries({ queryKey: ["my-documents"] });
    toast.success("מסמך נמחק");
  };

  // Group docs into buckets
  const bucketGroups = BUCKET_CONFIG.map((bucket) => ({
    ...bucket,
    docs: documents.filter((d: any) => d.classification === bucket.label),
  }));

  return (
    <div className="space-y-6">
      {/* Massive Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer relative overflow-hidden",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01] shadow-xl"
            : "border-border hover:border-primary/50 hover:bg-primary/[0.02]"
        )}
        onClick={() => document.getElementById("file-input-smart")?.click()}
      >
        <input
          id="file-input-smart"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => { if (e.target.files) handleUpload(Array.from(e.target.files)); }}
          className="hidden"
        />
        <div className="space-y-4">
          <div className="p-5 rounded-full bg-primary/10 w-fit mx-auto">
            <Upload className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">
            זרוק את כל הקבצים כאן
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            אין צורך לשנות שמות קבצים — המערכת מזהה את סוג המסמך אוטומטית לפי תוכן
          </p>
          <p className="text-sm text-muted-foreground">
            PDF, JPG, PNG — עד 50 קבצים בבת אחת
          </p>
        </div>
      </div>

      {/* Upload Progress with Smart Bucket Animation */}
      {uploadingFiles.length > 0 && (
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-primary" />
            סיווג חכם בתהליך...
          </h3>
          {uploadingFiles.map((uf, idx) => (
            <div key={idx} className="flex items-center gap-3 animate-slide-in">
              {uf.status === "done" ? (
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              ) : uf.status === "error" ? (
                <XCircle className="w-4 h-4 text-destructive shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate text-foreground">{uf.file.name}</span>
                  <span className="text-muted-foreground shrink-0 mr-2">
                    {uf.status === "classifying" ? "🔍 מזהה תוכן..." : uf.status === "done" ? `✅ ${uf.classification}` : uf.status === "error" ? "❌ שגיאה" : "⬆️ מעלה..."}
                  </span>
                </div>
                <Progress value={uf.progress} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Smart Buckets Visual */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {bucketGroups.map((bucket) => (
          <div
            key={bucket.id}
            className={cn(
              "glass-card p-5 space-y-3 transition-all",
              bucket.docs.length > 0 ? "ring-1 ring-primary/20" : ""
            )}
          >
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
        {missingDocs.length > 0 && (
          <p className="text-xs text-destructive">חסרים {missingDocs.length} מסמכים — נא להשלים</p>
        )}
      </div>
    </div>
  );
};

export default SmartBuckets;
