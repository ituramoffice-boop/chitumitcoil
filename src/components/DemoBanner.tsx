import { useNavigate, useSearchParams } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import { AnimatePresence, motion } from "framer-motion";
import { X, Shield, Eye, LogIn } from "lucide-react";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { useAuth } from "@/contexts/AuthContext";

export function DemoBanner() {
  const { isDemoMode, demoRole, disableDemo } = useDemo();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isUrlDemo = searchParams.get("demo") === "true";

  const showBanner = isDemoMode || (isUrlDemo && !user);

  if (!showBanner) return null;

  const roleLabel = demoRole === "client" ? "לקוח" : demoRole === "consultant" ? "יועץ" : demoRole === "admin" ? "מנהל" : null;

  const handleClose = () => {
    if (isDemoMode) {
      disableDemo();
      navigate("/");
    } else {
      searchParams.delete("demo");
      setSearchParams(searchParams);
      navigate("/auth");
    }
  };

  // URL demo mode — top fixed banner
  if (isUrlDemo && !isDemoMode) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500/15 via-gold/10 to-amber-500/15 border-b border-gold/30 backdrop-blur-xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between" dir="rtl">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/25">
                <Eye className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-bold text-gold">מצב דמו</span>
              </div>
              <span className="text-xs text-muted-foreground">
                אתה צופה בתצוגה לדוגמה — הנתונים אינם אמיתיים
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/auth")}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 border border-primary/20"
              >
                <LogIn className="w-3 h-3" />
                התחבר לחשבון
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-muted/30 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // DemoContext mode — bottom banner (existing)
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
        {roleLabel && <span className="text-foreground/80">{roleLabel}</span>}
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 font-semibold">שליטה מלאה</span>
        <button
          onClick={() => navigate("/demo")}
          className="text-xs text-gold/70 hover:text-gold underline transition-colors"
        >
          החלף תפקיד
        </button>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-gold/10 rounded-full transition-colors"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
