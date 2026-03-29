import { AlertTriangle, Sparkles, Flame, ThermometerSun, Snowflake, Shield, TrendingUp } from "lucide-react";

type HeatStatus = "hot" | "warm" | "cold";

const HEAT_CONFIG: Record<HeatStatus, { label: string; icon: any; bg: string; text: string; border: string }> = {
  hot: { label: "חם 🔥", icon: Flame, bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/30" },
  warm: { label: "פושר", icon: ThermometerSun, bg: "bg-warning/15", text: "text-warning", border: "border-warning/30" },
  cold: { label: "קר ❄️", icon: Snowflake, bg: "bg-primary/15", text: "text-primary", border: "border-primary/30" },
};

export function getHeatFromScore(score: number | null): HeatStatus {
  if (!score) return "cold";
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

export function HeatTag({ score, override }: { score: number | null; override?: HeatStatus }) {
  const heat = override || getHeatFromScore(score);
  const cfg = HEAT_CONFIG[heat];
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <cfg.icon size={10} />
      {cfg.label}
    </span>
  );
}

export function WowAlertsBadges({ alerts }: { alerts: string[] | null | undefined }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {alerts.slice(0, 3).map((alert, i) => {
        const isWarning = alert.includes("⚠️") || alert.includes("נמוכ") || alert.includes("חריג");
        return (
          <span
            key={i}
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              isWarning
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            }`}
          >
            {alert}
          </span>
        );
      })}
    </div>
  );
}

export function CrossRefIndicator({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const s = status.toLowerCase();
  const color = s === "green" ? "bg-emerald-400" : s === "yellow" ? "bg-warning" : "bg-destructive";
  const label = s === "green" ? "תקין" : s === "yellow" ? "חריגה קלה" : "חריגה חמורה";
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

export function AIAnalysisTab({ lead }: { lead: any }) {
  const ai = lead?.ai_analysis as any;
  if (!ai) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        אין ניתוח AI עבור ליד זה. העלה תלוש שכר או דף חשבון בנק כדי לקבל ניתוח.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Advisor Summary */}
      {ai.advisor_summary && (
        <div className="glass-card p-4 border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-accent" />
            <span className="text-accent text-sm font-semibold">סיכום יועץ AI</span>
          </div>
          <p className="text-foreground/80 text-sm leading-relaxed">{ai.advisor_summary}</p>
        </div>
      )}

      {/* Wow Alerts */}
      {ai.wow_alerts && ai.wow_alerts.length > 0 && (
        <div>
          <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1">
            <AlertTriangle size={12} /> התראות AI
          </p>
          <div className="space-y-1.5">
            {ai.wow_alerts.map((alert: string, i: number) => {
              const isWarning = alert.includes("⚠️") || alert.includes("נמוכ");
              return (
                <div key={i} className={`text-xs px-3 py-2 rounded-xl border ${
                  isWarning
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                }`}>
                  {alert}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cross-reference & obligations row */}
      <div className="grid grid-cols-2 gap-3">
        {ai.cross_reference_status && (
          <div className="glass-card p-3">
            <p className="text-muted-foreground text-[10px] mb-1">סטטוס הצלבה</p>
            <CrossRefIndicator status={ai.cross_reference_status} />
          </div>
        )}
        {ai.total_monthly_obligations != null && (
          <div className="glass-card p-3">
            <p className="text-muted-foreground text-[10px] mb-1">התחייבויות חודשיות</p>
            <p className="text-accent font-bold text-sm">₪{ai.total_monthly_obligations.toLocaleString()}</p>
          </div>
        )}
        {(ai.debt_to_income_ratio != null || ai.dti_status === "data_error") && (
          <div className="glass-card p-3">
            <p className="text-muted-foreground text-[10px] mb-1">יחס חוב/הכנסה</p>
            {ai.dti_status === "data_error" ? (
              <p className="font-bold text-sm text-warning">דורש בדיקה ידנית</p>
            ) : (
              <p className={`font-bold text-sm ${ai.debt_to_income_ratio > 40 ? "text-destructive" : "text-emerald-500"}`}>
                {ai.debt_to_income_ratio}%
              </p>
            )}
          </div>
        )}
      </div>

      {/* Salary Verification */}
      {ai.salary_verification && (
        <div className="glass-card p-4">
          <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1">
            <TrendingUp size={12} /> אימות שכר
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-[10px]">ממוצע הפקדה</span>
              <p className="text-foreground font-medium">₪{ai.salary_verification.average_monthly_deposit?.toLocaleString() || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px]">התאמה לתלוש</span>
              <p className={ai.salary_verification.matches_payslip ? "text-emerald-500" : "text-destructive"}>
                {ai.salary_verification.matches_payslip ? "✓ תואם" : "✗ אי-התאמה"}
              </p>
            </div>
          </div>
          {ai.salary_verification.discrepancy_alert && (
            <p className="text-destructive text-xs mt-2">⚠️ {ai.salary_verification.discrepancy_alert}</p>
          )}
        </div>
      )}

      {/* Mortgage */}
      {ai.mortgage?.detected && (
        <div className="glass-card p-4">
          <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1">
            <Shield size={12} /> משכנתא מזוהה
          </p>
          <p className="text-foreground text-sm">₪{ai.mortgage.monthly_payment?.toLocaleString() || "—"} / חודש</p>
          {ai.mortgage.bank_name && <p className="text-muted-foreground text-[10px]">בנק: {ai.mortgage.bank_name}</p>}
        </div>
      )}

      {/* Insurance charges */}
      {ai.insurance_charges && ai.insurance_charges.length > 0 && (
        <div>
          <p className="text-muted-foreground text-xs mb-2">חיובי ביטוח</p>
          <div className="space-y-1">
            {ai.insurance_charges.map((ins: any, i: number) => (
              <div key={i} className="flex justify-between glass-card px-3 py-2 text-xs">
                <span className="text-foreground/70">{ins.company} — {ins.description}</span>
                <span className="text-foreground font-medium">₪{ins.monthly_amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON */}
      <details className="mt-2">
        <summary className="text-muted-foreground text-[10px] cursor-pointer hover:text-foreground/50">הצג JSON גולמי</summary>
        <pre className="mt-2 bg-muted/30 rounded-xl p-3 text-[10px] text-muted-foreground overflow-auto max-h-60 whitespace-pre-wrap" dir="ltr">
          {JSON.stringify(ai, null, 2)}
        </pre>
      </details>
    </div>
  );
}
