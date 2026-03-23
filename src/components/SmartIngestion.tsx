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
  File,
  Image,
  Brain,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const REQUIRED_DOCS = [
  "תלושי שכר",
  "דפי עו\"ש",
  "דו\"ח BDI",
  "חוזה שכירות",
  "צילום ת\"ז",
];

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "classifying" | "analyzing" | "done" | "error";
  classification?: string;
  error?: string;
  docId?: string;
}

function quickClassify(fileName: string): string {
  const lower = fileName.toLowerCase();
  const map: Record<string, string> = {
    "תלוש": "תלושי שכר", "שכר": "תלושי שכר", "salary": "תלושי שכר", "payslip": "תלושי שכר",
    "עוש": "דפי עו\"ש", "בנק": "דפי עו\"ש", "bank": "דפי עו\"ש", "statement": "דפי עו\"ש",
    "bdi": "דו\"ח BDI", "אשראי": "דו\"ח BDI", "credit": "דו\"ח BDI",
    "שכירות": "חוזה שכירות", "lease": "חוזה שכירות", "rent": "חוזה שכירות",
    "נכס": "תמונות נכס", "property": "תמונות נכס",
    "זהות": "צילום ת\"ז", "tz": "צילום ת\"ז", "id": "צילום ת\"ז",
  };
  for (const [keyword, classification] of Object.entries(map)) {
    if (lower.includes(keyword)) return classification;
  }
  if (lower.match(/\.(jpg|jpeg|png|webp|heic)$/)) return "תמונות נכס";
  return "לא מסווג";
}

const SmartIngestion = () => {
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
  const missingDocs = REQUIRED_DOCS.filter(
    (doc) => !uploadedClassifications.includes(doc)
  );

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

  const analyzeDocument = async (docId: string, fileIndex: number) => {
    try {
      setUploadingFiles((prev) =>
        prev.map((f, i) => i === fileIndex ? { ...f, status: "analyzing", progress: 80 } : f)
      );

      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: { document_id: docId },
      });

      if (error) throw error;

      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === fileIndex
            ? { ...f, progress: 100, status: "done", classification: data.classification }
            : f
        )
      );

      if (data.red_flags?.length > 0) {
        toast.warning(`נמצאו ${data.red_flags.length} דגלים אדומים במסמך`, {
          description: data.red_flags.map((f: any) => f.label).join(", "),
        });
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      // Don't fail the upload — just mark analysis as skipped
      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === fileIndex ? { ...f, progress: 100, status: "done" } : f
        )
      );
      toast.info("המסמך הועלה בהצלחה, ניתוח AI ייעשה מאוחר יותר");
    }
  };

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!user) return;
      const validFiles = validateFiles(files);
      if (validFiles.length === 0) return;

      const startIndex = uploadingFiles.length;
      const newUploading: UploadingFile[] = validFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
      }));
      setUploadingFiles((prev) => [...prev, ...newUploading]);

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const classification = quickClassify(file.name);
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const fileIndex = startIndex + i;

        try {
          setUploadingFiles((prev) =>
            prev.map((f, idx) => idx === fileIndex ? { ...f, progress: 20, status: "uploading" } : f)
          );

          const { error: uploadError } = await supabase.storage
            .from("mortgage-documents")
            .upload(filePath, file);
          if (uploadError) throw uploadError;

          setUploadingFiles((prev) =>
            prev.map((f, idx) => idx === fileIndex ? { ...f, progress: 50, status: "classifying" } : f)
          );

          // Save metadata
          const { data: insertedDoc, error: dbError } = await supabase
            .from("documents")
            .insert({
              file_name: file.name,
              file_path: filePath,
              file_type: file.type,
              file_size: file.size,
              classification,
              uploaded_by: user.id,
            } as any)
            .select("id")
            .single();

          if (dbError) throw dbError;

          // Trigger AI analysis
          await analyzeDocument(insertedDoc.id, fileIndex);
        } catch (err: any) {
          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "error", error: err.message } : f
            )
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
    },
    [user, queryClient, uploadingFiles.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleUpload(Array.from(e.dataTransfer.files));
    },
    [handleUpload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleUpload(Array.from(e.target.files));
  };

  const deleteDocument = async (doc: any) => {
    await supabase.storage.from("mortgage-documents").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    queryClient.invalidateQueries({ queryKey: ["my-documents"] });
    toast.success("מסמך נמחק");
  };

  const reanalyze = async (doc: any) => {
    toast.info("מנתח מחדש...");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: { document_id: doc.id },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
      toast.success("ניתוח הושלם בהצלחה");
      if (data.red_flags?.length > 0) {
        toast.warning(`נמצאו ${data.red_flags.length} דגלים אדומים`);
      }
    } catch (err: any) {
      toast.error("שגיאה בניתוח: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary" />
        קליטה חכמה — העלאת מסמכים
        <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
          <Brain className="w-3 h-3" />
          ניתוח AI
        </span>
      </h2>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-primary/[0.02]"
        )}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input id="file-input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileInput} className="hidden" />
        <div className="space-y-3">
          <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">גרור קבצים לכאן או לחץ לבחירה</p>
          <p className="text-sm text-muted-foreground">PDF, JPG, PNG — עד 50 קבצים • ניתוח AI אוטומטי</p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            התקדמות העלאה וניתוח AI
          </h3>
          {uploadingFiles.map((uf, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {uf.status === "done" ? (
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              ) : uf.status === "error" ? (
                <XCircle className="w-4 h-4 text-destructive shrink-0" />
              ) : uf.status === "analyzing" ? (
                <Brain className="w-4 h-4 animate-pulse text-primary shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate text-foreground">{uf.file.name}</span>
                  <span className="text-muted-foreground shrink-0 mr-2">
                    {uf.status === "analyzing" ? "🤖 מנתח AI..." : uf.status === "classifying" ? "מסווג..." : uf.status === "done" ? uf.classification : uf.status === "error" ? "שגיאה" : "מעלה..."}
                  </span>
                </div>
                <Progress value={uf.progress} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gap Checklist */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">צ׳קליסט מסמכים</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
          <p className="text-xs text-destructive">חסרים {missingDocs.length} מסמכים — נא להשלים את ההעלאה</p>
        )}
      </div>

      {/* Uploaded Documents List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : documents.length > 0 ? (
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">מסמכים שהועלו ({documents.length})</h3>
          <div className="space-y-2">
            {documents.map((doc: any) => {
              const hasAnalysis = doc.extracted_data?.analyzed_at;
              const flagCount = Array.isArray(doc.risk_flags) ? doc.risk_flags.length : 0;
              return (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
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
                      <span>{doc.classification}</span>
                      <span>•</span>
                      <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                      {hasAnalysis && (
                        <>
                          <span>•</span>
                          <span className="text-success flex items-center gap-1">
                            <Brain className="w-3 h-3" /> נותח
                          </span>
                        </>
                      )}
                      {flagCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-destructive font-medium">{flagCount} דגלים</span>
                        </>
                      )}
                    </div>
                    {doc.extracted_data?.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{doc.extracted_data.summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!hasAnalysis && (
                      <Button variant="ghost" size="icon" onClick={() => reanalyze(doc)} title="נתח עם AI">
                        <Brain className="w-4 h-4 text-primary" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteDocument(doc)} className="shrink-0">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SmartIngestion;
