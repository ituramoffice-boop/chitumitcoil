import { cn } from "@/lib/utils";

interface CreditMetric {
  label: string;
  value: string;
  status: "good" | "moderate" | "bad";
}

const METRICS: CreditMetric[] = [
  { label: "דירוג משוער", value: "C+", status: "moderate" },
  { label: "יחס החזר", value: "38%", status: "moderate" },
  { label: "מסגרת אשראי מנוצלת", value: "72%", status: "bad" },
  { label: "תשלומים בפיגור", value: "0", status: "good" },
  { label: "הלוואות פעילות", value: "3", status: "moderate" },
  { label: "סה\"כ התחייבויות", value: "₪285,000", status: "moderate" },
];

const statusColors = {
  good: "text-primary",
  moderate: "text-warning",
  bad: "text-destructive",
};

export function CreditSummary() {
  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">תקציר מנהלים – אשראי</h3>
      <div className="grid grid-cols-2 gap-3">
        {METRICS.map((m, i) => (
          <div key={i} className="p-3 rounded-lg bg-secondary/50 space-y-1">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className={cn("text-lg font-bold", statusColors[m.status])}>{m.value}</p>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
        <p className="text-xs text-warning font-medium">המלצת מערכת</p>
        <p className="text-xs text-muted-foreground mt-1">
          מומלץ לסגור הלוואת צריכה אחת (₪850/חודש) לפני הגשה. יחס ההחזר ירד ל-33% ויעלה את סיכויי האישור משמעותית.
        </p>
      </div>
    </div>
  );
}
