import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Upload,
  Brain,
  StickyNote,
  ArrowRightLeft,
  RefreshCw,
  Plus,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";

interface Activity {
  id: string;
  lead_id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: any;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  document_upload: { icon: Upload, color: "text-primary", bg: "bg-primary/10" },
  ai_analysis: { icon: Brain, color: "text-success", bg: "bg-success/10" },
  note: { icon: StickyNote, color: "text-warning", bg: "bg-warning/10" },
  status_change: { icon: RefreshCw, color: "text-muted-foreground", bg: "bg-muted" },
  handover: { icon: ArrowRightLeft, color: "text-destructive", bg: "bg-destructive/10" },
};

export function CaseTimeline({ leadId }: { leadId: string }) {
  const { user } = useAuth();
  const { isAgency } = useWorkspace();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activity-log", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Activity[];
    },
  });

  const addNote = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from("activity_log").insert({
        lead_id: leadId,
        user_id: user!.id,
        activity_type: "note",
        title: "הערה פנימית",
        description: text,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-log", leadId] });
      setNoteText("");
      setShowNoteInput(false);
      toast.success("הערה נוספה");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">ציר זמן</h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setShowNoteInput(!showNoteInput)}
        >
          <Plus className="w-3 h-3" />
          הערה
        </Button>
      </div>

      {showNoteInput && (
        <div className="space-y-2 p-3 rounded-lg border border-border bg-secondary/30">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="הוסף הערה פנימית..."
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={!noteText.trim() || addNote.isPending}
              onClick={() => addNote.mutate(noteText.trim())}
            >
              {addNote.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              שמור
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowNoteInput(false)}>
              ביטול
            </Button>
          </div>
        </div>
      )}

      {activities.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">אין פעילות עדיין</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-0 bottom-0 right-[15px] w-px bg-border" />

          <div className="space-y-3">
            {activities.map((activity) => {
              const config = TYPE_CONFIG[activity.activity_type] || TYPE_CONFIG.note;
              const Icon = config.icon;

              return (
                <div key={activity.id} className="flex gap-3 relative">
                  <div className={cn("p-1.5 rounded-full z-10 shrink-0", config.bg)}>
                    <Icon className={cn("w-3.5 h-3.5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-xs font-medium text-foreground">{activity.title}</p>
                    {activity.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{activity.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { locale: he, addSuffix: true })}
                      </span>
                      {isAgency && activity.activity_type === "handover" && activity.metadata?.handler && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          {activity.metadata.handler}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
