import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy, TrendingUp, Target, Users, DollarSign, Phone,
  Crown, Medal, Award, Flame, BarChart3, ArrowUpRight,
  ArrowDownRight, Minus, Zap, Calendar, Clock, Filter,
  ArrowUpDown, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Lightbulb, Timer, Percent, PhoneCall,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, subMonths, startOfDay, startOfWeek, startOfMonth, startOfQuarter, isAfter } from "date-fns";
import { he } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────
interface LeadRow {
  id: string;
  consultant_id: string;
  status: string;
  mortgage_amount: number | null;
  lead_source: string | null;
  lead_score: number | null;
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
  created_at: string;
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
  avgLeadScore: number;
  rank: number;
}

type TimeRange = "all" | "today" | "week" | "month" | "quarter" | "year";
type SortBy = "closedDeals" | "conversionRate" | "totalRevenue" | "totalCalls" | "avgLeadScore" | "positiveCallRate";

// ─── Constants ───────────────────────────────────────────────
const rankIcons = [
  { icon: Crown, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30" },
  { icon: Medal, color: "text-slate-400", bg: "bg-slate-400/10 border-slate-400/30" },
  { icon: Award, color: "text-amber-700", bg: "bg-amber-700/10 border-amber-700/30" },
];

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "all", label: "כל הזמן" },
  { value: "today", label: "היום" },
  { value: "week", label: "שבוע אחרון" },
  { value: "month", label: "חודש אחרון" },
  { value: "quarter", label: "רבעון אחרון" },
  { value: "year", label: "שנה אחרונה" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "closedDeals", label: "סגירות" },
  { value: "conversionRate", label: "המרה %" },
  { value: "totalRevenue", label: "היקף" },
  { value: "totalCalls", label: "שיחות" },
  { value: "avgLeadScore", label: "ציון ליד ממוצע" },
  { value: "positiveCallRate", label: "סנטימנט חיובי" },
];

const FUNNEL_STAGES = [
  { key: "new", label: "חדש", color: "bg-blue-500" },
  { key: "contacted", label: "נוצר קשר", color: "bg-sky-500" },
  { key: "in_progress", label: "בטיפול", color: "bg-yellow-500" },
  { key: "submitted", label: "הוגש", color: "bg-orange-500" },
  { key: "approved", label: "אושר", color: "bg-green-500" },
  { key: "rejected", label: "נדחה", color: "bg-red-500" },
  { key: "closed", label: "נסגר", color: "bg-primary" },
];

// ─── Helpers ─────────────────────────────────────────────────
function getTimeRangeStart(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case "today": return startOfDay(now);
    case "week": return startOfWeek(now, { weekStartsOn: 0 });
    case "month": return startOfMonth(now);
    case "quarter": return startOfQuarter(now);
    case "year": return subMonths(now, 12);
    default: return null;
  }
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Sub-Components ──────────────────────────────────────────
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
        <span className="text-xs tabular-nums text-muted-foreground">{formatDuration(agent.avgCallDuration)}</span>
      </TableCell>
      <TableCell className="text-center">
        <div className={cn(
          "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold",
          agent.avgLeadScore >= 70 ? "bg-red-500/10 text-red-500 border border-red-500/30" :
          agent.avgLeadScore >= 40 ? "bg-orange-500/10 text-orange-500 border border-orange-500/30" :
          "bg-blue-500/10 text-blue-500 border border-blue-500/30"
        )}>
          {agent.avgLeadScore}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="outline" className={cn(
          "text-[10px]",
          agent.positiveCallRate >= 60 ? "border-green-500/30 text-green-600 dark:text-green-400" :
          agent.positiveCallRate >= 40 ? "border-yellow-500/30 text-yellow-600 dark:text-yellow-400" :
          "border-red-500/30 text-red-600 dark:text-red-400"
        )}>
          {agent.positiveCallRate}%
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <span className="tabular-nums">{agent.totalCalls}</span>
        </div>
      </TableCell>
      <TableCell className="text-center font-semibold tabular-nums">
        ₪{agent.totalRevenue.toLocaleString()}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center gap-2 justify-center">
          <Progress value={agent.conversionRate} className="h-2 w-14" />
          <span className={cn(
            "text-sm font-semibold tabular-nums",
            agent.conversionRate >= 50 ? "text-green-600 dark:text-green-400" :
            agent.conversionRate >= 25 ? "text-yellow-600 dark:text-yellow-400" :
            "text-red-600 dark:text-red-400"
          )}>
            {agent.conversionRate}%
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <span className="font-bold text-lg">{agent.closedDeals}</span>
        <span className="text-muted-foreground text-xs">/{agent.totalLeads}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 justify-end">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{agent.name}</span>
            {isCurrentUser && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">אתה</Badge>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {agent.name.charAt(0)}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {agent.rank <= 3 && RankIcon ? (
          <div className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full border", rankConfig.bg)}>
            <RankIcon className={cn("h-4 w-4", rankConfig.color)} />
          </div>
        ) : (
          <span className="text-muted-foreground font-mono text-sm">{agent.rank}</span>
        )}
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
        <span className="font-semibold tabular-nums">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, description, color }: {
  icon: any; title: string; description: string; color: string;
}) {
  return (
    <div className={cn("flex items-start gap-2.5 p-3 rounded-lg border", color)}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs font-bold">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function SalesLeaderboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("closedDeals");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ─── Data Fetching ───────────────────────────────────────
  const { data: allLeads = [] } = useQuery({
    queryKey: ["sales-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, consultant_id, status, mortgage_amount, lead_source, lead_score, created_at");
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

  const { data: allCallLogs = [] } = useQuery({
    queryKey: ["sales-calls-full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("call_logs").select("user_id, duration_seconds, sentiment, created_at");
      if (error) throw error;
      return (data || []) as CallLogRow[];
    },
    enabled: !!user,
  });

  // ─── Filtering ───────────────────────────────────────────
  const rangeStart = getTimeRangeStart(timeRange);

  const leads = useMemo(() => {
    let result = allLeads;
    if (rangeStart) result = result.filter(l => isAfter(new Date(l.created_at), rangeStart));
    if (filterSource !== "all") result = result.filter(l => l.lead_source === filterSource);
    if (filterStatus !== "all") result = result.filter(l => l.status === filterStatus);
    if (filterAgent !== "all") result = result.filter(l => l.consultant_id === filterAgent);
    return result;
  }, [allLeads, rangeStart, filterSource, filterStatus, filterAgent]);

  const callLogs = useMemo(() => {
    let result = allCallLogs;
    if (rangeStart) result = result.filter(c => isAfter(new Date(c.created_at), rangeStart));
    if (filterAgent !== "all") result = result.filter(c => c.user_id === filterAgent);
    return result;
  }, [allCallLogs, rangeStart, filterAgent]);

  // ─── Profile Map ─────────────────────────────────────────
  const profileMap = useMemo(() => new Map(profiles.map(p => [p.user_id, p.full_name || "ללא שם"])), [profiles]);

  // Available sources
  const availableSources = useMemo(() => [...new Set(allLeads.map(l => l.lead_source).filter(Boolean))], [allLeads]);

  // ─── Agent Stats ─────────────────────────────────────────
  const agents = useMemo(() => {
    const agentMap = new Map<string, AgentStats>();

    for (const lead of leads) {
      const uid = lead.consultant_id;
      if (!agentMap.has(uid)) {
        agentMap.set(uid, {
          userId: uid, name: profileMap.get(uid) || "ללא שם",
          totalLeads: 0, closedDeals: 0, conversionRate: 0,
          totalRevenue: 0, totalCalls: 0, avgCallDuration: 0,
          positiveCallRate: 0, avgLeadScore: 0, rank: 0,
        });
      }
      const agent = agentMap.get(uid)!;
      agent.totalLeads++;
      if (lead.status === "approved" || lead.status === "closed") {
        agent.closedDeals++;
        agent.totalRevenue += lead.mortgage_amount || 0;
      }
    }

    // Lead scores per agent
    const scoresByAgent = new Map<string, number[]>();
    for (const lead of leads) {
      if (lead.lead_score && lead.lead_score > 0) {
        if (!scoresByAgent.has(lead.consultant_id)) scoresByAgent.set(lead.consultant_id, []);
        scoresByAgent.get(lead.consultant_id)!.push(lead.lead_score);
      }
    }
    for (const [uid, scores] of scoresByAgent) {
      const agent = agentMap.get(uid);
      if (agent) agent.avgLeadScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    }

    // Call stats
    const callsByUser = new Map<string, { total: number; positive: number; duration: number }>();
    for (const call of callLogs) {
      if (!callsByUser.has(call.user_id)) callsByUser.set(call.user_id, { total: 0, positive: 0, duration: 0 });
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

    const result = Array.from(agentMap.values()).map(a => ({
      ...a,
      conversionRate: a.totalLeads > 0 ? Math.round((a.closedDeals / a.totalLeads) * 100) : 0,
    }));

    result.sort((a, b) => {
      const diff = (b[sortBy] || 0) - (a[sortBy] || 0);
      return sortDir === "desc" ? diff : -diff;
    });
    result.forEach((a, i) => a.rank = i + 1);

    return result;
  }, [leads, callLogs, profileMap, sortBy, sortDir]);

  // ─── Global Stats ────────────────────────────────────────
  const totalLeads = leads.length;
  const totalClosed = leads.filter(l => l.status === "approved" || l.status === "closed").length;
  const totalRevenue = leads
    .filter(l => l.status === "approved" || l.status === "closed")
    .reduce((sum, l) => sum + (l.mortgage_amount || 0), 0);
  const globalConversion = totalLeads > 0 ? Math.round((totalClosed / totalLeads) * 100) : 0;
  const totalCallsCount = callLogs.length;
  const avgDealSize = totalClosed > 0 ? Math.round(totalRevenue / totalClosed) : 0;
  const totalCallDuration = callLogs.reduce((s, c) => s + c.duration_seconds, 0);
  const avgCallDur = totalCallsCount > 0 ? Math.round(totalCallDuration / totalCallsCount) : 0;
  const rejectedCount = leads.filter(l => l.status === "rejected").length;
  const rejectionRate = totalLeads > 0 ? Math.round((rejectedCount / totalLeads) * 100) : 0;

  // Funnel counts
  const statusCounts: Record<string, number> = {};
  for (const lead of leads) {
    statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
  }

  // ─── AI Insights ─────────────────────────────────────────
  const insights = useMemo(() => {
    const result: { icon: any; title: string; description: string; color: string }[] = [];

    // Best performer
    if (agents.length > 0) {
      const best = agents[0];
      result.push({
        icon: Crown,
        title: `${best.name} מוביל/ה עם ${best.closedDeals} סגירות`,
        description: `שיעור המרה ${best.conversionRate}% | היקף ₪${best.totalRevenue.toLocaleString()}`,
        color: "bg-yellow-500/5 border-yellow-500/20 text-yellow-700 dark:text-yellow-400",
      });
    }

    // High rejection rate alert
    if (rejectionRate > 30) {
      result.push({
        icon: AlertTriangle,
        title: `שיעור דחייה גבוה: ${rejectionRate}%`,
        description: `${rejectedCount} לידים נדחו. שווה לבדוק את תהליך הסינון הראשוני ואת איכות הלידים הנכנסים.`,
        color: "bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400",
      });
    }

    // Low conversion alert
    if (globalConversion < 20 && totalLeads >= 5) {
      result.push({
        icon: TrendingUp,
        title: `שיעור המרה נמוך: ${globalConversion}%`,
        description: `ממליץ לשפר את תהליך הפולו-אפ. ציון ליד ממוצע נמוך עשוי להצביע על בעיית איכות לידים.`,
        color: "bg-orange-500/5 border-orange-500/20 text-orange-700 dark:text-orange-400",
      });
    }

    // Short calls warning
    if (avgCallDur > 0 && avgCallDur < 120) {
      result.push({
        icon: Timer,
        title: `שיחות קצרות: ממוצע ${formatDuration(avgCallDur)}`,
        description: `שיחות ארוכות יותר (3-5 דקות) מובילות בד"כ לשיעור סגירה גבוה יותר. ייתכן שהנציגים מנתקים מוקדם מדי.`,
        color: "bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-400",
      });
    }

    // High avg deal size
    if (avgDealSize > 1000000) {
      result.push({
        icon: DollarSign,
        title: `גודל עסקה ממוצע: ₪${(avgDealSize / 1000000).toFixed(1)}M`,
        description: `עסקאות גדולות דורשות טיפול VIP. ממליץ לתת עדיפות לשיחות עם לידים בסכומים גבוהים.`,
        color: "bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400",
      });
    }

    // Source analysis
    const sourceStats = new Map<string, { total: number; closed: number }>();
    for (const lead of leads) {
      const src = lead.lead_source || "organic";
      if (!sourceStats.has(src)) sourceStats.set(src, { total: 0, closed: 0 });
      const s = sourceStats.get(src)!;
      s.total++;
      if (lead.status === "approved" || lead.status === "closed") s.closed++;
    }
    let bestSource = "";
    let bestSourceRate = 0;
    for (const [src, stats] of sourceStats) {
      if (stats.total >= 3) {
        const rate = Math.round((stats.closed / stats.total) * 100);
        if (rate > bestSourceRate) { bestSourceRate = rate; bestSource = src; }
      }
    }
    if (bestSource && bestSourceRate > 0) {
      const sourceLabels: Record<string, string> = { facebook: "פייסבוק", referral: "הפנייה", organic: "אורגני" };
      result.push({
        icon: Lightbulb,
        title: `מקור הלידים הטוב ביותר: ${sourceLabels[bestSource] || bestSource}`,
        description: `שיעור המרה ${bestSourceRate}%. שווה להשקיע יותר תקציב במקור הזה.`,
        color: "bg-purple-500/5 border-purple-500/20 text-purple-700 dark:text-purple-400",
      });
    }

    // Stale pipeline
    const staleInProgress = leads.filter(l =>
      l.status === "in_progress" &&
      (Date.now() - new Date(l.created_at).getTime()) > 14 * 24 * 60 * 60 * 1000
    ).length;
    if (staleInProgress >= 3) {
      result.push({
        icon: Clock,
        title: `${staleInProgress} לידים תקועים בטיפול`,
        description: `לידים שב"בטיפול" מעל שבועיים. ייתכן שנדרשת פעולה דחופה או סגירת התיקים.`,
        color: "bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400",
      });
    }

    return result;
  }, [agents, rejectionRate, rejectedCount, globalConversion, totalLeads, avgCallDur, avgDealSize, leads]);

  // ─── Render ──────────────────────────────────────────────
  const hasFilters = timeRange !== "all" || filterAgent !== "all" || filterSource !== "all" || filterStatus !== "all";

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">לוח תוצאות מכירות</h2>
            <p className="text-sm text-muted-foreground">ביצועי נציגים, שיעורי המרה ותובנות AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => { setTimeRange("all"); setFilterAgent("all"); setFilterSource("all"); setFilterStatus("all"); }}
            >
              נקה פילטרים ✕
            </Button>
          )}
          <Badge variant="outline" className="gap-1 text-xs">
            <Zap className="h-3 w-3" />
            עדכון אוטומטי
          </Badge>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />

            <Select value={timeRange} onValueChange={v => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Calendar className="h-3 w-3 ml-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Users className="h-3 w-3 ml-1" />
                <SelectValue placeholder="נציג" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הנציגים</SelectItem>
                {profiles.map(p => (
                  <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || "ללא שם"}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="מקור" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המקורות</SelectItem>
                {availableSources.map(s => (
                  <SelectItem key={s!} value={s!}>{s === "facebook" ? "פייסבוק" : s === "referral" ? "הפנייה" : s === "organic" ? "אורגני" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {FUNNEL_STAGES.map(s => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-6 w-px bg-border mx-1" />

            <Select value={sortBy} onValueChange={v => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <ArrowUpDown className="h-3 w-3 ml-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
            >
              {sortDir === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
          value={totalRevenue >= 1000000 ? `₪${(totalRevenue / 1000000).toFixed(1)}M` : `₪${(totalRevenue / 1000).toFixed(0)}K`}
          subValue={avgDealSize > 0 ? `ממוצע ₪${(avgDealSize / 1000).toFixed(0)}K לעסקה` : undefined}
          iconColor="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          trend="up"
        />
        <StatCard
          icon={PhoneCall}
          label="שיחות"
          value={totalCallsCount.toString()}
          subValue={`ממוצע ${formatDuration(avgCallDur)} לשיחה`}
          iconColor="bg-orange-500/10 text-orange-600 dark:text-orange-400"
          trend="neutral"
        />
        <StatCard
          icon={Percent}
          label="שיעור דחייה"
          value={`${rejectionRate}%`}
          subValue={`${rejectedCount} לידים נדחו`}
          iconColor="bg-red-500/10 text-red-600 dark:text-red-400"
          trend={rejectionRate > 30 ? "down" : rejectionRate > 15 ? "neutral" : "up"}
        />
        <StatCard
          icon={Flame}
          label="לידים חמים"
          value={leads.filter(l => (l.lead_score || 0) >= 70).length.toString()}
          subValue="ציון 70+"
          iconColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          trend="up"
        />
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-primary" />
              תובנות AI חכמות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {insights.map((insight, i) => (
                <InsightCard key={i} {...insight} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Agent Leaderboard */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              דירוג נציגים
              {filterAgent !== "all" && (
                <Badge variant="secondary" className="text-[10px]">מסונן</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">אין נתוני נציגים {hasFilters ? "בתקופה שנבחרה" : "עדיין"}</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[420px]">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">ממוצע שיחה</TableHead>
                        <TableHead className="text-center">🌡️ חום</TableHead>
                        <TableHead className="text-center">סנטימנט</TableHead>
                        <TableHead className="text-center">שיחות</TableHead>
                        <TableHead className="text-center">היקף</TableHead>
                        <TableHead className="text-center">המרה</TableHead>
                        <TableHead className="text-center">סגירות</TableHead>
                        <TableHead className="text-right">נציג</TableHead>
                        <TableHead className="text-center w-14">#</TableHead>
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

        {/* Sidebar: Funnel + Top Performers */}
        <div className="space-y-6">
          {/* Sales Funnel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                משפך מכירות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {FUNNEL_STAGES.map(stage => (
                <FunnelBar
                  key={stage.key}
                  label={stage.label}
                  count={statusCounts[stage.key] || 0}
                  total={totalLeads}
                  color={stage.color}
                />
              ))}
            </CardContent>
          </Card>

          {/* Top Performers */}
          {agents.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  🏆 מובילים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {agents.slice(0, 3).map((agent, i) => {
                  const config = rankIcons[i];
                  const RankIcon = config?.icon || Award;
                  return (
                    <div key={agent.userId} className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg border",
                      config?.bg || "bg-muted/30 border-border/30"
                    )}>
                      <div className="flex items-center gap-2">
                        <RankIcon className={cn("h-4 w-4", config?.color || "text-muted-foreground")} />
                        <div>
                          <span className="text-sm font-medium">{agent.name}</span>
                          <p className="text-[10px] text-muted-foreground">{agent.conversionRate}% המרה</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span className="text-sm font-bold">{agent.closedDeals}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground tabular-nums">₪{(agent.totalRevenue / 1000).toFixed(0)}K</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
