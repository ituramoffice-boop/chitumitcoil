import { ShieldCheck } from "lucide-react";

export function AccessibilityBadge() {
  return (
    <a
      href="/accessibility"
      aria-label="הצהרת נגישות"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full bg-card/90 backdrop-blur-xl border border-gold/20 text-gold text-xs font-medium shadow-lg hover:shadow-gold/20 hover:border-gold/40 transition-all duration-200 group"
    >
      <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
      <span className="hidden sm:inline">נגישות</span>
    </a>
  );
}
