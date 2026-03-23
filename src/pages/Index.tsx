import { FileCheck, Users, ShieldCheck, TrendingUp, Brain } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { DocumentUpload } from "@/components/DocumentUpload";
import { GapChecklist } from "@/components/GapChecklist";
import { IncomeExpenseChart } from "@/components/IncomeExpenseChart";
import { RiskAlerts } from "@/components/RiskAlerts";
import { CreditSummary } from "@/components/CreditSummary";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">SmartMortgage AI</h1>
              <p className="text-xs text-muted-foreground">חיתום דיגיטלי חכם</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">תיק #2024-0847</span>
            <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              בעיבוד
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="מסמכים שהועלו"
            value="12"
            subtitle="מתוך 15 נדרשים"
            icon={FileCheck}
            variant="success"
          />
          <StatsCard
            title="ציון תיק"
            value="72/100"
            subtitle="בינוני-טוב"
            icon={TrendingUp}
            variant="warning"
          />
          <StatsCard
            title="התראות סיכון"
            value="4"
            subtitle="1 קריטית"
            icon={ShieldCheck}
            variant="danger"
          />
          <StatsCard
            title="לווים"
            value="2"
            subtitle="יחיד + ערב"
            icon={Users}
            variant="default"
          />
        </div>

        {/* Upload + Checklist Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DocumentUpload />
          <GapChecklist />
        </div>

        {/* Charts + Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncomeExpenseChart />
          <RiskAlerts />
        </div>

        {/* Credit Summary */}
        <CreditSummary />
      </main>
    </div>
  );
};

export default Index;
