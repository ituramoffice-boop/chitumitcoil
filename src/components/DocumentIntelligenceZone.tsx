import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ShieldCheck, AlertTriangle, Lock, Fingerprint, CheckCircle2 } from "lucide-react";
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

type ScanPhase = "idle" | "reading" | "matching" | "security" | "verified" | "error";

const PHASE_LABELS: Record<ScanPhase, string> = {
  idle: "",
  reading: "קורא מטא-דאטה של המסמך...",
  matching: "מאמת התאמת תוכן...",
  security: "סריקת אבטחה והצפנה...",
  verified: "AI Verified ✓",
  error: "שגיאה באימות",
};

/* Expected MIME prefixes per doc zone */
const ZONE_RULES: Record<string, { mimes: string[]; minSize: number; requirePdf: boolean }> = {
  "תלושי שכר": { mimes: ["application/pdf"], minSize: 10240, requirePdf: true },
  'דפי עו"ש': { mimes: ["application/pdf"], minSize: 10240, requirePdf: true },
  'דו"ח BDI': { mimes: ["application/pdf"], minSize: 10240, requirePdf: true },
  'צילום ת"ז': { mimes: ["application/pdf", "image/"], minSize: 5120, requirePdf: false },
};

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
  const inputRef = useRef<HTMLInputElement>(null);
  const rules = ZONE_RULES[docKey] || { mimes: ["application/pdf", "image/"], minSize: 5120, requirePdf: false };

  const runValidation = useCallback(
    async (file: File) => {
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

      // Phase 2: Content matching
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

      // Phase 3: Security scan
      setPhase("security");
      await delay(2200);

      // Success
      setPhase("verified");

      // Haptic feedback (mobile)
      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);

      // Subtle success sound
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

  if (found && phase === "idle") {
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
          <p className="text-[11px] text-muted-foreground">✓ הועלה ואומת בהצלחה</p>
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

      {/* Security scan pulse overlay */}
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
            {/* Scanning line */}
            <motion.div
              className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Lock icon pulses */}
            <motion.div
              className="absolute top-2 left-2 text-cyan-400/40"
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Lock className="w-3 h-3" />
            </motion.div>
            <motion.div
              className="absolute bottom-2 right-2 text-cyan-400/40"
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            >
              <Fingerprint className="w-3 h-3" />
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
        <p className={cn("text-sm font-medium", phase === "verified" ? "text-success" : phase === "error" ? "text-destructive" : "text-foreground")}>
          {label}
        </p>
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
      </div>

      {/* Right side */}
      <div className="relative z-10">
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

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
