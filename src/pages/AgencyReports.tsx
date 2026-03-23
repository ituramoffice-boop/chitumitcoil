import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Target,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { he } from "date-fns/locale";

type LeadStatus = "new" | "contacted" | "in_progress" | "submitted" | "approved" | "rejected" | "closed";

interface Lead {
  id: string;
  full_name: string;
  status: LeadStatus;
  assigned_to: string | null;
  consultant_id: string;
  created_at: string;
  mortgage_amount: number | null;
  lead_source: string | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  department: string | null;
  profile?: { full_name: string | null };
}

const MONTH_NAMES = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יוני", "יולי", "אוג", "ספט", "אוק", "נוב", "דצמ"];

const COLORS = {
  primary: "hsl(217, 91%, 50%)",
  success: "hsl(160, 84%, 39%)",
  warning: "hsl(38, 92%, 50%)",
  destructive: "hsl(0, 84%, 60%)",
  muted: "hsl(220, 9%, 46%)",
};

const AgencyReports = () => {
  const { user } = useAuth();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["agency-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, full_name, status, assigned_to, consultant_id, created_at, mortgage_amount, lead_source")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) throw error;
      return data;
    },
  });

  const currentTeam = teams[0];

  const { data: members = [] } = useQuery({
    queryKey: ["team-members-reports", currentTeam?.id],
    queryFn: async () => {
      if (!currentTeam) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("id, user_id, role, department")
        .eq("team_id", currentTeam.id);
      if (error) throw error;
      const userIds = (data as any[]).map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      return (data as any[]).map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id),
      })) as TeamMember[];
    },
    enabled: !!currentTeam,
  });

  // Monthly trend data (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return months.map((month) => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const monthLeads = leads.filter((l) => {
        const d = new Date(l.created_at);
        return d >= start && d <= end;
      });
      const approved = monthLeads.filter((l) => l.status === "approved").length;
      const total = monthLeads.length;

      return {
        name: MONTH_NAMES[month.getMonth()],
        לידים: total,
        אישורים: approved,
        המרה: total > 0 ? Math.round((approved / total) * 100) : 0,
      };
    });
  }, [leads]);

  // Conversion funnel data
  const funnelData = useMemo(() => {
    const stages = [
      { name: "לידים חדשים", statuses: ["new"] as LeadStatus[], color: COLORS.primary },
      { name: "יצירת קשר", statuses: ["contacted"] as LeadStatus[], color: COLORS.warning },
      { name: "בניתוח", statuses: ["in_progress"] as LeadStatus[], color: COLORS.muted },
      { name: "הוגש לבנק", statuses: ["submitted"] as LeadStatus[], color: COLORS.success },
      { name: "אושר", statuses: ["approved"] as LeadStatus[], color: "hsl(160, 84%, 39%)" },
    ];
    return stages.map((s) => ({
      name: s.name,
      value: leads.filter((l) => s.statuses.includes(l.status)).length,
      color: s.color,
    }));
  }, [leads]);

  // Source breakdown
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.lead_source || "organic";
      counts[src] = (counts[src] || 0) + 1;
    });
    const labels: Record<string, string> = { facebook: "פייסבוק", referral: "הפנייה", organic: "אורגני" };
    const colors: Record<string, string> = {
      facebook: COLORS.primary,
      referral: COLORS.success,
      organic: COLORS.warning,
    };
    return Object.entries(counts).map(([k, v]) => ({
      name: labels[k] || k,
      value: v,
      color: colors[k] || COLORS.muted,
    }));
  }, [leads]);

  // Member performance ranking
  const memberPerformance = useMemo(() => {
    return members
      .map((m) => {
        const mLeads = leads.filter((l) => l.assigned_to === m.user_id || l.consultant_id === m.user_id);
        const approved = mLeads.filter((l) => l.status === "approved").length;
        const totalValue = mLeads.reduce((s, l) => s + (l.mortgage_amount ? Number(l.mortgage_amount) : 0), 0);
        return {
          name: m.profile?.full_name || "ללא שם",
          לידים: mLeads.length,
          אישורים: approved,
          שווי: Math.round(totalValue / 1000),
          המרה: mLeads.length > 0 ? Math.round((approved / mLeads.length) * 100) : 0,
        };
      })
      .sort((a, b) => b.אישורים - a.אישורים);
  }, [members, leads]);

  // Forecast - simple linear projection
  const forecast = useMemo(() => {
    if (monthlyTrend.length < 2) return null;
    const recent = monthlyTrend.slice(-3);
    const avgGrowth = recent.reduce((s, m) => s + m.לידים, 0) / recent.length;
    const avgApproval = recent.reduce((s, m) => s + m.המרה, 0) / recent.length;
    const lastMonth = monthlyTrend[monthlyTrend.length - 1];
    const trend = lastMonth.לידים > (monthlyTrend[monthlyTrend.length - 2]?.לידים || 0) ? "up" : "down";
    return {
      predictedLeads: Math.round(avgGrowth * 1.1),
      predictedApprovals: Math.round(avgGrowth * 1.1 * (avgApproval / 100)),
      avgConversion: Math.round(avgApproval),
      trend,
    };
  }, [monthlyTrend]);

  // KPIs
  const kpis = useMemo(() => {
    const totalValue = leads
      .filter((l) => l.status === "approved")
      .reduce((s, l) => s + (l.mortgage_amount ? Number(l.mortgage_amount) : 0), 0);
    const thisMonth = leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= startOfMonth(new Date());
    });
    const approvedRate = leads.length > 0
      ? Math.round((leads.filter((l) => l.status === "approved").length / leads.length) * 100)
      : 0;
    return {
      totalLeads: leads.length,
      totalApproved: leads.filter((l) => l.status === "approved").length,
      totalValue,
      thisMonthLeads: thisMonth.length,
      approvedRate,
    };
  }, [leads]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">דוחות סוכנות</h2>
          <p className="text-xs text-muted-foreground">ביצועים, מגמות ותחזיות</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="סה״כ לידים" value={kpis.totalLeads} icon={Users} />
        <KpiCard title="אושרו" value={kpis.totalApproved} icon={CheckCircle2} variant="success" />
        <KpiCard title="אחוז המרה" value={`${kpis.approvedRate}%`} icon={Target} variant="primary" />
        <KpiCard title="החודש" value={kpis.thisMonthLeads} icon={TrendingUp} variant="warning" />
        <KpiCard
          title="שווי כולל"
          value={kpis.totalValue > 0 ? `₪${(kpis.totalValue / 1000000).toFixed(1)}M` : "₪0"}
          icon={Zap}
          variant="primary"
        />
      </div>

      {/* Forecast Banner */}
      {forecast && (
        <div className="glass-card p-4 border-primary/20 bg-gradient-to-l from-primary/5 via-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">תחזית לחודש הבא</p>
              <p className="text-xs text-muted-foreground">
                צפי של ~{forecast.predictedLeads} לידים חדשים, ~{forecast.predictedApprovals} אישורים
                (המרה ממוצעת {forecast.avgConversion}%)
              </p>
            </div>
            <div className={cn("flex items-center gap-1 text-sm font-bold", forecast.trend === "up" ? "text-success" : "text-destructive")}>
              {forecast.trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {forecast.trend === "up" ? "מגמת עלייה" : "מגמת ירידה"}
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">מגמת לידים ואישורים (6 חודשים)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 13%, 91%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="לידים" stroke={COLORS.primary} fillOpacity={1} fill="url(#gradPrimary)" strokeWidth={2} />
              <Area type="monotone" dataKey="אישורים" stroke={COLORS.success} fillOpacity={1} fill="url(#gradSuccess)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Rate Trend */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">מגמת המרה (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 13%, 91%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="המרה" stroke={COLORS.warning} strokeWidth={3} dot={{ r: 5, fill: COLORS.warning }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">משפך המרה</h3>
          <div className="space-y-3">
            {funnelData.map((stage, i) => {
              const maxVal = Math.max(...funnelData.map((s) => s.value), 1);
              return (
                <div key={stage.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{stage.name}</span>
                    <span className="font-bold text-foreground">{stage.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(stage.value / maxVal) * 100}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">התפלגות מקורות</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {sourceData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 13%, 91%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {sourceData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-muted-foreground">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Ranking */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">דירוג חברי צוות</h3>
          {memberPerformance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">אין חברי צוות</p>
          ) : (
            <div className="space-y-3">
              {memberPerformance.slice(0, 5).map((member, i) => (
                <div key={member.name} className="flex items-center gap-3">
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    i === 0 ? "bg-warning/20 text-warning" :
                    i === 1 ? "bg-secondary text-muted-foreground" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {member.לידים} לידים · {member.אישורים} אישורים · ₪{member.שווי}K
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs font-bold",
                    member.המרה >= 50 ? "text-success" : member.המרה >= 25 ? "text-warning" : "text-muted-foreground"
                  )}>
                    {member.המרה}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Bar Chart */}
      {memberPerformance.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">ביצועי צוות - השוואה</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={memberPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 13%, 91%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="לידים" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={14} />
              <Bar dataKey="אישורים" fill={COLORS.success} radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

function KpiCard({ title, value, icon: Icon, variant }: {
  title: string;
  value: string | number;
  icon: any;
  variant?: "primary" | "success" | "warning";
}) {
  const colors = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
  };
  return (
    <div className="glass-card p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary">
          <Icon className={cn("w-4 h-4", variant ? colors[variant] : "text-muted-foreground")} />
        </div>
      </div>
    </div>
  );
}

export default AgencyReports;
