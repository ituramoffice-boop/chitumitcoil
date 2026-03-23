import { useState } from "react";
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
  Link2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import RiskAnalysisView from "@/components/RiskAnalysisView";
import DataMasker from "@/components/DataMasker";

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
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: "חדש", color: "text-primary", bg: "bg-primary/10" },
  contacted: { label: "יצירת קשר", color: "text-warning", bg: "bg-warning/10" },
  in_progress: { label: "בטיפול", color: "text-primary", bg: "bg-primary/10" },
  submitted: { label: "הוגש", color: "text-primary", bg: "bg-primary/10" },
  approved: { label: "אושר", color: "text-success", bg: "bg-success/10" },
  rejected: { label: "נדחה", color: "text-destructive", bg: "bg-destructive/10" },
  closed: { label: "סגור", color: "text-muted-foreground", bg: "bg-muted" },
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

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    inProgress: leads.filter((l) => ["contacted", "in_progress", "submitted"].includes(l.status)).length,
    approved: leads.filter((l) => l.status === "approved").length,
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
              <p className="text-xs text-muted-foreground">פאנל יועץ</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 ml-2" />
            יציאה
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} title="סה״כ לידים" value={stats.total} />
          <StatCard icon={Plus} title="חדשים" value={stats.new} variant="primary" />
          <StatCard icon={Clock} title="בטיפול" value={stats.inProgress} variant="warning" />
          <StatCard icon={CheckCircle2} title="אושרו" value={stats.approved} variant="success" />
        </div>

        {/* Leads Table + Risk Analysis */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">ניהול לידים</h2>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) { setEditingLead(null); resetForm(); }
            }}>
              <DialogTrigger asChild>
                <Button>
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
                  <div key={lead.id}>
                    <div
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-secondary/50"
                      )}
                      onClick={() => setSelectedLead(isSelected ? null : lead)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-foreground">{lead.full_name}</span>
                          <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", sc.color, sc.bg)}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                        >
                          <ShieldAlert className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(lead); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
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
                      <div className="mt-3 mr-4 border-r-2 border-primary/20 pr-4 animate-slide-in">
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
    <div className="glass-card p-5">
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
