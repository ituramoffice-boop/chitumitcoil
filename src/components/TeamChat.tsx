import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MessageCircle, Send, Loader2, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface ChatMessage {
  id: string;
  team_id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

export function TeamChat({ teamId }: { teamId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch profiles for name resolution
  const { data: profileMap = new Map() } = useQuery({
    queryKey: ["chat-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return new Map((data || []).map((p) => [p.user_id, p.full_name || "משתמש"]));
    },
  });

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["team-messages", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_messages")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data as any[]).map((m) => ({
        ...m,
        sender_name: profileMap.get(m.user_id) || "משתמש",
      })) as ChatMessage[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_messages",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["team-messages", teamId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, queryClient]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("team_messages").insert({
        team_id: teamId,
        user_id: user!.id,
        content,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-messages", teamId] });
      setMessage("");
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage.mutate(message.trim());
  };

  return (
    <div className="glass-card flex flex-col h-[500px]" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border shrink-0">
        <MessageCircle className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">צ׳אט צוות</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
          בזמן אמת
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Users className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">אין הודעות עדיין. התחל שיחה!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            const senderName = profileMap.get(msg.user_id) || msg.sender_name || "משתמש";
            return (
              <div
                key={msg.id}
                className={cn("flex", isMe ? "justify-start" : "justify-end")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  )}
                >
                  {!isMe && (
                    <p className="text-[10px] font-semibold mb-0.5 opacity-70">{senderName}</p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={cn(
                    "text-[9px] mt-1",
                    isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>
                    {formatDistanceToNow(new Date(msg.created_at), { locale: he, addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2 shrink-0">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="הקלד הודעה..."
          className="flex-1 text-sm"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || sendMessage.isPending}
          className="shrink-0"
        >
          {sendMessage.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
