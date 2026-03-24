import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Percent, MapPin } from "lucide-react";

// Mock data — Bloomberg-style mortgage market analytics
const monthlyDemand = [
  { month: "ינו׳", volume: 18200, approvals: 14100 },
  { month: "פבר׳", volume: 17800, approvals: 13600 },
  { month: "מרץ", volume: 21400, approvals: 16800 },
  { month: "אפר׳", volume: 22100, approvals: 17200 },
  { month: "מאי", volume: 24600, approvals: 19100 },
  { month: "יוני", volume: 23800, approvals: 18400 },
  { month: "יולי", volume: 25200, approvals: 19800 },
  { month: "אוג׳", volume: 26100, approvals: 20500 },
  { month: "ספט׳", volume: 27400, approvals: 21200 },
  { month: "אוק׳", volume: 28900, approvals: 22100 },
  { month: "נוב׳", volume: 30200, approvals: 23400 },
  { month: "דצמ׳", volume: 31500, approvals: 24800 },
];

const interestRates = [
  { month: "ינו׳", prime: 6.0, fixed5: 4.8, variable: 5.2, cpi: 3.9 },
  { month: "פבר׳", prime: 5.9, fixed5: 4.7, variable: 5.1, cpi: 3.8 },
  { month: "מרץ", prime: 5.75, fixed5: 4.6, variable: 5.0, cpi: 3.7 },
  { month: "אפר׳", prime: 5.5, fixed5: 4.5, variable: 4.9, cpi: 3.6 },
  { month: "מאי", prime: 5.5, fixed5: 4.4, variable: 4.8, cpi: 3.5 },
  { month: "יוני", prime: 5.25, fixed5: 4.3, variable: 4.7, cpi: 3.4 },
  { month: "יולי", prime: 5.0, fixed5: 4.2, variable: 4.6, cpi: 3.3 },
  { month: "אוג׳", prime: 4.75, fixed5: 4.1, variable: 4.5, cpi: 3.2 },
  { month: "ספט׳", prime: 4.75, fixed5: 4.0, variable: 4.4, cpi: 3.1 },
  { month: "אוק׳", prime: 4.5, fixed5: 3.9, variable: 4.3, cpi: 3.0 },
  { month: "נוב׳", prime: 4.5, fixed5: 3.85, variable: 4.2, cpi: 2.9 },
  { month: "דצמ׳", prime: 4.25, fixed5: 3.8, variable: 4.1, cpi: 2.85 },
];

const geoData = [
  { name: "תל אביב", value: 28, color: "hsl(43, 74%, 52%)" },
  { name: "מרכז", value: 24, color: "hsl(234, 89%, 63%)" },
  { name: "ירושלים", value: 16, color: "hsl(186, 100%, 50%)" },
  { name: "חיפה והצפון", value: 14, color: "hsl(160, 84%, 39%)" },
  { name: "דרום", value: 10, color: "hsl(38, 92%, 50%)" },
  { name: "יו״ש", value: 8, color: "hsl(280, 60%, 55%)" },
];

const formatNum = (n: number) => n.toLocaleString("he-IL");

export default function MarketTrends() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-header">מגמות שוק המשכנתאות</h2>
          <p className="text-sm text-muted-foreground mt-1">נתוני שוק עדכניים · עדכון אחרון: דצמבר 2025</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
          LIVE
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "ביקוש חודשי", value: "₪31.5B", change: "+8.2%", up: true },
          { label: "ריבית פריים", value: "4.25%", change: "-0.25%", up: false },
          { label: "שיעור אישורים", value: "78.7%", change: "+1.2%", up: true },
          { label: "זמן ממוצע לאישור", value: "12 ימים", change: "-2 ימים", up: false },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card p-4">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="text-xl font-bold text-foreground font-heebo mt-1">{kpi.value}</p>
            <p className={`text-xs mt-1 ${kpi.up ? "text-success" : "text-cyan-glow"}`}>
              {kpi.change}
            </p>
          </div>
        ))}
      </div>

      {/* Chart 1: Monthly Demand */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gold" />
          <h3 className="font-semibold text-foreground">ביקוש למשכנתאות (חודשי)</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyDemand}>
            <defs>
              <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(234,89%,63%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(234,89%,63%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(43,74%,52%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(43,74%,52%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
            <XAxis dataKey="month" tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} />
            <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} tickFormatter={formatNum} />
            <Tooltip
              contentStyle={{ background: "hsl(222,47%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "hsl(210,40%,96%)" }}
              formatter={(v: number) => [formatNum(v), ""]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="volume" name="בקשות" stroke="hsl(234,89%,63%)" fill="url(#gradVolume)" strokeWidth={2} />
            <Area type="monotone" dataKey="approvals" name="אישורים" stroke="hsl(43,74%,52%)" fill="url(#gradApproved)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Interest Rates */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="w-5 h-5 text-cyan-glow" />
            <h3 className="font-semibold text-foreground">ריביות ממוצעות בשוק</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={interestRates}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} />
              <YAxis domain={[2, 7]} tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "hsl(222,47%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="prime" name="פריים" stroke="hsl(0,63%,50%)" fill="hsl(0,63%,50%)" fillOpacity={0.08} strokeWidth={2} />
              <Area type="monotone" dataKey="fixed5" name="קל״צ 5 שנים" stroke="hsl(43,74%,52%)" fill="hsl(43,74%,52%)" fillOpacity={0.08} strokeWidth={2} />
              <Area type="monotone" dataKey="variable" name="משתנה" stroke="hsl(234,89%,63%)" fill="hsl(234,89%,63%)" fillOpacity={0.08} strokeWidth={2} />
              <Area type="monotone" dataKey="cpi" name="צמוד מדד" stroke="hsl(160,84%,39%)" fill="hsl(160,84%,39%)" fillOpacity={0.08} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Geographic Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gold" />
            <h3 className="font-semibold text-foreground">פילוח גיאוגרפי של לידים</h3>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={260}>
              <PieChart>
                <Pie
                  data={geoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={3}
                  stroke="none"
                >
                  {geoData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(222,47%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v}%`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {geoData.map((g) => (
                <div key={g.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: g.color }} />
                  <span className="text-muted-foreground flex-1">{g.name}</span>
                  <span className="font-bold text-foreground font-heebo">{g.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
