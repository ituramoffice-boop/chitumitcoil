import { Link } from "react-router-dom";
import { ChitumitLogo } from "@/components/ChitumitLogo";

interface PublicFooterProps {
  className?: string;
  activePage?: "terms" | "privacy" | "accessibility";
}

export function PublicFooter({ className = "", activePage }: PublicFooterProps) {
  return (
    <footer className={`relative z-10 border-t border-gold/10 py-8 px-4 text-center text-sm text-muted-foreground ${className}`}>
      <div className="max-w-5xl mx-auto space-y-3">
        <p className="flex items-center justify-center gap-2">
          <ChitumitLogo size={18} />
          <span>© 2026 חיתומית — <span className="text-gold/50">הבינה שמאחורי האישור</span></span>
        </p>
        <div className="flex items-center justify-center gap-4 text-xs">
          {activePage === "terms" ? (
            <span className="text-gold">תנאי שימוש</span>
          ) : (
            <Link to="/terms" className="hover:text-gold transition-colors">תנאי שימוש</Link>
          )}
          <span className="text-gold/20">·</span>
          {activePage === "privacy" ? (
            <span className="text-gold">מדיניות פרטיות</span>
          ) : (
            <Link to="/privacy" className="hover:text-gold transition-colors">מדיניות פרטיות</Link>
          )}
          <span className="text-gold/20">·</span>
          {activePage === "accessibility" ? (
            <span className="text-gold">הצהרת נגישות</span>
          ) : (
            <Link to="/accessibility" className="hover:text-gold transition-colors">הצהרת נגישות</Link>
          )}
        </div>
      </div>
    </footer>
  );
}
