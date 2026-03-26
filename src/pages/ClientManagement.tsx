import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, Plus, CheckCircle2, Circle, AlertTriangle, Clock,
  MessageSquare, Bell, Calendar, ChevronLeft, ChevronRight,
  FileText, ArrowRight, Zap, Phone, Mail, Search, Filter,
} from "lucide-react";
import { FinancialXRay } from "@/components/FinancialXRay";

// Stage definitions
const STAGES = [
  { key: "document_collection", label: "איסוף מסמכים", icon: FileText },
  { key: "initial_review", label: "בדיקה ראשונית", icon: Search },
  { key: "bank_submission", label: "הגשה לבנק", icon: ArrowRight },
  { key: "bank_review", label: "בדיקת בנק", icon: Clock },
  { key: "approval", label: "אישור עקרוני", icon: CheckCircle2 },
  { key: "signing", label: "חתימות", icon: FileText },
  { key: "closing", label: "סגירה", icon: Zap },
];

const DEFAULT_CHECKLIST = [
  { title: "3 תלושי שכר אחרונים", is_critical: true },
  { title: "תדפיס עו\"ש (3 חודשים)", is_critical: true },
  { title: "אישור זכויות / נסח טאבו", is_critical: true },
  { title: "תעודת זהות + ספח", is_critical: true },
  { title: "אישור יתרת משכנתא קיימת", is_critical: false },
  { title: "חוזה רכישה", is_critical: false },
  { title: "אישור רואה חשבון (עצמאי)", is_critical: false },
  { title: "דו\"ח BDI / נתוני אשראי", is_critical: false },
];

type ClientCase = {
  id: string;
  lead_id: string;
  consultant_id: string;
  status: string;
  current_stage: string;
  stages_completed: string[];
  target_close_date: string | null;
  notes_internal: string | null;
  created_at: string;
  updated_at: string;
  lead?: { full_name: string; phone: string | null; email: string | null; status: string };
};

type ChecklistItem = {
  id: string;
  case_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  is_critical: boolean;
  completed_at: string | null;
  due_date: string | null;
  sort_order: number;
};

type Reminder = {
  id: string;
  case_id: string;
  title: string;
  description: string | null;
  remind_at: string;
  is_done: boolean;
  reminder_type: string;
};

type TimelineEvent = {
  id: string;
  case_id: string;
  event_type: string;
  title: string;
  description: string | null;
  created_at: string;
};

export default function ClientManagement() {
  const { user } = useAuth();
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<ClientCase | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [newReminderOpen, setNewReminderOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: "", remind_at: "", description: "" });
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");

  useEffect(() => {
    if (user) {
      loadCases();
      loadLeads();
    }
  }, [user]);

  const loadCases = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("client_cases")
      .select("*")
      .order("updated_at", { ascending: false });
    
    if (data) {
      // Load lead info for each case
      const leadIds = data.map(c => c.lead_id);
      const { data: leadsData } = await supabase
        .from("leads")
        .select("id, full_name, phone, email, status")
        .in("id", leadIds);
      
      const casesWithLeads = data.map(c => ({
        ...c,
        lead: leadsData?.find(l => l.id === c.lead_id),
      }));
      setCases(casesWithLeads as ClientCase[]);
    }
    setLoading(false);
  };

  const loadLeads = async () => {
    const { data } = await supabase
      .from("leads")
      .select("id, full_name, phone, email, status")
      .in("status", ["approved", "in_progress", "submitted"]);
    if (data) setLeads(data);
  };

  const loadCaseDetails = async (caseItem: ClientCase) => {
    setSelectedCase(caseItem);
    const [checklistRes, remindersRes, timelineRes] = await Promise.all([
      supabase.from("case_checklist").select("*").eq("case_id", caseItem.id).order("sort_order"),
      supabase.from("case_reminders").select("*").eq("case_id", caseItem.id).order("remind_at"),
      supabase.from("case_timeline").select("*").eq("case_id", caseItem.id).order("created_at", { ascending: false }),
    ]);
    if (checklistRes.data) setChecklist(checklistRes.data as ChecklistItem[]);
    if (remindersRes.data) setReminders(remindersRes.data as Reminder[]);
    if (timelineRes.data) setTimeline(timelineRes.data as TimelineEvent[]);
  };

  const createCase = async () => {
    if (!selectedLeadId || !user) return;
    const { data, error } = await supabase
      .from("client_cases")
      .insert({ lead_id: selectedLeadId, consultant_id: user.id })
      .select()
      .single();
    
    if (error) {
      toast({ title: "שגיאה ביצירת תיק", variant: "destructive" });
      return;
    }

    // Create default checklist
    const checklistItems = DEFAULT_CHECKLIST.map((item, i) => ({
      case_id: data.id,
      title: item.title,
      is_critical: item.is_critical,
      sort_order: i,
    }));
    await supabase.from("case_checklist").insert(checklistItems);

    // Add timeline event
    await supabase.from("case_timeline").insert({
      case_id: data.id,
      event_type: "created",
      title: "תיק נפתח",
      description: "תיק לקוח חדש נפתח במערכת",
      created_by: user.id,
    });

    toast({ title: "תיק חדש נפתח בהצלחה! 🎉" });
    setNewCaseOpen(false);
    setSelectedLeadId("");
    loadCases();
  };

  const toggleChecklist = async (item: ChecklistItem) => {
    const newCompleted = !item.is_completed;
    await supabase.from("case_checklist").update({
      is_completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    }).eq("id", item.id);

    if (newCompleted && selectedCase) {
      await supabase.from("case_timeline").insert({
        case_id: selectedCase.id,
        event_type: "checklist",
        title: `מסמך הושלם: ${item.title}`,
        created_by: user?.id,
      });
    }

    if (selectedCase) loadCaseDetails(selectedCase);
  };

  const advanceStage = async () => {
    if (!selectedCase) return;
    const currentIdx = STAGES.findIndex(s => s.key === selectedCase.current_stage);
    if (currentIdx >= STAGES.length - 1) return;
    
    const nextStage = STAGES[currentIdx + 1].key;
    const newCompleted = [...(selectedCase.stages_completed || []), selectedCase.current_stage];
    
    await supabase.from("client_cases").update({
      current_stage: nextStage,
      stages_completed: newCompleted,
      updated_at: new Date().toISOString(),
    }).eq("id", selectedCase.id);

    await supabase.from("case_timeline").insert({
      case_id: selectedCase.id,
      event_type: "stage_change",
      title: `שלב התקדם: ${STAGES[currentIdx + 1].label}`,
      created_by: user?.id,
    });

    toast({ title: `עברנו לשלב: ${STAGES[currentIdx + 1].label} ✅` });
    const updated = { ...selectedCase, current_stage: nextStage, stages_completed: newCompleted };
    setSelectedCase(updated);
    loadCases();
    loadCaseDetails(updated);
  };

  const addReminder = async () => {
    if (!selectedCase || !newReminder.title || !newReminder.remind_at) return;
    await supabase.from("case_reminders").insert({
      case_id: selectedCase.id,
      title: newReminder.title,
      description: newReminder.description || null,
      remind_at: new Date(newReminder.remind_at).toISOString(),
    });

    await supabase.from("case_timeline").insert({
      case_id: selectedCase.id,
      event_type: "reminder",
      title: `תזכורת נוספה: ${newReminder.title}`,
      created_by: user?.id,
    });

    setNewReminder({ title: "", remind_at: "", description: "" });
    setNewReminderOpen(false);
    loadCaseDetails(selectedCase);
    toast({ title: "תזכורת נוספה! 🔔" });
  };

  const toggleReminder = async (r: Reminder) => {
    await supabase.from("case_reminders").update({ is_done: !r.is_done }).eq("id", r.id);
    if (selectedCase) loadCaseDetails(selectedCase);
  };

  // Computed
  const stageProgress = selectedCase
    ? ((STAGES.findIndex(s => s.key === selectedCase.current_stage) / (STAGES.length - 1)) * 100)
    : 0;
  const checklistProgress = checklist.length
    ? (checklist.filter(c => c.is_completed).length / checklist.length) * 100
    : 0;
  const overdueReminders = reminders.filter(r => !r.is_done && new Date(r.remind_at) < new Date());

  const filteredCases = cases.filter(c => {
    const matchesSearch = !searchTerm || c.lead?.full_name?.includes(searchTerm);
    const matchesStage = filterStage === "all" || c.current_stage === filterStage;
    return matchesSearch && matchesStage;
  });

  // ──────── Detail View ────────
  if (selectedCase) {
    return (
      <div className="space-y-6 animate-[fadeSlideUp_0.3s_ease-out]">
        {/* Back + header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedCase(null)} className="gap-2">
            <ChevronRight className="w-4 h-4" />
            חזרה לרשימה
          </Button>
          <div className="flex items-center gap-2">
            {selectedCase.lead?.phone && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`https://wa.me/972${selectedCase.lead?.phone?.replace(/\D/g, "").replace(/^0/, "")}`, "_blank")}>
                <Phone className="w-3.5 h-3.5" />
                וואטסאפ
              </Button>
            )}
            {selectedCase.lead?.email && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`mailto:${selectedCase.lead?.email}`)}>
                <Mail className="w-3.5 h-3.5" />
                מייל
              </Button>
            )}
          </div>
        </div>

        {/* Client name + stage */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black">{selectedCase.lead?.full_name}</h2>
              <p className="text-sm text-muted-foreground">
                נפתח ב-{new Date(selectedCase.created_at).toLocaleDateString("he-IL")}
              </p>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {STAGES.find(s => s.key === selectedCase.current_stage)?.label}
            </Badge>
          </div>

          {/* Stage progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>התקדמות תיק</span>
              <span>{Math.round(stageProgress)}%</span>
            </div>
            <Progress value={stageProgress} className="h-2" />
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {STAGES.map((stage, i) => {
                const isCompleted = selectedCase.stages_completed?.includes(stage.key);
                const isCurrent = selectedCase.current_stage === stage.key;
                return (
                  <div key={stage.key} className="flex items-center">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                      isCompleted ? "bg-primary/10 text-primary" :
                      isCurrent ? "bg-primary text-primary-foreground font-bold" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      <stage.icon className="w-3 h-3" />
                      {stage.label}
                    </div>
                    {i < STAGES.length - 1 && <ChevronLeft className="w-3 h-3 text-muted-foreground mx-0.5" />}
                  </div>
                );
              })}
            </div>
            <Button onClick={advanceStage} size="sm" className="gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              קדם לשלב הבא
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Checklist */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                צ'קליסט מסמכים
              </h3>
              <span className="text-xs text-muted-foreground">{Math.round(checklistProgress)}% הושלם</span>
            </div>
            <Progress value={checklistProgress} className="h-1.5 mb-4" />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {checklist.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleChecklist(item)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-right transition-colors ${
                    item.is_completed ? "bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  {item.is_completed ? (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={`text-sm flex-1 ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>
                    {item.title}
                  </span>
                  {item.is_critical && !item.is_completed && (
                    <Badge variant="destructive" className="text-[10px] px-1.5">קריטי</Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Reminders */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                תזכורות
                {overdueReminders.length > 0 && (
                  <Badge variant="destructive" className="text-[10px]">{overdueReminders.length} באיחור</Badge>
                )}
              </h3>
              <Dialog open={newReminderOpen} onOpenChange={setNewReminderOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus className="w-3 h-3" /> תזכורת
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>תזכורת חדשה</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="כותרת" value={newReminder.title} onChange={e => setNewReminder(r => ({ ...r, title: e.target.value }))} />
                    <Input type="datetime-local" value={newReminder.remind_at} onChange={e => setNewReminder(r => ({ ...r, remind_at: e.target.value }))} />
                    <Textarea placeholder="פירוט (אופציונלי)" value={newReminder.description} onChange={e => setNewReminder(r => ({ ...r, description: e.target.value }))} />
                    <Button onClick={addReminder} className="w-full">הוסף תזכורת</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {reminders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">אין תזכורות</p>
              )}
              {reminders.map(r => {
                const isOverdue = !r.is_done && new Date(r.remind_at) < new Date();
                return (
                  <button
                    key={r.id}
                    onClick={() => toggleReminder(r)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-right transition-colors ${
                      r.is_done ? "bg-muted/50" : isOverdue ? "bg-destructive/5 border border-destructive/20" : "hover:bg-muted"
                    }`}
                  >
                    {r.is_done ? (
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : isOverdue ? (
                      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                    <div className="flex-1 text-right">
                      <p className={`text-sm ${r.is_done ? "line-through text-muted-foreground" : ""}`}>{r.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(r.remind_at).toLocaleDateString("he-IL")} {new Date(r.remind_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Financial X-Ray */}
        <FinancialXRay leadId={selectedCase?.lead_id} clientName={selectedCase?.lead?.full_name} />

        {/* Timeline */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            ציר זמן
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {timeline.map((event, i) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="mt-1 flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    event.event_type === "stage_change" ? "bg-primary" :
                    event.event_type === "checklist" ? "bg-green-500" :
                    event.event_type === "reminder" ? "bg-amber-500" :
                    "bg-muted-foreground"
                  }`} />
                  {i < timeline.length - 1 && <div className="w-px h-full bg-border mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(event.created_at).toLocaleDateString("he-IL")} • {new Date(event.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {timeline.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">אין אירועים עדיין</p>
            )}
          </div>
        </div>

        {/* Internal Notes */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-primary" />
            הערות פנימיות
          </h3>
          <Textarea
            placeholder="הערות פנימיות לצוות (הלקוח לא רואה)..."
            defaultValue={selectedCase.notes_internal || ""}
            onBlur={async (e) => {
              await supabase.from("client_cases").update({
                notes_internal: e.target.value,
                updated_at: new Date().toISOString(),
              }).eq("id", selectedCase.id);
            }}
            className="min-h-[80px]"
          />
        </div>
      </div>
    );
  }

  // ──────── List View ────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            ניהול לקוחות
          </h1>
          <p className="text-sm text-muted-foreground">מעקב תיקים פעילים, מסמכים ותזכורות</p>
        </div>
        <Dialog open={newCaseOpen} onOpenChange={setNewCaseOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              פתח תיק חדש
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>פתיחת תיק לקוח חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר ליד..." />
                </SelectTrigger>
                <SelectContent>
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={createCase} disabled={!selectedLeadId} className="w-full">
                פתח תיק
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לקוח..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-44">
            <Filter className="w-3.5 h-3.5 ml-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל השלבים</SelectItem>
            {STAGES.map(s => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Urgent reminders banner */}
      {cases.some(c => {
        // We'll show a banner if there are cases we should check
        return true;
      }) && overdueReminders.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-destructive">{overdueReminders.length} תזכורות באיחור</p>
            <p className="text-xs text-muted-foreground">יש לטפל בתזכורות שעבר מועדן</p>
          </div>
        </div>
      )}

      {/* Cases grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">טוען...</div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold mb-1">אין תיקים פעילים</h3>
          <p className="text-sm text-muted-foreground mb-4">פתח תיק חדש מתוך ליד קיים</p>
          <Button onClick={() => setNewCaseOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            פתח תיק ראשון
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map(c => {
            const stageIdx = STAGES.findIndex(s => s.key === c.current_stage);
            const progress = ((stageIdx) / (STAGES.length - 1)) * 100;
            const StageIcon = STAGES[stageIdx]?.icon || Circle;
            return (
              <button
                key={c.id}
                onClick={() => loadCaseDetails(c)}
                className="bg-card border border-border rounded-2xl p-5 text-right hover:border-primary/30 hover:shadow-md transition-all card-hover"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">{c.lead?.full_name || "ללא שם"}</h3>
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <StageIcon className="w-3.5 h-3.5 text-primary" />
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] mb-3">
                  {STAGES[stageIdx]?.label}
                </Badge>
                <Progress value={progress} className="h-1 mb-2" />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{Math.round(progress)}% הושלם</span>
                  <span>{new Date(c.updated_at).toLocaleDateString("he-IL")}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
