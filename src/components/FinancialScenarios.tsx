import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Plus,
  RefreshCw,
  TrendingUp,
  Calculator,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import RiskMeter from "./RiskMeter";

interface ScenarioInputs {
  propertyValue: number;
  mortgageAmount: number;
  monthlyIncome: number;
  existingDebt: number;
  interestRate: number;
  loanTermYears: number;
  currentMortgageBalance: number;
  currentInterestRate: number;
}

function calcMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const FinancialScenarios = () => {
  const { user, role } = useAuth();
  
  const [inputs, setInputs] = useState<ScenarioInputs>({
    propertyValue: 2000000,
    mortgageAmount: 1500000,
    monthlyIncome: 25000,
    existingDebt: 3000,
    interestRate: 4.5,
    loanTermYears: 25,
    currentMortgageBalance: 800000,
    currentInterestRate: 5.8,
  });

  // Fetch lead data if consultant/admin
  const { data: leads = [] } = useQuery({
    queryKey: ["scenario-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: role === "consultant" || role === "admin",
  });

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const loadLeadData = (leadId: string) => {
    const lead = leads.find((l: any) => l.id === leadId);
    if (lead) {
      setInputs((prev) => ({
        ...prev,
        propertyValue: Number(lead.property_value) || prev.propertyValue,
        mortgageAmount: Number(lead.mortgage_amount) || prev.mortgageAmount,
        monthlyIncome: Number(lead.monthly_income) || prev.monthlyIncome,
      }));
      setSelectedLeadId(leadId);
    }
  };

  // Calculations
  const ltv = (inputs.mortgageAmount / inputs.propertyValue) * 100;
  const monthlyPayment = calcMonthlyPayment(inputs.mortgageAmount, inputs.interestRate, inputs.loanTermYears);
  const totalDebtPayment = monthlyPayment + inputs.existingDebt;
  const dti = (totalDebtPayment / inputs.monthlyIncome) * 100;
  const maxLoanByDTI = ((inputs.monthlyIncome * 0.4 - inputs.existingDebt) * inputs.loanTermYears * 12) / (1 + (inputs.interestRate / 100) * inputs.loanTermYears);
  const maxLoanByLTV = inputs.propertyValue * 0.75;
  const maxLoan = Math.min(maxLoanByDTI, maxLoanByLTV);

  // Top-up calc
  const currentEquity = inputs.propertyValue - inputs.currentMortgageBalance;
  const maxTopUp = Math.max(0, inputs.propertyValue * 0.75 - inputs.currentMortgageBalance);
  const topUpPayment = calcMonthlyPayment(maxTopUp, inputs.interestRate, 20);

  // Refinancing calc
  const currentPayment = calcMonthlyPayment(inputs.currentMortgageBalance, inputs.currentInterestRate, inputs.loanTermYears);
  const newPayment = calcMonthlyPayment(inputs.currentMortgageBalance, inputs.interestRate, inputs.loanTermYears);
  const monthlySavings = currentPayment - newPayment;
  const totalSavings = monthlySavings * inputs.loanTermYears * 12;

  // Risk score
  const riskScore = Math.max(0, Math.min(100, 100 - (dti > 40 ? 30 : dti > 30 ? 15 : 0) - (ltv > 75 ? 25 : ltv > 60 ? 10 : 0)));

  const updateInput = (key: keyof ScenarioInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: Number(value) || 0 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          ניתוח היתכנות פיננסית
        </h2>
      </div>

      {/* Lead Selector for Consultant/Admin */}
      {(role === "consultant" || role === "admin") && leads.length > 0 && (
        <div className="glass-card p-4">
          <Label className="text-sm font-medium mb-2 block">בחר לקוח לטעינת נתונים:</Label>
          <div className="flex gap-2 flex-wrap">
            {leads.slice(0, 8).map((lead: any) => (
              <Button
                key={lead.id}
                variant={selectedLeadId === lead.id ? "default" : "outline"}
                size="sm"
                onClick={() => loadLeadData(lead.id)}
              >
                {lead.full_name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Inputs Panel */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground text-sm">נתוני בסיס</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InputField label="שווי נכס (₪)" value={inputs.propertyValue} onChange={(v) => updateInput("propertyValue", v)} />
          <InputField label="סכום משכנתא מבוקש (₪)" value={inputs.mortgageAmount} onChange={(v) => updateInput("mortgageAmount", v)} />
          <InputField label="הכנסה חודשית נטו (₪)" value={inputs.monthlyIncome} onChange={(v) => updateInput("monthlyIncome", v)} />
          <InputField label="חובות קיימים (₪/חודש)" value={inputs.existingDebt} onChange={(v) => updateInput("existingDebt", v)} />
          <InputField label="ריבית משוערת (%)" value={inputs.interestRate} onChange={(v) => updateInput("interestRate", v)} step="0.1" />
          <InputField label="תקופה (שנים)" value={inputs.loanTermYears} onChange={(v) => updateInput("loanTermYears", v)} />
          <InputField label="יתרת משכנתא קיימת (₪)" value={inputs.currentMortgageBalance} onChange={(v) => updateInput("currentMortgageBalance", v)} />
          <InputField label="ריבית נוכחית (%)" value={inputs.currentInterestRate} onChange={(v) => updateInput("currentInterestRate", v)} step="0.1" />
        </div>
      </div>

      {/* Risk Meter */}
      <div className="glass-card p-6">
        <RiskMeter score={riskScore} />
      </div>

      {/* Three Scenarios */}
      <Tabs defaultValue="new" dir="rtl">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="new" className="gap-1">
            <Home className="w-4 h-4" />
            משכנתא חדשה
          </TabsTrigger>
          <TabsTrigger value="topup" className="gap-1">
            <Plus className="w-4 h-4" />
            תוספת על הקיים
          </TabsTrigger>
          <TabsTrigger value="refinance" className="gap-1">
            <RefreshCw className="w-4 h-4" />
            מיחזור
          </TabsTrigger>
        </TabsList>

        {/* A. New Mortgage */}
        <TabsContent value="new" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="הלוואה מקסימלית"
              value={`₪${Math.round(maxLoan).toLocaleString()}`}
              subtext={`DTI: ₪${Math.round(maxLoanByDTI).toLocaleString()} | LTV: ₪${Math.round(maxLoanByLTV).toLocaleString()}`}
              icon={DollarSign}
              status={maxLoan >= inputs.mortgageAmount ? "good" : "danger"}
            />
            <MetricCard
              label="החזר חודשי"
              value={`₪${Math.round(monthlyPayment).toLocaleString()}`}
              subtext={`כולל חובות: ₪${Math.round(totalDebtPayment).toLocaleString()}`}
              icon={Calculator}
              status={dti < 30 ? "good" : dti < 40 ? "warning" : "danger"}
            />
            <MetricCard
              label="יחס מימון (LTV)"
              value={`${ltv.toFixed(1)}%`}
              subtext={`יחס החזר (DTI): ${dti.toFixed(1)}%`}
              icon={Percent}
              status={ltv < 60 ? "good" : ltv < 75 ? "warning" : "danger"}
            />
          </div>

          <div className="glass-card p-5 space-y-3">
            <h4 className="font-semibold text-foreground text-sm">סיכום היתכנות</h4>
            <div className="space-y-2">
              <StatusRow label="סכום מבוקש מול מקסימום" ok={maxLoan >= inputs.mortgageAmount} text={maxLoan >= inputs.mortgageAmount ? "הסכום המבוקש בטווח האפשרי" : `חורג ב-₪${Math.round(inputs.mortgageAmount - maxLoan).toLocaleString()}`} />
              <StatusRow label="יחס החזר להכנסה" ok={dti < 40} text={dti < 30 ? "תקין — מתחת ל-30%" : dti < 40 ? "על הגבול — 30%-40%" : "חריג — מעל 40%"} />
              <StatusRow label="יחס מימון" ok={ltv <= 75} text={ltv <= 60 ? "מצוין — מתחת ל-60%" : ltv <= 75 ? "סביר — עד 75%" : "חריג — מעל 75%"} />
            </div>
          </div>
        </TabsContent>

        {/* B. Loan Top-up */}
        <TabsContent value="topup" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="הון עצמי בנכס"
              value={`₪${Math.round(currentEquity).toLocaleString()}`}
              subtext={`${((currentEquity / inputs.propertyValue) * 100).toFixed(1)}% מהנכס`}
              icon={TrendingUp}
              status={currentEquity > 0 ? "good" : "danger"}
            />
            <MetricCard
              label="תוספת מקסימלית"
              value={`₪${Math.round(maxTopUp).toLocaleString()}`}
              subtext="עד 75% LTV"
              icon={Plus}
              status={maxTopUp > 0 ? "good" : "danger"}
            />
            <MetricCard
              label="החזר חודשי נוסף"
              value={`₪${Math.round(topUpPayment).toLocaleString()}`}
              subtext="ל-20 שנה"
              icon={Calculator}
              status="info"
            />
          </div>
          {maxTopUp <= 0 && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>אין אפשרות לתוספת — ה-LTV הנוכחי כבר מעל 75%</span>
            </div>
          )}
        </TabsContent>

        {/* C. Refinancing */}
        <TabsContent value="refinance" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="החזר נוכחי"
              value={`₪${Math.round(currentPayment).toLocaleString()}`}
              subtext={`ריבית ${inputs.currentInterestRate}%`}
              icon={Calculator}
              status="warning"
            />
            <MetricCard
              label="החזר חדש"
              value={`₪${Math.round(newPayment).toLocaleString()}`}
              subtext={`ריבית ${inputs.interestRate}%`}
              icon={Calculator}
              status="good"
            />
            <MetricCard
              label="חיסכון חודשי"
              value={`₪${Math.round(Math.max(0, monthlySavings)).toLocaleString()}`}
              subtext={`סה״כ: ₪${Math.round(Math.max(0, totalSavings)).toLocaleString()}`}
              icon={DollarSign}
              status={monthlySavings > 0 ? "good" : "danger"}
            />
          </div>
          {monthlySavings <= 0 && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-warning/10 text-warning text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>מיחזור לא משתלם בריבית הנוכחית — הריבית החדשה גבוהה או שווה</span>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

function InputField({ label, value, onChange, step }: { label: string; value: number; onChange: (v: string) => void; step?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} dir="ltr" className="text-left" step={step} />
    </div>
  );
}

function MetricCard({ label, value, subtext, icon: Icon, status }: { label: string; value: string; subtext: string; icon: any; status: "good" | "warning" | "danger" | "info" }) {
  const colors = {
    good: "ring-success/30 bg-success/5",
    warning: "ring-warning/30 bg-warning/5",
    danger: "ring-destructive/30 bg-destructive/5",
    info: "ring-primary/30 bg-primary/5",
  };
  const iconColors = { good: "text-success", warning: "text-warning", danger: "text-destructive", info: "text-primary" };

  return (
    <div className={cn("glass-card p-5 space-y-2 ring-1", colors[status])}>
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", iconColors[status])} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  );
}

function StatusRow({ label, ok, text }: { label: string; ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
      {ok ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" /> : <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-medium", ok ? "text-success" : "text-destructive")}>{text}</p>
      </div>
    </div>
  );
}

export default FinancialScenarios;
