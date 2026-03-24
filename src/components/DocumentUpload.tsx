import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, HelpCircle, Building2, Receipt, CreditCard, Home, UserCheck } from "lucide-react";
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

const GUIDE_STEPS = [
  {
    icon: UserCheck,
    title: "צילום תעודת זהות",
    desc: "צלמו את שני הצדדים של ת\"ז + ספח. ודאו שהתמונה ברורה וקריאה.",
  },
  {
    icon: Receipt,
    title: "3 תלושי שכר אחרונים",
    desc: "ניתן להוריד מאזור האישי במקום העבודה או דרך אתר מס הכנסה.",
  },
  {
    icon: Building2,
    title: "דפי עו\"ש (6 חודשים)",
    desc: "היכנסו לאפליקציית הבנק → דפי חשבון → ייצוא ל-PDF. גם חשבון עו\"ש וגם חסכונות.",
  },
  {
    icon: CreditCard,
    title: "דוח BDI / אשראי",
    desc: "ניתן להפיק בחינם באתר check.co.il או דרך הבנק שלכם.",
  },
  {
    icon: Home,
    title: "מסמכי הנכס",
    desc: "חוזה רכישה / שומת מקרקעין / נסח טאבו. צרו קשר עם עורך הדין לקבלתם.",
  },
];

export function DocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>(DEMO_FILES);
  const [isDragging, setIsDragging] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Upload Area */}
      <div className="lg:col-span-2 glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">נשמח לעזור לך לרכז את המסמכים 📋</h3>
        <p className="text-sm text-muted-foreground">גרור את הקבצים לכאן ואנחנו נדאג לסווג אותם אוטומטית. פשוט ומהיר.</p>

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
          <p className="text-sm font-medium text-foreground">שחרר קבצים כאן ואנחנו נטפל בשאר</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG • עד 50 קבצים בבת אחת</p>
        </div>

        {files.length > 0 && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 animate-fade-in"
              >
                <FileText className="w-4 h-4 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{file.name}</p>
                  {file.classification && (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-1">
                      ✓ {file.classification}
                    </span>
                  )}
                </div>
                {file.status === "classified" ? (
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
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

      {/* Helpful Assistant Sidebar */}
      <div className="glass-card p-5 space-y-4 h-fit">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-2 w-full text-right"
        >
          <div className="p-2 rounded-full bg-gold/10">
            <HelpCircle className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-foreground">המדריך שלך 💡</h4>
            <p className="text-[11px] text-muted-foreground">איפה מוצאים כל מסמך?</p>
          </div>
        </button>

        {showGuide && (
          <div className="space-y-3 animate-fade-in">
            {GUIDE_STEPS.map((step, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="p-1.5 rounded-lg bg-gold/10 h-fit shrink-0">
                  <step.icon className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
            <div className="p-3 rounded-lg border border-gold/20 bg-gold/5 text-center">
              <p className="text-xs text-gold">
                💬 צריך עזרה? שלח לנו הודעה ונדריך אותך צעד אחר צעד
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
