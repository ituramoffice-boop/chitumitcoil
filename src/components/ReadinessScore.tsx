import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface ReadinessScoreProps {
  score: number; // 0-100
  className?: string;
}

export function ReadinessScore({ score, className }: ReadinessScoreProps) {
  const getColor = () => {
    if (score >= 80) return { ring: "text-success", bg: "bg-success/10", label: "מוכן למימון" };
    if (score >= 50) return { ring: "text-gold", bg: "bg-gold/10", label: "כמעט מוכן" };
    return { ring: "text-muted-foreground", bg: "bg-secondary", label: "חסרים מסמכים" };
  };
  const c = getColor();
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" strokeWidth="3" className="stroke-border/30" />
          <circle
            cx="20" cy="20" r="18" fill="none" strokeWidth="3"
            className={c.ring.replace("text-", "stroke-")}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
          {score}
        </span>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground">מוכנות</p>
        <p className={cn("text-xs font-semibold", c.ring)}>{c.label}</p>
      </div>
    </div>
  );
}
