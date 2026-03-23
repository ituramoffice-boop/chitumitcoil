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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CLASSIFICATION_MAP: Record<string, string> = {
  "תלוש": "תלושי שכר",
  "שכר": "תלושי שכר",
  "salary": "תלושי שכר",
  "payslip": "תלושי שכר",
  "עוש": "דפי עו\"ש",
  "בנק": "דפי עו\"ש",
  "bank": "דפי עו\"ש",
  "statement": "דפי עו\"ש",
  "bdi": "דו\"ח BDI",
  "אשראי": "דו\"ח BDI",
  "credit": "דו\"ח BDI",
  "שכירות": "חוזה שכירות",
  "lease": "חוזה שכירות",
  "rent": "חוזה שכירות",
  "נכס": "תמונות נכס",
  "property": "תמונות נכס",
  "זהות": "צילום ת\"ז",
  "tz": "צילום ת\"ז",
  "id": "צילום ת\"ז",
};

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
  status: "uploading" | "classifying" | "done" | "error";
  classification?: string;
  error?: string;
}

function classifyFile(fileName: string): string {
  const lower = fileName.toLowerCase();
  for (const [keyword, classification] of Object.entries(CLASSIFICATION_MAP)) {
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
      return (
        ext.endsWith(".pdf") ||
        ext.endsWith(".jpg") ||
        ext.endsWith(".jpeg") ||
        ext.endsWith(".png") ||
        ext.endsWith(".webp")
      );
    });
    if (valid.length < files.length) {
      toast.error("קבצים שאינם PDF או תמונה הוסרו");
    }
    if (valid.length > 50) {
      toast.error("ניתן להעלות עד 50 קבצים בבת אחת");
      return valid.slice(0, 50);
    }
    return valid;
  };

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!user) return;
      const validFiles = validateFiles(files);
      if (validFiles.length === 0) return;

      const newUploading: UploadingFile[] = validFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
      }));
      setUploadingFiles((prev) => [...prev, ...newUploading]);

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const classification = classifyFile(file.name);
        const filePath = `${user.id}/${Date.now()}_${file.name}`;

        try {
          // Upload to storage
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, progress: 30, status: "uploading" } : f
            )
          );

          const { error: uploadError } = await supabase.storage
            .from("mortgage-documents")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, progress: 70, status: "classifying" } : f
            )
          );

          // Save metadata
          const { error: dbError } = await supabase.from("documents").insert({
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            classification,
            uploaded_by: user.id,
          } as any);

          if (dbError) throw dbError;

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? { ...f, progress: 100, status: "done", classification }
                : f
            )
          );
        } catch (err: any) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? { ...f, status: "error", error: err.message }
                : f
            )
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
    },
    [user, queryClient]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      handleUpload(files);
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary" />
        קליטה חכמה — העלאת מסמכים
      </h2>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
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
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="space-y-3">
          <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            גרור קבצים לכאן או לחץ לבחירה
          </p>
          <p className="text-sm text-muted-foreground">
            PDF, JPG, PNG — עד 50 קבצים בבת אחת
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">התקדמות סיווג</h3>
          {uploadingFiles.map((uf, idx) => (
            <div key={idx} className="flex items-center gap-3">
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
                    {uf.status === "classifying"
                      ? "מסווג..."
                      : uf.status === "done"
                      ? uf.classification
                      : uf.status === "error"
                      ? "שגיאה"
                      : "מעלה..."}
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
              <div
                key={doc}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg text-sm",
                  found ? "bg-success/10 text-success" : "bg-destructive/5 text-destructive"
                )}
              >
                {found ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                <span className="font-medium">{doc}</span>
                <span className="text-xs mr-auto opacity-70">
                  {found ? "נמצא" : "חסר"}
                </span>
              </div>
            );
          })}
        </div>
        {missingDocs.length > 0 && (
          <p className="text-xs text-destructive">
            חסרים {missingDocs.length} מסמכים — נא להשלים את ההעלאה
          </p>
        )}
      </div>

      {/* Uploaded Documents List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : documents.length > 0 ? (
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">
            מסמכים שהועלו ({documents.length})
          </h3>
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
              >
                {doc.file_type?.includes("pdf") ? (
                  <FileText className="w-5 h-5 text-destructive shrink-0" />
                ) : doc.file_type?.includes("image") ? (
                  <Image className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <File className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {doc.classification} •{" "}
                    {(doc.file_size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteDocument(doc)}
                  className="shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SmartIngestion;
