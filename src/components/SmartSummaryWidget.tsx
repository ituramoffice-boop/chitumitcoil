import { Sparkles, FileCheck, Users, AlertTriangle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartSummaryProps {
  greeting: string;
  newDocsCollected: number;
  pendingLeads: number;
  expiringCount: number;
  missingDocsCount: number;
}

export function SmartSummaryWidget({
  greeting,
  newDocsCollected,
  pendingLeads,
  expiringCount,
  missingDocsCount,
}: SmartSummaryProps) {
  const insights: { icon: any; text: string; color: string }[] = [];

  if (newDocsCollected > 0) {
    insights.push({
      icon: FileCheck,
      text: `אספתי ${newDocsCollected} מסמכים מלקוחות בזמן שלא היית כאן`,
      color: "text-success",
    });
  }
  if (pendingLeads > 0) {
    insights.push({
      icon: Users,
      text: `${pendingLeads} לידים חדשים ממתינים לתשומת לבך`,
      color: "text-primary",
    });
  }
  if (expiringCount > 0) {
    insights.push({
      icon: AlertTriangle,
      text: `${expiringCount} אישורים עקרוניים עומדים לפוג — כדאי לטפל היום`,
      color: "text-destructive",
    });
  }
  if (missingDocsCount > 0) {
    insights.push({
      icon: AlertTriangle,
      text: `שלחתי תזכורות ל-${missingDocsCount} לקוחות על מסמכים חסרים`,
      color: "text-gold",
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: Sparkles,
      text: "הכל מסודר! אין פריטים דחופים כרגע 🎉",
      color: "text-success",
    });
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-gold/20 bg-gradient-to-l from-gold/5 via-card to-gold/5 p-5 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 shrink-0 animate-pulse-subtle">
          <Sparkles className="w-6 h-6 text-gold" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-base font-bold text-foreground">
              {greeting}, הנה הסיכום הבוקרי שלך ☀️
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              העוזר האישי שלך עבד בשבילך — הנה מה שחשוב עכשיו:
            </p>
          </div>

          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors group cursor-default"
              >
                <insight.icon className={cn("w-4 h-4 shrink-0", insight.color)} />
                <span className="text-sm text-foreground flex-1">{insight.text}</span>
                <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-l from-gold/3 to-transparent pointer-events-none" />
    </div>
  );
}
