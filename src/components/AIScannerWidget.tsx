import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, CheckCircle2, Upload, UserPlus, Search } from "lucide-react";

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
export type ScannerType = "payslip" | "pension" | "insurance" | "bank_statement" | "credit_card";

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
  credit_card: {
    edgeFunction: "analyze-credit-card",
    storageBucket: "payslips",
    progressMessages: [
      "הופך קובץ לתמונה לעיבוד...",
      "מזהה הלוואות חוץ-בנקאיות...",
      "מאתר תשלומי ביטוח באשראי...",
      "מסווג חיובים קבועים ומנויים...",
      "מכין סיכום פיננסי ליועץ...",
    ],
    successMessage: "ביקורת כרטיס אשראי הושלמה!",
    acceptFormats: ".pdf,.jpg,.jpeg,.png,.webp",
    uploadLabel: "גררו פירוט כרטיס אשראי לכאן או לחצו להעלאה",
    formatHint: "PDF, JPG, PNG – עד 10MB",
  },
};

// ── Client search result ───────────────────────────────────
interface ClientOption {
  id: string;
  full_name: string;
  phone?: string | null;
}

// ── Generic AI Scanner Widget ──────────────────────────────
interface AIScannerWidgetProps {
  type: ScannerType;
  onSubmit: (data: Record<string, unknown>) => void;
  maxFileSizeMB?: number;
  extraBody?: Record<string, unknown>;
  /** Hide advisor upload even for consultants */
  hideAdvisorUpload?: boolean;
}

export default function AIScannerWidget({
  type,
  onSubmit,
  maxFileSizeMB = 10,
  extraBody,
  hideAdvisorUpload = false,
}: AIScannerWidgetProps) {
  const config = SCANNER_CONFIGS[type];
  const { role, user } = useAuth();
  const isAdvisor = role === "consultant" || role === "admin";

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [progressMsgIdx, setProgressMsgIdx] = useState(0);

  // Advisor upload state
  const [advisorMode, setAdvisorMode] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<ClientOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [searchingClients, setSearchingClients] = useState(false);

  // Cycle progress messages during analysis
  useEffect(() => {
    if (!uploading) return;
    const iv = setInterval(() => {
      setProgressMsgIdx((prev) => (prev + 1) % config.progressMessages.length);
    }, 2500);
    return () => clearInterval(iv);
  }, [uploading, config.progressMessages.length]);

  // Search clients when advisor types
  useEffect(() => {
    if (!advisorMode || clientSearch.length < 2 || !user) return;
    const timer = setTimeout(async () => {
      setSearchingClients(true);
      const { data } = await supabase
        .from("leads")
        .select("id, full_name, phone")
        .or(`full_name.ilike.%${clientSearch}%,phone.ilike.%${clientSearch}%`)
        .limit(5);
      setClientResults(data || []);
      setSearchingClients(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [clientSearch, advisorMode, user]);

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

    // If advisor mode, must select a client
    if (advisorMode && !selectedClient) {
      toast.error("יש לבחור לקוח לפני העלאה");
      return;
    }

    setUploading(true);
    setFileName(file.name);
    setProgressMsgIdx(0);

    try {
      // Upload original to storage (optional — skip for unauthenticated users)
      let filePath = "";
      if (user) {
        filePath = `${crypto.randomUUID()}_${file.name}`;
        console.log(`[Scanner] Uploading to storage: ${filePath}, type: ${file.type}, size: ${file.size}`);
        const { error: uploadError } = await supabase.storage
          .from(config.storageBucket)
          .upload(filePath, file, { contentType: file.type });
        if (uploadError) {
          console.warn("[Scanner] Storage upload failed (non-critical):", uploadError.message);
          // Don't throw — storage is optional for public scanners
        } else {
          console.log("[Scanner] Storage upload successful");
        }
      } else {
        console.log("[Scanner] Skipping storage upload (unauthenticated user)");
      }

      // Convert to base64 images for AI
      let images: { base64: string; mime_type: string }[] = [];

      if (file.type === "application/pdf") {
        console.log("[Scanner] Converting PDF to images...");
        setPdfProgress({ current: 0, total: 0 });
        try {
          const pdfImages = await pdfToBase64Images(file, (current, total) => {
            console.log(`[Scanner] PDF page ${current}/${total}`);
            setPdfProgress({ current, total });
          });
          setPdfProgress(null);
          console.log(`[Scanner] PDF converted: ${pdfImages.length} pages`);
          
          // Limit to first 5 pages to avoid payload size issues
          const maxPages = Math.min(pdfImages.length, 5);
          if (pdfImages.length > 5) {
            console.warn(`[Scanner] PDF has ${pdfImages.length} pages, limiting to first ${maxPages}`);
            toast.info(`ה-PDF מכיל ${pdfImages.length} עמודים – מנתח את 5 הראשונים`);
          }
          images = pdfImages.slice(0, maxPages).map((b64) => ({ base64: b64, mime_type: "image/png" }));
        } catch (pdfErr: any) {
          console.error("[Scanner] PDF conversion failed:", pdfErr);
          setPdfProgress(null);
          toast.error("שגיאה בקריאת ה-PDF – נסו להעלות כתמונה (JPG/PNG)");
          setUploading(false);
          return;
        }
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

      if (images.length === 0) {
        toast.error("לא הצלחנו לחלץ תוכן מהקובץ");
        setUploading(false);
        return;
      }

      // Call the type-specific edge function
      console.log(`[Scanner] Calling edge function: ${config.edgeFunction}, images: ${images.length}`);
      const { data, error: fnError } = await supabase.functions.invoke(config.edgeFunction, {
        body: { images, ...extraBody },
      });
      
      if (fnError) {
        console.error("[Scanner] Edge function error:", fnError);
        throw fnError;
      }
      
      if (data?.error) {
        console.error("[Scanner] Edge function returned error:", data.error);
        toast.error(data.error);
        setUploading(false);
        return;
      }
      
      console.log("[Scanner] Edge function response:", data);

      const analysis = data?.analysis || data;
      
      if (!analysis || (typeof analysis === "object" && Object.keys(analysis).length === 0)) {
        toast.error("הניתוח לא החזיר תוצאות – נסו שנית עם קובץ ברור יותר");
        setUploading(false);
        return;
      }
      
      setUploaded(true);
      setUploading(false);

      // Build result payload
      const resultPayload: Record<string, unknown> = {
        tool: `${type}_scan`,
        file_path: filePath,
        ai_analysis: analysis,
      };

      // Tag advisor uploads
      if (advisorMode && selectedClient) {
        resultPayload.uploaded_by_advisor = true;
        resultPayload.advisor_user_id = user?.id;
        resultPayload.client_lead_id = selectedClient.id;
        resultPayload.client_name = selectedClient.full_name;

        // Save analysis to the lead's ai_analysis field
        await supabase
          .from("leads")
          .update({
            ai_analysis: {
              ...(typeof analysis === "object" ? analysis : {}),
              _scan_type: type,
              _uploaded_by: "advisor",
              _scan_date: new Date().toISOString(),
            },
          })
          .eq("id", selectedClient.id);
      }

      // Trigger email notification to advisor after scan completion
      if (user && analysis) {
        const wowAlerts = analysis.wow_alerts || analysis.key_findings || [];
        const findingsCount = (wowAlerts.length || 0) + (analysis.risks?.length || 0);
        const clientName = advisorMode && selectedClient ? selectedClient.full_name : "לקוח אנונימי";

        // Fetch advisor profile for email
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.email) {
          supabase.functions.invoke("send-email", {
            body: {
              type: "new_lead",
              to: profile.email,
              data: {
                name: clientName,
                scan_type: type === "payslip" ? "תלוש שכר" : type === "bank_statement" ? "דף בנק" : type === "credit_card" ? "כרטיס אשראי" : type === "pension" ? "פנסיה" : "ביטוח",
                wow_alerts: wowAlerts,
                from: "חיתומית SCORE <reports@chitumit.co.il>",
              },
            },
          }).catch((e: any) => console.warn("[Scanner] Email notification failed:", e));
        }

        // Send analysis_ready email to client if they have an email
        if (advisorMode && selectedClient?.email && analysis) {
          const clientWowAlerts = analysis.wow_alerts || analysis.key_findings || [];
          const clientFindingsCount = (clientWowAlerts.length || 0) + (analysis.risks?.length || 0);
          const scanTypeHeb = type === "payslip" ? "תלוש שכר" : type === "bank_statement" ? "דף בנק" : type === "credit_card" ? "כרטיס אשראי" : type === "pension" ? "פנסיה" : "ביטוח";
          const reportLink = `${window.location.origin}/client-dashboard`;

          supabase.functions.invoke("send-email", {
            body: {
              type: "analysis_ready",
              to: selectedClient.email,
              data: {
                client_name: selectedClient.full_name,
                scan_type: scanTypeHeb,
                findings_count: clientFindingsCount,
                wow_alerts: clientWowAlerts,
                link: reportLink,
                from: "חיתומית SCORE <reports@chitumit.co.il>",
              },
            },
          }).catch((e: any) => console.warn("[Scanner] Client email notification failed:", e));
        }
      }

      onSubmit(resultPayload);
    } catch (err: any) {
      console.error(`${type} scanner error:`, err);
      setUploading(false);
      toast.error("שגיאה בניתוח – נסו שנית");
    }
  }, [type, config, maxFileSizeMB, onSubmit, extraBody, advisorMode, selectedClient, user]);

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
      {/* Advisor Upload Toggle */}
      {isAdvisor && !hideAdvisorUpload && !uploading && !uploaded && (
        <div className="space-y-3">
          <Button
            variant={advisorMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setAdvisorMode(!advisorMode);
              setSelectedClient(null);
              setClientSearch("");
              setClientResults([]);
            }}
            className="w-full gap-2 text-xs"
          >
            <UserPlus className="w-4 h-4" />
            {advisorMode ? "ביטול מצב יועץ" : "העלאה עבור לקוח"}
          </Button>

          {advisorMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              {selectedClient ? (
                <div className="flex items-center justify-between bg-accent/10 border border-accent/20 rounded-lg px-3 py-2">
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">{selectedClient.full_name}</span>
                    {selectedClient.phone && (
                      <span className="text-muted-foreground mr-2 text-xs"> · {selectedClient.phone}</span>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[10px]">נבחר</Badge>
                  <button
                    onClick={() => { setSelectedClient(null); setClientSearch(""); }}
                    className="text-xs text-muted-foreground hover:text-foreground mr-2"
                  >
                    שנה
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="חפש לקוח לפי שם או טלפון..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pr-9 text-sm"
                      dir="rtl"
                    />
                  </div>
                  {searchingClients && (
                    <p className="text-xs text-muted-foreground text-center">מחפש...</p>
                  )}
                  {clientResults.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      {clientResults.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => {
                            setSelectedClient(client);
                            setClientSearch("");
                            setClientResults([]);
                          }}
                          className="w-full text-right px-3 py-2 hover:bg-accent/10 transition-colors border-b border-border last:border-0 text-sm"
                        >
                          <span className="font-medium text-foreground">{client.full_name}</span>
                          {client.phone && (
                            <span className="text-muted-foreground mr-2 text-xs">{client.phone}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {clientSearch.length >= 2 && clientResults.length === 0 && !searchingClients && (
                    <p className="text-xs text-muted-foreground text-center">לא נמצאו לקוחות</p>
                  )}
                </>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Upload Zone */}
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
            {advisorMode && selectedClient && (
              <Badge variant="outline" className="text-[10px]">
                סריקה עבור: {selectedClient.full_name}
              </Badge>
            )}
          </motion.div>
        ) : uploaded ? (
          <div className="space-y-2">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-green-400 font-bold">{config.successMessage}</p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
            {advisorMode && selectedClient && (
              <Badge className="bg-accent/20 text-accent border-accent/30 text-[10px]">
                הועלה עבור: {selectedClient.full_name}
              </Badge>
            )}
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
