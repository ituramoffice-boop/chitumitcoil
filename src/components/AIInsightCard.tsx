import { Brain, TrendingUp, Percent, DollarSign, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  monthlyIncome: number | null;
  mortgageAmount: number | null;
  propertyValue: number | null;
  documentsCount: number;
  completionPercent: number;
}

export function AIInsightCard({ monthlyIncome, mortgageAmount, propertyValue, documentsCount, completionPercent }: Props) {
  const income = monthlyIncome || 0;
  const maxLoan = Math.round(income * 220); // ~220x monthly income rough estimate
  const estimatedRate = income > 20000 ? 3.5 : income > 15000 ? 3.8 : income > 10000 ? 4.2 : 4.8;
  const dti = income > 0 && mortgageAmount ? ((mortgageAmount / 300 / income) * 100).toFixed(1) : null;
  const ltv = propertyValue && mortgageAmount ? ((mortgageAmount / propertyValue) * 100).toFixed(1) : null;

  const showInsight = income > 0 && completionPercent >= 50;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/10 p-6 space-y-4 shadow-lg shadow-primary/5">
      {/* Glow effect */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />

      <div className="relative flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/15 animate-pulse-glow">
          <Brain className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
            תובנת AI
            <Sparkles className="w-4 h-4 text-primary" />
          </h3>
          <p className="text-xs text-muted-foreground">מבוסס על ניתוח המסמכים שלך</p>
        </div>
      </div>

      {showInsight ? (
        <div className="relative space-y-4">
          <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border space-y-1">
            <p className="text-sm text-muted-foreground">סכום הלוואה מרבי משוער</p>
            <p className="text-3xl font-bold text-primary">
              ₪{maxLoan.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              בריבית משוערת של {estimatedRate}%
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {dti && (
              <div className="p-3 rounded-lg bg-card/60 border border-border text-center">
                <Percent className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{dti}%</p>
                <p className="text-xs text-muted-foreground">יחס החזר (DTI)</p>
              </div>
            )}
            {ltv && (
              <div className="p-3 rounded-lg bg-card/60 border border-border text-center">
                <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{ltv}%</p>
                <p className="text-xs text-muted-foreground">אחוז מימון (LTV)</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative p-4 rounded-xl bg-card/80 border border-dashed border-border text-center space-y-2">
          <DollarSign className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            {documentsCount === 0
              ? "העלה מסמכים כדי לקבל תובנות AI"
              : `השלם ${100 - completionPercent}% נוספים מהמסמכים הנדרשים`}
          </p>
        </div>
      )}
    </div>
  );
}
