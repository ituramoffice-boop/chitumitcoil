import { Shield, Users, FileText, TrendingUp, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInsuranceClients, useInsurancePolicies } from "@/hooks/useInsuranceData";
import { Skeleton } from "@/components/ui/skeleton";

const POLICY_TYPES: Record<string, string> = {
  life: "חיים", health: "בריאות", car: "רכב", home: "דירה",
  business: "עסק", pension: "פנסיה", disability: "אובדן כושר",
};

export function InsuranceOverview() {
  const { data: clients, isLoading: loadingClients } = useInsuranceClients();
  const { data: policies, isLoading: loadingPolicies } = useInsurancePolicies();

  const loading = loadingClients || loadingPolicies;

  const activePolicies = policies?.filter((p) => p.status === "active") || [];
  const activeClients = clients?.filter((c) => c.status === "active") || [];
  const totalPremium = activePolicies.reduce((s, p) => s + Number(p.monthly_premium || 0), 0);
  const totalCommission = activePolicies.reduce((s, p) => s + Number(p.commission_amount || 0), 0);

  const stats = [
    { label: "פוליסות פעילות", value: activePolicies.length.toString(), icon: FileText, color: "text-primary" },
    { label: "לקוחות פעילים", value: activeClients.length.toString(), icon: Users, color: "text-emerald-400" },
    { label: "פרמיה חודשית כוללת", value: `₪${totalPremium.toLocaleString()}`, icon: DollarSign, color: "text-gold" },
    { label: "עמלות צפויות", value: `₪${totalCommission.toLocaleString()}`, icon: TrendingUp, color: "text-cyan-400" },
  ];

  // Upcoming renewals: policies ending within 30 days
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const renewals = (policies || [])
    .filter((p) => p.status === "active" && p.end_date)
    .map((p) => {
      const endDate = new Date(p.end_date!);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...p, daysLeft, clientName: p.insurance_clients?.full_name || "—" };
    })
    .filter((p) => p.daysLeft > 0 && p.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  // Recent policies
  const recentPolicies = (policies || []).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">סקירה כללית</h2>
        <p className="text-sm text-muted-foreground">תמונת מצב עדכנית של תיק הביטוח שלך</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Renewals */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              חידושים קרובים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : renewals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">אין חידושים קרובים</p>
            ) : (
              renewals.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{r.clientName}</p>
                    <p className="text-xs text-muted-foreground">{POLICY_TYPES[r.policy_type] || r.policy_type} • {r.insurance_company || "—"}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gold">₪{Number(r.monthly_premium || 0).toLocaleString()}</p>
                    <p className={`text-xs ${r.daysLeft <= 7 ? "text-red-400" : "text-muted-foreground"}`}>
                      {r.daysLeft} ימים
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              פוליסות אחרונות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : recentPolicies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">אין פוליסות עדיין</p>
            ) : (
              recentPolicies.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      p.status === "active" ? "bg-emerald-400" : p.status === "claim" ? "bg-amber-400" : "bg-muted-foreground"
                    }`} />
                    <p className="text-sm text-foreground">
                      {POLICY_TYPES[p.policy_type] || p.policy_type} — {p.insurance_clients?.full_name || "—"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap mr-3">
                    {new Date(p.created_at).toLocaleDateString("he-IL")}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
