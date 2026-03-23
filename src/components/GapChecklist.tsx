import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  label: string;
  status: "found" | "missing" | "warning";
  detail?: string;
}

const CHECKLIST: ChecklistItem[] = [
  { label: "תלושי שכר (3 חודשים)", status: "found", detail: "ינואר-מרץ 2024" },
  { label: "דפי עו\"ש (6 חודשים)", status: "warning", detail: "חסר חודש פברואר" },
  { label: "דוח אשראי BDI", status: "found", detail: "עדכני ל-03/2024" },
  { label: "חוזה שכירות", status: "found", detail: "תקף עד 12/2024" },
  { label: "צילום ת\"ז", status: "missing", detail: "נדרש העלאה" },
  { label: "תמונות נכס", status: "found", detail: "5 תמונות" },
  { label: "אישור זכויות / נסח טאבו", status: "missing", detail: "נדרש העלאה" },
];

const statusConfig = {
  found: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
  missing: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
};

export function GapChecklist() {
  const found = CHECKLIST.filter(i => i.status === "found").length;
  const total = CHECKLIST.length;
  const pct = Math.round((found / total) * 100);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">שלמות תיק</h3>
        <span className={cn("text-sm font-bold", pct >= 80 ? "text-primary" : "text-warning")}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-2">
        {CHECKLIST.map((item, i) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
              <div className={cn("p-1 rounded-md", config.bg)}>
                <Icon className={cn("w-4 h-4", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{item.label}</p>
                {item.detail && (
                  <p className={cn("text-xs", config.color)}>{item.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
