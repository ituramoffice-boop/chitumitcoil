import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useInsurancePolicies } from "@/hooks/useInsuranceData";

const POLICY_TYPES: Record<string, string> = {
  life: "חיים", health: "בריאות", car: "רכב", home: "דירה",
  business: "עסק", pension: "פנסיה", disability: "אובדן כושר",
};

const TYPE_COLORS: Record<string, string> = {
  life: "#3B82F6", health: "#10B981", car: "#F59E0B", home: "#8B5CF6",
  business: "#EC4899", pension: "#06B6D4", disability: "#6B7280",
};

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
    fontSize: "12px",
  },
};

export function InsuranceReports() {
  const { data: policies, isLoading } = useInsurancePolicies();

  const allPolicies = policies || [];
  const activePolicies = allPolicies.filter((p) => p.status === "active");

  // Summary
  const totalPolicies = allPolicies.length;
  const totalPremium = activePolicies.reduce((s, p) => s + Number(p.monthly_premium || 0), 0);
  const totalCommission = activePolicies.reduce((s, p) => s + Number(p.commission_amount || 0), 0);

  // Type distribution
  const typeMap = new Map<string, number>();
  allPolicies.forEach((p) => {
    typeMap.set(p.policy_type, (typeMap.get(p.policy_type) || 0) + 1);
  });
  const typeData = Array.from(typeMap.entries()).map(([name, value]) => ({
    name: POLICY_TYPES[name] || name,
    value,
    color: TYPE_COLORS[name] || "#6B7280",
  }));

  // Company distribution
  const companyMap = new Map<string, number>();
  allPolicies.forEach((p) => {
    const co = p.insurance_company || "אחר";
    companyMap.set(co, (companyMap.get(co) || 0) + 1);
  });
  const companyData = Array.from(companyMap.entries())
    .map(([company, policies]) => ({ company, policies }))
    .sort((a, b) => b.policies - a.policies);

  // Monthly data (by created_at month)
  const monthMap = new Map<string, { premium: number; commission: number }>();
  allPolicies.forEach((p) => {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthMap.get(key) || { premium: 0, commission: 0 };
    existing.premium += Number(p.monthly_premium || 0);
    existing.commission += Number(p.commission_amount || 0);
    monthMap.set(key, existing);
  });
  const monthlyData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      month: new Date(month + "-01").toLocaleDateString("he-IL", { month: "short" }),
      ...data,
    }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">דוחות וניתוחים</h2>
        <p className="text-sm text-muted-foreground">ביצועים, מגמות ונתוני תיק הביטוח</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-primary">{totalPolicies}</p>
            <p className="text-xs text-muted-foreground mt-1">פוליסות בתיק</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-gold">₪{totalPremium.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">פרמיה חודשית כוללת</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-emerald-400">₪{totalCommission.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">עמלות כוללות</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {monthlyData.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ביצועים חודשיים — פרמיות ועמלות</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="premium" name="פרמיה (₪)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="commission" name="עמלה (₪)" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {typeData.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">חלוקה לפי סוג פוליסה</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {companyData.length > 0 && (
          <Card className="bg-card/50 border-border/50 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">פוליסות לפי חברת ביטוח</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={companyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis dataKey="company" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={60} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="policies" name="פוליסות" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {totalPolicies === 0 && (
          <Card className="bg-card/50 border-border/50 lg:col-span-2">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">אין נתונים עדיין — הוסף פוליסות כדי לראות דוחות</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
