import { useState, useMemo, useEffect } from "react";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useDemo } from "@/contexts/DemoContext";
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
  RefreshCw,
  AlertCircle,
  FileX,
  Banknote,
  ChevronLeft,
  Upload,
  ClipboardCheck,
  Building,
  Lock,
  Crown,
  Zap,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import RiskAnalysisView from "@/components/RiskAnalysisView";
import DataMasker from "@/components/DataMasker";
import { NotificationBell } from "@/components/NotificationBell";
import { WorkspaceSettings } from "@/components/WorkspaceSettings";
import { CaseTimeline } from "@/components/CaseTimeline";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { SmartSummaryWidget } from "@/components/SmartSummaryWidget";
import { ReadinessScore } from "@/components/ReadinessScore";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow, format } from "date-fns";
import { he } from "date-fns/locale";
import { RevenueForecaster, PriorityBoard } from "@/components/PredictiveCRM";
import { AIUnderwriterAdvocate } from "@/components/AIUnderwriterAdvocate";
import { CollaborativeUnderwriting } from "@/components/CollaborativeUnderwriting";
import { AdvisorBenchmark } from "@/components/AdvisorBenchmark";
import { InsiderFeed } from "@/components/InsiderFeed";
import { PerformanceStats, FeeEstimator, CloseDealTrigger, PipelineTicker } from "@/components/ProfitIntelligence";
import { PresentationMode } from "@/components/PresentationMode";

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
  client_user_id: string | null;
}

interface Document {
  lead_id: string | null;
  classification: string | null;
  created_at: string;
  risk_flags: any;
  extracted_data: any;
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

// Conversion funnel stages
const FUNNEL_STAGES: { key: LeadStatus | "all"; label: string; icon: any; statuses: LeadStatus[] }[] = [
  { key: "all", label: "כל הלידים", icon: Users, statuses: [] },
  { key: "new", label: "לידים חדשים", icon: Plus, statuses: ["new"] },
  { key: "contacted", label: "העלאת מסמכים", icon: Upload, statuses: ["contacted"] },
  { key: "in_progress", label: "בדיקת חיתום", icon: ClipboardCheck, statuses: ["in_progress"] },
  { key: "submitted", label: "הוגש לבנק", icon: Building, statuses: ["submitted"] },
  { key: "approved", label: "אושר", icon: CheckCircle2, statuses: ["approved"] },
  { key: "closed", label: "סגור", icon: Lock, statuses: ["closed"] },
];

type AlertCategory = "expiring" | "missing_docs" | "anomalies";

interface CriticalAlert {
  lead: Lead;
  reason: string;
  category: AlertCategory;
  missingDoc?: string;
}

const ConsultantDashboard = ({ onSwitchToAdmin }: { onSwitchToAdmin?: () => void }) => {
  const { user, role, signOut } = useAuth();
  const { isDemoMode } = useDemo();
  const { isAgency } = useWorkspace();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sendingMagicLink, setSendingMagicLink] = useState<string | null>(null);
  const [funnelFilter, setFunnelFilter] = useState<LeadStatus | "all">("all");
  const [presentationLead, setPresentationLead] = useState<Lead | null>(null);
  const [alertTab, setAlertTab] = useState<AlertCategory>("expiring");
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

  const openWhatsApp = (phone: string, name: string, missingDoc?: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const intlPhone = cleanPhone.startsWith("0") ? "972" + cleanPhone.slice(1) : cleanPhone;
    const docText = missingDoc || "מסמך אחד נוסף";
    const message = `היי ${name} 😊\nרציתי לעדכן שאנחנו כמעט מוכנים להגיש את הבקשה!\nחסר לנו רק ${docText} — תוכל/י להעלות אותו כאן בקלות:\n📎 https://chitumitcoil.lovable.app/auth\n\nאם צריך עזרה לאתר את המסמך, אני כאן בשבילך!`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Demo data for consultant
  const DEMO_LEADS: Lead[] = [
    { id: "d1", full_name: "דנה כהן", phone: "052-1111111", email: "dana@test.com", status: "new", notes: "פנתה דרך הפייסבוק", mortgage_amount: 800000, property_value: 1500000, monthly_income: 18000, created_at: new Date(Date.now() - 86400000).toISOString(), lead_source: "facebook", last_contact: null, next_step: "העלאת תלושי שכר", client_user_id: null },
    { id: "d2", full_name: "אבי לוי", phone: "054-2222222", email: "avi@test.com", status: "contacted", notes: "זוג צעיר", mortgage_amount: 1200000, property_value: 2000000, monthly_income: 25000, created_at: new Date(Date.now() - 172800000).toISOString(), lead_source: "referral", last_contact: new Date(Date.now() - 43200000).toISOString(), next_step: "העלאת דפי בנק", client_user_id: null },
    { id: "d3", full_name: "שרה מזרחי", phone: "050-3333333", email: "sara@test.com", status: "in_progress", notes: "מחכה לאישור BDI", mortgage_amount: 950000, property_value: 1800000, monthly_income: 20000, created_at: new Date(Date.now() - 604800000).toISOString(), lead_source: "organic", last_contact: new Date(Date.now() - 86400000).toISOString(), next_step: "המתנה לאישור עקרוני", client_user_id: null },
    { id: "d4", full_name: "יוסי ברק", phone: "058-4444444", email: "yossi@test.com", status: "submitted", notes: "הוגש לבנק הפועלים", mortgage_amount: 1500000, property_value: 2500000, monthly_income: 30000, created_at: new Date(Date.now() - 1209600000).toISOString(), lead_source: "referral", last_contact: new Date(Date.now() - 172800000).toISOString(), next_step: "חתימה על מסמכים", client_user_id: null },
    { id: "d5", full_name: "מיכל אדרי", phone: "053-5555555", email: "michal@test.com", status: "approved", notes: "אושר! מזל טוב", mortgage_amount: 700000, property_value: 1300000, monthly_income: 16000, created_at: new Date(Date.now() - 2592000000).toISOString(), lead_source: "advisor_sync", last_contact: new Date().toISOString(), next_step: null, client_user_id: "demo-synced" },
    { id: "d6", full_name: "רון גבאי", phone: "050-6666666", email: "ron@test.com", status: "new", notes: null, mortgage_amount: null, property_value: null, monthly_income: null, created_at: new Date(Date.now() - 3600000).toISOString(), lead_source: "organic", last_contact: null, next_step: null, client_user_id: null },
  ];

  const DEMO_DOCS: Document[] = [
    { lead_id: "d2", classification: "תלושי שכר", created_at: new Date().toISOString(), risk_flags: null, extracted_data: { analyzed_at: new Date().toISOString() } },
    { lead_id: "d3", classification: 'דפי עו"ש', created_at: new Date().toISOString(), risk_flags: null, extracted_data: { analyzed_at: new Date().toISOString() } },
    { lead_id: "d3", classification: "תלושי שכר", created_at: new Date().toISOString(), risk_flags: null, extracted_data: null },
    { lead_id: "d4", classification: "תלושי שכר", created_at: new Date().toISOString(), risk_flags: null, extracted_data: { analyzed_at: new Date().toISOString() } },
    { lead_id: "d4", classification: 'דפי עו"ש', created_at: new Date().toISOString(), risk_flags: null, extracted_data: { analyzed_at: new Date().toISOString() } },
    { lead_id: "d4", classification: 'דו"ח BDI', created_at: new Date().toISOString(), risk_flags: null, extracted_data: { analyzed_at: new Date().toISOString() } },
  ];

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) return DEMO_LEADS;
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: documents = [], dataUpdatedAt } = useQuery({
    queryKey: ["all-documents", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) return DEMO_DOCS;
      const { data, error } = await supabase
        .from("documents")
        .select("lead_id, classification, created_at, risk_flags, extracted_data")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
  });

  const lastSyncTime = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  // Profile: plan & lead_count
  const { data: profile } = useQuery({
    queryKey: ["my-profile", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) return { plan: "pro", lead_count: 6 };
      const { data, error } = await supabase
        .from("profiles")
        .select("plan, lead_count")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const FREE_LEAD_LIMIT = 10;
  const isFree = !profile || profile.plan === "free";
  const usedLeads = leads.length;
  const usagePercent = isFree ? Math.min(100, (usedLeads / FREE_LEAD_LIMIT) * 100) : 0;
  const isAtLimit = isFree && usedLeads >= FREE_LEAD_LIMIT;

  // Realtime: auto-refresh leads & documents on any change
  useEffect(() => {
    if (isDemoMode) return;
    const channel = supabase
      .channel('consultant-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        queryClient.invalidateQueries({ queryKey: ["leads"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        queryClient.invalidateQueries({ queryKey: ["all-documents"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, () => {
        queryClient.invalidateQueries({ queryKey: ["activity-log"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, isDemoMode]);

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
      if (isAtLimit) {
        toast.error("הגעת למכסת 10 הלידים החינמיים. שדרג לתוכנית Pro כדי להמשיך!");
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["all-documents"] });
    toast.success("הנתונים עודכנו");
  };

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    inProgress: leads.filter((l) => ["contacted", "in_progress", "submitted"].includes(l.status)).length,
    approved: leads.filter((l) => l.status === "approved").length,
  }), [leads]);

  // Critical alerts - 3 categories
  const criticalAlerts = useMemo(() => {
    const alerts: CriticalAlert[] = [];

    leads.forEach((lead) => {
      if (lead.status === "closed" || lead.status === "rejected") return;
      const leadDocs = documents.filter((d) => d.lead_id === lead.id);

      // 1. Expiring approvals (submitted > 25 days ago)
      if (lead.status === "submitted") {
        const daysSince = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 25) {
          const daysLeft = Math.max(0, 30 - Math.floor(daysSince));
          alerts.push({
            lead,
            reason: daysLeft > 0 ? `אישור עקרוני פג בעוד ${daysLeft} ימים` : "אישור עקרוני פג תוקף!",
            category: "expiring",
          });
        }
      }

      // 2. Missing critical documents
      if (leadDocs.length > 0) {
        const classifications = leadDocs.map((d) => d.classification?.toLowerCase() || "");
        const hasBankStatement = classifications.some((c) => c.includes("bank") || c.includes("עו"));
        const hasPaySlip = classifications.some((c) => c.includes("pay") || c.includes("תלוש") || c.includes("salary"));

        if (!hasBankStatement) {
          alerts.push({
            lead,
            reason: "חסר דף חשבון בנק (עו\"ש)",
            category: "missing_docs",
            missingDoc: "דף חשבון בנק (עו\"ש)",
          });
        }
        if (!hasPaySlip) {
          alerts.push({
            lead,
            reason: "חסר תלוש שכר",
            category: "missing_docs",
            missingDoc: "תלוש שכר",
          });
        }
      } else if (lead.status !== "new") {
        alerts.push({
          lead,
          reason: "לא הועלו מסמכים כלל",
          category: "missing_docs",
        });
      }

      // 3. Bank anomalies (returned checks / risk flags in recent docs)
      leadDocs.forEach((doc) => {
        const age = (Date.now() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (age > 1) return; // last 24 hours only

        const flags = Array.isArray(doc.risk_flags) ? doc.risk_flags : [];
        const hasReturn = flags.some((f: any) => {
          const text = typeof f === "string" ? f : JSON.stringify(f);
          return text.includes("אכ") || text.includes("החזר") || text.includes("return") || text.includes("חריג");
        });
        if (hasReturn) {
          alerts.push({
            lead,
            reason: "זוהו אכ\"מ / החזרות בעו\"ש",
            category: "anomalies",
          });
        }
      });
    });

    return alerts;
  }, [leads, documents]);

  const filteredAlerts = useMemo(() => criticalAlerts.filter((a) => a.category === alertTab), [criticalAlerts, alertTab]);
  const alertCounts = useMemo(() => ({
    expiring: criticalAlerts.filter((a) => a.category === "expiring").length,
    missing_docs: criticalAlerts.filter((a) => a.category === "missing_docs").length,
    anomalies: criticalAlerts.filter((a) => a.category === "anomalies").length,
  }), [criticalAlerts]);

  // Funnel counts
  const funnelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    FUNNEL_STAGES.forEach((stage) => {
      if (stage.key !== "all") {
        counts[stage.key] = leads.filter((l) => stage.statuses.includes(l.status)).length;
      }
    });
    return counts;
  }, [leads]);

  // Filtered leads by funnel
  const filteredLeads = useMemo(() => {
    if (funnelFilter === "all") return leads;
    const stage = FUNNEL_STAGES.find((s) => s.key === funnelFilter);
    if (!stage) return leads;
    return leads.filter((l) => stage.statuses.includes(l.status));
  }, [leads, funnelFilter]);

  // Lead source chart
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
    const parts: string[] = [];
    if (newDocs > 0) parts.push(`${newDocs} מסמכים חדשים לסיווג`);
    if (alertCounts.expiring > 0) parts.push(`${alertCounts.expiring} אישורים עקרוניים שפגים בקרוב`);
    if (alertCounts.missing_docs > 0) parts.push(`${alertCounts.missing_docs} חוסרים קריטיים`);
    if (stats.new > 0) parts.push(`${stats.new} לידים חדשים ממתינים`);
    return { greeting, parts };
  }, [documents, alertCounts, stats]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChitumitLogo size={36} />
            <div>
              <h1 className="text-xl font-bold text-gold">חיתומית</h1>
              <p className="text-[10px] text-muted-foreground">תהיה מאושר.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Admin switch button */}
            {role === "admin" && onSwitchToAdmin && (
              <Button variant="outline" size="sm" onClick={onSwitchToAdmin} className="text-xs">
                📊 מצב ניהול
              </Button>
            )}
            <NotificationBell />
            {/* Last Sync */}
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshData} title="רענן נתונים">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              {lastSyncTime && (
                <span>סנכרון אחרון: {format(lastSyncTime, "HH:mm", { locale: he })}</span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 ml-2" />
              יציאה
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 lg:px-10 py-10 space-y-8">
        {/* AI Co-Pilot Smart Summary */}
        <SmartSummaryWidget
          greeting={summary.greeting}
          newDocsCollected={documents.filter(d => {
            const age = (Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
            return age < 1;
          }).length}
          pendingLeads={stats.new}
          expiringCount={alertCounts.expiring}
          missingDocsCount={alertCounts.missing_docs}
        />

        {/* Revenue Forecast HUD */}
        <RevenueForecaster leads={leads} />

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} title="סה״כ לידים" value={stats.total} />
          <StatCard icon={Plus} title="חדשים" value={stats.new} variant="primary" />
          <StatCard icon={Clock} title="בטיפול" value={stats.inProgress} variant="warning" />
          <StatCard icon={CheckCircle2} title="אושרו" value={stats.approved} variant="success" />
        </div>

        {/* Free Plan Usage Bar & Upgrade CTA */}
        {isFree && (
          <div className={cn(
            "relative overflow-hidden rounded-xl border p-5 animate-fade-in",
            isAtLimit
              ? "border-gold/50 bg-gradient-to-l from-gold/10 via-gold/5 to-transparent gold-border-card"
              : "border-border/40 glass-card"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-gold" />
                <h3 className="text-sm font-bold text-foreground">
                  תוכנית חינמית — {usedLeads} / {FREE_LEAD_LIMIT} לידים
                </h3>
              </div>
              <Button
                className="bg-gold text-gold-foreground hover:bg-gold/90 gold-glow-btn gap-1.5 font-bold shadow-lg animate-glow-pulse"
                size="sm"
                onClick={() => toast.info("שדרוג לתוכנית Pro — בקרוב!")}
              >
                <Crown className="w-4 h-4" />
                שדרג ל-Pro
              </Button>
            </div>
            <Progress value={usagePercent} className="h-2.5 bg-secondary" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{usedLeads} לידים בשימוש</span>
              <span>{Math.max(0, FREE_LEAD_LIMIT - usedLeads)} נותרו</span>
            </div>
            {isAtLimit && (
              <div className="mt-3 p-3 rounded-lg bg-gold/10 border border-gold/20 flex items-center gap-2 text-sm text-gold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>הגעת למכסה! שדרג לתוכנית Pro כדי להוסיף לידים ללא הגבלה, חייגן AI, ושוק לידים.</span>
              </div>
            )}
          </div>
        )}

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">משפך מכירות</h3>
          </div>
          <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
            {FUNNEL_STAGES.map((stage, i) => {
              const count = funnelCounts[stage.key] || 0;
              const isActive = funnelFilter === stage.key;
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="flex items-center flex-1 min-w-0">
                  <button
                    onClick={() => setFunnelFilter(stage.key)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg transition-all duration-200 w-full group",
                      isActive
                        ? "bg-primary/10 border border-primary/30 shadow-sm"
                        : "hover:bg-secondary/50 border border-transparent"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-full transition-colors",
                      isActive ? "bg-primary/20" : "bg-secondary group-hover:bg-primary/10"
                    )}>
                      <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                    </div>
                    <span className={cn(
                      "text-lg font-bold",
                      isActive ? "text-primary" : "text-foreground"
                    )}>{count}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{stage.label}</span>
                  </button>
                  {i < FUNNEL_STAGES.length - 1 && (
                    <ChevronLeft className="w-4 h-4 text-muted-foreground/30 shrink-0 mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Profit Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceStats leads={leads} />
          <PipelineTicker leads={leads} />
        </div>

        {/* Critical Alerts + Lead Source */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Critical Alerts - 3 categories */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold text-foreground">דחוף לטיפול</h3>
              {criticalAlerts.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">
                  {criticalAlerts.length}
                </span>
              )}
            </div>

            {/* Alert category tabs */}
            <div className="flex gap-2 mb-4">
              <AlertTabButton
                active={alertTab === "expiring"}
                onClick={() => setAlertTab("expiring")}
                icon={Clock}
                label="פגי תוקף"
                count={alertCounts.expiring}
                variant="destructive"
              />
              <AlertTabButton
                active={alertTab === "missing_docs"}
                onClick={() => setAlertTab("missing_docs")}
                icon={FileX}
                label="חוסרים קריטיים"
                count={alertCounts.missing_docs}
                variant="warning"
              />
              <AlertTabButton
                active={alertTab === "anomalies"}
                onClick={() => setAlertTab("anomalies")}
                icon={Banknote}
                label="חריגים בעו״ש"
                count={alertCounts.anomalies}
                variant="primary"
              />
            </div>

            {/* Alert list */}
            {filteredAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                אין התראות בקטגוריה זו 🎉
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredAlerts.map((alert, i) => (
                  <div
                    key={`${alert.lead.id}-${alert.category}-${i}`}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer group",
                      "hover:bg-secondary/50 hover:shadow-sm hover:-translate-y-0.5",
                      alert.category === "expiring" ? "border-destructive/20" :
                      alert.category === "anomalies" ? "border-primary/20" : "border-warning/20"
                    )}
                    onClick={() => setSelectedLead(alert.lead)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        alert.category === "expiring" ? "bg-destructive/10" :
                        alert.category === "anomalies" ? "bg-primary/10" : "bg-warning/10"
                      )}>
                        {alert.category === "expiring" ? (
                          <Clock className="w-4 h-4 text-destructive" />
                        ) : alert.category === "anomalies" ? (
                          <Banknote className="w-4 h-4 text-primary" />
                        ) : (
                          <FileWarning className="w-4 h-4 text-warning" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{alert.lead.full_name}</p>
                        <p className={cn(
                          "text-xs",
                          alert.category === "expiring" ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {alert.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {alert.lead.phone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="שלח WhatsApp"
                          onClick={(e) => {
                            e.stopPropagation();
                            openWhatsApp(alert.lead.phone!, alert.lead.full_name, alert.missingDoc);
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

        {/* Predictive CRM Pipeline */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">ניהול לקוחות חכם</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                AI-Powered
              </span>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) { setEditingLead(null); resetForm(); }
            }}>
              <DialogTrigger asChild>
                <Button className="hover-scale animate-cta-pulse gold-glow-btn bg-gold text-gold-foreground hover:bg-gold/90">
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף לקוח חדש
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
          ) : (
            <PriorityBoard
              leads={leads}
              documents={documents}
              onSelectLead={(lead) => setSelectedLead(lead as any as Lead)}
              selectedLeadId={selectedLead?.id || null}
              onWhatsApp={openWhatsApp}
            />
          )}
        </div>

        {/* Insider Feed */}
        <InsiderFeed leads={leads} />

        {/* Selected Lead Detail */}
        {selectedLead && (
          <div className="glass-card p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">{selectedLead.full_name} — ניתוח מעמיק</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLead(null)}>סגור</Button>
            </div>
            {/* Profit Intelligence sidebar */}
            <div className="space-y-3 mb-4">
              <CloseDealTrigger lead={selectedLead} />
              <FeeEstimator lead={selectedLead} />
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gold/20 text-gold hover:bg-gold/10"
                onClick={() => setPresentationLead(selectedLead)}
              >
                <Crown className="w-3.5 h-3.5 ml-1.5" />
                מצב מצגת ללקוח
              </Button>
            </div>

            <Tabs defaultValue="advocate" dir="rtl">
              <TabsList>
                <TabsTrigger value="advocate">AI חיתום</TabsTrigger>
                <TabsTrigger value="collab">מודיעין קולקטיבי</TabsTrigger>
                <TabsTrigger value="risk">ניתוח סיכונים</TabsTrigger>
                <TabsTrigger value="timeline">ציר זמן</TabsTrigger>
                <TabsTrigger value="details">פרטים</TabsTrigger>
              </TabsList>
              <TabsContent value="advocate" className="mt-4">
                <AIUnderwriterAdvocate lead={selectedLead} />
              </TabsContent>
              <TabsContent value="collab" className="mt-4 space-y-4">
                <CollaborativeUnderwriting lead={selectedLead} />
                <AdvisorBenchmark lead={selectedLead} />
              </TabsContent>
              <TabsContent value="risk" className="mt-4">
                <RiskAnalysisView lead={selectedLead} />
              </TabsContent>
              <TabsContent value="timeline" className="mt-4">
                <div className="glass-card p-5">
                  <CaseTimeline leadId={selectedLead.id} />
                </div>
              </TabsContent>
              <TabsContent value="details" className="mt-4">
                <div className="glass-card p-5 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">שווי נכס</p>
                      <p className="font-bold text-foreground">
                        {selectedLead.property_value ? `₪${Number(selectedLead.property_value).toLocaleString()}` : "לא צוין"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">סכום משכנתא</p>
                      <p className="font-bold text-foreground">
                        {selectedLead.mortgage_amount ? `₪${Number(selectedLead.mortgage_amount).toLocaleString()}` : "לא צוין"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">הכנסה חודשית</p>
                      <p className="font-bold text-foreground">
                        {selectedLead.monthly_income ? `₪${Number(selectedLead.monthly_income).toLocaleString()}` : "לא צוין"}
                      </p>
                    </div>
                  </div>
                  {selectedLead.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">הערות</p>
                      <p className="text-sm text-foreground">{selectedLead.notes}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        <div className="glass-card p-5">
          <WorkspaceSettings />
        </div>

        {/* Mobile last sync */}
        <div className="flex md:hidden items-center justify-center gap-2 text-xs text-muted-foreground pb-4">
          <Button variant="ghost" size="sm" className="h-7 gap-1.5" onClick={refreshData}>
            <RefreshCw className="w-3 h-3" />
            רענן
          </Button>
          {lastSyncTime && (
            <span>סנכרון אחרון: {format(lastSyncTime, "HH:mm", { locale: he })}</span>
          )}
        </div>
      </main>
    </div>
  );
};

/* ---------- Sub-components ---------- */

function AlertTabButton({ active, onClick, icon: Icon, label, count, variant }: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  count: number;
  variant: "destructive" | "warning" | "primary";
}) {
  const colors = {
    destructive: { activeBg: "bg-destructive/10 border-destructive/30", text: "text-destructive", badge: "bg-destructive/20 text-destructive" },
    warning: { activeBg: "bg-warning/10 border-warning/30", text: "text-warning", badge: "bg-warning/20 text-warning" },
    primary: { activeBg: "bg-primary/10 border-primary/30", text: "text-primary", badge: "bg-primary/20 text-primary" },
  };
  const c = colors[variant];
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
        active ? c.activeBg : "border-transparent hover:bg-secondary/50"
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", active ? c.text : "text-muted-foreground")} />
      <span className={active ? c.text : "text-muted-foreground"}>{label}</span>
      {count > 0 && (
        <span className={cn("text-[10px] px-1.5 py-0 rounded-full font-bold", c.badge)}>
          {count}
        </span>
      )}
    </button>
  );
}

function StatCard({ icon: Icon, title, value, variant }: {
  icon: any;
  title: string;
  value: number;
  variant?: "primary" | "warning" | "success";
}) {
  const colors = {
    primary: "text-cyan-glow",
    warning: "text-gold",
    success: "text-success",
  };
  const glows = {
    primary: "glow-cyan",
    warning: "glow-gold",
    success: "",
  };
  return (
    <div className={cn("glass-card p-5 hover-scale cursor-default transition-all duration-200 hover:shadow-md", variant && glows[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold gradient-header">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/80">
          <Icon className={cn("w-5 h-5", variant ? colors[variant] : "text-gold")} />
        </div>
      </div>
    </div>
  );
}

export default ConsultantDashboard;
