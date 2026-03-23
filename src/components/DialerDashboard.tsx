import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Phone, PhoneCall, Search, Filter, Shuffle, Play, Users, Clock,
  Headphones, Mic, Volume2, Eye, BarChart3, Zap, PhoneOutgoing,
  ArrowUpDown, TrendingUp, CheckCircle2,
} from "lucide-react";
import { PowerDialer } from "@/components/PowerDialer";
import { CallHistory } from "@/components/CallHistory";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend,
} from "recharts";

type LeadStatus = "new" | "contacted" | "in_progress" | "submitted" | "approved" | "rejected" | "closed";

interface Lead {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  notes: string | null;
  mortgage_amount: number | null;
  monthly_income: number | null;
  lead_source: string | null;
  last_contact: string | null;
  next_step: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "חדש",
  contacted: "נוצר קשר",
  in_progress: "בטיפול",
  submitted: "הוגש",
  approved: "אושר",
  rejected: "נדחה",
  closed: "סגור",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600",
  contacted: "bg-yellow-500/10 text-yellow-600",
  in_progress: "bg-purple-500/10 text-purple-600",
  submitted: "bg-orange-500/10 text-orange-600",
  approved: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-600",
  closed: "bg-muted text-muted-foreground",
};

export function DialerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "last_contact" | "created">("last_contact");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [dialerQueue, setDialerQueue] = useState<Lead[]>([]);
  const [listenMode, setListenMode] = useState<"off" | "listen" | "whisper">("off");
  const [quickDialNumber, setQuickDialNumber] = useState("");
  const [activeTab, setActiveTab] = useState("queue");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["dialer-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .not("phone", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Lead[];
    },
    enabled: !!user,
  });

  // Call stats
  const { data: callLogs = [] } = useQuery({
    queryKey: ["dialer-call-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const callStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = callLogs.filter(l => new Date(l.created_at).toDateString() === today);
    return {
      totalCalls: callLogs.length,
      todayCalls: todayLogs.length,
      avgDuration: callLogs.length > 0 ? Math.round(callLogs.reduce((s, l) => s + (l.duration_seconds || 0), 0) / callLogs.length) : 0,
      positiveRate: callLogs.length > 0 ? Math.round((callLogs.filter(l => l.sentiment === "positive").length / callLogs.length) * 100) : 0,
    };
  }, [callLogs]);

  // Daily trends (last 7 days)
  const dailyTrends = useMemo(() => {
    const days: { date: string; calls: number; avgDuration: number; positive: number; negative: number; neutral: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayLabel = d.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" });
      const dayLogs = callLogs.filter(l => new Date(l.created_at).toDateString() === dateStr);
      days.push({
        date: dayLabel,
        calls: dayLogs.length,
        avgDuration: dayLogs.length > 0 ? Math.round(dayLogs.reduce((s, l) => s + (l.duration_seconds || 0), 0) / dayLogs.length / 60) : 0,
        positive: dayLogs.filter(l => l.sentiment === "positive").length,
        negative: dayLogs.filter(l => l.sentiment === "negative").length,
        neutral: dayLogs.filter(l => l.sentiment === "neutral").length,
      });
    }
    return days;
  }, [callLogs]);

  // Sentiment distribution
  const sentimentDist = useMemo(() => {
    const pos = callLogs.filter(l => l.sentiment === "positive").length;
    const neg = callLogs.filter(l => l.sentiment === "negative").length;
    const neu = callLogs.filter(l => l.sentiment === "neutral").length;
    const none = callLogs.length - pos - neg - neu;
    return [
      { name: "חיובי", value: pos, fill: "hsl(142, 76%, 36%)" },
      { name: "ניטרלי", value: neu + none, fill: "hsl(45, 93%, 47%)" },
      { name: "שלילי", value: neg, fill: "hsl(0, 84%, 60%)" },
    ].filter(d => d.value > 0);
  }, [callLogs]);

  // Simulated active agents
  const activeAgents = useMemo(() => [
    { name: "יוסי כהן", status: "בשיחה", lead: "דני לוי", duration: "02:34", sentiment: "positive" },
    { name: "מיכל אברהם", status: "wrap_up", lead: "שרה גולד", duration: "05:12", sentiment: "neutral" },
    { name: "אבי ישראלי", status: "idle", lead: null, duration: null, sentiment: null },
  ], []);

  const sources = useMemo(() => {
    const s = new Set(leads.map(l => l.lead_source).filter(Boolean));
    return Array.from(s) as string[];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let result = leads.filter(l => l.phone);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.full_name.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.email?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter(l => l.status === statusFilter);
    if (sourceFilter !== "all") result = result.filter(l => l.lead_source === sourceFilter);

    result.sort((a, b) => {
      if (sortBy === "name") return a.full_name.localeCompare(b.full_name);
      if (sortBy === "last_contact") {
        const aDate = a.last_contact ? new Date(a.last_contact).getTime() : 0;
        const bDate = b.last_contact ? new Date(b.last_contact).getTime() : 0;
        return aDate - bDate; // oldest first = needs calling
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return result;
  }, [leads, search, statusFilter, sourceFilter, sortBy]);

  const toggleSelect = (id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const startSession = () => {
    const queue = leads.filter(l => selectedLeads.has(l.id));
    if (queue.length === 0) {
      toast({ title: "בחר לפחות ליד אחד", variant: "destructive" });
      return;
    }
    setDialerQueue(queue);
    setListenMode("off");
  };

  const quickDialRandom = () => {
    const available = filteredLeads.filter(l => l.phone);
    if (available.length === 0) {
      toast({ title: "אין לידים זמינים לחיוג", variant: "destructive" });
      return;
    }
    const random = available[Math.floor(Math.random() * available.length)];
    setDialerQueue([random]);
    toast({ title: `🎲 חיוג מהיר ל-${random.full_name}` });
  };

  const quickDialManual = () => {
    if (!quickDialNumber || quickDialNumber.length < 9) {
      toast({ title: "הכנס מספר טלפון תקין", variant: "destructive" });
      return;
    }
    const fakeLead: Lead = {
      id: "quick-" + Date.now(),
      full_name: quickDialNumber,
      phone: quickDialNumber,
      email: null,
      status: "new",
      notes: null,
      mortgage_amount: null,
      monthly_income: null,
      lead_source: "חיוג מהיר",
      last_contact: null,
      next_step: null,
      created_at: new Date().toISOString(),
    };
    setDialerQueue([fakeLead]);
    setQuickDialNumber("");
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{callStats?.todayCalls || 0}</p>
              <p className="text-[10px] text-muted-foreground">שיחות היום</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{callStats?.totalCalls || 0}</p>
              <p className="text-[10px] text-muted-foreground">סה"כ שיחות</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatDuration(callStats?.avgDuration || 0)}</p>
              <p className="text-[10px] text-muted-foreground">זמן ממוצע</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{callStats?.positiveRate || 0}%</p>
              <p className="text-[10px] text-muted-foreground">סנטימנט חיובי</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Bar */}
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Dial Number */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <PhoneOutgoing className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיוג מהיר — הכנס מספר..."
                  value={quickDialNumber}
                  onChange={e => setQuickDialNumber(e.target.value)}
                  className="pr-9 text-sm"
                  onKeyDown={e => e.key === "Enter" && quickDialManual()}
                />
              </div>
              <Button size="sm" onClick={quickDialManual} className="gap-1.5 shrink-0">
                <Phone className="h-3.5 w-3.5" />
                חייג
              </Button>
            </div>

            <div className="h-6 w-px bg-border hidden md:block" />

            {/* Random Dial */}
            <Button variant="outline" size="sm" onClick={quickDialRandom} className="gap-1.5">
              <Shuffle className="h-3.5 w-3.5" />
              חיוג רנדומלי
            </Button>

            {/* Listen / Whisper Mode */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
              <Button
                variant={listenMode === "off" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setListenMode("off")}
              >
                <Phone className="h-3 w-3" />
                רגיל
              </Button>
              <Button
                variant={listenMode === "listen" ? "default" : "ghost"}
                size="sm"
                className={cn("h-7 text-xs gap-1", listenMode === "listen" && "bg-blue-600 hover:bg-blue-700")}
                onClick={() => {
                  setListenMode("listen");
                  toast({ title: "🎧 מצב האזנה פעיל", description: "אתה שומע את השיחה — הלקוח לא שומע אותך" });
                }}
              >
                <Headphones className="h-3 w-3" />
                האזנה
              </Button>
              <Button
                variant={listenMode === "whisper" ? "default" : "ghost"}
                size="sm"
                className={cn("h-7 text-xs gap-1", listenMode === "whisper" && "bg-amber-600 hover:bg-amber-700")}
                onClick={() => {
                  setListenMode("whisper");
                  toast({ title: "🗣️ מצב לחישה פעיל", description: "רק הנציג שומע אותך — הלקוח לא" });
                }}
              >
                <Mic className="h-3 w-3" />
                לחישה
              </Button>
            </div>

            {/* Start Session */}
            {selectedLeads.size > 0 && (
              <Button onClick={startSession} className="gap-1.5 bg-green-600 hover:bg-green-700">
                <Play className="h-3.5 w-3.5" />
                התחל סשן ({selectedLeads.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-[450px]">
          <TabsTrigger value="queue" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            תור חיוג
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            דשבורד
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            היסטוריה
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Daily Calls Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  מגמת שיחות — 7 ימים אחרונים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="calls" name="שיחות" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sentiment Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  הפצת סנטימנט
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sentimentDist.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={180}>
                      <PieChart>
                        <Pie data={sentimentDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                          {sentimentDist.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {sentimentDist.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: d.fill }} />
                          <span className="text-sm">{d.name}</span>
                          <span className="text-sm font-bold">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
                    אין נתונים עדיין
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sentiment Stacked Bar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  סנטימנט יומי
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="positive" name="חיובי" stackId="a" fill="hsl(142, 76%, 36%)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="neutral" name="ניטרלי" stackId="a" fill="hsl(45, 93%, 47%)" />
                    <Bar dataKey="negative" name="שלילי" stackId="a" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Active Agents */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-primary" />
                  נציגים פעילים כרגע
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeAgents.map((agent, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className={cn(
                        "w-3 h-3 rounded-full shrink-0",
                        agent.status === "בשיחה" ? "bg-green-500 animate-pulse" :
                        agent.status === "wrap_up" ? "bg-yellow-500 animate-pulse" :
                        "bg-muted-foreground"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {agent.status === "בשיחה" ? (
                            <span className="text-green-600 dark:text-green-400">
                              בשיחה עם {agent.lead} — {agent.duration}
                            </span>
                          ) : agent.status === "wrap_up" ? (
                            <span className="text-yellow-600 dark:text-yellow-400">
                              סיכום שיחה עם {agent.lead}
                            </span>
                          ) : (
                            "פנוי"
                          )}
                        </p>
                      </div>
                      {agent.status === "בשיחה" && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="האזנה"
                            onClick={() => toast({ title: `🎧 מאזין לשיחה של ${agent.name}` })}
                          >
                            <Headphones className="h-3.5 w-3.5 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="לחישה"
                            onClick={() => toast({ title: `🗣️ לחישה ל-${agent.name}` })}
                          >
                            <Mic className="h-3.5 w-3.5 text-amber-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="חיפוש לפי שם, טלפון, מייל..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pr-9 text-sm"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] text-sm">
                    <Filter className="h-3.5 w-3.5 ml-1.5" />
                    <SelectValue placeholder="סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הסטטוסים</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Source Filter */}
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[140px] text-sm">
                    <SelectValue placeholder="מקור" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל המקורות</SelectItem>
                    {sources.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-[140px] text-sm">
                    <ArrowUpDown className="h-3.5 w-3.5 ml-1.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_contact">קשר אחרון</SelectItem>
                    <SelectItem value="name">שם</SelectItem>
                    <SelectItem value="created">תאריך יצירה</SelectItem>
                  </SelectContent>
                </Select>

                <Badge variant="outline" className="text-xs">
                  {filteredLeads.length} לידים
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>שם</TableHead>
                      <TableHead>טלפון</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>מקור</TableHead>
                      <TableHead>קשר אחרון</TableHead>
                      <TableHead className="w-20">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          לא נמצאו לידים
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map(lead => (
                        <TableRow
                          key={lead.id}
                          className={cn(
                            "cursor-pointer transition-colors",
                            selectedLeads.has(lead.id) && "bg-primary/5"
                          )}
                          onClick={() => toggleSelect(lead.id)}
                        >
                          <TableCell onClick={e => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedLeads.has(lead.id)}
                              onCheckedChange={() => toggleSelect(lead.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{lead.full_name}</TableCell>
                          <TableCell className="font-mono text-sm" dir="ltr">{lead.phone}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[lead.status])}>
                              {STATUS_LABELS[lead.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{lead.lead_source || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {lead.last_contact
                              ? formatDistanceToNow(new Date(lead.last_contact), { locale: he, addSuffix: true })
                              : "אין"}
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setDialerQueue([lead]);
                                  toast({ title: `📞 מחייג ל-${lead.full_name}` });
                                }}
                                title="חייג"
                              >
                                <Phone className="h-3.5 w-3.5 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/[^0-9+]/g, "")}`, "_blank")}
                                title="WhatsApp"
                              >
                                <Zap className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <CallHistory />
        </TabsContent>
      </Tabs>

      {/* Listen/Whisper Status Indicator */}
      {listenMode !== "off" && (
        <div className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium text-white",
          listenMode === "listen" ? "bg-blue-600" : "bg-amber-600"
        )}>
          {listenMode === "listen" ? (
            <>
              <Headphones className="h-4 w-4 animate-pulse" />
              מצב האזנה פעיל — הלקוח לא שומע אותך
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 animate-pulse" />
              מצב לחישה פעיל — רק הנציג שומע אותך
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[10px] text-white/80 hover:text-white hover:bg-white/10 p-1"
            onClick={() => setListenMode("off")}
          >
            ✕
          </Button>
        </div>
      )}

      {/* Power Dialer Floating Panel */}
      {dialerQueue.length > 0 && (
        <PowerDialer
          queue={dialerQueue}
          onClose={() => {
            setDialerQueue([]);
            queryClient.invalidateQueries({ queryKey: ["dialer-leads"] });
            queryClient.invalidateQueries({ queryKey: ["dialer-stats"] });
          }}
          onCallComplete={async (leadId, notes, aiAnalysis) => {
            if (leadId.startsWith("quick-")) return; // skip for manual quick dials
            const updates: any = { last_contact: new Date().toISOString() };
            if (notes) updates.notes = notes;
            if (aiAnalysis?.nextStep) updates.next_step = aiAnalysis.nextStep;
            await supabase.from("leads").update(updates).eq("id", leadId);
            queryClient.invalidateQueries({ queryKey: ["dialer-leads"] });
            queryClient.invalidateQueries({ queryKey: ["dialer-stats"] });
          }}
        />
      )}
    </div>
  );
}
