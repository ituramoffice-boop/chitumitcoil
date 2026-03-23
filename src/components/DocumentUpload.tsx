import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  status: "uploading" | "classified" | "error";
  classification?: string;
}

const CLASSIFICATIONS: Record<string, string> = {
  "תלוש_שכר": "תלוש שכר",
  "עו_ש": "דף עו\"ש",
  "אשראי": "דוח אשראי BDI",
  "שכירות": "חוזה שכירות",
  "נכס": "תמונת נכס",
  "ת_ז": "צילום ת\"ז",
};

const DEMO_FILES: UploadedFile[] = [
  { id: "1", name: "תלוש_שכר_ינואר_2024.pdf", type: "pdf", status: "classified", classification: "תלוש שכר" },
  { id: "2", name: "עו_ש_לאומי_Q1.pdf", type: "pdf", status: "classified", classification: "דף עו\"ש" },
  { id: "3", name: "דוח_BDI_2024.pdf", type: "pdf", status: "classified", classification: "דוח אשראי BDI" },
  { id: "4", name: "חוזה_שכירות.pdf", type: "pdf", status: "classified", classification: "חוזה שכירות" },
  { id: "5", name: "צילום_נכס_חזית.jpg", type: "jpg", status: "classified", classification: "תמונת נכס" },
];

export function DocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>(DEMO_FILES);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const classKeys = Object.keys(CLASSIFICATIONS);
    const newFiles: UploadedFile[] = droppedFiles.map((f, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: f.name,
      type: f.name.split(".").pop() || "unknown",
      status: "classified" as const,
      classification: CLASSIFICATIONS[classKeys[Math.floor(Math.random() * classKeys.length)]],
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">העלאת מסמכים</h3>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">גרור ושחרר קבצים כאן</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG • עד 50 קבצים</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 animate-slide-in"
            >
              <FileText className="w-4 h-4 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{file.name}</p>
                {file.classification && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-1">
                    {file.classification}
                  </span>
                )}
              </div>
              {file.status === "classified" ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              ) : file.status === "error" ? (
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              ) : null}
              <button onClick={() => removeFile(file.id)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
