// Dashboard - Properly binding parsed JSON to UI

interface AnalysisResult {
  verifiedSalary: number;
  totalLiabilities: number;
  dtiRatio: number;
  clientName?: string;
}

interface AnalysisResultDashboardProps {
  analysisResult: AnalysisResult | null;
}

export function AnalysisResultDashboard({ analysisResult }: AnalysisResultDashboardProps) {
  // Guard: show loading state if data isn't ready yet
  if (!analysisResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-lg">ממתין לנתונים...</p>
      </div>
    );
  }

  const { verifiedSalary, totalLiabilities, dtiRatio, clientName } =
    analysisResult;

  const dtiColor =
    dtiRatio > 50 ? "text-destructive" : dtiRatio > 35 ? "text-yellow-500" : "text-green-500";

  return (
    <div className="grid grid-cols-2 gap-6 p-6" dir="rtl">
      {clientName && (
        <div className="col-span-2 text-xl font-bold text-foreground">
          ניתוח עבור: {clientName}
        </div>
      )}
      <div className="bg-card rounded-2xl p-6 shadow">
        <p className="text-muted-foreground text-sm mb-1">הכנסה מאומתת</p>
        <p className="text-3xl font-bold text-foreground">
          ₪{verifiedSalary.toLocaleString("he-IL")}
        </p>
      </div>
      <div className="bg-card rounded-2xl p-6 shadow">
        <p className="text-muted-foreground text-sm mb-1">סך התחייבויות חודשיות</p>
        <p className="text-3xl font-bold text-foreground">
          ₪{totalLiabilities.toLocaleString("he-IL")}
        </p>
      </div>
      <div className="col-span-2 bg-card rounded-2xl p-6 shadow text-center">
        <p className="text-muted-foreground text-sm mb-1">יחס חוב להכנסה (DTI)</p>
        <p className={`text-5xl font-bold ${dtiColor}`}>{dtiRatio}%</p>
        <p className="text-sm mt-2 text-muted-foreground">
          {dtiRatio > 50
            ? "⚠️ מעל הסף - סיכון גבוה"
            : dtiRatio > 35
            ? "⚠️ גבולי"
            : "✅ תקין"}
        </p>
      </div>
    </div>
  );
}
