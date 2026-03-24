import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ShoppingCart, Lock, Crown, Eye, Phone, Mail, MapPin,
  TrendingUp, DollarSign, Users, Sparkles
} from "lucide-react";

interface MarketplaceLead {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  mortgage_amount: number | null;
  property_value: number | null;
  monthly_income: number | null;
  lead_score: number | null;
  created_at: string;
  status: string;
  is_marketplace: boolean;
}

export default function LeadMarketplace() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const leadsRes = await supabase.from("leads").select("*").eq("status", "new").order("lead_score", { ascending: false });
    const profileRes = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();

    if (leadsRes.data) {
      const marketplaceLeads = (leadsRes.data as any[]).filter((l: any) => l.is_marketplace === true);
      setLeads(marketplaceLeads as MarketplaceLead[]);
    }
    if (profileRes.data) setProfile(profileRes.data);
    setLoading(false);
  };

  const isPro = profile?.plan === "pro" || profile?.plan === "enterprise";

  const claimLead = async (leadId: string) => {
    if (!isPro) {
      toast.error("שוק הלידים זמין רק למנויי Pro ומעלה");
      return;
    }
    setClaimingId(leadId);
    const { error } = await supabase
      .from("leads")
      .update({
        consultant_id: user!.id,
        status: "contacted" as any,
      } as any)
      .eq("id", leadId);

    if (error) {
      toast.error("שגיאה בתפיסת הליד");
    } else {
      toast.success("הליד נוסף לרשימה שלך!");
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    }
    setClaimingId(null);
  };

  const maskValue = (val: string | null) => {
    if (!val || !isPro) return "•••••••";
    return val;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gold/10">
            <ShoppingCart className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">שוק לידים</h2>
            <p className="text-xs text-muted-foreground">לידים חמים שמחפשים יועץ — זמין למנויי Pro</p>
          </div>
        </div>
        {!isPro && (
          <Badge className="bg-gold/10 text-gold border-gold/20">
            <Crown className="w-3.5 h-3.5 ml-1" /> Pro בלבד
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>אין לידים זמינים כרגע בשוק</p>
            <p className="text-xs mt-1">לידים חדשים מתווספים בכל יום</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leads.map((lead) => (
            <Card key={lead.id} className="glass-card hover:border-gold/30 transition-all duration-200">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">{isPro ? lead.full_name : "••••• •••••"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  {lead.lead_score !== null && lead.lead_score > 0 && (
                    <Badge className={`${lead.lead_score >= 70 ? "bg-emerald-500/10 text-emerald-500" : lead.lead_score >= 40 ? "bg-gold/10 text-gold" : "bg-slate-500/10 text-slate-400"}`}>
                      <Sparkles className="w-3 h-3 ml-1" /> {lead.lead_score}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span className={!isPro ? "blur-sm select-none" : ""}>{maskValue(lead.phone)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span className={!isPro ? "blur-sm select-none" : ""}>{maskValue(lead.email)}</span>
                  </div>
                  {lead.mortgage_amount && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="w-3.5 h-3.5" />
                      ₪{(lead.mortgage_amount / 1000).toFixed(0)}K משכנתא
                    </div>
                  )}
                  {lead.property_value && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="w-3.5 h-3.5" />
                      ₪{(lead.property_value / 1000).toFixed(0)}K נכס
                    </div>
                  )}
                </div>

                <Button
                  className={isPro
                    ? "w-full bg-gradient-to-l from-gold to-amber-500 text-slate-900 hover:from-amber-500 hover:to-gold font-bold"
                    : "w-full bg-muted text-muted-foreground cursor-not-allowed"}
                  disabled={!isPro || claimingId === lead.id}
                  onClick={() => claimLead(lead.id)}
                >
                  {!isPro ? (
                    <><Lock className="w-4 h-4 ml-1" /> שדרג ל-Pro לצפייה</>
                  ) : claimingId === lead.id ? (
                    "מעביר..."
                  ) : (
                    <><Eye className="w-4 h-4 ml-1" /> תפוס ליד</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
