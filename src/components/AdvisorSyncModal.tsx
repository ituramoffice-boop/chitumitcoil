import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Link2, UserCheck, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AdvisorSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advisorId: string;
  advisorName: string | null;
}

export function AdvisorSyncModal({ open, onOpenChange, advisorId, advisorName }: AdvisorSyncModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleConsent = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const securityEntry = {
        action: "consent_granted",
        timestamp: now,
        ip: "client-side",
        user_agent: navigator.userAgent.substring(0, 120),
      };

      // Upsert sync record
      const { error: syncError } = await supabase
        .from("advisor_client_sync" as any)
        .upsert(
          {
            client_user_id: user.id,
            advisor_user_id: advisorId,
            status: "active",
            consent_granted_at: now,
            security_log: [securityEntry],
          } as any,
          { onConflict: "client_user_id,advisor_user_id" }
        );
      if (syncError) throw syncError;

      // Link existing lead if any, or create a synced lead for the advisor
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("client_user_id", user.id)
        .eq("consultant_id", advisorId)
        .maybeSingle();

      if (!existingLead) {
        // Create a linked lead record for the advisor
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("user_id", user.id)
          .maybeSingle();

        await supabase.from("leads").insert({
          consultant_id: advisorId,
          client_user_id: user.id,
          full_name: profile?.full_name || user.email?.split("@")[0] || "לקוח מסונכרן",
          email: profile?.email || user.email,
          phone: profile?.phone || null,
          lead_source: "advisor_sync",
          status: "new" as const,
          notes: "סנכרון אוטומטי – לקוח קיים שיתף גישה ליועץ",
        });
      }

      // Send notification to advisor
      await supabase.from("notifications").insert({
        user_id: advisorId,
        title: "לקוח חדש סונכרן",
        body: `${user.user_metadata?.full_name || user.email} שיתף/ה את ציון הצ'יטומית ומסמכים לעיון.`,
        type: "sync",
        link: "/dashboard",
      } as any);

      toast.success("הגישה אושרה בהצלחה! היועץ יכול כעת לצפות בנתונים שלך.");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error("שגיאה בתהליך הסנכרון. נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    onOpenChange(false);
    toast("הבקשה נדחתה. לא שותפו נתונים.");
  };

  const displayName = advisorName || "היועץ";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-background to-secondary/30 border-primary/20">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3"
          >
            <Link2 className="w-8 h-8 text-primary" />
          </motion.div>
          <DialogTitle className="text-xl font-bold text-center">
            זוהה פרופיל קיים
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-2 text-sm leading-relaxed">
            האם לאפשר ל-<span className="font-semibold text-foreground">{displayName}</span> גישה
            מאובטחת לציון הצ'יטומית ולמסמכים שלך?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {[
            { icon: UserCheck, text: "גישה לציון הצ'יטומית שלך" },
            { icon: Shield, text: "צפייה במסמכים שהועלו" },
            { icon: Lock, text: "הנתונים מוצפנים AES-256 – ניתן לבטל בכל עת" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="flex items-center gap-3 text-sm text-muted-foreground"
            >
              <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{item.text}</span>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3 mt-2">
          <Button
            onClick={handleConsent}
            disabled={loading}
            className="flex-1 gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            אישור גישה
          </Button>
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={loading}
            className="flex-1"
          >
            לא, תודה
          </Button>
        </div>

        <p className="text-[10px] text-center text-muted-foreground/60 mt-2">
          בהתאם לתקני ISO 27001 · השיתוף מתועד ביומן אבטחה
        </p>
      </DialogContent>
    </Dialog>
  );
}
