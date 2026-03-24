import { useNavigate } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function DemoBanner() {
  const { isDemoMode, demoRole, disableDemo } = useDemo();
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  const roleLabel = demoRole === "client" ? "לקוח" : demoRole === "consultant" ? "יועץ" : "מנהל";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-warning/90 text-warning-foreground px-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-3 text-sm font-medium"
      >
        <span>⚡ מצב דמו — תפקיד: {roleLabel}</span>
        <button
          onClick={() => { navigate("/demo"); }}
          className="underline text-xs hover:opacity-80"
        >
          החלף תפקיד
        </button>
        <button
          onClick={() => { disableDemo(); navigate("/"); }}
          className="p-1 hover:bg-black/10 rounded-full"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
