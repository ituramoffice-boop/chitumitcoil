import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy, TrendingUp, Target, Users, DollarSign, Phone,
  Crown, Medal, Award, Flame, BarChart3, ArrowUpRight,
  ArrowDownRight, Minus, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadRow {
  id: string;
  consultant_id: string;
  status: string;
  mortgage_amount: number | null;
  created_at: string;
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
}

interface CallLogRow {
  user_id: string;
  duration_seconds: number;
  sentiment: string | null;
}

interface AgentStats {
  userId: string;
  name: string;
  totalLeads: number;
  closedDeals: number;
  conversionRate: number;
  totalRevenue: number;
  totalCalls: number;
  avgCallDuration: number;
  positiveCallRate: number;
  rank: number;
}

const rankIcons = [
  { icon: Crown, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30" },
  { icon: Medal, color: "text-slate-400", bg: "bg-slate-400/10 border-slate-400/30" },
  { icon: Award, color: "text-amber-700", bg: "bg-amber-700/10 border-amber-700/30" },
];

function StatCard({ icon: Icon, label, value, subValue, iconColor, trend }: {
  icon: any; label: string; value: string; subValue?: string; iconColor: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 to-primary/20" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subValue && (
              <div className="flex items-center gap-1 mt-1">
                {trend === "up" && <ArrowUpRight className="h-3 w-3 text-green-500" />}
                {trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                {trend === "neutral" && <Minus className="h-3 w-3 text-muted-foreground" />}
                <p className="text-[11px] text-muted-foreground">{subValue}</p>
              </div>
            )}
          </div>
          <div className={cn("p-2.5 rounded-xl", iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentRow({ agent, isCurrentUser }: { agent: AgentStats; isCurrentUser: boolean }) {
  const rankConfig = rankIcons[agent.rank - 1];
  const RankIcon = rankConfig?.icon;

  return (
    <TableRow className={cn(
      "transition-colors",
      isCurrentUser && "bg-primary/5 border-r-2 border-r-primary",
      agent.rank <= 3 && "font-medium"
    )}>
      <TableCell className="text-center">
        {agent.rank <= 3 && RankIcon ? (
          <div className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full border", rankConfig.bg)}>
            <RankIcon className={cn("h-4 w-4", rankConfig.color)} />
          </div>
        ) : (
          <span className="text-muted-foreground font-mono text-sm">{agent.rank}</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {agent.name.charAt(0)}
          </div>
          <div>
            <span className="font-medium">{agent.name}</span>
            {isCurrentUser && (
              <Badge variant="outline" className="mr-2 text-[9px] px-1.5 py-0 border-primary/30 text-primary">
                אתה
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <span className="font-bold text-lg">{agent.closedDeals}</span>
        <span className="text-muted-foreground text-xs">/{agent.totalLeads}</span>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center gap-2">
          <Progress
            value={agent.conversionRate}
            className="h-2 w-16"
          />
          <span className={cn(
            "text-sm font-semibold",
            agent.conversionRate >= 50 ? "text-green-600 dark:text-green-400" :
            agent.conversionRate >= 25 ? "text-yellow-600 dark:text-yellow-400" :
            "text-red-600 dark:text-red-400"
          )}>
            {agent.conversionRate}%
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center font-semibold">
        ₪{agent.totalRevenue.toLocaleString()}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <span>{agent.totalCalls}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="outline" className={cn(
          "text-[10px]",
          agent.positiveCallRate >= 60 ? "border-green-500/30 text-green-600 dark:text-green-400" :
          agent.positiveCallRate >= 40 ? "border-yellow-500/30 text-yellow-600 dark:text-yellow-400" :
          "border-red-500/30 text-red-600 dark:text-red-400"
        )}>
          {agent.positiveCallRate}% חיובי
        </Badge>
      </TableCell>
    </TableRow>
  );
}

function FunnelBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SalesLeaderboard() {
  const { user } = useAuth();

  const { data: leads = [] } = useQuery({
    queryKey: ["sales-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, consultant_id, status, mortgage_amount, created_at");
      if (error) throw error;
      return (data || []) as LeadRow[];
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["sales-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name");
      if (error) throw error;
      return (data || []) as ProfileRow[];
    },
    enabled: !!user,
  });

  const { data: callLogs = [] } = useQuery({
    queryKey: ["sales-calls"],
    queryFn: async () => {
      const { data, error } = await supabase.from("call_logs").select("user_id, duration_seconds, sentiment");
      if (error) throw error;
      return (data || []) as CallLogRow[];
    },
    enabled: !!user,
  });

  // Build agent stats
  const profileMap = new Map(profiles.map(p => [p.user_id, p.full_name || "ללא שם"]));

  const agentMap = new Map<string, AgentStats>();
  for (const lead of leads) {
    const uid = lead.consultant_id;
    if (!agentMap.has(uid)) {
      agentMap.set(uid, {
        userId: uid,
        name: profileMap.get(uid) || "ללא שם",
        totalLeads: 0, closedDeals: 0, conversionRate: 0,
        totalRevenue: 0, totalCalls: 0, avgCallDuration: 0,
        positiveCallRate: 0, rank: 0,
      });
    }
    const agent = agentMap.get(uid)!;
    agent.totalLeads++;
    if (lead.status === "approved" || lead.status === "closed") {
      agent.closedDeals++;
      agent.totalRevenue += lead.mortgage_amount || 0;
    }
  }

  // Add call stats
  const callsByUser = new Map<string, { total: number; positive: number; duration: number }>();
  for (const call of callLogs) {
    if (!callsByUser.has(call.user_id)) {
      callsByUser.set(call.user_id, { total: 0, positive: 0, duration: 0 });
    }
    const c = callsByUser.get(call.user_id)!;
    c.total++;
    c.duration += call.duration_seconds;
    if (call.sentiment === "positive") c.positive++;
  }

  for (const [uid, callData] of callsByUser) {
    const agent = agentMap.get(uid);
    if (agent) {
      agent.totalCalls = callData.total;
      agent.avgCallDuration = callData.total > 0 ? Math.round(callData.duration / callData.total) : 0;
      agent.positiveCallRate = callData.total > 0 ? Math.round((callData.positive / callData.total) * 100) : 0;
    }
  }

  // Calculate conversion rates and rank
  const agents = Array.from(agentMap.values()).map(a => ({
    ...a,
    conversionRate: a.totalLeads > 0 ? Math.round((a.closedDeals / a.totalLeads) * 100) : 0,
  }));
  agents.sort((a, b) => b.closedDeals - a.closedDeals || b.conversionRate - a.conversionRate);
  agents.forEach((a, i) => a.rank = i + 1);

  // Global stats
  const totalLeads = leads.length;
  const totalClosed = leads.filter(l => l.status === "approved" || l.status === "closed").length;
  const totalRevenue = leads
    .filter(l => l.status === "approved" || l.status === "closed")
    .reduce((sum, l) => sum + (l.mortgage_amount || 0), 0);
  const globalConversion = totalLeads > 0 ? Math.round((totalClosed / totalLeads) * 100) : 0;
  const totalCallsCount = callLogs.length;

  // Funnel
  const statusCounts: Record<string, number> = {};
  for (const lead of leads) {
    statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
  }

  const funnelStages = [
    { key: "new", label: "חדש", color: "bg-blue-500" },
    { key: "contacted", label: "נוצר קשר", color: "bg-sky-500" },
    { key: "in_progress", label: "בטיפול", color: "bg-yellow-500" },
    { key: "submitted", label: "הוגש", color: "bg-orange-500" },
    { key: "approved", label: "אושר", color: "bg-green-500" },
    { key: "rejected", label: "נדחה", color: "bg-red-500" },
    { key: "closed", label: "נסגר", color: "bg-primary" },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">לוח תוצאות מכירות</h2>
            <p className="text-sm text-muted-foreground">ביצועי נציגים, שיעורי המרה ומשפך מכירות</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 text-xs">
          <Zap className="h-3 w-3" />
          עדכון אוטומטי
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="עסקאות שנסגרו"
          value={totalClosed.toString()}
          subValue={`מתוך ${totalLeads} לידים`}
          iconColor="bg-green-500/10 text-green-600 dark:text-green-400"
          trend="up"
        />
        <StatCard
          icon={TrendingUp}
          label="שיעור המרה"
          value={`${globalConversion}%`}
          subValue="מליד לסגירה"
          iconColor="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          trend={globalConversion >= 30 ? "up" : globalConversion >= 15 ? "neutral" : "down"}
        />
        <StatCard
          icon={DollarSign}
          label="סה״כ היקף"
          value={`₪${(totalRevenue / 1000000).toFixed(1)}M`}
          subValue="סכום משכנתאות שאושרו"
          iconColor="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          trend="up"
        />
        <StatCard
          icon={Phone}
          label="שיחות"
          value={totalCallsCount.toString()}
          subValue="סה״כ שיחות שבוצעו"
          iconColor="bg-orange-500/10 text-orange-600 dark:text-orange-400"
          trend="neutral"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Agent Leaderboard */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              דירוג נציגים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">אין נתוני נציגים עדיין</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="min-w-[700px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-16">#</TableHead>
                        <TableHead className="text-right">נציג</TableHead>
                        <TableHead className="text-center">סגירות</TableHead>
                        <TableHead className="text-center">המרה</TableHead>
                        <TableHead className="text-center">היקף</TableHead>
                        <TableHead className="text-center">שיחות</TableHead>
                        <TableHead className="text-center">סנטימנט</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agents.map(agent => (
                        <AgentRow
                          key={agent.userId}
                          agent={agent}
                          isCurrentUser={agent.userId === user?.id}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Sales Funnel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              משפך מכירות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelStages.map(stage => (
              <FunnelBar
                key={stage.key}
                label={stage.label}
                count={statusCounts[stage.key] || 0}
                total={totalLeads}
                color={stage.color}
              />
            ))}
            
            {/* Top performers mini */}
            {agents.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">🏆 מובילים</p>
                <div className="space-y-2">
                  {agents.slice(0, 3).map((agent, i) => {
                    const config = rankIcons[i];
                    const RankIcon = config?.icon || Award;
                    return (
                      <div key={agent.userId} className={cn(
                        "flex items-center justify-between p-2 rounded-lg border",
                        config?.bg || "bg-muted/30 border-border/30"
                      )}>
                        <div className="flex items-center gap-2">
                          <RankIcon className={cn("h-4 w-4", config?.color || "text-muted-foreground")} />
                          <span className="text-sm font-medium">{agent.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span className="text-sm font-bold">{agent.closedDeals}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
