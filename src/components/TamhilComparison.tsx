import { ArrowLeft, TrendingDown, TrendingUp, DollarSign, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  mortgageAmount: number | null;
  monthlyIncome: number | null;
}

export function TamhilComparison({ mortgageAmount, monthlyIncome }: Props) {
  const amount = mortgageAmount || 1500000;
  const income = monthlyIncome || 18000;

  // Simulated current vs optimized
  const current = {
    label: "תמהיל נוכחי",
    rate: 4.5,
    monthly: Math.round((amount * 0.045 / 12) / (1 - Math.pow(1 + 0.045 / 12, -300))),
    totalInterest: 0,
    tracks: [
      { name: "פריים", percent: 33, rate: "פ+1.5%" },
      { name: "קבועה ל״צ", percent: 34, rate: "4.2%" },
      { name: "משתנה 5", percent: 33, rate: "3.8%" },
    ],
  };
  current.totalInterest = current.monthly * 300 - amount;

  const optimized = {
    label: "תמהיל ממוטב",
    rate: 3.8,
    monthly: Math.round((amount * 0.038 / 12) / (1 - Math.pow(1 + 0.038 / 12, -300))),
    totalInterest: 0,
    tracks: [
      { name: "פריים", percent: 25, rate: "פ+0.9%" },
      { name: "קבועה ל״צ", percent: 40, rate: "3.5%" },
      { name: "משתנה 5", percent: 20, rate: "3.2%" },
      { name: "מט״ח", percent: 15, rate: "2.8%" },
    ],
  };
  optimized.totalInterest = optimized.monthly * 300 - amount;

  const savings = current.monthly - optimized.monthly;
  const totalSavings = current.totalInterest - optimized.totalInterest;

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">השוואת תמהיל</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current */}
        <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
          <h4 className="font-semibold text-muted-foreground text-sm">{current.label}</h4>
          <p className="text-2xl font-bold text-foreground">₪{current.monthly.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/חודש</span></p>
          <div className="space-y-2">
            {current.tracks.map((t) => (
              <div key={t.name} className="flex items-center gap-2">
                <div className="h-2 rounded-full bg-muted-foreground/20" style={{ width: `${t.percent}%` }} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{t.name} ({t.rate})</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">סה״כ ריבית: ₪{current.totalInterest.toLocaleString()}</p>
        </div>

        {/* Optimized */}
        <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3 relative">
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">מומלץ</div>
          <h4 className="font-semibold text-primary text-sm">{optimized.label}</h4>
          <p className="text-2xl font-bold text-foreground">₪{optimized.monthly.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/חודש</span></p>
          <div className="space-y-2">
            {optimized.tracks.map((t) => (
              <div key={t.name} className="flex items-center gap-2">
                <div className="h-2 rounded-full bg-primary/40" style={{ width: `${t.percent}%` }} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{t.name} ({t.rate})</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">סה״כ ריבית: ₪{optimized.totalInterest.toLocaleString()}</p>
        </div>
      </div>

      {/* Savings */}
      {savings > 0 && (
        <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-success/10 border border-success/20">
          <TrendingDown className="w-6 h-6 text-success" />
          <div className="text-center">
            <p className="text-lg font-bold text-success">חיסכון של ₪{savings.toLocaleString()} לחודש</p>
            <p className="text-xs text-muted-foreground">₪{totalSavings.toLocaleString()} סה״כ על פני 25 שנים</p>
          </div>
        </div>
      )}
    </div>
  );
}
