import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Brain,
  LogOut,
  Plus,
  Users,
  Phone,
  Mail,
  TrendingUp,
  Clock,
  CheckCircle2,
  Edit,
  Trash2,
  Loader2,
  ShieldAlert,
  Send,
  MessageCircle,
  AlertTriangle,
  FileWarning,
  Sparkles,
  ArrowLeft,
  Calendar,
  Facebook,
  Share2,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import RiskAnalysisView from "@/components/RiskAnalysisView";
import DataMasker from "@/components/DataMasker";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

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
  lead_source: string | null;
  last_contact: string | null;
  next_step: string | null;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; pulse?: boolean }> = {
  new: { label: "חדש", color: "text-primary", bg: "bg-primary/10" },
  contacted: { label: "יצירת קשר", color: "text-warning", bg: "bg-warning/10" },
  in_progress: { label: "בניתוח AI", color: "text-primary", bg: "bg-primary/10", pulse: true },
  submitted: { label: "הוגש", color: "text-primary", bg: "bg-primary/10" },
  approved: { label: "אושר", color: "text-success", bg: "bg-success/10" },
  rejected: { label: "נדחה", color: "text-destructive", bg: "bg-destructive/10" },
  closed: { label: "סגור", color: "text-muted-foreground", bg: "bg-muted" },
};

const NEXT_STEP_OPTIONS = [
  "העלאת תלושי שכר",
  "העלאת דפי בנק",
  "השלמת מסמכים",
  "המתנה לאישור עקרוני",
  "חתימה על מסמכים",
  "פגישת ייעוץ",
  "מעקב טלפוני",
];

const SOURCE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  facebook: { label: "פייסבוק", color: "hsl(217, 91%, 50%)", icon: Facebook },
  referral: { label: "הפנייה", color: "hsl(160, 84%, 39%)", icon: Share2 },
  organic: { label: "אורגני", color: "hsl(38, 92%, 50%)", icon: Globe },
};

const ConsultantDashboard = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sendingMagicLink, setSendingMagicLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    notes: "",
    mortgage_amount: "",
    property_value: "",
    monthly_income: "",
    status: "new" as LeadStatus,
    lead_source: "organic",
    next_step: "",
  });

  const handleSendMagicLink = async (lead: Lead) => {
    if (!lead.email) {
      toast.error("ללקוח זה לא הוגדר כתובת מייל");
      return;
    }
    setSendingMagicLink(lead.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-magic-link", {
        body: { email: lead.email, leadName: lead.full_name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`קישור גישה נשלח בהצלחה ל-${lead.email}`);
    } catch (e: any) {
      toast.error(`שגיאה בשליחת קישור: ${e.message}`);
    } finally {
      setSendingMagicLink(null);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const intlPhone = cleanPhone.startsWith("0") ? "972" + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(`שלום ${name}, `)}`, "_blank");
  };

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["all-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("lead_id, classification, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("leads").insert({
        consultant_id: user!.id,
        full_name: data.full_name,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
        mortgage_amount: data.mortgage_amount ? Number(data.mortgage_amount) : null,
        property_value: data.property_value ? Number(data.property_value) : null,
        monthly_income: data.monthly_income ? Number(data.monthly_income) : null,
        status: data.status as any,
        lead_source: data.lead_source || "organic",
        next_step: data.next_step || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("ליד נוצר בהצלחה");
      resetForm();
      setDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("leads")
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
          email: data.email || null,
          notes: data.notes || null,
          mortgage_amount: data.mortgage_amount ? Number(data.mortgage_amount) : null,
          property_value: data.property_value ? Number(data.property_value) : null,
          monthly_income: data.monthly_income ? Number(data.monthly_income) : null,
          status: data.status as any,
          lead_source: data.lead_source || "organic",
          next_step: data.next_step || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("ליד עודכן");
      resetForm();
      setDialogOpen(false);
      setEditingLead(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("ליד נמחק");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      email: "",
      notes: "",
      mortgage_amount: "",
      property_value: "",
      monthly_income: "",
      status: "new",
      lead_source: "organic",
      next_step: "",
    });
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      full_name: lead.full_name,
      phone: lead.phone || "",
      email: lead.email || "",
      notes: lead.notes || "",
      mortgage_amount: lead.mortgage_amount?.toString() || "",
      property_value: lead.property_value?.toString() || "",
      monthly_income: lead.monthly_income?.toString() || "",
      status: lead.status,
      lead_source: lead.lead_source || "organic",
      next_step: lead.next_step || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Computed stats
  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    inProgress: leads.filter((l) => ["contacted", "in_progress", "submitted"].includes(l.status)).length,
    approved: leads.filter((l) => l.status === "approved").length,
  }), [leads]);

  // Urgent tasks: leads missing documents or needing attention
  const urgentTasks = useMemo(() => {
    const tasks: { lead: Lead; reason: string; type: "missing_docs" | "expired" | "no_contact" }[] = [];
    leads.forEach((lead) => {
      const leadDocs = documents.filter((d) => d.lead_id === lead.id);
      if (lead.status !== "closed" && lead.status !== "rejected") {
        if (leadDocs.length === 0) {
          tasks.push({ lead, reason: "חסרים מסמכים", type: "missing_docs" });
        }
        if (lead.last_contact) {
          const daysSince = (Date.now() - new Date(lead.last_contact).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince > 7) {
            tasks.push({ lead, reason: `לא היה קשר ${Math.floor(daysSince)} ימים`, type: "no_contact" });
          }
        }
        if (lead.status === "submitted") {
          const daysSinceCreated = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceCreated > 30) {
            tasks.push({ lead, reason: "אישור עקרוני עלול לפוג", type: "expired" });
          }
        }
      }
    });
    return tasks.slice(0, 5);
  }, [leads, documents]);

  // Lead source chart data
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = { facebook: 0, referral: 0, organic: 0 };
    leads.forEach((l) => {
      const src = l.lead_source || "organic";
      if (counts[src] !== undefined) counts[src]++;
      else counts.organic++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name: SOURCE_CONFIG[key]?.label || key,
        value,
        color: SOURCE_CONFIG[key]?.color || "hsl(220, 9%, 46%)",
      }));
  }, [leads]);

  // Smart summary
  const summary = useMemo(() => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";
    const newDocs = documents.filter((d) => {
      const age = (Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return age < 1 && (!d.classification || d.classification === "unclassified");
    }).length;
    const expiring = leads.filter(
      (l) => l.status === "submitted" && (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24) > 25
    ).length;
    const parts: string[] = [];
    if (newDocs > 0) parts.push(`${newDocs} מסמכים חדשים לסיווג`);
    if (expiring > 0) parts.push(`${expiring} אישורים עקרוניים שפגים בקרוב`);
    if (stats.new > 0) parts.push(`${stats.new} לידים חדשים ממתינים`);
    return { greeting, parts };
  }, [documents, leads, stats]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SmartMortgage AI</h1>
              <p className="text-xs text-muted-foreground">פאנל יועץ</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 ml-2" />
            יציאה
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* AI Summary Banner */}
        {summary.parts.length > 0 && (
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-l from-primary/5 via-primary/10 to-primary/5 p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20 shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {summary.greeting}! <span className="font-normal text-muted-foreground">
                    {summary.parts.length > 0
                      ? `יש לך ${summary.parts.join(" ו-")}.`
                      : "הכל מעודכן! 🎉"}
                  </span>
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} title="סה״כ לידים" value={stats.total} />
          <StatCard icon={Plus} title="חדשים" value={stats.new} variant="primary" />
          <StatCard icon={Clock} title="בטיפול" value={stats.inProgress} variant="warning" />
          <StatCard icon={CheckCircle2} title="אושרו" value={stats.approved} variant="success" />
        </div>

        {/* Urgent Tasks + Lead Source */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Urgent Tasks */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="font-semibold text-foreground">משימות דחופות</h3>
              {urgentTasks.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                  {urgentTasks.length}
                </span>
              )}
            </div>
            {urgentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">אין משימות דחופות כרגע 🎉</p>
            ) : (
              <div className="space-y-2">
                {urgentTasks.map((task, i) => (
                  <div
                    key={`${task.lead.id}-${task.type}-${i}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLead(task.lead)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        task.type === "missing_docs" ? "bg-warning/10" : task.type === "expired" ? "bg-destructive/10" : "bg-muted"
                      )}>
                        <FileWarning className={cn(
                          "w-4 h-4",
                          task.type === "missing_docs" ? "text-warning" : task.type === "expired" ? "text-destructive" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{task.lead.full_name}</p>
                        <p className="text-xs text-muted-foreground">{task.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.lead.phone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            openWhatsApp(task.lead.phone!, task.lead.full_name);
                          }}
                        >
                          <MessageCircle className="w-4 h-4 text-success" />
                        </Button>
                      )}
                      <ArrowLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lead Source Chart */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-4">מקור לידים</h3>
            {sourceData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">אין נתונים עדיין</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
                            <span className="font-medium text-foreground">{payload[0].name}</span>
                            <span className="text-muted-foreground mr-2">{payload[0].value}</span>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2">
                  {sourceData.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-muted-foreground">{s.name} ({s.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leads Table */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">ניהול לידים</h2>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) { setEditingLead(null); resetForm(); }
            }}>
              <DialogTrigger asChild>
                <Button className="hover-scale">
                  <Plus className="w-4 h-4 ml-2" />
                  ליד חדש
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingLead ? "עריכת ליד" : "ליד חדש"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>שם מלא *</Label>
                      <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>טלפון</Label>
                      <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} dir="ltr" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>אימייל</Label>
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <Label>סטטוס</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as LeadStatus })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>מקור ליד</Label>
                      <Select value={formData.lead_source} onValueChange={(v) => setFormData({ ...formData, lead_source: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>צעד הבא</Label>
                      <Select value={formData.next_step} onValueChange={(v) => setFormData({ ...formData, next_step: v })}>
                        <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                        <SelectContent>
                          {NEXT_STEP_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>סכום משכנתא</Label>
                      <Input type="number" value={formData.mortgage_amount} onChange={(e) => setFormData({ ...formData, mortgage_amount: e.target.value })} dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <Label>שווי נכס</Label>
                      <Input type="number" value={formData.property_value} onChange={(e) => setFormData({ ...formData, property_value: e.target.value })} dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <Label>הכנסה חודשית</Label>
                      <Input type="number" value={formData.monthly_income} onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })} dir="ltr" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>הערות</Label>
                    <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    {editingLead ? "עדכן" : "צור ליד"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>עדיין אין לידים. לחץ על "ליד חדש" כדי להתחיל.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => {
                const sc = STATUS_CONFIG[lead.status];
                const isSelected = selectedLead?.id === lead.id;
                return (
                  <div key={lead.id} className="animate-fade-in">
                    <div
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:bg-secondary/50 hover:-translate-y-0.5"
                      )}
                      onClick={() => setSelectedLead(isSelected ? null : lead)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-foreground">{lead.full_name}</span>
                          <span className={cn(
                            "text-[11px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1",
                            sc.color, sc.bg,
                            sc.pulse && "animate-pulse"
                          )}>
                            {sc.pulse && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />}
                            {sc.label}
                          </span>
                          {lead.next_step && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground border border-border">
                              ← {lead.next_step}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <DataMasker value={lead.phone} type="phone" />
                            </span>
                          )}
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <DataMasker value={lead.email} type="email" />
                            </span>
                          )}
                          {lead.mortgage_amount && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />₪{Number(lead.mortgage_amount).toLocaleString()}
                            </span>
                          )}
                          {lead.last_contact && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(lead.last_contact), { locale: he, addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {lead.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="WhatsApp"
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsApp(lead.phone!, lead.full_name);
                            }}
                          >
                            <MessageCircle className="w-4 h-4 text-success" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="הפקת קישור גישה"
                          disabled={sendingMagicLink === lead.id || !lead.email}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendMagicLink(lead);
                          }}
                        >
                          {sendingMagicLink === lead.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : (
                            <Send className="w-4 h-4 text-primary" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                        >
                          <ShieldAlert className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(lead); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("למחוק את הליד?")) deleteMutation.mutate(lead.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Risk Analysis Panel */}
                    {isSelected && (
                      <div className="mt-3 mr-4 border-r-2 border-primary/20 pr-4 animate-fade-in">
                        <Tabs defaultValue="risk" dir="rtl">
                          <TabsList>
                            <TabsTrigger value="risk">ניתוח סיכונים</TabsTrigger>
                            <TabsTrigger value="details">פרטים</TabsTrigger>
                          </TabsList>
                          <TabsContent value="risk" className="mt-4">
                            <RiskAnalysisView lead={lead} />
                          </TabsContent>
                          <TabsContent value="details" className="mt-4">
                            <div className="glass-card p-5 space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">שווי נכס</p>
                                  <p className="font-bold text-foreground">
                                    {lead.property_value ? `₪${Number(lead.property_value).toLocaleString()}` : "לא צוין"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">סכום משכנתא</p>
                                  <p className="font-bold text-foreground">
                                    {lead.mortgage_amount ? `₪${Number(lead.mortgage_amount).toLocaleString()}` : "לא צוין"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">הכנסה חודשית</p>
                                  <p className="font-bold text-foreground">
                                    {lead.monthly_income ? `₪${Number(lead.monthly_income).toLocaleString()}` : "לא צוין"}
                                  </p>
                                </div>
                              </div>
                              {lead.notes && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">הערות</p>
                                  <p className="text-sm text-foreground">{lead.notes}</p>
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function StatCard({ icon: Icon, title, value, variant }: {
  icon: any;
  title: string;
  value: number;
  variant?: "primary" | "warning" | "success";
}) {
  const colors = {
    primary: "text-primary",
    warning: "text-warning",
    success: "text-success",
  };
  return (
    <div className="glass-card p-5 hover-scale cursor-default">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary">
          <Icon className={cn("w-5 h-5", variant ? colors[variant] : "text-muted-foreground")} />
        </div>
      </div>
    </div>
  );
}

export default ConsultantDashboard;
