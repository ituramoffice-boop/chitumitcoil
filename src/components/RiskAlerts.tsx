import { AlertTriangle, ShieldAlert, Search, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  source: string;
}

const ALERTS: Alert[] = [
  {
    severity: "critical",
    title: "זוהו 3 אירועי אכ\"מ",
    description: "נמצאו 3 אירועי אי-כיסוי מספיק בעו\"ש בנק לאומי בחודשים ינואר-מרץ 2024",
    source: "דף עו\"ש – בנק לאומי",
  },
  {
    severity: "warning",
    title: "הלוואה נסתרת",
    description: "זוהתה הוראת קבע של ₪1,200/חודש ל\"קרן השתלמות\" שאינה מופיעה בתלוש השכר",
    source: "הצלבה עו\"ש ↔ תלוש",
  },
  {
    severity: "warning",
    title: "אי-התאמת נטו",
    description: "פער של ₪340 בין הנטו בתלוש (₪14,200) לזיכוי בעו\"ש (₪13,860)",
    source: "הצלבה תלוש ↔ עו\"ש",
  },
  {
    severity: "info",
    title: "דירוג אשראי נמוך",
    description: "דירוג BDI משוער: C+. נקודות תורפה: 2 חריגות אשראי, יתרת אשראי גבוהה",
    source: "דוח BDI",
  },
];

const severityConfig = {
  critical: {
    icon: ShieldAlert,
    border: "border-destructive/40",
    bg: "bg-destructive/5",
    badge: "bg-destructive/20 text-destructive",
    label: "קריטי",
    glow: "glow-danger",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-warning/40",
    bg: "bg-warning/5",
    badge: "bg-warning/20 text-warning",
    label: "אזהרה",
    glow: "",
  },
  info: {
    icon: Search,
    border: "border-accent/40",
    bg: "bg-accent/5",
    badge: "bg-accent/20 text-accent",
    label: "לתשומת לב",
    glow: "",
  },
};

export function RiskAlerts() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingDown className="w-5 h-5 text-destructive" />
        <h3 className="text-lg font-semibold text-foreground">התראות סיכון</h3>
        <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs font-bold animate-pulse-glow">
          {ALERTS.filter(a => a.severity === "critical").length} קריטיות
        </span>
      </div>

      <div className="space-y-3">
        {ALERTS.map((alert, i) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;
          return (
            <div
              key={i}
              className={cn(
                "p-4 rounded-lg border transition-all hover:scale-[1.01]",
                config.border,
                config.bg,
                config.glow
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", config.badge.split(" ")[1])} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{alert.title}</span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", config.badge)}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
                  <p className="text-[10px] text-muted-foreground/70">מקור: {alert.source}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
