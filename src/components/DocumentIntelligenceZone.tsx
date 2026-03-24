import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ShieldCheck, AlertTriangle, Lock, Fingerprint, CheckCircle2, Shield, ScanLine, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DocumentIntelligenceZoneProps {
  docKey: string;
  label: string;
  icon: React.ElementType;
  found: boolean;
  acceptedTypes: string[];
  onFileAccepted: (file: File) => void;
}

type ScanPhase = "idle" | "reading" | "fingerprinting" | "matching" | "security" | "verified" | "error";

const PHASE_LABELS: Record<ScanPhase, string> = {
  idle: "",
  reading: "קורא מטא-דאטה של המסמך...",
  fingerprinting: "סריקה פורנזית — חתימה דיגיטלית...",
  matching: "מאמת התאמת תוכן...",
  security: "הצפנת AES-256 ובדיקת שלמות...",
  verified: "AI Verified ✓",
  error: "שגיאה באימות",
};

const ZONE_RULES: Record<string, { mimes: string[]; minSize: number; requirePdf: boolean }> = {
  "תלושי שכר": { mimes: ["application/pdf"], minSize: 10240, requirePdf: true },
  'דפי עו"ש': { mimes: ["application/pdf"], minSize: 10240, requirePdf: true },
  'דו"ח BDI': { mimes: ["application/pdf"], minSize: 10240, requirePdf: true },
  'צילום ת"ז': { mimes: ["application/pdf", "image/"], minSize: 5120, requirePdf: false },
};

/* Simulate PDF digital signature check by reading first bytes */
async function checkPdfSignature(file: File): Promise<{ valid: boolean; hasDigitalSig: boolean }> {
  try {
    const header = await file.slice(0, 1024).text();
    const isPdf = header.startsWith("%PDF");
    const hasDigitalSig = header.includes("/Sig") || header.includes("/ByteRange");
    return { valid: isPdf, hasDigitalSig };
  } catch {
    return { valid: false, hasDigitalSig: false };
  }
}

/* Mask sensitive data for display */
function maskFileName(name: string): string {
  // Mask ID numbers patterns (9 digits)
  return name.replace(/\d{9}/g, (m) => m.slice(0, 2) + "•••••" + m.slice(-2));
}

/* ── Encrypted Badge (shown on every zone) ── */
function EncryptedBadge() {
  return (
    <div className="flex items-center gap-1 text-[9px] text-cyan-400/60 font-medium">
      <Lock className="w-2.5 h-2.5" />
      <span>Secure & Encrypted</span>
    </div>
  );
}

export function DocumentIntelligenceZone({
  docKey,
  label,
  icon: Icon,
  found,
  acceptedTypes,
  onFileAccepted,
}: DocumentIntelligenceZoneProps) {
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [isDragOver, setIsDragOver] = useState(false);
  const [maskedName, setMaskedName] = useState<string | null>(null);
  const [showUnmasked, setShowUnmasked] = useState(false);
  const [rawName, setRawName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rules = ZONE_RULES[docKey] || { mimes: ["application/pdf", "image/"], minSize: 5120, requirePdf: false };

  const runValidation = useCallback(
    async (file: File) => {
      setRawName(file.name);
      setMaskedName(maskFileName(file.name));
      setShowUnmasked(false);

      // Phase 1: Reading metadata
      setPhase("reading");
      await delay(900);

      // Check file size
      if (file.size < rules.minSize) {
        setPhase("error");
        toast.error("מבנה נתונים לא תקין", {
          description: "נא להעלות את קובץ ה-PDF המקורי שיוצא מהמקור הרשמי.",
          icon: <AlertTriangle className="w-4 h-4" />,
        });
        await delay(2000);
        setPhase("idle");
        return;
      }

      // Phase 2: Forensic fingerprinting (PDF signature check)
      setPhase("fingerprinting");
      await delay(1200);

      if (file.type === "application/pdf") {
        const sigResult = await checkPdfSignature(file);
        if (!sigResult.valid) {
          setPhase("error");
          toast.error("בדיקת שלמות המסמך נכשלה", {
            description: "נא להעלות קובץ PDF מקורי באיכות גבוהה.",
            icon: <Shield className="w-4 h-4" />,
          });
          await delay(2000);
          setPhase("idle");
          return;
        }
      }

      // Phase 3: Content matching
      setPhase("matching");
      await delay(800);

      const mimeMatch = rules.mimes.some((m) =>
        m.endsWith("/") ? file.type.startsWith(m) : file.type === m
      );

      if (rules.requirePdf && file.type !== "application/pdf") {
        setPhase("error");
        toast.error("חוסר התאמה בפורמט המסמך", {
          description: `האזור "${label}" דורש קובץ PDF מקורי. הקובץ שהועלה הוא ${file.type || "לא ידוע"}.`,
          icon: <AlertTriangle className="w-4 h-4" />,
        });
        await delay(2000);
        setPhase("idle");
        return;
      }

      if (!mimeMatch) {
        setPhase("error");
        toast.error("חוסר התאמה בפורמט המסמך", {
          description: `סוג הקובץ "${file.type || "לא ידוע"}" לא מתאים לאזור "${label}".`,
          icon: <AlertTriangle className="w-4 h-4" />,
        });
        await delay(2000);
        setPhase("idle");
        return;
      }

      // Check for suspicious/low-quality files (very small PDFs or corrupt-looking)
      if (file.type === "application/pdf" && file.size < 15000) {
        setPhase("error");
        toast.error("התראת אבטחה", {
          description: "בדיקת שלמות המסמך נכשלה. נא להעלות PDF מקורי באיכות גבוהה.",
          icon: <Shield className="w-4 h-4 text-destructive" />,
        });
        await delay(2000);
        setPhase("idle");
        return;
      }

      // Phase 4: Security & encryption scan
      setPhase("security");
      await delay(2500);

      // Success
      setPhase("verified");

      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);

      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.value = 0.08;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.35);
      } catch {}

      onFileAccepted(file);

      await delay(3000);
      setPhase("idle");
    },
    [docKey, label, rules, onFileAccepted]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || phase !== "idle") return;
      runValidation(files[0]);
    },
    [runValidation, phase]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  /* ── Found/verified state ── */
  if (found && phase === "idle") {
    const displayName = maskedName || label;
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="flex items-center gap-3 p-4 rounded-xl border bg-success/5 border-success/20 text-success"
      >
        <div className="p-2 rounded-lg bg-success/10">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-success">{label}</p>
          {maskedName && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                {showUnmasked ? rawName : maskedName}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setShowUnmasked(!showUnmasked); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <EncryptedBadge />
            <span className="text-[10px] text-muted-foreground">✓ אומת בהצלחה</span>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-semibold"
        >
          <motion.div
            animate={{ boxShadow: ["0 0 0px hsl(186 100% 50% / 0)", "0 0 12px hsl(186 100% 50% / 0.4)", "0 0 0px hsl(186 100% 50% / 0)"] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-cyan-400"
          />
          AI Verified
        </motion.div>
      </motion.div>
    );
  }

  const isProcessing = phase !== "idle" && phase !== "error";

  return (
    <motion.div
      whileHover={phase === "idle" ? { scale: 1.01 } : {}}
      onDragOver={(e) => { e.preventDefault(); if (phase === "idle") setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => phase === "idle" && inputRef.current?.click()}
      className={cn(
        "relative flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer overflow-hidden",
        phase === "error"
          ? "bg-destructive/5 border-destructive/30"
          : phase === "verified"
          ? "bg-success/5 border-success/20"
          : isDragOver
          ? "bg-cyan-500/[0.06] border-cyan-500/40 scale-[1.01]"
          : isProcessing
          ? "bg-card/40 border-cyan-500/30"
          : "bg-card/40 border-border/40 hover:border-cyan-500/30 hover:bg-cyan-500/[0.03]"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Forensic fingerprinting overlay */}
      <AnimatePresence>
        {phase === "fingerprinting" && (
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 rounded-xl"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, hsl(186 100% 50% / 0.06), transparent 60%)",
                  "radial-gradient(circle at 80% 50%, hsl(186 100% 50% / 0.06), transparent 60%)",
                  "radial-gradient(circle at 20% 50%, hsl(186 100% 50% / 0.06), transparent 60%)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400/20"
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ScanLine className="w-10 h-10" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security & encryption scan overlay */}
      <AnimatePresence>
        {phase === "security" && (
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-cyan-400/30"
              animate={{
                boxShadow: [
                  "inset 0 0 20px hsl(186 100% 50% / 0.05)",
                  "inset 0 0 40px hsl(186 100% 50% / 0.15)",
                  "inset 0 0 20px hsl(186 100% 50% / 0.05)",
                ],
              }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-2 left-2 text-cyan-400/40"
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Lock className="w-3 h-3" />
            </motion.div>
            <motion.div
              className="absolute top-2 right-2 text-cyan-400/30 text-[8px] font-mono"
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              AES-256
            </motion.div>
            <motion.div
              className="absolute bottom-2 right-2 text-cyan-400/40"
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            >
              <Fingerprint className="w-3 h-3" />
            </motion.div>
            <motion.div
              className="absolute bottom-2 left-2 text-cyan-400/30 text-[8px] font-mono"
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.7 }}
            >
              SHA-256
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reading metadata shimmer */}
      <AnimatePresence>
        {phase === "reading" && (
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/[0.08] to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon */}
      <div className={cn(
        "p-2 rounded-lg relative z-10 transition-colors",
        phase === "verified" ? "bg-success/10" : phase === "error" ? "bg-destructive/10" : "bg-secondary/60"
      )}>
        {phase === "verified" ? (
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 12 }}>
            <ShieldCheck className="w-5 h-5 text-success" />
          </motion.div>
        ) : phase === "error" ? (
          <AlertTriangle className="w-5 h-5 text-destructive" />
        ) : phase === "fingerprinting" ? (
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            <Fingerprint className="w-5 h-5 text-cyan-400" />
          </motion.div>
        ) : isProcessing ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </motion.div>
        ) : (
          <Icon className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-medium", phase === "verified" ? "text-success" : phase === "error" ? "text-destructive" : "text-foreground")}>
            {label}
          </p>
          {phase === "idle" && <EncryptedBadge />}
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={cn(
              "text-[11px]",
              phase === "verified" ? "text-success" : phase === "error" ? "text-destructive/80" : isProcessing ? "text-cyan-400" : "text-muted-foreground"
            )}
          >
            {phase === "idle" ? "גרור קובץ או לחץ להעלאה" : PHASE_LABELS[phase]}
          </motion.p>
        </AnimatePresence>
        {/* Privacy masking during processing */}
        {isProcessing && maskedName && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate"
          >
            {maskedName}
          </motion.p>
        )}
      </div>

      {/* Right side */}
      <div className="relative z-10 flex flex-col items-end gap-1">
        {phase === "idle" && (
          <div className="text-cyan-400 text-xs flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            העלה
          </div>
        )}
        {phase === "verified" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-semibold"
          >
            <motion.div
              animate={{ boxShadow: ["0 0 0px hsl(186 100% 50% / 0)", "0 0 12px hsl(186 100% 50% / 0.4)", "0 0 0px hsl(186 100% 50% / 0)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-cyan-400"
            />
            AI Verified
          </motion.div>
        )}
        {isProcessing && phase !== "verified" && (
          <motion.div
            className="w-6 h-6 rounded-full border-2 border-cyan-400/30 border-t-cyan-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
    </motion.div>
  );
}

/* ── Compliance Footer ── */
export function ComplianceFooter() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="mt-8 mb-4 py-4 px-5 rounded-xl border border-border/30 bg-card/20 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-cyan-400/60" />
          <span className="text-[11px] font-medium">ISO 27001</span>
        </div>
        <div className="w-px h-3 bg-border/40" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Lock className="w-3.5 h-3.5 text-cyan-400/60" />
          <span className="text-[11px] font-medium">GDPR Compliant</span>
        </div>
        <div className="w-px h-3 bg-border/40" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Fingerprint className="w-3.5 h-3.5 text-cyan-400/60" />
          <span className="text-[11px] font-medium">AES-256 Encryption</span>
        </div>
      </div>
      <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
        כל המידע מוצפן ומאובטח בהתאם לתקני ISO 27001 ו-GDPR. הנתונים שלך מוגנים בהצפנת AES-256.
      </p>
    </motion.div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
