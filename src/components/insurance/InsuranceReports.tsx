import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const MONTHLY_DATA = [
  { month: "ינו", policies: 8, premium: 3200, commission: 480 },
  { month: "פבר", policies: 12, premium: 4800, commission: 720 },
  { month: "מרץ", policies: 10, premium: 4100, commission: 615 },
  { month: "אפר", policies: 15, premium: 6200, commission: 930 },
  { month: "מאי", policies: 11, premium: 4500, commission: 675 },
  { month: "יוני", policies: 18, premium: 7300, commission: 1095 },
];

const TYPE_DATA = [
  { name: "חיים", value: 35, color: "#3B82F6" },
  { name: "בריאות", value: 25, color: "#10B981" },
  { name: "רכב", value: 20, color: "#F59E0B" },
  { name: "דירה", value: 10, color: "#8B5CF6" },
  { name: "פנסיה", value: 7, color: "#EC4899" },
  { name: "אחר", value: 3, color: "#6B7280" },
];

const COMPANY_DATA = [
  { company: "הראל", policies: 32 },
  { company: "הפניקס", policies: 28 },
  { company: "מגדל", policies: 22 },
  { company: "כלל", policies: 18 },
  { company: "מנורה", policies: 15 },
  { company: "AIG", policies: 12 },
];

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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">דוחות וניתוחים</h2>
        <p className="text-sm text-muted-foreground">ביצועים, מגמות ונתוני תיק הביטוח</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-primary">74</p>
            <p className="text-xs text-muted-foreground mt-1">פוליסות נמכרו השנה</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-gold">₪30,100</p>
            <p className="text-xs text-muted-foreground mt-1">פרמיה חודשית ממוצעת</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-emerald-400">₪4,515</p>
            <p className="text-xs text-muted-foreground mt-1">עמלות ממוצעות לחודש</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ביצועים חודשיים — פרמיות ועמלות</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={MONTHLY_DATA}>
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

        {/* Policy Type Distribution */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">חלוקה לפי סוג פוליסה</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={TYPE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {TYPE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Company */}
        <Card className="bg-card/50 border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">פוליסות לפי חברת ביטוח</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={COMPANY_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis dataKey="company" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={60} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="policies" name="פוליסות" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
