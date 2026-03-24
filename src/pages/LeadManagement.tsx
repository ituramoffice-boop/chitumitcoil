import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Search, Plus, Upload, LayoutGrid, TableProperties, ArrowUpDown,
  MoreHorizontal, Trash2, Edit, Phone, Mail, MessageCircle,
  Filter, Loader2, Sparkles, Clock, Target, ChevronDown,
  ChevronUp, Star, Zap, TrendingUp, AlertTriangle, CheckCircle2,
  XCircle, ArrowRight, Calendar, Globe, Facebook, Share2,
  FileUp, Users, BarChart3, Bell, Settings, GripVertical,
  Pen, Download, FileText,
} from "lucide-react";
import { SignatureModal } from "@/components/SignatureModal";
import { PowerDialer } from "@/components/PowerDialer";
import { CallHistory } from "@/components/CallHistory";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { PLAN_LIMITS } from "@/hooks/useConsultantBranding";
import { Link } from "react-router-dom";
import { Crown, Lock } from "lucide-react";

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
  updated_at: string;
  consultant_id: string;
  lead_source: string | null;
  last_contact: string | null;
  next_step: string | null;
  assigned_to: string | null;
  lead_score: number | null;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; icon: any }> = {
  new: { label: "חדש", color: "text-primary", bg: "bg-primary/10", icon: Star },
  contacted: { label: "נוצר קשר", color: "text-warning", bg: "bg-warning/10", icon: Phone },
  in_progress: { label: "בטיפול", color: "text-blue-500", bg: "bg-blue-500/10", icon: Loader2 },
  submitted: { label: "הוגש לבנק", color: "text-indigo-500", bg: "bg-indigo-500/10", icon: ArrowRight },
  approved: { label: "אושר", color: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
  rejected: { label: "נדחה", color: "text-destructive", bg: "bg-destructive/10", icon: XCircle },
  closed: { label: "סגור", color: "text-muted-foreground", bg: "bg-muted", icon: CheckCircle2 },
};

const KANBAN_COLUMNS: LeadStatus[] = ["new", "contacted", "in_progress", "submitted", "approved", "rejected", "closed"];

const SOURCE_CONFIG: Record<string, { label: string; icon: any }> = {
  facebook: { label: "פייסבוק", icon: Facebook },
  referral: { label: "הפנייה", icon: Share2 },
  organic: { label: "אורגני", icon: Globe },
};

type SortField = "full_name" | "created_at" | "mortgage_amount" | "monthly_income" | "status" | "lead_score";
type SortDir = "asc" | "desc";
type ViewMode = "table" | "kanban";

// Lead scoring algorithm
function calculateLeadScore(lead: Lead): number {
  let score = 0;
  if (lead.mortgage_amount && lead.mortgage_amount > 1000000) score += 25;
  else if (lead.mortgage_amount && lead.mortgage_amount > 500000) score += 15;
  else if (lead.mortgage_amount) score += 5;
  if (lead.monthly_income && lead.monthly_income > 25000) score += 25;
  else if (lead.monthly_income && lead.monthly_income > 15000) score += 15;
  else if (lead.monthly_income) score += 5;
  if (lead.email) score += 10;
  if (lead.phone) score += 10;
  if (lead.property_value) score += 10;
  if (lead.notes && lead.notes.length > 20) score += 5;
  // Recency
  const daysSinceCreated = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated < 2) score += 10;
  else if (daysSinceCreated < 7) score += 5;
  return Math.min(score, 100);
}

function getScoreColor(score: number) {
  if (score >= 85) return "text-red-500";
  if (score >= 50) return "text-orange-500";
  return "text-blue-400";
}

function getScoreBg(score: number) {
  if (score >= 85) return "bg-red-500/10";
  if (score >= 50) return "bg-orange-500/10";
  return "bg-blue-500/8";
}

function getTemperatureLabel(score: number) {
  if (score >= 85) return { emoji: "🔥", label: "Hot", color: "text-red-500" };
  if (score >= 50) return { emoji: "⚡", label: "Warm", color: "text-orange-500" };
  return { emoji: "❄️", label: "Cold", color: "text-blue-400" };
}


function getHeatLabel(score: number) {
  if (score >= 85) return { label: "🔥 בשל לקטיף!", color: "text-red-600 dark:text-red-400" };
  if (score >= 70) return { label: "🔥 ליד חם", color: "text-orange-600 dark:text-orange-400" };
  if (score >= 50) return { label: "🌡️ מתחמם", color: "text-yellow-600 dark:text-yellow-400" };
  if (score >= 30) return { label: "❄️ פושר", color: "text-blue-500" };
  return { label: "🧊 קר כקרח", color: "text-blue-300" };
}

function HeatBars({ score }: { score: number }) {
  return (
    <div className="flex gap-[2px] items-end">
      {Array.from({ length: 10 }).map((_, i) => {
        const threshold = (i + 1) * 10;
        const active = score >= threshold;
        return (
          <div
            key={i}
            className={cn(
              "w-[5px] rounded-sm transition-all duration-500",
              active
                ? i < 3 ? "bg-blue-400 h-1.5" : i < 5 ? "bg-yellow-400 h-2" : i < 7 ? "bg-orange-400 h-2.5" : "bg-red-500 h-3"
                : "bg-muted h-1"
            )}
          />
        );
      })}
    </div>
  );
}

function HeatIndicator({ score }: { score: number }) {
  const temp = getTemperatureLabel(score);
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all",
        score >= 85 ? "border-red-500/60 bg-red-500/10 animate-heat-pulse" :
        score >= 50 ? "border-orange-500/50 bg-orange-500/8" :
        "border-blue-400/40 bg-blue-500/5 backdrop-blur-sm",
        getScoreColor(score)
      )}>
        {score}
      </div>
      <div className="flex flex-col">
        <span className="text-xs leading-none">{temp.emoji}</span>
        <span className={cn("text-[8px] font-bold uppercase tracking-wider", temp.color)}>{temp.label}</span>
      </div>
    </div>
  );
}

function LeadHeatPopup({ lead, children }: { lead: { full_name: string; lead_score: number; mortgage_amount: number | null; monthly_income: number | null; status: string; last_contact: string | null; next_step: string | null }; children: React.ReactNode }) {
  const heat = getHeatLabel(lead.lead_score);
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-64 p-0 overflow-hidden" side="top" dir="rtl">
        {/* Header with gradient */}
        <div className={cn(
          "p-3 text-white",
          lead.lead_score >= 70 ? "bg-gradient-to-l from-red-500 to-orange-500" :
          lead.lead_score >= 40 ? "bg-gradient-to-l from-yellow-500 to-amber-500" :
          "bg-gradient-to-l from-blue-500 to-cyan-500"
        )}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">{lead.full_name}</span>
            <span className="text-2xl font-black">{lead.lead_score}</span>
          </div>
          <p className="text-xs opacity-90 mt-0.5">{heat.label}</p>
        </div>

        {/* Heat bars */}
        <div className="px-3 py-2 border-b border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">מד חום</span>
            <HeatBars score={lead.lead_score} />
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
            <div
              className={cn(
                "h-1.5 rounded-full transition-all",
                lead.lead_score >= 70 ? "bg-gradient-to-l from-red-500 to-orange-400" :
                lead.lead_score >= 40 ? "bg-gradient-to-l from-yellow-500 to-amber-400" :
                "bg-gradient-to-l from-blue-500 to-cyan-400"
              )}
              style={{ width: `${lead.lead_score}%` }}
            />
          </div>
        </div>

        {/* Details */}
        <div className="p-3 space-y-1.5 text-xs">
          {lead.mortgage_amount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">סכום משכנתא</span>
              <span className="font-semibold">₪{lead.mortgage_amount.toLocaleString()}</span>
            </div>
          )}
          {lead.monthly_income && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">הכנסה חודשית</span>
              <span className="font-semibold">₪{lead.monthly_income.toLocaleString()}</span>
            </div>
          )}
          {lead.next_step && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">צעד הבא</span>
              <span className="font-medium text-primary truncate max-w-[120px]">{lead.next_step}</span>
            </div>
          )}
          {lead.last_contact && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">קשר אחרון</span>
              <span>{formatDistanceToNow(new Date(lead.last_contact), { locale: he, addSuffix: true })}</span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Follow-up logic
function needsFollowUp(lead: Lead): { needed: boolean; reason: string; urgency: "high" | "medium" | "low" } {
  const now = Date.now();
  const lastContact = lead.last_contact ? new Date(lead.last_contact).getTime() : new Date(lead.created_at).getTime();
  const daysSince = (now - lastContact) / (1000 * 60 * 60 * 24);

  if (lead.status === "new" && daysSince > 1) return { needed: true, reason: "ליד חדש לא טופל מעל 24 שעות", urgency: "high" };
  if (lead.status === "contacted" && daysSince > 3) return { needed: true, reason: "לא היה קשר מעל 3 ימים", urgency: "high" };
  if (lead.status === "in_progress" && daysSince > 5) return { needed: true, reason: "לא עודכן מעל 5 ימים", urgency: "medium" };
  if (lead.status === "submitted" && daysSince > 7) return { needed: true, reason: "הוגש לפני מעל שבוע", urgency: "low" };
  return { needed: false, reason: "", urgency: "low" };
}

const NEXT_STEP_OPTIONS = [
  "העלאת תלושי שכר", "העלאת דפי בנק", "השלמת מסמכים",
  "המתנה לאישור עקרוני", "חתימה על מסמכים", "פגישת ייעוץ", "מעקב טלפוני",
];

const LeadManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user plan for paywall
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-plan", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("plan, lead_count")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as { plan: string; lead_count: number } | null;
    },
    enabled: !!user,
  });

  const userPlan = userProfile?.plan || "free";
  const leadLimit = PLAN_LIMITS[userPlan] || 10;
  const isAtLimit = userPlan === "free" && (userProfile?.lead_count || 0) >= leadLimit;

  // Helper: should this lead index be blurred?
  const isLeadBlurred = (index: number) => {
    if (userPlan !== "free") return false;
    return index >= leadLimit;
  };
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "all">("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [signLead, setSignLead] = useState<Lead | null>(null);
  const [dialerQueue, setDialerQueue] = useState<Lead[]>([]);
  const [callHistoryLead, setCallHistoryLead] = useState<Lead | null>(null);

  const [formData, setFormData] = useState({
    full_name: "", phone: "", email: "", notes: "",
    mortgage_amount: "", property_value: "", monthly_income: "",
    lead_source: "organic", next_step: "",
  });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["lead-management"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel('lead-mgmt-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        queryClient.invalidateQueries({ queryKey: ["lead-management"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Scoring — prefer AI-generated DB score, fallback to calculated
  const leadsWithScore = useMemo(() =>
    leads.map(l => ({ ...l, lead_score: (l.lead_score && l.lead_score > 0) ? l.lead_score : calculateLeadScore(l) })),
    [leads]
  );

  // Follow-ups
  const followUps = useMemo(() =>
    leadsWithScore.filter(l => needsFollowUp(l).needed).map(l => ({ ...l, followUp: needsFollowUp(l) })),
    [leadsWithScore]
  );

  // Filter & sort
  const filteredLeads = useMemo(() => {
    let result = leadsWithScore;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(l =>
        l.full_name.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.phone?.includes(s) ||
        l.notes?.toLowerCase().includes(s)
      );
    }
    if (filterStatus !== "all") result = result.filter(l => l.status === filterStatus);
    if (filterSource !== "all") result = result.filter(l => l.lead_source === filterSource);
    if (filterDateRange !== "all") {
      const now = Date.now();
      const ranges = { today: 1, week: 7, month: 30 };
      const days = ranges[filterDateRange];
      result = result.filter(l => (now - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24) <= days);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "lead_score") cmp = (a.lead_score || 0) - (b.lead_score || 0);
      else if (sortField === "mortgage_amount") cmp = (a.mortgage_amount || 0) - (b.mortgage_amount || 0);
      else if (sortField === "monthly_income") cmp = (a.monthly_income || 0) - (b.monthly_income || 0);
      else if (sortField === "full_name") cmp = a.full_name.localeCompare(b.full_name, "he");
      else if (sortField === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === "status") cmp = KANBAN_COLUMNS.indexOf(a.status) - KANBAN_COLUMNS.indexOf(b.status);
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [leadsWithScore, searchTerm, filterStatus, filterSource, sortField, sortDir]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload: any = {
        full_name: data.full_name,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
        mortgage_amount: data.mortgage_amount ? Number(data.mortgage_amount) : null,
        property_value: data.property_value ? Number(data.property_value) : null,
        monthly_income: data.monthly_income ? Number(data.monthly_income) : null,
        lead_source: data.lead_source || "organic",
        next_step: data.next_step || null,
      };
      if (data.id) {
        const { error } = await supabase.from("leads").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        payload.consultant_id = user!.id;
        const { error } = await supabase.from("leads").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-management"] });
      setDialogOpen(false);
      setEditingLead(null);
      resetForm();
      toast({ title: editingLead ? "ליד עודכן" : "ליד נוצר בהצלחה" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const { error } = await supabase.from("leads").delete().eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-management"] });
      setSelectedLeads(new Set());
      toast({ title: "לידים נמחקו" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: LeadStatus }) => {
      for (const id of ids) {
        const { error } = await supabase.from("leads").update({ status, last_contact: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
      }
    },
    onMutate: async ({ ids, status }) => {
      await queryClient.cancelQueries({ queryKey: ["lead-management"] });
      const previous = queryClient.getQueryData<Lead[]>(["lead-management"]);
      queryClient.setQueryData<Lead[]>(["lead-management"], old =>
        old?.map(l => ids.includes(l.id) ? { ...l, status, last_contact: new Date().toISOString() } : l)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["lead-management"], context.previous);
      toast({ title: "שגיאה בעדכון סטטוס", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-management"] });
      setSelectedLeads(new Set());
      toast({ title: "סטטוס עודכן" });
    },
  });

  const resetForm = () => setFormData({
    full_name: "", phone: "", email: "", notes: "",
    mortgage_amount: "", property_value: "", monthly_income: "",
    lead_source: "organic", next_step: "",
  });

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
      lead_source: lead.lead_source || "organic",
      next_step: lead.next_step || "",
    });
    setDialogOpen(true);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) setSelectedLeads(new Set());
    else setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedLeads);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedLeads(next);
  };

  const openWhatsApp = (lead: Lead, template?: string) => {
    if (!lead.phone) return;
    const cleanPhone = lead.phone.replace(/\D/g, "");
    const intlPhone = cleanPhone.startsWith("0") ? "972" + cleanPhone.slice(1) : cleanPhone;
    const message = template || `היי ${lead.full_name}, יש לנו עדכון לגבי תיק המשכנתא שלך ב-SmartMortgage. נשמח לעדכן אותך!`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Drag & Drop for Kanban
  const handleDragStart = (lead: Lead) => setDraggedLead(lead);
  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => { e.preventDefault(); setDragOverColumn(status); };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = (status: LeadStatus) => {
    if (draggedLead && draggedLead.status !== status) {
      updateStatusMutation.mutate({ ids: [draggedLead.id], status });
    }
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  // CSV Import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split("\n").filter(l => l.trim());
        if (lines.length < 2) { toast({ title: "קובץ ריק", variant: "destructive" }); return; }
        const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
        const nameCol = headers.findIndex(h => /שם|name/i.test(h));
        const phoneCol = headers.findIndex(h => /טלפון|phone/i.test(h));
        const emailCol = headers.findIndex(h => /מייל|email/i.test(h));
        const amountCol = headers.findIndex(h => /סכום|amount|mortgage/i.test(h));
        const sourceCol = headers.findIndex(h => /מקור|source/i.test(h));
        if (nameCol === -1) { toast({ title: "לא נמצאה עמודת שם", variant: "destructive" }); return; }

        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map(c => c.trim().replace(/"/g, ""));
          const name = cols[nameCol];
          if (!name) continue;
          const { error } = await supabase.from("leads").insert({
            consultant_id: user!.id,
            full_name: name,
            phone: phoneCol >= 0 ? cols[phoneCol] || null : null,
            email: emailCol >= 0 ? cols[emailCol] || null : null,
            mortgage_amount: amountCol >= 0 && cols[amountCol] ? Number(cols[amountCol]) : null,
            lead_source: sourceCol >= 0 ? cols[sourceCol] || "organic" : "organic",
          });
          if (!error) imported++;
        }
        queryClient.invalidateQueries({ queryKey: ["lead-management"] });
        toast({ title: `יובאו ${imported} לידים בהצלחה` });
        setImportDialogOpen(false);
      } catch (err: any) {
        toast({ title: "שגיאה בייבוא", description: err.message, variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    inProgress: leads.filter(l => ["contacted", "in_progress", "submitted"].includes(l.status)).length,
    approved: leads.filter(l => l.status === "approved").length,
    totalMortgage: leads.reduce((s, l) => s + (l.mortgage_amount || 0), 0),
    avgScore: leadsWithScore.length ? Math.round(leadsWithScore.reduce((s, l) => s + l.lead_score, 0) / leadsWithScore.length) : 0,
    followUpCount: followUps.length,
  }), [leads, leadsWithScore, followUps]);

  const SortIcon = ({ field }: { field: SortField }) => (
    sortField === field ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "סה\"כ לידים", value: stats.total, icon: Users, color: "text-primary", filter: "all" as const },
          { label: "לידים חדשים", value: stats.new, icon: Star, color: "text-warning", filter: "new" as const },
          { label: "בתהליך", value: stats.inProgress, icon: Loader2, color: "text-blue-500", filter: "in_progress" as const },
          { label: "אושרו", value: stats.approved, icon: CheckCircle2, color: "text-success", filter: "approved" as const },
          { label: "סה\"כ משכנתאות", value: `₪${(stats.totalMortgage / 1000000).toFixed(1)}M`, icon: TrendingUp, color: "text-primary", filter: "all" as const },
          { label: "ציון ממוצע", value: stats.avgScore, icon: Target, color: getScoreColor(stats.avgScore), filter: "all" as const, sort: "lead_score" as SortField },
          { label: "דרושי מעקב", value: stats.followUpCount, icon: Bell, color: stats.followUpCount > 0 ? "text-destructive" : "text-success", filter: "all" as const, onlyFollowUp: true },
        ].map((s, i) => (
          <Card
            key={i}
            className={cn(
              "border-border/50 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
              filterStatus === s.filter && s.filter !== "all" && "ring-2 ring-primary border-primary"
            )}
            onClick={() => {
              if (s.onlyFollowUp) {
                // Show only leads needing follow-up by sorting by score and filtering to statuses that need follow-up
                setFilterStatus("all");
                setSortField("created_at");
                setSortDir("asc");
              } else if (s.sort) {
                setSortField(s.sort);
                setSortDir("desc");
                setFilterStatus("all");
              } else if (s.filter === "all") {
                setFilterStatus("all");
              } else {
                setFilterStatus(prev => prev === s.filter ? "all" : s.filter);
              }
            }}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", s.color.replace("text-", "bg-") + "/10")}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Follow-up Alerts */}
      {followUps.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              תזכורות מעקב אוטומטיות ({followUps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {followUps.slice(0, 5).map(l => (
                <Badge key={l.id} variant="outline" className={cn(
                  "cursor-pointer hover:bg-background transition-colors",
                  l.followUp.urgency === "high" ? "border-destructive text-destructive" :
                  l.followUp.urgency === "medium" ? "border-warning text-warning" : "border-muted-foreground"
                )} onClick={() => openEdit(l)}>
                  <Clock className="h-3 w-3 ml-1" />
                  {l.full_name}: {l.followUp.reason}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם, טלפון, מייל..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="סטטוס" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {KANBAN_COLUMNS.map(s => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="מקור" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המקורות</SelectItem>
              {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDateRange} onValueChange={v => setFilterDateRange(v as any)}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="תקופה" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל התקופות</SelectItem>
              <SelectItem value="today">היום</SelectItem>
              <SelectItem value="week">שבוע אחרון</SelectItem>
              <SelectItem value="month">חודש אחרון</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {/* Temperature Sort */}
          <Button
            variant={sortField === "lead_score" ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-1.5",
              sortField === "lead_score" && "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0"
            )}
            onClick={() => {
              if (sortField === "lead_score") {
                setSortDir(d => d === "desc" ? "asc" : "desc");
              } else {
                setSortField("lead_score");
                setSortDir("desc");
              }
            }}
          >
            🌡️ מיון לפי טמפרטורה
            {sortField === "lead_score" && (sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
          </Button>
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-muted/80 backdrop-blur rounded-full p-1 border border-border/50">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                viewMode === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TableProperties className="h-3.5 w-3.5" />
              טבלה
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                viewMode === "kanban"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              קנבן
            </button>
          </div>

          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileUp className="h-4 w-4 ml-1" />
                ייבוא
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>ייבוא לידים מקובץ CSV</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  העלה קובץ CSV עם עמודות: שם (חובה), טלפון, מייל, סכום, מקור.
                  העמודות ימופו אוטומטית לפי הכותרות.
                </p>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">גרור קובץ לכאן או לחץ לבחירה</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    בחר קובץ CSV
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) { setEditingLead(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 ml-1" />
                ליד חדש
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingLead ? "עריכת ליד" : "ליד חדש"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>שם מלא *</Label>
                    <Input value={formData.full_name} onChange={e => setFormData(d => ({ ...d, full_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>טלפון</Label>
                    <Input value={formData.phone} onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>מייל</Label>
                    <Input type="email" value={formData.email} onChange={e => setFormData(d => ({ ...d, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label>מקור ליד</Label>
                    <Select value={formData.lead_source} onValueChange={v => setFormData(d => ({ ...d, lead_source: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>סכום משכנתא</Label>
                    <Input type="number" value={formData.mortgage_amount} onChange={e => setFormData(d => ({ ...d, mortgage_amount: e.target.value }))} />
                  </div>
                  <div>
                    <Label>שווי נכס</Label>
                    <Input type="number" value={formData.property_value} onChange={e => setFormData(d => ({ ...d, property_value: e.target.value }))} />
                  </div>
                  <div>
                    <Label>הכנסה חודשית</Label>
                    <Input type="number" value={formData.monthly_income} onChange={e => setFormData(d => ({ ...d, monthly_income: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>צעד הבא</Label>
                  <Select value={formData.next_step} onValueChange={v => setFormData(d => ({ ...d, next_step: v }))}>
                    <SelectTrigger><SelectValue placeholder="בחר צעד" /></SelectTrigger>
                    <SelectContent>
                      {NEXT_STEP_OPTIONS.map(o => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>הערות</Label>
                  <Textarea value={formData.notes} onChange={e => setFormData(d => ({ ...d, notes: e.target.value }))} rows={3} />
                </div>
                <Button
                  onClick={() => saveMutation.mutate(editingLead ? { ...formData, id: editingLead.id } : formData)}
                  disabled={!formData.full_name || saveMutation.isPending}
                >
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : null}
                  {editingLead ? "עדכן" : "צור ליד"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedLeads.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">{selectedLeads.size} לידים נבחרו</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                שנה סטטוס <ChevronDown className="h-3 w-3 mr-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {KANBAN_COLUMNS.map(s => (
                <DropdownMenuItem key={s} onClick={() => updateStatusMutation.mutate({ ids: [...selectedLeads], status: s })}>
                  {STATUS_CONFIG[s].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate([...selectedLeads])}>
            <Trash2 className="h-3 w-3 ml-1" />
            מחק
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 gap-1"
            onClick={() => {
              const selectedArray = leadsWithScore.filter(l => selectedLeads.has(l.id) && l.phone);
              if (selectedArray.length === 0) {
                toast({ title: "אין לידים עם טלפון בנבחרים", variant: "destructive" });
                return;
              }
              setDialerQueue(selectedArray);
              setSelectedLeads(new Set());
            }}
          >
            <Phone className="h-3 w-3" />
            Power Dialer ({[...selectedLeads].filter(id => leadsWithScore.find(l => l.id === id)?.phone).length})
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedLeads(new Set())}>ביטול</Button>
        </div>
      )}

      {/* Paywall Banner */}
      {isAtLimit && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-primary" />
            <div>
              <p className="font-bold text-sm">הגעת למגבלת הלידים בתוכנית החינמית ({leadLimit} לידים)</p>
              <p className="text-xs text-muted-foreground">שדרג ל-Pro כדי לפתוח גישה ל-100 לידים ותכונות מתקדמות</p>
            </div>
          </div>
          <Button asChild size="sm" className="gap-1">
            <Link to="/dashboard/consultant-settings">
              <Crown className="h-4 w-4" />
              שדרג ל-Pro
            </Link>
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="animate-fade-in">
        <Card className="glass-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("lead_score")}>
                      <div className="flex items-center gap-1">🌡️ טמפרטורה <SortIcon field="lead_score" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("full_name")}>
                      <div className="flex items-center gap-1">שם <SortIcon field="full_name" /></div>
                    </TableHead>
                    <TableHead>קשר</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                      <div className="flex items-center gap-1">סטטוס <SortIcon field="status" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("mortgage_amount")}>
                      <div className="flex items-center gap-1">משכנתא <SortIcon field="mortgage_amount" /></div>
                    </TableHead>
                    <TableHead>מקור</TableHead>
                    <TableHead>צעד הבא</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("created_at")}>
                      <div className="flex items-center gap-1">נוצר <SortIcon field="created_at" /></div>
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map(lead => {
                    const fu = needsFollowUp(lead);
                    const src = SOURCE_CONFIG[lead.lead_source || "organic"];
                    return (
                      <TableRow key={lead.id} className={cn(
                        "group transition-colors",
                        fu.needed && "bg-destructive/5",
                        selectedLeads.has(lead.id) && "bg-primary/5"
                      )}>
                        <TableCell>
                          <Checkbox checked={selectedLeads.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} />
                        </TableCell>
                        <TableCell>
                          <HeatIndicator score={lead.lead_score} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <LeadHeatPopup lead={lead}>
                                <p className="font-medium text-sm cursor-pointer hover:text-primary transition-colors">{lead.full_name}</p>
                              </LeadHeatPopup>
                              {fu.needed && (
                                <p className="text-[10px] text-destructive flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />{fu.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {lead.phone && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openWhatsApp(lead)}>
                                <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                              </Button>
                            )}
                            {lead.phone && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                <a href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5" /></a>
                              </Button>
                            )}
                            {lead.email && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5" /></a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", STATUS_CONFIG[lead.status].bg, STATUS_CONFIG[lead.status].color)} variant="outline">
                            {STATUS_CONFIG[lead.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {lead.mortgage_amount ? `₪${lead.mortgage_amount.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell>
                          {src && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <src.icon className="h-3 w-3" />
                              {src.label}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{lead.next_step || "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(lead.created_at), { locale: he, addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => openEdit(lead)}>
                                <Edit className="h-3.5 w-3.5 ml-2" />עריכה
                              </DropdownMenuItem>
                              {!(lead as any).signed_at ? (
                                <DropdownMenuItem onClick={() => setSignLead(lead)}>
                                  <Pen className="h-3.5 w-3.5 ml-2 text-primary" />חתימה דיגיטלית
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => window.open((lead as any).signature_url, "_blank")}>
                                  <Download className="h-3.5 w-3.5 ml-2 text-primary" />הורד הסכם חתום
                                </DropdownMenuItem>
                              )}
                              {lead.phone && (
                                <DropdownMenuItem onClick={() => openWhatsApp(lead, `היי ${lead.full_name}, ראיתי שהעלית חלק מהמסמכים ל-SmartMortgage. חסר לנו מסמכים כדי להתקדם. אפשר לשלוח כאן? 📄`)}>
                                  <MessageCircle className="h-3.5 w-3.5 ml-2 text-green-500" />WhatsApp תזכורת
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setCallHistoryLead(lead)}>
                                <Phone className="h-3.5 w-3.5 ml-2 text-primary" />היסטוריית שיחות
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate([lead.id])}>
                                <Trash2 className="h-3.5 w-3.5 ml-2" />מחיקה
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredLeads.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>אין לידים להצגה</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="flex gap-3 overflow-x-auto pb-4 animate-fade-in" style={{ minHeight: 400 }}>
          {KANBAN_COLUMNS.map(status => {
            const columnLeads = filteredLeads.filter(l => l.status === status);
            const cfg = STATUS_CONFIG[status];
            return (
              <div
                key={status}
                className={cn(
                  "flex-shrink-0 w-[240px] rounded-xl border bg-card/80 backdrop-blur-sm flex flex-col transition-all duration-200",
                  dragOverColumn === status && "border-primary bg-primary/5 scale-[1.02]"
                )}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(status)}
              >
                <div className={cn("p-2.5 rounded-t-xl flex items-center justify-between", cfg.bg)}>
                  <div className="flex items-center gap-2">
                    <cfg.icon className={cn("h-4 w-4", cfg.color)} />
                    <span className={cn("text-sm font-semibold", cfg.color)}>{cfg.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{columnLeads.length}</Badge>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[500px]">
                  {columnLeads.map(lead => {
                    const score = lead.lead_score;
                    const fu = needsFollowUp(lead);
                    const src = SOURCE_CONFIG[lead.lead_source || "organic"];
                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead)}
                        className={cn(
                          "p-2.5 rounded-lg border bg-background cursor-grab active:cursor-grabbing",
                          "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group",
                          score >= 85 ? "heat-hot" : score >= 50 ? "heat-warm" : score >= 0 ? "heat-cold" : "",
                          fu.needed && "border-destructive/30",
                          draggedLead?.id === lead.id && "opacity-40 scale-95 rotate-1"
                        )}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <LeadHeatPopup lead={lead}>
                            <p className="font-medium text-sm leading-tight cursor-pointer hover:text-primary transition-colors">{lead.full_name}</p>
                          </LeadHeatPopup>
                          <HeatIndicator score={score} />
                        </div>
                        {/* Phone */}
                        {lead.phone && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                            <Phone className="h-3 w-3" />{lead.phone}
                          </p>
                        )}
                        {/* Source */}
                        {src && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                            <src.icon className="h-3 w-3" />
                            {src.label}
                          </div>
                        )}
                        {/* Last Contacted */}
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                          <Clock className="h-3 w-3" />
                          {lead.last_contact
                            ? formatDistanceToNow(new Date(lead.last_contact), { locale: he, addSuffix: true })
                            : "לא נוצר קשר"}
                        </p>
                        {lead.mortgage_amount && (
                          <p className="text-xs font-medium text-foreground mb-1">₪{lead.mortgage_amount.toLocaleString()}</p>
                        )}
                        {lead.next_step && (
                          <p className="text-[10px] text-primary bg-primary/5 rounded px-1.5 py-0.5 inline-block mb-1">{lead.next_step}</p>
                        )}
                        {fu.needed && (
                          <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3" />{fu.reason}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {lead.phone && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openWhatsApp(lead); }}>
                              <MessageCircle className="h-3 w-3 text-green-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openEdit(lead); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          {!(lead as any).signed_at ? (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setSignLead(lead); }} title="חתימה">
                              <Pen className="h-3 w-3 text-primary" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); window.open((lead as any).signature_url, "_blank"); }} title="הורד הסכם">
                              <FileText className="h-3 w-3 text-primary" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {columnLeads.length === 0 && (
                    <p className="text-center text-[10px] text-muted-foreground py-4">גרור לידים לכאן</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Signature Modal */}
      {signLead && (
        <SignatureModal
          open={!!signLead}
          onOpenChange={(open) => { if (!open) setSignLead(null); }}
          lead={signLead}
        />
      )}

      {/* Power Dialer */}
      {dialerQueue.length > 0 && (
        <PowerDialer
          queue={dialerQueue}
          onClose={() => setDialerQueue([])}
          onCallComplete={async (leadId, notes, aiAnalysis) => {
            // Update lead with call notes and next step
            const updates: any = { last_contact: new Date().toISOString() };
            if (notes) updates.notes = notes;
            if (aiAnalysis?.nextStep) updates.next_step = aiAnalysis.nextStep;
            await supabase.from("leads").update(updates).eq("id", leadId);
            queryClient.invalidateQueries({ queryKey: ["lead-management"] });
          }}
        />
      )}

      {/* Call History Dialog */}
      <CallHistory
        showAsDialog
        open={!!callHistoryLead}
        onClose={() => setCallHistoryLead(null)}
        leadId={callHistoryLead?.id}
        leadName={callHistoryLead?.full_name}
      />
    </div>
  );
};

export default LeadManagement;
