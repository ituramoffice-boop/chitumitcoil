import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Brain,
  LogOut,
  Users,
  TrendingUp,
  Shield,
  DollarSign,
  Heart,
  Search,
  Eye,
  BarChart3,
  PieChart,
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Target,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LeadStatus = "new" | "contacted" | "in_progress" | "submitted" | "approved" | "rejected" | "closed";

interface Lead {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  notes: string | null;
  mortgage_amount: number | null;
  property_value: number | null;
  monthly_income: number | null;
  created_at: string;
  consultant_id: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: "חדש", color: "text-primary", bg: "bg-primary/10" },
  contacted: { label: "יצירת קשר", color: "text-amber-600", bg: "bg-amber-50" },
  in_progress: { label: "בטיפול", color: "text-blue-600", bg: "bg-blue-50" },
  submitted: { label: "הוגש", color: "text-indigo-600", bg: "bg-indigo-50" },
  approved: { label: "אושר", color: "text-emerald-600", bg: "bg-emerald-50" },
  rejected: { label: "נדחה", color: "text-destructive", bg: "bg-destructive/10" },
  closed: { label: "סגור", color: "text-muted-foreground", bg: "bg-muted" },
};

type ViewMode = "dashboard" | "clients" | "client-detail";

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedClient, setSelectedClient] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const refreshLeads = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
  };

  const { data: allLeads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: allRoles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data as { user_id: string; role: string }[];
    },
  });

  const filteredLeads = allLeads.filter(
    (l) =>
      l.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone?.includes(searchTerm)
  );

  // Stats
  const totalMortgage = allLeads.reduce((s, l) => s + (l.mortgage_amount || 0), 0);
  const totalPropertyValue = allLeads.reduce((s, l) => s + (l.property_value || 0), 0);
  const avgIncome = allLeads.length
    ? allLeads.reduce((s, l) => s + (l.monthly_income || 0), 0) / allLeads.length
    : 0;
  const approvedCount = allLeads.filter((l) => l.status === "approved").length;
  const conversionRate = allLeads.length ? ((approvedCount / allLeads.length) * 100).toFixed(1) : "0";

  // Insurance/financial opportunities
  const insuranceOpportunities = allLeads.filter(
    (l) =>
      l.notes?.includes("ביטוח") ||
      l.notes?.includes("פוטנציאל") ||
      l.monthly_income && l.monthly_income > 15000
  );

  const highValueClients = allLeads.filter(
    (l) => (l.mortgage_amount || 0) > 1000000 || (l.monthly_income || 0) > 25000
  );

  const noInsuranceClients = allLeads.filter(
    (l) => l.notes?.includes("ללא ביטוח") || l.notes?.includes("צריך ביטוח") || l.notes?.includes("צריכים ביטוח")
  );

  const consultantCount = allRoles.filter((r) => r.role === "consultant").length;
  const clientCount = allRoles.filter((r) => r.role === "client").length;

  const openClientDetail = (lead: Lead) => {
    setSelectedClient(lead);
    setViewMode("client-detail");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SmartMortgage AI</h1>
              <p className="text-xs text-muted-foreground">פאנל מנהל</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={viewMode === "dashboard" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("dashboard")}
            >
              <BarChart3 className="w-4 h-4 ml-1" />
              דשבורד
            </Button>
            <Button
              variant={viewMode === "clients" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("clients")}
            >
              <Users className="w-4 h-4 ml-1" />
              לקוחות
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 ml-1" />
              יציאה
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {leadsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : viewMode === "dashboard" ? (
          <DashboardView
            totalLeads={allLeads.length}
            totalMortgage={totalMortgage}
            totalPropertyValue={totalPropertyValue}
            avgIncome={avgIncome}
            conversionRate={conversionRate}
            approvedCount={approvedCount}
            consultantCount={consultantCount}
            clientCount={clientCount}
            insuranceOpportunities={insuranceOpportunities}
            highValueClients={highValueClients}
            noInsuranceClients={noInsuranceClients}
            allLeads={allLeads}
            onViewClient={openClientDetail}
            onGoToClients={() => setViewMode("clients")}
          />
        ) : viewMode === "clients" ? (
          <ClientsView
            leads={filteredLeads}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onViewClient={openClientDetail}
            profiles={allProfiles}
          />
        ) : (
          <ClientDetailView
            lead={selectedClient!}
            onBack={() => setViewMode("clients")}
            profiles={allProfiles}
            onLeadUpdated={refreshLeads}
          />
        )}
      </main>
    </div>
  );
};

// Dashboard View
function DashboardView({
  totalLeads, totalMortgage, totalPropertyValue, avgIncome,
  conversionRate, approvedCount, consultantCount, clientCount,
  insuranceOpportunities, highValueClients, noInsuranceClients,
  allLeads, onViewClient, onGoToClients,
}: any) {
  return (
    <div className="space-y-8">
      {/* System Health Banner */}
      <div className="relative overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-l from-gold/10 via-gold/5 to-transparent p-5 glow-gold">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-gold/15">
              <Shield className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">System Health — Chitumit Platform</h3>
              <p className="text-xs text-muted-foreground">All systems operational · Uptime 99.97%</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xl font-bold text-gold font-heebo">₪{(totalMortgage / 1000000).toFixed(0)}M</p>
              <p className="text-[10px] text-muted-foreground">Total Underwriting Volume</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-cyan-glow font-heebo">{totalLeads}</p>
              <p className="text-[10px] text-muted-foreground">Cases Managed</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-success font-heebo">{conversionRate}%</p>
              <p className="text-[10px] text-muted-foreground">Approval Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="סה״כ לקוחות" value={totalLeads} />
        <KPICard icon={DollarSign} label="סה״כ משכנתאות" value={`₪${(totalMortgage / 1000000).toFixed(1)}M`} variant="primary" />
        <KPICard icon={TrendingUp} label="שיעור אישור" value={`${conversionRate}%`} variant="success" />
        <KPICard icon={Heart} label="הזדמנויות ביטוח" value={insuranceOpportunities.length} variant="warning" />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">סיכום פיננסי</h3>
          </div>
          <div className="space-y-3">
            <FinancialRow label="סה״כ שווי נכסים" value={totalPropertyValue} />
            <FinancialRow label="סה״כ היקף משכנתאות" value={totalMortgage} />
            <FinancialRow label="הכנסה ממוצעת לקוח" value={Math.round(avgIncome)} />
            <FinancialRow label="יחס מימון ממוצע (LTV)" value={`${totalPropertyValue ? ((totalMortgage / totalPropertyValue) * 100).toFixed(1) : 0}%`} isPercent />
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">סטטיסטיקת משתמשים</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary">
              <span className="text-sm text-muted-foreground">יועצים רשומים</span>
              <span className="font-bold text-foreground">{consultantCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary">
              <span className="text-sm text-muted-foreground">לקוחות רשומים</span>
              <span className="font-bold text-foreground">{clientCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary">
              <span className="text-sm text-muted-foreground">תיקים שאושרו</span>
              <span className="font-bold text-emerald-600">{approvedCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary">
              <span className="text-sm text-muted-foreground">סטטוסים פתוחים</span>
              <span className="font-bold text-foreground">{totalLeads - approvedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OpportunityCard
          title="לקוחות בעלי ערך גבוה"
          icon={Target}
          color="text-primary"
          clients={highValueClients}
          description="משכנתא מעל ₪1M או הכנסה מעל ₪25K"
          onViewClient={onViewClient}
        />
        <OpportunityCard
          title="הזדמנויות ביטוח"
          icon={Heart}
          color="text-amber-600"
          clients={insuranceOpportunities}
          description="לקוחות עם פוטנציאל מכירת ביטוח"
          onViewClient={onViewClient}
        />
        <OpportunityCard
          title="ללא ביטוח קיים"
          icon={AlertTriangle}
          color="text-destructive"
          clients={noInsuranceClients}
          description="לקוחות שצריכים ביטוח חדש"
          onViewClient={onViewClient}
        />
      </div>

      {/* Status breakdown */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">פילוח לפי סטטוס</h3>
          <Button variant="outline" size="sm" onClick={onGoToClients}>
            צפה בכל הלקוחות
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = allLeads.filter((l: Lead) => l.status === key).length;
            return (
              <div key={key} className={cn("rounded-lg p-3 text-center", config.bg)}>
                <p className={cn("text-2xl font-bold", config.color)}>{count}</p>
                <p className="text-xs text-muted-foreground">{config.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Clients Table View
function ClientsView({ leads, searchTerm, onSearchChange, onViewClient, profiles }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">כל הלקוחות</h2>
        <div className="relative w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="חפש לפי שם, אימייל או טלפון..."
            className="pr-10"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">שם</TableHead>
              <TableHead className="text-right">טלפון</TableHead>
              <TableHead className="text-right">אימייל</TableHead>
              <TableHead className="text-right">סכום משכנתא</TableHead>
              <TableHead className="text-right">הכנסה חודשית</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  לא נמצאו לקוחות
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead: Lead) => {
                const sc = STATUS_CONFIG[lead.status];
                return (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => onViewClient(lead)}>
                    <TableCell className="font-medium">{lead.full_name}</TableCell>
                    <TableCell dir="ltr" className="text-left">{lead.phone || "-"}</TableCell>
                    <TableCell dir="ltr" className="text-left">{lead.email || "-"}</TableCell>
                    <TableCell>{lead.mortgage_amount ? `₪${Number(lead.mortgage_amount).toLocaleString()}` : "-"}</TableCell>
                    <TableCell>{lead.monthly_income ? `₪${Number(lead.monthly_income).toLocaleString()}` : "-"}</TableCell>
                    <TableCell>
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium", sc.color, sc.bg)}>
                        {sc.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewClient(lead); }}>
                        <Eye className="w-4 h-4 ml-1" />
                        צפה
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Client Detail View
function ClientDetailView({ lead, onBack, profiles, onLeadUpdated }: { lead: Lead; onBack: () => void; profiles: Profile[]; onLeadUpdated: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: lead.full_name,
    phone: lead.phone || "",
    email: lead.email || "",
    mortgage_amount: lead.mortgage_amount?.toString() || "",
    property_value: lead.property_value?.toString() || "",
    monthly_income: lead.monthly_income?.toString() || "",
    status: lead.status,
    notes: lead.notes || "",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof editData) => {
      const { error } = await supabase
        .from("leads")
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
          email: data.email || null,
          mortgage_amount: data.mortgage_amount ? Number(data.mortgage_amount) : null,
          property_value: data.property_value ? Number(data.property_value) : null,
          monthly_income: data.monthly_income ? Number(data.monthly_income) : null,
          status: data.status as LeadStatus,
          notes: data.notes || null,
        })
        .eq("id", lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "עודכן בהצלחה", description: "פרטי הלקוח עודכנו" });
      setIsEditing(false);
      onLeadUpdated();
    },
    onError: () => {
      toast({ title: "שגיאה", description: "לא ניתן לעדכן את הנתונים", variant: "destructive" });
    },
  });

  const displayLead = isEditing ? {
    ...lead,
    full_name: editData.full_name,
    phone: editData.phone || null,
    email: editData.email || null,
    mortgage_amount: editData.mortgage_amount ? Number(editData.mortgage_amount) : null,
    property_value: editData.property_value ? Number(editData.property_value) : null,
    monthly_income: editData.monthly_income ? Number(editData.monthly_income) : null,
    status: editData.status as LeadStatus,
    notes: editData.notes || null,
  } : lead;

  const sc = STATUS_CONFIG[displayLead.status];
  const ltv = displayLead.property_value ? ((displayLead.mortgage_amount || 0) / displayLead.property_value * 100).toFixed(1) : null;
  const dti = displayLead.monthly_income ? (((displayLead.mortgage_amount || 0) / 240) / displayLead.monthly_income * 100).toFixed(1) : null;

  const hasInsurance = displayLead.notes?.includes("ביטוח חיים קיים") || displayLead.notes?.includes("יש ביטוח");
  const needsInsurance = displayLead.notes?.includes("ללא ביטוח") || displayLead.notes?.includes("צריך ביטוח") || displayLead.notes?.includes("צריכים ביטוח");
  const insurancePotential = displayLead.notes?.includes("פוטנציאל");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 ml-1" />
          חזרה לרשימה
        </Button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 ml-1" />
                ביטול
              </Button>
              <Button size="sm" onClick={() => updateMutation.mutate(editData)} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 ml-1" />
                {updateMutation.isPending ? "שומר..." : "שמור"}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 ml-1" />
              עריכה
            </Button>
          )}
        </div>
      </div>

      {/* Client Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            {isEditing ? (
              <Input value={editData.full_name} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} className="text-xl font-bold" />
            ) : (
              <h2 className="text-2xl font-bold text-foreground">{displayLead.full_name}</h2>
            )}
            {isEditing ? (
              <div className="flex items-center gap-3">
                <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} placeholder="טלפון" className="w-40" />
                <Input value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} placeholder="אימייל" className="w-52" />
              </div>
            ) : (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {displayLead.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{displayLead.phone}</span>}
                {displayLead.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{displayLead.email}</span>}
              </div>
            )}
          </div>
          {isEditing ? (
            <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v as LeadStatus })}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className={cn("text-sm px-3 py-1.5 rounded-full font-medium", sc.color, sc.bg)}>{sc.label}</span>
          )}
        </div>
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isEditing ? (
          <>
            <EditableDetailCard label="סכום משכנתא" value={editData.mortgage_amount} onChange={(v) => setEditData({ ...editData, mortgage_amount: v })} icon={DollarSign} />
            <EditableDetailCard label="שווי נכס" value={editData.property_value} onChange={(v) => setEditData({ ...editData, property_value: v })} icon={TrendingUp} />
            <EditableDetailCard label="הכנסה חודשית" value={editData.monthly_income} onChange={(v) => setEditData({ ...editData, monthly_income: v })} icon={BarChart3} />
            <DetailCard label="יחס מימון (LTV)" value={ltv ? `${ltv}%` : "לא זמין"} icon={PieChart} />
          </>
        ) : (
          <>
            <DetailCard label="סכום משכנתא" value={displayLead.mortgage_amount ? `₪${Number(displayLead.mortgage_amount).toLocaleString()}` : "לא צוין"} icon={DollarSign} />
            <DetailCard label="שווי נכס" value={displayLead.property_value ? `₪${Number(displayLead.property_value).toLocaleString()}` : "לא צוין"} icon={TrendingUp} />
            <DetailCard label="הכנסה חודשית" value={displayLead.monthly_income ? `₪${Number(displayLead.monthly_income).toLocaleString()}` : "לא צוין"} icon={BarChart3} />
            <DetailCard label="יחס מימון (LTV)" value={ltv ? `${ltv}%` : "לא זמין"} icon={PieChart} />
          </>
        )}
      </div>

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            ניתוח פיננסי
          </h3>
          <div className="space-y-3">
            <AnalysisRow label="יחס החזר להכנסה (DTI)" value={dti ? `${dti}%` : "N/A"} status={dti && Number(dti) < 30 ? "good" : dti && Number(dti) < 40 ? "warning" : "danger"} />
            <AnalysisRow label="יחס מימון (LTV)" value={ltv ? `${ltv}%` : "N/A"} status={ltv && Number(ltv) < 60 ? "good" : ltv && Number(ltv) < 75 ? "warning" : "danger"} />
            <AnalysisRow label="הכנסה חודשית" value={displayLead.monthly_income ? `₪${Number(displayLead.monthly_income).toLocaleString()}` : "N/A"} status={(displayLead.monthly_income || 0) > 20000 ? "good" : (displayLead.monthly_income || 0) > 12000 ? "warning" : "danger"} />
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            הזדמנויות ביטוח ופיננסים
          </h3>
          <div className="space-y-3">
            <div className={cn("flex items-center gap-3 p-3 rounded-lg", hasInsurance ? "bg-emerald-50" : needsInsurance ? "bg-red-50" : "bg-amber-50")}>
              {hasInsurance ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
              <div>
                <p className="text-sm font-medium text-foreground">ביטוח חיים</p>
                <p className="text-xs text-muted-foreground">{hasInsurance ? "קיים" : needsInsurance ? "חסר — הזדמנות מכירה!" : "לא ידוע"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50">
              <Target className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-foreground">ביטוח משכנתא</p>
                <p className="text-xs text-muted-foreground">{displayLead.mortgage_amount ? "נדרש ביטוח — הזדמנות מכירה" : "אין משכנתא"}</p>
              </div>
            </div>
            {insurancePotential && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">פוטנציאל גבוה</p>
                  <p className="text-xs text-muted-foreground">לקוח מתאים למוצרים פיננסיים נוספים</p>
                </div>
              </div>
            )}
            {(displayLead.monthly_income || 0) > 20000 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                <DollarSign className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">הכנסה גבוהה</p>
                  <p className="text-xs text-muted-foreground">מתאים לביטוח אובדן כושר עבודה ופנסיה</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="glass-card p-6 space-y-3">
        <h3 className="font-semibold text-foreground">הערות</h3>
        {isEditing ? (
          <Textarea value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} rows={4} placeholder="הוסף הערות..." />
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">{displayLead.notes || "אין הערות"}</p>
        )}
      </div>
    </div>
  );
}

function EditableDetailCard({ label, value, onChange, icon: Icon }: { label: string; value: string; onChange: (v: string) => void; icon: any }) {
  return (
    <div className="glass-card p-5 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder="₪" className="font-bold" />
    </div>
  );
}

function KPICard({ icon: Icon, label, value, variant }: { icon: any; label: string; value: any; variant?: string }) {
  const colorMap: Record<string, string> = { primary: "text-primary", success: "text-emerald-600", warning: "text-amber-600" };
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary">
          <Icon className={cn("w-5 h-5", variant ? colorMap[variant] : "text-muted-foreground")} />
        </div>
      </div>
    </div>
  );
}

function FinancialRow({ label, value, isPercent }: { label: string; value: any; isPercent?: boolean }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-secondary">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground">{isPercent ? value : `₪${Number(value).toLocaleString()}`}</span>
    </div>
  );
}

function DetailCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="glass-card p-5 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function AnalysisRow({ label, value, status }: { label: string; value: string; status: "good" | "warning" | "danger" }) {
  const colors = { good: "text-emerald-600 bg-emerald-50", warning: "text-amber-600 bg-amber-50", danger: "text-red-600 bg-red-50" };
  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-secondary">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-bold px-2 py-0.5 rounded", colors[status])}>{value}</span>
    </div>
  );
}

function OpportunityCard({ title, icon: Icon, color, clients, description, onViewClient }: any) {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-5 h-5", color)} />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <p className="text-3xl font-bold text-foreground">{clients.length}</p>
      {clients.slice(0, 3).map((c: Lead) => (
        <button
          key={c.id}
          onClick={() => onViewClient(c)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors text-sm"
        >
          <span className="text-foreground">{c.full_name}</span>
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

export default AdminDashboard;
