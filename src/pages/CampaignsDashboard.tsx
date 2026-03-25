import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Megaphone, Users, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const kpis = [
  { label: "קמפיינים פעילים", value: "7", icon: Megaphone, change: "+2 מהשבוע שעבר" },
  { label: "סה״כ לידים", value: "1,284", icon: Users, change: "+18% מהחודש שעבר" },
  { label: "עלות ממוצעת לליד", value: "₪38", icon: DollarSign, change: "-12% מהחודש שעבר" },
  { label: "אחוז המרה", value: "14.2%", icon: TrendingUp, change: "+3.1% מהחודש שעבר" },
];

const trafficSources = [
  { source: "Facebook Ads", leads: 482, closed: 68, cpa: "₪32", badge: "top" },
  { source: "Google Ads", leads: 356, closed: 51, cpa: "₪45", badge: "active" },
  { source: "TikTok Ads", leads: 198, closed: 22, cpa: "₪28", badge: "new" },
  { source: "Organic (SEO)", leads: 164, closed: 31, cpa: "₪0", badge: "free" },
  { source: "Instagram", leads: 84, closed: 9, cpa: "₪41", badge: "active" },
];

const PIE_COLORS = ["hsl(217, 91%, 60%)", "hsl(262, 83%, 58%)", "hsl(173, 80%, 40%)", "hsl(43, 96%, 56%)", "hsl(346, 77%, 50%)"];

const pieData = trafficSources.map((s) => ({ name: s.source, value: s.leads }));
const barData = trafficSources.map((s) => ({ name: s.source.replace(" Ads", "").replace(" (SEO)", ""), leads: s.leads, closed: s.closed }));

const badgeVariant = (type: string) => {
  switch (type) {
    case "top": return "default";
    case "new": return "secondary";
    case "free": return "outline";
    default: return "secondary";
  }
};

const badgeLabel = (type: string) => {
  switch (type) {
    case "top": return "מוביל";
    case "new": return "חדש";
    case "free": return "חינמי";
    default: return "פעיל";
  }
};

const CampaignsDashboard = () => {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user || role !== "admin") return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <BarChart3 className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">דשבורד קמפיינים</h1>
          <p className="text-sm text-muted-foreground">מעקב אחרי ביצועי השיווק ומקורות התנועה</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/50">
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <kpi.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-[10px] text-primary mt-0.5">{kpi.change}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Traffic Sources Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">מקורות תנועה</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">מקור</TableHead>
                <TableHead className="text-right">לידים</TableHead>
                <TableHead className="text-right">עסקאות שנסגרו</TableHead>
                <TableHead className="text-right">עלות לליד</TableHead>
                <TableHead className="text-right">המרה</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trafficSources.map((row) => (
                <TableRow key={row.source}>
                  <TableCell className="font-medium text-foreground">{row.source}</TableCell>
                  <TableCell className="text-foreground">{row.leads.toLocaleString()}</TableCell>
                  <TableCell className="text-foreground">{row.closed}</TableCell>
                  <TableCell className="text-foreground">{row.cpa}</TableCell>
                  <TableCell className="text-foreground">
                    {row.leads > 0 ? `${((row.closed / row.leads) * 100).toFixed(1)}%` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(row.badge)}>{badgeLabel(row.badge)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignsDashboard;
