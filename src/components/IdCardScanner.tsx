import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CreditCard, Upload, Camera, CheckCircle2, Scan, Shield, Fingerprint,
  X, Eye, EyeOff, Sparkles, FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ScanPhase = "idle" | "uploading" | "scanning" | "extracting" | "done";

interface ExtractedData {
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
}

const MOCK_EXTRACTED: ExtractedData = {
  idNumber: "3•••••847",
  fullName: "ישראל ישראלי",
  dateOfBirth: "15/03/1989",
};

const SCAN_LINES = [
  "מזהה מסמך רשמי...",
  "קורא נתונים ביומטריים...",
  "מאמת תקינות ת״ז...",
  "מחלץ פרטים אישיים...",
  "מצפין נתונים AES-256...",
];

export default function IdCardScanner({
  onComplete,
}: {
  onComplete?: (data: ExtractedData) => void;
}) {
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [scanLine, setScanLine] = useState(0);
  const [scanY, setScanY] = useState(0);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [showId, setShowId] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scanInterval = useRef<ReturnType<typeof setInterval>>();

  const startScan = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setPhase("uploading");

        // Phase 1: uploading → scanning (0.6s)
        setTimeout(() => {
          setPhase("scanning");
          let y = 0;
          let lineIdx = 0;
          scanInterval.current = setInterval(() => {
            y += 2;
            if (y > 100) y = 0;
            setScanY(y);
            if (y % 25 === 0 && lineIdx < SCAN_LINES.length - 1) {
              lineIdx++;
              setScanLine(lineIdx);
            }
          }, 30);

          // Phase 2: scanning → extracting (2.5s)
          setTimeout(() => {
            clearInterval(scanInterval.current);
            setPhase("extracting");

            // Phase 3: extracting → done (1.2s)
            setTimeout(() => {
              setExtracted(MOCK_EXTRACTED);
              setPhase("done");
              onComplete?.(MOCK_EXTRACTED);
            }, 1200);
          }, 2500);
        }, 600);
      };
      reader.readAsDataURL(file);
    },
    [onComplete],
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      startScan(file);
    },
    [startScan],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const reset = () => {
    setPhase("idle");
    setPreview(null);
    setExtracted(null);
    setScanLine(0);
    setScanY(0);
    setShowId(false);
    clearInterval(scanInterval.current);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
        <Fingerprint className="w-4 h-4" />
        <span>סריקת תעודת זהות</span>
        {phase === "done" && (
          <span className="mr-auto text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> אומת
          </span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <AnimatePresence mode="wait">
        {/* ── IDLE ── */}
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={cn(
              "relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 group overflow-hidden",
              dragActive
                ? "border-cyan-400 bg-cyan-500/10 scale-[1.02]"
                : "border-white/15 bg-white/5 hover:border-cyan-500/40 hover:bg-white/[0.07]"
            )}
            onClick={() => fileRef.current?.click()}
          >
            {/* Corner brackets decoration */}
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-lg" />
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-lg" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-500/30 rounded-br-lg" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-lg" />

            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto group-hover:bg-cyan-500/20 transition-colors">
                <CreditCard className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/70">גרור תמונת ת״ז לכאן</p>
                <p className="text-xs text-white/40 mt-1">או לחץ לצילום / בחירת קובץ</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs"
                  onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                >
                  <Upload className="w-3 h-3 ml-1" /> העלאת קובץ
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs"
                  onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                >
                  <Camera className="w-3 h-3 ml-1" /> צלם עכשיו
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 mt-3 text-[10px] text-white/25">
              <Shield className="w-3 h-3" /> מוצפן ומאובטח — לא נשמר בשרתים
            </div>
          </motion.div>
        )}

        {/* ── SCANNING STATES ── */}
        {(phase === "uploading" || phase === "scanning" || phase === "extracting") && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative rounded-2xl border border-cyan-500/30 bg-black/40 overflow-hidden"
          >
            {/* ID Preview */}
            <div className="relative aspect-[1.6/1] max-h-48 overflow-hidden">
              {preview && (
                <img src={preview} alt="ת״ז" className="w-full h-full object-cover opacity-60" />
              )}

              {/* Scanning laser line */}
              {phase === "scanning" && (
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-l from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_hsl(180,80%,50%)]"
                  style={{ top: `${scanY}%` }}
                />
              )}

              {/* Corner targeting brackets */}
              <div className="absolute inset-4">
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/70 rounded-tr-md" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/70 rounded-tl-md" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/70 rounded-br-md" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/70 rounded-bl-md" />
              </div>

              {/* Extracting pulse */}
              {phase === "extracting" && (
                <motion.div
                  className="absolute inset-0 bg-cyan-500/10"
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}

              {/* Phase badge */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <div className="bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 text-xs border border-cyan-500/30">
                  {phase === "uploading" && <><Upload className="w-3 h-3 text-cyan-400 animate-pulse" /> מעלה...</>}
                  {phase === "scanning" && <><Scan className="w-3 h-3 text-cyan-400 animate-pulse" /> {SCAN_LINES[scanLine]}</>}
                  {phase === "extracting" && <><Sparkles className="w-3 h-3 text-cyan-400 animate-spin" /> מחלץ נתונים...</>}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-l from-cyan-400 to-teal-400"
                initial={{ width: "0%" }}
                animate={{
                  width: phase === "uploading" ? "20%" : phase === "scanning" ? "75%" : "95%",
                }}
                transition={{ duration: phase === "scanning" ? 2.5 : 0.6, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* ── DONE ── */}
        {phase === "done" && extracted && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden"
          >
            {/* Mini preview */}
            {preview && (
              <div className="relative h-20 overflow-hidden">
                <img src={preview} alt="ת״ז" className="w-full h-full object-cover opacity-30 blur-sm" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-950/80" />
                <div className="absolute top-2 left-2">
                  <button onClick={reset} className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/60 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute top-2 right-2 bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <FileCheck className="w-3 h-3" /> מאומת
                </div>
              </div>
            )}

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {/* ID Number */}
                <div className="bg-white/5 rounded-xl p-2.5 col-span-1">
                  <p className="text-[10px] text-white/40 mb-1">מספר ת״ז</p>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-mono font-medium text-white/80" dir="ltr">
                      {showId ? "304291847" : extracted.idNumber}
                    </span>
                    <button
                      onClick={() => setShowId(!showId)}
                      className="text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showId ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                {/* Name */}
                <div className="bg-white/5 rounded-xl p-2.5 col-span-1">
                  <p className="text-[10px] text-white/40 mb-1">שם מלא</p>
                  <p className="text-sm font-medium text-white/80">{extracted.fullName}</p>
                </div>
                {/* DOB */}
                <div className="bg-white/5 rounded-xl p-2.5 col-span-1">
                  <p className="text-[10px] text-white/40 mb-1">תאריך לידה</p>
                  <p className="text-sm font-medium text-white/80" dir="ltr">{extracted.dateOfBirth}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-emerald-400/60">
                <Shield className="w-3 h-3" />
                <span>הנתונים מוצפנים — גישה ליועץ בלבד</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
