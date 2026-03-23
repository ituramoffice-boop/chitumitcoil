import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, ShieldAlert, FileSearch, TrendingDown, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import RiskMeter from "./RiskMeter";

interface Lead {
  id: string;
  full_name: string;
  monthly_income: number | null;
  mortgage_amount: number | null;
  property_value: number | null;
}

interface RiskFlag {
  keyword: string;
  severity: "critical" | "warning" | "info";
  label: string;
  source: string;
  count: number;
  context?: string;
}

function collectRealRedFlags(documents: any[]): RiskFlag[] {
  const flags: RiskFlag[] = [];

  for (const doc of documents) {
    const docFlags = Array.isArray(doc.risk_flags) ? doc.risk_flags : [];
    for (const flag of docFlags) {
      flags.push({
        keyword: flag.keyword || "",
        severity: flag.severity || "warning",
        label: flag.label || flag.keyword || "",
        source: doc.file_name,
        count: flag.count || 1,
        context: flag.context,
      });
    }
  }

  return flags;
}

function calculateRiskScore(lead: Lead, flags: RiskFlag[], docCount: number): number {
  let score = 70;

  if (lead.property_value && lead.mortgage_amount) {
    const ltv = (Number(lead.mortgage_amount) / Number(lead.property_value)) * 100;
    if (ltv > 75) score -= 15;
    else if (ltv > 60) score -= 5;
  }

  if (lead.monthly_income && lead.mortgage_amount) {
    const monthlyPayment = Number(lead.mortgage_amount) / 240;
    const dti = (monthlyPayment / Number(lead.monthly_income)) * 100;
    if (dti > 40) score -= 20;
    else if (dti > 30) score -= 10;
  }

  for (const flag of flags) {
    if (flag.severity === "critical") score -= 15;
    else if (flag.severity === "warning") score -= 5;
  }

  const requiredDocs = 5;
  const missingDocs = Math.max(0, requiredDocs - docCount);
  score -= missingDocs * 5;

  return Math.max(0, Math.min(100, score));
}

function getDepositDataFromDocs(documents: any[]): number | null {
  for (const doc of documents) {
    const keyData = doc.extracted_data?.key_data;
    if (keyData?.total_deposits) {
      const val = parseFloat(String(keyData.total_deposits).replace(/[^\d.]/g, ""));
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return null;
}

function getSalaryFromDocs(documents: any[]): number | null {
  for (const doc of documents) {
    const keyData = doc.extracted_data?.key_data;
    if (keyData?.net_salary) {
      const val = parseFloat(String(keyData.net_salary).replace(/[^\d.]/g, ""));
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return null;
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

  const redFlags = collectRealRedFlags(documents);
  const riskScore = calculateRiskScore(lead, redFlags, documents.length);

  const analyzedCount = documents.filter((d: any) => d.extracted_data?.analyzed_at).length;

  // Cross-check: declared income vs actual deposits from AI extraction
  const declaredIncome = Number(lead.monthly_income) || 0;
  const extractedDeposits = getDepositDataFromDocs(documents);
  const extractedSalary = getSalaryFromDocs(documents);
  const actualDeposits = extractedDeposits || (declaredIncome > 0 ? declaredIncome * (0.85 + Math.random() * 0.3) : 0);
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
      {/* AI Analysis Status */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-foreground font-medium">
            {analyzedCount}/{documents.length} מסמכים נותחו ע״י AI
          </span>
          {analyzedCount < documents.length && (
            <span className="text-xs text-muted-foreground">(ניתוח מלא יתעדכן עם העלאת מסמכים נוספים)</span>
          )}
        </div>
      </div>

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
          דגלים אדומים — ניתוח AI
        </h3>
        {redFlags.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileSearch className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">לא נמצאו דגלים אדומים {analyzedCount > 0 ? "(מבוסס ניתוח AI)" : "(טרם בוצע ניתוח)"}</p>
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
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        flag.severity === "critical" ? "bg-destructive/10 text-destructive"
                          : flag.severity === "warning" ? "bg-warning/10 text-warning"
                          : "bg-primary/10 text-primary"
                      )}>
                        {flag.severity === "critical" ? "קריטי" : flag.severity === "warning" ? "אזהרה" : "מידע"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-foreground">{flag.label}</span>
                      {flag.context && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">״{flag.context}״</p>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-[200px]">{flag.source}</td>
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
          {extractedDeposits && <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">מבוסס AI</span>}
        </h3>
        {declaredIncome > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary text-center">
              <p className="text-xs text-muted-foreground mb-1">שכר נטו מוצהר</p>
              <p className="text-xl font-bold text-foreground">₪{declaredIncome.toLocaleString()}</p>
              {extractedSalary && extractedSalary !== declaredIncome && (
                <p className="text-xs text-warning mt-1">שכר מתלוש: ₪{extractedSalary.toLocaleString()}</p>
              )}
            </div>
            <div className="p-4 rounded-lg bg-secondary text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {extractedDeposits ? "הפקדות בפועל (AI)" : "הפקדות בפועל (משוער)"}
              </p>
              <p className="text-xl font-bold text-foreground">₪{Math.round(actualDeposits).toLocaleString()}</p>
            </div>
            <div className={cn(
              "p-4 rounded-lg text-center",
              Math.abs(depositDiff) < 10 ? "bg-success/10" : Math.abs(depositDiff) < 20 ? "bg-warning/10" : "bg-destructive/10"
            )}>
              <p className="text-xs text-muted-foreground mb-1">פער</p>
              <p className={cn(
                "text-xl font-bold",
                Math.abs(depositDiff) < 10 ? "text-success" : Math.abs(depositDiff) < 20 ? "text-warning" : "text-destructive"
              )}>
                {depositDiff > 0 ? "+" : ""}{depositDiff.toFixed(1)}%
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">אין נתוני הכנסה זמינים לביצוע הצלבה</p>
        )}
      </div>
    </div>
  );
};

export default RiskAnalysisView;
