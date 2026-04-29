import { forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  DollarSign,
  Heart,
  AlertTriangle,
  Loader2,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DashboardOverview = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["dash-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const totalMortgage = leads.reduce((s: number, l: any) => s + (Number(l.mortgage_amount) || 0), 0);
  const totalPropertyValue = leads.reduce((s: number, l: any) => s + (Number(l.property_value) || 0), 0);
  const avgIncome = leads.length ? leads.reduce((s: number, l: any) => s + (Number(l.monthly_income) || 0), 0) / leads.length : 0;
  const approvedCount = leads.filter((l: any) => l.status === "approved").length;
  const conversionRate = leads.length ? ((approvedCount / leads.length) * 100).toFixed(1) : "0";
  const avgLTV = totalPropertyValue ? ((totalMortgage / totalPropertyValue) * 100).toFixed(1) : "0";

  const statusCounts = {
    new: leads.filter((l: any) => l.status === "new").length,
    in_progress: leads.filter((l: any) => ["contacted", "in_progress", "submitted"].includes(l.status)).length,
    approved: approvedCount,
    rejected: leads.filter((l: any) => l.status === "rejected").length,
  };

  const highRiskLeads = leads.filter((l: any) => {
    if (!l.property_value || !l.mortgage_amount) return false;
    return (l.mortgage_amount / l.property_value) * 100 > 75;
  });

  const todayStr = new Date().toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div ref={ref} className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold gradient-header flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-glow" />
          סקירה כללית
        </h2>
        <span className="text-xs text-muted-foreground font-heebo">{todayStr}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Users} label="סה״כ לקוחות" value={leads.length} onClick={() => navigate("/dashboard/clients")} />
        <KPI icon={DollarSign} label="היקף משכנתאות" value={`₪${(totalMortgage / 1000000).toFixed(1)}M`} color="text-cyan-glow" glow="glow-cyan" onClick={() => navigate("/dashboard/reports")} />
        <KPI icon={TrendingUp} label="שיעור אישור" value={`${conversionRate}%`} color="text-success" onClick={() => navigate("/dashboard/reports")} />
        <KPI icon={Heart} label="LTV ממוצע" value={`${avgLTV}%`} color="text-gold" glow="glow-gold" onClick={() => navigate("/dashboard/scenarios")} />
      </div>

      {/* Status Grid */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground text-sm">סטטוס תיקים</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusBox label="חדשים" count={statusCounts.new} color="text-cyan-glow" bg="bg-cyan-glow/10" onClick={() => navigate("/dashboard/clients")} />
          <StatusBox label="בטיפול" count={statusCounts.in_progress} color="text-gold" bg="bg-gold/10" onClick={() => navigate("/dashboard/clients")} />
          <StatusBox label="אושרו" count={statusCounts.approved} color="text-success" bg="bg-success/10" onClick={() => navigate("/dashboard/clients")} />
          <StatusBox label="נדחו" count={statusCounts.rejected} color="text-destructive" bg="bg-destructive/10" onClick={() => navigate("/dashboard/clients")} />
        </div>
      </div>

      {/* High Risk */}
      {highRiskLeads.length > 0 && (
        <div className="glass-card p-6 space-y-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            תיקים בסיכון גבוה (LTV &gt; 75%)
          </h3>
          <div className="space-y-2">
            {highRiskLeads.slice(0, 5).map((lead: any) => {
              const ltv = ((lead.mortgage_amount / lead.property_value) * 100).toFixed(1);
              return (
                <div
                  key={lead.id}
                  onClick={() => navigate("/dashboard/clients")}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors group"
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{lead.full_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-destructive">LTV: {ltv}%</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => navigate("/calculator")}
          className="glass-card p-5 cursor-pointer hover:ring-1 hover:ring-cyan-glow/30 hover:shadow-md transition-all group flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-cyan-glow/10 group-hover:bg-cyan-glow/20 transition-colors shrink-0">
            <DollarSign className="w-5 h-5 text-cyan-glow" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm group-hover:text-cyan-glow transition-colors">מחשבון משכנתא</h4>
            <p className="text-xs text-muted-foreground mt-0.5">חישוב החזר חודשי, ריבית והשוואת מסלולים</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div
          onClick={() => navigate("/property-value")}
          className="glass-card p-5 cursor-pointer hover:ring-1 hover:ring-gold/30 hover:shadow-md transition-all group flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-gold/10 group-hover:bg-gold/20 transition-colors shrink-0">
            <TrendingUp className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm group-hover:text-gold transition-colors">מחשבון שווי נכס</h4>
            <p className="text-xs text-muted-foreground mt-0.5">הערכת שווי מיידית לפי אזור, גודל ומגמות שוק</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Financial Summary + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-3 cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all" onClick={() => navigate("/dashboard/reports")}>
          <h3 className="font-semibold text-foreground text-sm flex items-center justify-between">
            סיכום פיננסי
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </h3>
          <FinRow label="סה״כ שווי נכסים" value={`₪${totalPropertyValue.toLocaleString()}`} />
          <FinRow label="סה״כ היקף משכנתאות" value={`₪${totalMortgage.toLocaleString()}`} />
          <FinRow label="הכנסה ממוצעת" value={`₪${Math.round(avgIncome).toLocaleString()}`} />
        </div>
        <div className="glass-card p-6 space-y-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center justify-between">
            לקוחות אחרונים
            <span className="text-xs text-gold cursor-pointer hover:underline" onClick={() => navigate("/dashboard/clients")}>הצג הכל →</span>
          </h3>
          {leads.slice(0, 5).map((lead: any) => (
            <div
              key={lead.id}
              onClick={() => navigate("/dashboard/clients")}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary/80 hover:ring-1 hover:ring-gold/20 transition-all group"
            >
              <span className="text-sm text-foreground group-hover:text-gold transition-colors font-medium">{lead.full_name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("he-IL")}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

DashboardOverview.displayName = "DashboardOverview";

function KPI({ icon: Icon, label, value, color, glow, onClick }: { icon: any; label: string; value: any; color?: string; glow?: string; onClick?: () => void }) {
  return (
    <div
      className={cn("glass-card p-5 cursor-pointer hover:ring-1 hover:ring-gold/20 hover:shadow-md transition-all group", glow)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold gradient-header mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/80 group-hover:bg-gold/10 transition-colors">
          <Icon className={cn("w-5 h-5", color || "text-gold")} />
        </div>
      </div>
    </div>
  );
}

function StatusBox({ label, count, color, bg, onClick }: { label: string; count: number; color: string; bg: string; onClick?: () => void }) {
  return (
    <div
      className={cn("rounded-xl p-4 text-center cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all border border-border/30", bg)}
      onClick={onClick}
    >
      <p className={cn("text-3xl font-bold", color)}>{count}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function FinRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

export default DashboardOverview;
