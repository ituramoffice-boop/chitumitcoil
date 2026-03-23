import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  TrendingUp,
  DollarSign,
  Heart,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DashboardOverview = () => {
  const { role } = useAuth();

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
    const ltv = (l.mortgage_amount / l.property_value) * 100;
    return ltv > 75;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        סקירה כללית
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Users} label="סה״כ לקוחות" value={leads.length} />
        <KPI icon={DollarSign} label="היקף משכנתאות" value={`₪${(totalMortgage / 1000000).toFixed(1)}M`} color="text-primary" />
        <KPI icon={TrendingUp} label="שיעור אישור" value={`${conversionRate}%`} color="text-success" />
        <KPI icon={Heart} label="LTV ממוצע" value={`${avgLTV}%`} color="text-warning" />
      </div>

      {/* Status Grid */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground text-sm">סטטוס תיקים</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusBox label="חדשים" count={statusCounts.new} color="text-primary" bg="bg-primary/10" />
          <StatusBox label="בטיפול" count={statusCounts.in_progress} color="text-warning" bg="bg-warning/10" />
          <StatusBox label="אושרו" count={statusCounts.approved} color="text-success" bg="bg-success/10" />
          <StatusBox label="נדחו" count={statusCounts.rejected} color="text-destructive" bg="bg-destructive/10" />
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
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
                  <span className="text-sm font-medium text-foreground">{lead.full_name}</span>
                  <span className="text-sm font-bold text-destructive">LTV: {ltv}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">סיכום פיננסי</h3>
          <FinRow label="סה״כ שווי נכסים" value={`₪${totalPropertyValue.toLocaleString()}`} />
          <FinRow label="סה״כ היקף משכנתאות" value={`₪${totalMortgage.toLocaleString()}`} />
          <FinRow label="הכנסה ממוצעת" value={`₪${Math.round(avgIncome).toLocaleString()}`} />
        </div>
        <div className="glass-card p-6 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">לקוחות אחרונים</h3>
          {leads.slice(0, 5).map((lead: any) => (
            <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <span className="text-sm text-foreground">{lead.full_name}</span>
              <span className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("he-IL")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function KPI({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color?: string }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary">
          <Icon className={cn("w-5 h-5", color || "text-muted-foreground")} />
        </div>
      </div>
    </div>
  );
}

function StatusBox({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <div className={cn("rounded-xl p-4 text-center", bg)}>
      <p className={cn("text-3xl font-bold", color)}>{count}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function FinRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-secondary">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

export default DashboardOverview;
