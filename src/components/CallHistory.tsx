import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone, Clock, Brain, Smile, Meh, Frown, ChevronDown, ChevronUp,
  FileText, Target, Calendar, User, Sparkles,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CallLog {
  id: string;
  lead_id: string;
  duration_seconds: number;
  notes: string | null;
  ai_summary: any;
  sentiment: string | null;
  action_items: any;
  next_step: string | null;
  status: string;
  created_at: string;
}

interface CallHistoryProps {
  leadId?: string;
  leadName?: string;
  showAsDialog?: boolean;
  open?: boolean;
  onClose?: () => void;
}

const sentimentConfig: Record<string, { icon: any; label: string; color: string }> = {
  positive: { icon: Smile, label: "חיובי", color: "text-green-500" },
  neutral: { icon: Meh, label: "ניטרלי", color: "text-yellow-500" },
  negative: { icon: Frown, label: "שלילי", color: "text-red-500" },
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function CallLogRow({ log }: { log: CallLog }) {
  const [expanded, setExpanded] = useState(false);
  const sentiment = sentimentConfig[log.sentiment || "neutral"] || sentimentConfig.neutral;
  const SentimentIcon = sentiment.icon;
  const summary = log.ai_summary?.summary as string[] | undefined;
  const actionItems = log.action_items as string[] | undefined;

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{format(new Date(log.created_at), "dd/MM/yyyy", { locale: he })}</span>
            <span className="text-muted-foreground text-xs">
              {format(new Date(log.created_at), "HH:mm")}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{formatDuration(log.duration_seconds)}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <SentimentIcon className={cn("w-4 h-4", sentiment.color)} />
            <span className={sentiment.color}>{sentiment.label}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={log.status === "completed" ? "default" : "secondary"}>
            {log.status === "completed" ? "הושלמה" : log.status}
          </Badge>
        </TableCell>
        <TableCell className="text-left">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/30 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Notes */}
              {log.notes && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <FileText className="w-3.5 h-3.5" />
                    הערות שיחה
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{log.notes}</p>
                </div>
              )}

              {/* AI Summary */}
              {summary && summary.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    סיכום AI
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-0.5">
                    {summary.map((point, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-primary mt-1">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {actionItems && actionItems.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Target className="w-3.5 h-3.5 text-orange-500" />
                    פעולות נדרשות
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-0.5">
                    {actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-orange-500 mt-1">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Step */}
              {log.next_step && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Target className="w-3.5 h-3.5 text-blue-500" />
                    צעד הבא
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{log.next_step}</p>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function CallHistoryContent({ leadId }: { leadId?: string }) {
  const { user } = useAuth();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["call-logs", leadId],
    queryFn: async () => {
      let query = supabase
        .from("call_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (leadId) query = query.eq("lead_id", leadId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CallLog[];
    },
    enabled: !!user,
  });

  const totalCalls = logs.length;
  const totalDuration = logs.reduce((sum, l) => sum + l.duration_seconds, 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  const positiveRate = totalCalls > 0
    ? Math.round((logs.filter(l => l.sentiment === "positive").length / totalCalls) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Phone className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">אין היסטוריית שיחות עדיין</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{totalCalls}</div>
            <div className="text-xs text-muted-foreground">סה"כ שיחות</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{formatDuration(avgDuration)}</div>
            <div className="text-xs text-muted-foreground">זמן ממוצע</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{positiveRate}%</div>
            <div className="text-xs text-muted-foreground">סנטימנט חיובי</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <ScrollArea className="max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>תאריך</TableHead>
              <TableHead>משך</TableHead>
              <TableHead>סנטימנט</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map(log => (
              <CallLogRow key={log.id} log={log} />
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

export function CallHistory({ leadId, leadName, showAsDialog, open, onClose }: CallHistoryProps) {
  if (showAsDialog) {
    return (
      <Dialog open={open} onOpenChange={() => onClose?.()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              היסטוריית שיחות {leadName && `— ${leadName}`}
            </DialogTitle>
          </DialogHeader>
          <CallHistoryContent leadId={leadId} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="w-5 h-5 text-primary" />
          היסטוריית שיחות {leadName && `— ${leadName}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CallHistoryContent leadId={leadId} />
      </CardContent>
    </Card>
  );
}
