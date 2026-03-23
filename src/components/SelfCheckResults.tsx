import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Sparkles, TrendingUp, Shield, BarChart3, PieChart, ArrowRight, CheckCircle2, AlertTriangle, DollarSign, Percent, Home, Plus, RefreshCw, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RiskMeter from "@/components/RiskMeter";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart as RechartsPie, Pie, Cell, RadialBarChart, RadialBar,
  AreaChart, Area,
} from "recharts";

// Simulated data based on "uploaded documents"
const MOCK_INCOME = 22000;
const MOCK_PROPERTY = 2200000;
const MOCK_MORTGAGE = 1600000;

const incomeExpenseData = [
  { month: "אוק׳", income: 22000, expenses: 14200 },
  { month: "נוב׳", income: 22000, expenses: 13800 },
  { month: "דצמ׳", income: 23500, expenses: 16100 },
  { month: "ינו׳", income: 22000, expenses: 14500 },
  { month: "פבר׳", income: 22000, expenses: 15200 },
  { month: "מרץ", income: 24000, expenses: 14800 },
];

const expenseBreakdown = [
  { name: "דיור", value: 5500, color: "hsl(217 91% 60%)" },
  { name: "מזון", value: 3200, color: "hsl(160 84% 39%)" },
  { name: "תחבורה", value: 1800, color: "hsl(40 96% 60%)" },
  { name: "חינוך", value: 2100, color: "hsl(280 70% 60%)" },
  { name: "אחר", value: 2200, color: "hsl(0 0% 50%)" },
];

const savingsHistory = [
  { month: "אוק׳", savings: 7800 },
  { month: "נוב׳", savings: 8200 },
  { month: "דצמ׳", savings: 7400 },
  { month: "ינו׳", savings: 7500 },
  { month: "פבר׳", savings: 6800 },
  { month: "מרץ", savings: 9200 },
];

function calcMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export default function SelfCheckResults() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Financial calculations
  const interestRate = 4.2;
  const loanTermYears = 25;
  const existingDebt = 2500;
  const maxLoan = Math.round(MOCK_INCOME * 220);
  const ltv = (MOCK_MORTGAGE / MOCK_PROPERTY) * 100;
  const monthlyPayment = calcMonthlyPayment(MOCK_MORTGAGE, interestRate, loanTermYears);
  const totalDebtPayment = monthlyPayment + existingDebt;
  const dti = (totalDebtPayment / MOCK_INCOME) * 100;
  const riskScore = Math.max(0, Math.min(100, 100 - (dti > 40 ? 30 : dti > 30 ? 15 : 0) - (ltv > 75 ? 25 : ltv > 60 ? 10 : 0)));

  // Refinancing
  const currentBalance = 850000;
  const currentRate = 5.6;
  const currentPayment = calcMonthlyPayment(currentBalance, currentRate, loanTermYears);
  const newPayment = calcMonthlyPayment(currentBalance, interestRate, loanTermYears);
  const monthlySavings = currentPayment - newPayment;

  // Top-up
  const equity = MOCK_PROPERTY - currentBalance;
  const maxTopUp = Math.max(0, MOCK_PROPERTY * 0.75 - currentBalance);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero AI Insight */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/10 p-6 shadow-lg shadow-primary/5">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
        <div className="relative flex flex-col sm:flex-row items-start gap-6">
          <div className="p-4 rounded-xl bg-primary/15 animate-pulse-glow shrink-0">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              תובנת AI
              <Sparkles className="w-5 h-5 text-primary" />
            </h2>
            <p className="text-sm text-muted-foreground">מבוסס על ניתוח המסמכים שהעלת</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border">
                <p className="text-sm text-muted-foreground">סכום הלוואה מרבי</p>
                <p className="text-2xl font-bold text-primary">₪{maxLoan.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">ריבית משוערת {interestRate}%</p>
              </div>
              <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border">
                <p className="text-sm text-muted-foreground">יחס החזר (DTI)</p>
                <p className="text-2xl font-bold text-foreground">{dti.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{dti < 30 ? "תקין" : dti < 40 ? "על הגבול" : "חריג"}</p>
              </div>
              <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border">
                <p className="text-sm text-muted-foreground">אחוז מימון (LTV)</p>
                <p className="text-2xl font-bold text-foreground">{ltv.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{ltv <= 60 ? "מצוין" : ltv <= 75 ? "סביר" : "גבוה"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview" className="gap-1 text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">סקירה כללית</span>
            <span className="sm:hidden">סקירה</span>
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-1 text-xs sm:text-sm">
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">תרחישים</span>
            <span className="sm:hidden">תרחישים</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-1 text-xs sm:text-sm">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">סיכונים</span>
            <span className="sm:hidden">סיכונים</span>
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="gap-1 text-xs sm:text-sm">
            <PieChart className="w-4 h-4" />
            <span className="hidden sm:inline">פירוט</span>
            <span className="sm:hidden">פירוט</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Income vs Expense Chart */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">הכנסות מול הוצאות (6 חודשים)</h3>
            <div className="h-[280px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeExpenseData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => `₪${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="income" name="הכנסות" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="הוצאות" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Savings Trend */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">מגמת חיסכון חודשי</h3>
            <div className="h-[200px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savingsHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => `₪${value.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="savings" name="חיסכון" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Credit Summary */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">תקציר מנהלים — אשראי</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "דירוג משוער", value: "B+", status: "moderate" as const },
                { label: "יחס החזר", value: `${dti.toFixed(0)}%`, status: dti < 30 ? "good" as const : "moderate" as const },
                { label: "מסגרת אשראי מנוצלת", value: "58%", status: "moderate" as const },
                { label: "תשלומים בפיגור", value: "0", status: "good" as const },
                { label: "הלוואות פעילות", value: "2", status: "moderate" as const },
                { label: 'סה"כ התחייבויות', value: "₪185,000", status: "moderate" as const },
              ].map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50 space-y-1">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className={cn("text-lg font-bold", m.status === "good" ? "text-success" : "text-warning")}>{m.value}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-primary font-medium">💡 המלצת מערכת</p>
              <p className="text-xs text-muted-foreground mt-1">
                מומלץ לסגור הלוואת צריכה אחת (₪850/חודש) לפני הגשה. יחס ההחזר ירד ל-{(dti - 3.8).toFixed(0)}% ויעלה את סיכויי האישור.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Scenarios */}
        <TabsContent value="scenarios" className="mt-6 space-y-6">
          <Tabs defaultValue="new" dir="rtl">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="new" className="gap-1">
                <Home className="w-4 h-4" />
                משכנתא חדשה
              </TabsTrigger>
              <TabsTrigger value="topup" className="gap-1">
                <Plus className="w-4 h-4" />
                תוספת
              </TabsTrigger>
              <TabsTrigger value="refinance" className="gap-1">
                <RefreshCw className="w-4 h-4" />
                מיחזור
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard label="הלוואה מקסימלית" value={`₪${maxLoan.toLocaleString()}`} subtext={`LTV: ₪${Math.round(MOCK_PROPERTY * 0.75).toLocaleString()}`} status={maxLoan >= MOCK_MORTGAGE ? "good" : "danger"} />
                <MetricCard label="החזר חודשי" value={`₪${Math.round(monthlyPayment).toLocaleString()}`} subtext={`כולל חובות: ₪${Math.round(totalDebtPayment).toLocaleString()}`} status={dti < 30 ? "good" : dti < 40 ? "warning" : "danger"} />
                <MetricCard label="יחס מימון (LTV)" value={`${ltv.toFixed(1)}%`} subtext={`DTI: ${dti.toFixed(1)}%`} status={ltv < 60 ? "good" : ltv < 75 ? "warning" : "danger"} />
              </div>
              <div className="glass-card p-5 space-y-3">
                <h4 className="font-semibold text-foreground text-sm">סיכום היתכנות</h4>
                <div className="space-y-2">
                  <StatusRow label="סכום מבוקש מול מקסימום" ok={maxLoan >= MOCK_MORTGAGE} text={maxLoan >= MOCK_MORTGAGE ? "הסכום המבוקש בטווח האפשרי" : `חורג ב-₪${Math.round(MOCK_MORTGAGE - maxLoan).toLocaleString()}`} />
                  <StatusRow label="יחס החזר להכנסה" ok={dti < 40} text={dti < 30 ? "תקין — מתחת ל-30%" : dti < 40 ? "על הגבול — 30%-40%" : "חריג — מעל 40%"} />
                  <StatusRow label="יחס מימון" ok={ltv <= 75} text={ltv <= 60 ? "מצוין — מתחת ל-60%" : ltv <= 75 ? "סביר — עד 75%" : "חריג — מעל 75%"} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="topup" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard label="הון עצמי בנכס" value={`₪${Math.round(equity).toLocaleString()}`} subtext={`${((equity / MOCK_PROPERTY) * 100).toFixed(0)}% מהנכס`} status="good" />
                <MetricCard label="תוספת מקסימלית" value={`₪${Math.round(maxTopUp).toLocaleString()}`} subtext="עד 75% LTV" status={maxTopUp > 0 ? "good" : "danger"} />
                <MetricCard label="החזר חודשי נוסף" value={`₪${Math.round(calcMonthlyPayment(maxTopUp, interestRate, 20)).toLocaleString()}`} subtext="ל-20 שנה" status="info" />
              </div>
            </TabsContent>

            <TabsContent value="refinance" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard label="החזר נוכחי" value={`₪${Math.round(currentPayment).toLocaleString()}`} subtext={`ריבית ${currentRate}%`} status="warning" />
                <MetricCard label="החזר חדש" value={`₪${Math.round(newPayment).toLocaleString()}`} subtext={`ריבית ${interestRate}%`} status="good" />
                <MetricCard label="חיסכון חודשי" value={`₪${Math.round(Math.max(0, monthlySavings)).toLocaleString()}`} subtext={`סה״כ: ₪${Math.round(Math.max(0, monthlySavings * loanTermYears * 12)).toLocaleString()}`} status={monthlySavings > 0 ? "good" : "danger"} />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Risk */}
        <TabsContent value="risk" className="mt-6 space-y-6">
          <div className="glass-card p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">מד סיכון כללי</h3>
            <RiskMeter score={riskScore} />
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">סריקת דגלים אדומים</h3>
            <div className="space-y-2">
              <FlagRow severity="low" text='לא נמצאו צ׳קים חוזרים (אכ"מ)' />
              <FlagRow severity="low" text="לא נמצאו עיקולים" />
              <FlagRow severity="medium" text="נמצאה הלוואה שלא דווחה — ₪850/חודש" />
              <FlagRow severity="low" text="אין פיגורים ב-180 יום אחרונים" />
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">הצלבת הכנסה מול הפקדות</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border text-center">
                <p className="text-xs text-muted-foreground">הכנסה מדווחת</p>
                <p className="text-xl font-bold text-foreground">₪{MOCK_INCOME.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border text-center">
                <p className="text-xs text-muted-foreground">ממוצע הפקדות</p>
                <p className="text-xl font-bold text-success">₪{(MOCK_INCOME * 1.02).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>ההפקדות תואמות את ההכנסה המדווחת — סטייה של 2% בלבד</span>
            </div>
          </div>
        </TabsContent>

        {/* Breakdown */}
        <TabsContent value="breakdown" className="mt-6 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">פילוח הוצאות חודשי</h3>
            <div className="h-[280px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₪${value.toLocaleString()}`} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">סיכום פיננסי</h3>
            <div className="grid grid-cols-2 gap-3">
              <SummaryItem label="הכנסה חודשית ממוצעת" value={`₪${MOCK_INCOME.toLocaleString()}`} />
              <SummaryItem label="הוצאות חודשיות ממוצעות" value={`₪${Math.round(incomeExpenseData.reduce((s, d) => s + d.expenses, 0) / 6).toLocaleString()}`} />
              <SummaryItem label="חיסכון ממוצע" value={`₪${Math.round(savingsHistory.reduce((s, d) => s + d.savings, 0) / 6).toLocaleString()}`} />
              <SummaryItem label="יתרת משכנתא קיימת" value={`₪${currentBalance.toLocaleString()}`} />
              <SummaryItem label="שווי נכס" value={`₪${MOCK_PROPERTY.toLocaleString()}`} />
              <SummaryItem label="החזר חודשי צפוי" value={`₪${Math.round(monthlyPayment).toLocaleString()}`} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* CTA */}
      <div className="glass-card p-6 text-center space-y-4 border-primary/20">
        <h3 className="text-lg font-bold text-foreground">רוצה ייעוץ מקצועי?</h3>
        <p className="text-sm text-muted-foreground">יועץ משכנתאות מוסמך יוכל לבדוק את הנתונים שלך לעומק ולבנות תמהיל אופטימלי</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate("/dashboard")} size="lg">
            לאזור האישי שלי
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} size="lg">
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtext, status }: { label: string; value: string; subtext: string; status: "good" | "warning" | "danger" | "info" }) {
  const colors = {
    good: "ring-success/30 bg-success/5",
    warning: "ring-warning/30 bg-warning/5",
    danger: "ring-destructive/30 bg-destructive/5",
    info: "ring-primary/30 bg-primary/5",
  };
  return (
    <div className={cn("glass-card p-5 space-y-2 ring-1", colors[status])}>
      <span className="text-sm text-muted-foreground">{label}</span>
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

function FlagRow({ severity, text }: { severity: "low" | "medium" | "high"; text: string }) {
  const config = {
    low: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    medium: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    high: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  };
  const { icon: Icon, color, bg } = config[severity];
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg text-sm", bg, color)}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
