import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brain, CheckCircle2, Upload } from "lucide-react";

// ── PDF to Image converter ─────────────────────────────────
async function pdfToBase64Images(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const images: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(i, totalPages);
    const page = await pdf.getPage(i);
    const scale = 2;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL("image/png").split(",")[1]);
  }

  return images;
}

// ── Scanner type configs ───────────────────────────────────
export type ScannerType = "payslip" | "pension" | "insurance" | "bank_statement";

interface ScannerTypeConfig {
  edgeFunction: string;
  storageBucket: string;
  progressMessages: string[];
  successMessage: string;
  acceptFormats: string;
  uploadLabel: string;
  formatHint: string;
}

const SCANNER_CONFIGS: Record<ScannerType, ScannerTypeConfig> = {
  payslip: {
    edgeFunction: "analyze-payslip",
    storageBucket: "payslips",
    progressMessages: [
      "הופך קובץ לתמונה לעיבוד...",
      "סורק הפרשות פנסיוניות מול החוק...",
      "מזהה כפילויות ביטוח וחוסרים...",
      "מכין סיכום מנהלים ליועץ...",
    ],
    successMessage: "ביקורת תלוש הושלמה!",
    acceptFormats: ".pdf,.jpg,.jpeg,.png,.webp",
    uploadLabel: "גררו תלוש לכאן או לחצו להעלאה",
    formatHint: "PDF, JPG, PNG – עד 10MB",
  },
  pension: {
    edgeFunction: "analyze-pension",
    storageBucket: "payslips",
    progressMessages: [
      "הופך קובץ לתמונה לעיבוד...",
      "סורק דוח פנסיה שנתי...",
      "מחשב תשואות ודמי ניהול...",
      "מכין סיכום פנסיוני ליועץ...",
    ],
    successMessage: "ביקורת פנסיה הושלמה!",
    acceptFormats: ".pdf,.jpg,.jpeg,.png,.webp",
    uploadLabel: "גררו דוח פנסיה לכאן או לחצו להעלאה",
    formatHint: "PDF, JPG, PNG – עד 10MB",
  },
  insurance: {
    edgeFunction: "analyze-insurance",
    storageBucket: "payslips",
    progressMessages: [
      "הופך קובץ לתמונה לעיבוד...",
      "סורק פוליסות ביטוח...",
      "מזהה כפילויות וחוסרים בכיסוי...",
      "מכין סיכום ביטוחי ליועץ...",
    ],
    successMessage: "ביקורת ביטוח הושלמה!",
    acceptFormats: ".pdf,.jpg,.jpeg,.png,.webp",
    uploadLabel: "גררו מסמך ביטוח לכאן או לחצו להעלאה",
    formatHint: "PDF, JPG, PNG – עד 10MB",
  },
  bank_statement: {
    edgeFunction: "analyze-bank-statement",
    storageBucket: "payslips",
    progressMessages: [
      "הופך קובץ לתמונה לעיבוד...",
      "סורק תנועות עו״ש וזיכויים...",
      "מזהה תשלומי משכנתא וביטוח...",
      "מחשב יחס התחייבויות להכנסה...",
      "מצליב נתונים מול תלוש שכר...",
    ],
    successMessage: "ביקורת עו״ש הושלמה!",
    acceptFormats: ".pdf,.jpg,.jpeg,.png,.webp",
    uploadLabel: "גררו דף חשבון בנק לכאן או לחצו להעלאה",
    formatHint: "PDF, JPG, PNG – עד 10MB",
  },
};

// ── Generic AI Scanner Widget ──────────────────────────────
interface AIScannerWidgetProps {
  type: ScannerType;
  onSubmit: (data: Record<string, unknown>) => void;
  maxFileSizeMB?: number;
  /** Extra fields to send in the edge function body (e.g. payslip_analysis for cross-ref) */
  extraBody?: Record<string, unknown>;
}

export default function AIScannerWidget({
  type,
  onSubmit,
  maxFileSizeMB = 10,
  extraBody,
}: AIScannerWidgetProps) {
  const config = SCANNER_CONFIGS[type];
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [progressMsgIdx, setProgressMsgIdx] = useState(0);

  // Cycle progress messages during analysis
  useEffect(() => {
    if (!uploading) return;
    const iv = setInterval(() => {
      setProgressMsgIdx((prev) => (prev + 1) % config.progressMessages.length);
    }, 2500);
    return () => clearInterval(iv);
  }, [uploading, config.progressMessages.length]);

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    const maxSize = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`הקובץ גדול מדי – עד ${maxFileSizeMB}MB`);
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("פורמט לא נתמך – PDF, JPG, PNG בלבד");
      return;
    }

    setUploading(true);
    setFileName(file.name);
    setProgressMsgIdx(0);

    try {
      // Upload original to storage
      const filePath = `${crypto.randomUUID()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(config.storageBucket)
        .upload(filePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      // Convert to base64 images for AI
      let images: { base64: string; mime_type: string }[] = [];

      if (file.type === "application/pdf") {
        setPdfProgress({ current: 0, total: 0 });
        const pdfImages = await pdfToBase64Images(file, (current, total) => {
          setPdfProgress({ current, total });
        });
        setPdfProgress(null);
        images = pdfImages.map((b64) => ({ base64: b64, mime_type: "image/png" }));
      } else {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        images = [{ base64, mime_type: file.type }];
      }

      // Call the type-specific edge function
      const { data, error: fnError } = await supabase.functions.invoke(config.edgeFunction, {
        body: { images, ...extraBody },
      });
      if (fnError) throw fnError;

      const analysis = data?.analysis || data;
      setUploaded(true);
      setUploading(false);

      onSubmit({
        tool: `${type}_scan`,
        file_path: filePath,
        ai_analysis: analysis,
      });
    } catch (err: any) {
      console.error(`${type} scanner error:`, err);
      setUploading(false);
      toast.error("שגיאה בניתוח – נסו שנית");
    }
  }, [type, config, maxFileSizeMB, onSubmit]);

  const handleFileSelect = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = config.acceptFormats;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) processFile(file);
    };
    input.click();
  }, [processFile, config.acceptFormats]);

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          dragging
            ? "border-accent bg-accent/10 scale-[1.02]"
            : uploaded
              ? "border-green-500 bg-green-500/10"
              : uploading
                ? "border-accent/50 bg-accent/5"
                : "border-border hover:border-accent/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) processFile(file);
        }}
        onClick={() => !uploading && !uploaded && handleFileSelect()}
      >
        {uploading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <Brain className="w-12 h-12 text-accent mx-auto animate-pulse" />
            <p className="text-accent font-bold text-sm">
              {pdfProgress && pdfProgress.total > 0
                ? `ממיר עמוד ${pdfProgress.current} מתוך ${pdfProgress.total}...`
                : config.progressMessages[progressMsgIdx]}
            </p>
            <Progress
              value={
                pdfProgress && pdfProgress.total > 0
                  ? Math.round((pdfProgress.current / pdfProgress.total) * 100)
                  : undefined
              }
              className="h-2 w-48 mx-auto"
            />
            <p className="text-xs text-muted-foreground">{fileName}</p>
          </motion.div>
        ) : uploaded ? (
          <div className="space-y-2">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-green-400 font-bold">{config.successMessage}</p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-foreground font-semibold">{config.uploadLabel}</p>
            <p className="text-xs text-muted-foreground">{config.formatHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
