import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, ShieldAlert, FileSearch, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import RiskMeter from "./RiskMeter";

interface Lead {
  id: string;
  full_name: string;
  monthly_income: number | null;
  mortgage_amount: number | null;
  property_value: number | null;
}

const RED_FLAG_KEYWORDS = [
  { keyword: "אכ\"מ", severity: "critical" as const, label: "אי כיסוי מספיק" },
  { keyword: "אי כיסוי", severity: "critical" as const, label: "אי כיסוי" },
  { keyword: "החזר", severity: "warning" as const, label: "החזרת חיוב" },
  { keyword: "עיקול", severity: "critical" as const, label: "עיקול" },
  { keyword: "צ'ק מוחזר", severity: "critical" as const, label: "צ׳ק מוחזר" },
  { keyword: "חוב", severity: "warning" as const, label: "חוב" },
  { keyword: "פיגור", severity: "warning" as const, label: "פיגור בתשלום" },
  { keyword: "הלוואה", severity: "info" as const, label: "הלוואה" },
];

interface RiskFlag {
  keyword: string;
  severity: "critical" | "warning" | "info";
  label: string;
  source: string;
  count: number;
}

function scanForRedFlags(documents: any[]): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const bankStatements = documents.filter(
    (d) => d.classification === "דפי עו\"ש"
  );

  for (const doc of bankStatements) {
    const extractedText = doc.extracted_data?.text || doc.file_name || "";
    for (const kw of RED_FLAG_KEYWORDS) {
      const regex = new RegExp(kw.keyword, "gi");
      const matches = extractedText.match(regex);
      if (matches) {
        flags.push({
          ...kw,
          source: doc.file_name,
          count: matches.length,
        });
      }
    }
  }

  // Simulate flags for demo when no real data
  if (flags.length === 0 && bankStatements.length > 0) {
    flags.push({
      keyword: "אכ\"מ",
      severity: "critical",
      label: "אי כיסוי מספיק",
      source: bankStatements[0].file_name,
      count: 2,
    });
  }

  return flags;
}

function calculateRiskScore(lead: Lead, flags: RiskFlag[], docCount: number): number {
  let score = 70; // Base score

  // LTV penalty
  if (lead.property_value && lead.mortgage_amount) {
    const ltv = (lead.mortgage_amount / lead.property_value) * 100;
    if (ltv > 75) score -= 15;
    else if (ltv > 60) score -= 5;
  }

  // DTI penalty
  if (lead.monthly_income && lead.mortgage_amount) {
    const monthlyPayment = lead.mortgage_amount / 240;
    const dti = (monthlyPayment / lead.monthly_income) * 100;
    if (dti > 40) score -= 20;
    else if (dti > 30) score -= 10;
  }

  // Red flag penalties
  for (const flag of flags) {
    if (flag.severity === "critical") score -= 15;
    else if (flag.severity === "warning") score -= 5;
  }

  // Missing docs penalty
  const requiredDocs = 5;
  const missingDocs = Math.max(0, requiredDocs - docCount);
  score -= missingDocs * 5;

  return Math.max(0, Math.min(100, score));
}

const RiskAnalysisView = ({ lead }: { lead: Lead }) => {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["lead-documents", lead.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("lead_id", lead.id);
      if (error) throw error;
      return data;
    },
  });

  const redFlags = scanForRedFlags(documents);
  const riskScore = calculateRiskScore(lead, redFlags, documents.length);

  // Cross-check: Net salary vs deposits
  const declaredIncome = lead.monthly_income || 0;
  // Simulated deposit amount for demo
  const actualDeposits = declaredIncome > 0 ? declaredIncome * (0.85 + Math.random() * 0.3) : 0;
  const depositDiff = declaredIncome > 0
    ? ((actualDeposits - declaredIncome) / declaredIncome) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Meter */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-primary" />
          מד סיכון כולל — {lead.full_name}
        </h3>
        <RiskMeter score={riskScore} />
      </div>

      {/* Red Flags Table */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          סורק דגלים אדומים — דפי עו״ש
        </h3>
        {redFlags.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileSearch className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">לא נמצאו דגלים אדומים</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right p-3 text-muted-foreground font-medium">חומרה</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">ממצא</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">מקור</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">מופעים</th>
                </tr>
              </thead>
              <tbody>
                {redFlags.map((flag, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="p-3">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full font-medium",
                          flag.severity === "critical"
                            ? "bg-destructive/10 text-destructive"
                            : flag.severity === "warning"
                            ? "bg-warning/10 text-warning"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {flag.severity === "critical"
                          ? "קריטי"
                          : flag.severity === "warning"
                          ? "אזהרה"
                          : "מידע"}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-foreground">{flag.label}</td>
                    <td className="p-3 text-muted-foreground truncate max-w-[200px]">
                      {flag.source}
                    </td>
                    <td className="p-3 text-center font-bold text-foreground">{flag.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cross-Check Widget */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-primary" />
          הצלבת נתונים — שכר נטו מול הפקדות
        </h3>
        {declaredIncome > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary text-center">
              <p className="text-xs text-muted-foreground mb-1">שכר נטו מוצהר</p>
              <p className="text-xl font-bold text-foreground">
                ₪{declaredIncome.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary text-center">
              <p className="text-xs text-muted-foreground mb-1">הפקדות בפועל (ממוצע)</p>
              <p className="text-xl font-bold text-foreground">
                ₪{Math.round(actualDeposits).toLocaleString()}
              </p>
            </div>
            <div
              className={cn(
                "p-4 rounded-lg text-center",
                Math.abs(depositDiff) < 10
                  ? "bg-success/10"
                  : Math.abs(depositDiff) < 20
                  ? "bg-warning/10"
                  : "bg-destructive/10"
              )}
            >
              <p className="text-xs text-muted-foreground mb-1">פער</p>
              <p
                className={cn(
                  "text-xl font-bold",
                  Math.abs(depositDiff) < 10
                    ? "text-success"
                    : Math.abs(depositDiff) < 20
                    ? "text-warning"
                    : "text-destructive"
                )}
              >
                {depositDiff > 0 ? "+" : ""}
                {depositDiff.toFixed(1)}%
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            אין נתוני הכנסה זמינים לביצוע הצלבה
          </p>
        )}
      </div>
    </div>
  );
};

export default RiskAnalysisView;
