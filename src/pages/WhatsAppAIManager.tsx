import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MessageSquare, Bot, ShieldCheck, Headphones, TrendingUp, RefreshCw, Clock, CheckCircle2, BarChart3 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";

const PERSONA_MODES = [
  { key: "sales", label: "מצב מכירות", icon: TrendingUp, description: "הבוט מתמקד בסגירת עסקאות וזיהוי הזדמנויות" },
  { key: "consultant", label: "מצב ייעוץ", icon: Bot, description: "הבוט מספק מידע מקצועי ומלווה את הלקוח" },
  { key: "support", label: "מצב תמיכה", icon: Headphones, description: "הבוט עונה על שאלות ומפנה לגורם המתאים" },
] as const;

type PersonaMode = typeof PERSONA_MODES[number]["key"];

interface AIConfig {
  id: string;
  persona_mode: string;
  system_context: string | null;
  updated_by: string | null;
  updated_at: string;
}

interface WhatsAppLog {
  id: string;
  from_number: string;
  to_number: string | null;
  message_body: string | null;
  message_type: string;
  direction: string;
  status: string;
  metadata: any;
  created_at: string;
}

const WhatsAppAIManager = () => {
  const { user, role, loading } = useAuth();
  const queryClient = useQueryClient();

  const [activeMode, setActiveMode] = useState<PersonaMode>("consultant");
  const [systemContext, setSystemContext] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load existing config
  const { data: config } = useQuery({
    queryKey: ["whatsapp-ai-config"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("whatsapp_ai_config")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      const cfg = data as AIConfig | null;
      if (cfg) {
        setActiveMode(cfg.persona_mode as PersonaMode);
        setSystemContext(cfg.system_context || "");
      }
      return cfg;
    },
  });

  // Load recent logs
  const { data: logs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["whatsapp-logs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("whatsapp_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as WhatsAppLog[];
    },
  });

  // Compute stats from logs
  const stats = (() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const todayLogs = logs.filter((l) => l.created_at >= todayISO);
    const todayInbound = todayLogs.filter((l) => l.direction === "inbound");
    const todayOutbound = todayLogs.filter((l) => l.direction === "outbound");

    const messagesToday = todayInbound.length;

    // Response rate: how many unique inbound numbers got an outbound reply today
    const inboundNumbers = new Set(todayInbound.map((l) => l.from_number));
    const repliedNumbers = new Set(todayOutbound.map((l) => l.from_number));
    const answeredCount = [...inboundNumbers].filter((n) => repliedNumbers.has(n)).length;
    const responseRate = inboundNumbers.size > 0 ? Math.round((answeredCount / inboundNumbers.size) * 100) : 0;

    // Avg response time: pair inbound→outbound by from_number, compute diff
    let totalResponseMs = 0;
    let responseCount = 0;
    for (const num of inboundNumbers) {
      const firstInbound = todayInbound.filter((l) => l.from_number === num).sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
      const firstOutbound = todayOutbound.filter((l) => l.from_number === num).sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
      if (firstInbound && firstOutbound) {
        const diff = new Date(firstOutbound.created_at).getTime() - new Date(firstInbound.created_at).getTime();
        if (diff > 0) {
          totalResponseMs += diff;
          responseCount++;
        }
      }
    }
    const avgResponseSec = responseCount > 0 ? Math.round(totalResponseMs / responseCount / 1000) : 0;

    return { messagesToday, responseRate, avgResponseSec };
  })();

  const saveConfig = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      if (config?.id) {
        const { error } = await (supabase as any)
          .from("whatsapp_ai_config")
          .update({ persona_mode: activeMode, system_context: systemContext, updated_by: user.id, updated_at: new Date().toISOString() })
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("whatsapp_ai_config")
          .insert([{ persona_mode: activeMode, system_context: systemContext, updated_by: user.id }]);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["whatsapp-ai-config"] });
      toast.success("ההגדרות נשמרו בהצלחה");
    } catch (e: any) {
      toast.error("שגיאה בשמירה: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user || role !== "admin") return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <MessageSquare className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">WhatsApp AI Manager</h1>
          <p className="text-sm text-muted-foreground">הגדרת הבוט החכם, מצב פעולה והקשר מערכתי</p>
        </div>
        <Badge variant="outline" className="mr-auto border-primary/30 text-primary">
          <ShieldCheck className="w-3 h-3 ml-1" /> Admin Only
        </Badge>
      </div>

      {/* Stats KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.messagesToday}</p>
              <p className="text-xs text-muted-foreground">הודעות היום</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-accent/10">
              <Clock className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.avgResponseSec > 0 ? `${stats.avgResponseSec}s` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">זמן תגובה ממוצע</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.responseRate}%</p>
              <p className="text-xs text-muted-foreground">אחוז הודעות שנענו</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Persona Mode Selection */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">מצב AI Persona</CardTitle>
          <CardDescription>בחר את מצב הפעולה של הבוט — רק מצב אחד פעיל בכל רגע נתון</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PERSONA_MODES.map(({ key, label, icon: Icon, description }) => (
            <div
              key={key}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                activeMode === key
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/50 hover:border-border"
              }`}
              onClick={() => setActiveMode(key)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${activeMode === key ? "bg-primary/10" : "bg-secondary"}`}>
                  <Icon className={`w-5 h-5 ${activeMode === key ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch checked={activeMode === key} onCheckedChange={() => setActiveMode(key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Updates Context */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">הקשר מערכתי (System Context)</CardTitle>
          <CardDescription>הזן מידע שהבוט צריך לדעת — עדכוני מערכת, מבצעים, שעות פעילות וכו׳</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={systemContext}
            onChange={(e) => setSystemContext(e.target.value)}
            placeholder="לדוגמה: אנחנו מציעים ריבית של 3.5% למשכנתאות מעל 1.5M ש״ח. שעות פעילות: 09:00-18:00. מבצע חדש: ייעוץ ראשוני חינם..."
            className="min-h-[160px] text-sm"
            dir="rtl"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {systemContext.length} תווים
            </p>
            <Button onClick={saveConfig} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              שמור הגדרות
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent WhatsApp Logs */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">הודעות אחרונות</CardTitle>
              <CardDescription>לוג של הודעות נכנסות מ-WhatsApp</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchLogs()}>
              <RefreshCw className="w-4 h-4 ml-1" /> רענן
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">אין הודעות עדיין. ההודעות יופיעו כאן ברגע שה-Webhook יקבל נתונים.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30">
                  <div className={`mt-0.5 p-1.5 rounded-md ${log.direction === "inbound" ? "bg-primary/10" : "bg-accent/10"}`}>
                    <MessageSquare className={`w-3.5 h-3.5 ${log.direction === "inbound" ? "text-primary" : "text-accent-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{log.from_number}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {log.direction === "inbound" ? "נכנסת" : "יוצאת"}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground mt-1 break-words">{log.message_body || "—"}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), "HH:mm dd/MM")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Info */}
      <Card className="border-border/50 bg-secondary/30">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Webhook URL:</strong>{" "}
            <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">
              {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`}
            </code>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            הגדר URL זה כ-Webhook בספק ה-WhatsApp שלך (Twilio, Meta Business API וכו׳) לקבלת הודעות נכנסות.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppAIManager;
