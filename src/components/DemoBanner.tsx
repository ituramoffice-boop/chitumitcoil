import { useNavigate } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import { AnimatePresence, motion } from "framer-motion";
import { X, Shield, Crown } from "lucide-react";
import { ChitumitLogo } from "@/components/ChitumitLogo";

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
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-card/95 border border-gold/30 text-foreground px-5 py-2.5 rounded-full shadow-[0_0_30px_hsl(43,74%,52%,0.15)] backdrop-blur-xl flex items-center gap-3 text-sm font-medium"
      >
        <ChitumitLogo size={16} />
        <Shield className="w-3.5 h-3.5 text-gold" />
        <span className="text-gold font-bold">מערכת מבצעית</span>
        <span className="text-muted-foreground">—</span>
        <span className="text-foreground/80">{roleLabel}</span>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 font-semibold">שליטה מלאה</span>
        <button
          onClick={() => { navigate("/demo"); }}
          className="text-xs text-gold/70 hover:text-gold underline transition-colors"
        >
          החלף תפקיד
        </button>
        <button
          onClick={() => { disableDemo(); navigate("/"); }}
          className="p-1 hover:bg-gold/10 rounded-full transition-colors"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
