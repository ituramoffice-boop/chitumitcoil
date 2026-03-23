import { useState, useMemo } from "react";
import { TeamChat } from "@/components/TeamChat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import {
  UsersRound,
  Plus,
  UserPlus,
  Loader2,
  Mail,
  Phone,
  Edit,
  Trash2,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Building2,
  User,
  BarChart3,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

type LeadStatus = "new" | "contacted" | "in_progress" | "submitted" | "approved" | "rejected" | "closed";

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  department: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

interface Lead {
  id: string;
  full_name: string;
  status: LeadStatus;
  assigned_to: string | null;
  consultant_id: string;
  created_at: string;
  mortgage_amount: number | null;
}

const DEPARTMENT_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  sales: { label: "מכירות", icon: Target, color: "text-primary" },
  underwriting: { label: "חיתום", icon: CheckCircle2, color: "text-success" },
  backoffice: { label: "בק-אופיס", icon: Briefcase, color: "text-warning" },
  management: { label: "ניהול", icon: Building2, color: "text-destructive" },
};

const ROLE_CONFIG: Record<string, string> = {
  owner: "בעלים",
  manager: "מנהל",
  member: "חבר צוות",
};

const STATUS_LABELS: Record<string, string> = {
  new: "חדש",
  contacted: "יצירת קשר",
  in_progress: "בניתוח",
  submitted: "הוגש",
  approved: "אושר",
  rejected: "נדחה",
  closed: "סגור",
};

const TeamManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [assignLeadOpen, setAssignLeadOpen] = useState(false);
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState<Lead | null>(null);
  const [teamName, setTeamName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [memberDept, setMemberDept] = useState("sales");

  // Fetch team
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Team[];
    },
  });

  const currentTeam = teams[0]; // For now use first team

  // Fetch team members with profiles
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["team-members", currentTeam?.id],
    queryFn: async () => {
      if (!currentTeam) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", currentTeam.id)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Fetch profiles for each member
      const userIds = (data as any[]).map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      return (data as any[]).map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) || { full_name: null, email: null, phone: null },
      })) as TeamMember[];
    },
    enabled: !!currentTeam,
  });

  // Fetch leads for assignment
  const { data: leads = [] } = useQuery({
    queryKey: ["leads-for-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, full_name, status, assigned_to, consultant_id, created_at, mortgage_amount")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  // Create team mutation
  const createTeam = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("teams").insert({
        name,
        owner_id: user!.id,
      } as any);
      if (error) throw error;
      // Add owner as member
      const { data: team } = await supabase
        .from("teams")
        .select("id")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (team) {
        await supabase.from("team_members").insert({
          team_id: team.id,
          user_id: user!.id,
          role: "owner",
          department: "management",
        } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("צוות נוצר בהצלחה");
      setTeamName("");
      setCreateTeamOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Add member mutation
  const addMember = useMutation({
    mutationFn: async ({ email, role, department }: { email: string; role: string; department: string }) => {
      if (!currentTeam) throw new Error("אין צוות פעיל");
      // Find user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .single();
      if (profileError || !profile) throw new Error("משתמש עם מייל זה לא נמצא במערכת");
      const { error } = await supabase.from("team_members").insert({
        team_id: currentTeam.id,
        user_id: profile.user_id,
        role,
        department,
      } as any);
      if (error) {
        if (error.code === "23505") throw new Error("משתמש זה כבר חבר בצוות");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("חבר צוות נוסף בהצלחה");
      setMemberEmail("");
      setMemberRole("member");
      setMemberDept("sales");
      setAddMemberOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Update member mutation
  const updateMember = useMutation({
    mutationFn: async ({ id, role, department }: { id: string; role: string; department: string }) => {
      const { error } = await supabase
        .from("team_members")
        .update({ role, department } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("חבר צוות עודכן");
      setEditMemberOpen(false);
      setSelectedMember(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Remove member mutation
  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("חבר צוות הוסר");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Assign lead mutation
  const assignLead = useMutation({
    mutationFn: async ({ leadId, userId }: { leadId: string; userId: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ assigned_to: userId } as any)
        .eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads-for-assignment"] });
      toast.success("ליד הוקצה בהצלחה");
      setAssignLeadOpen(false);
      setSelectedLeadForAssign(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Performance stats per member
  const memberStats = useMemo(() => {
    const stats: Record<string, { total: number; approved: number; inProgress: number; value: number }> = {};
    members.forEach((m) => {
      const memberLeads = leads.filter((l) => l.assigned_to === m.user_id || l.consultant_id === m.user_id);
      stats[m.user_id] = {
        total: memberLeads.length,
        approved: memberLeads.filter((l) => l.status === "approved").length,
        inProgress: memberLeads.filter((l) => ["contacted", "in_progress", "submitted"].includes(l.status)).length,
        value: memberLeads.reduce((sum, l) => sum + (l.mortgage_amount ? Number(l.mortgage_amount) : 0), 0),
      };
    });
    return stats;
  }, [members, leads]);

  // Unassigned leads
  const unassignedLeads = useMemo(() =>
    leads.filter((l) => !l.assigned_to && !["closed", "rejected"].includes(l.status)),
    [leads]
  );

  if (teamsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // No team yet - show create team
  if (!currentTeam) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-3">
          <UsersRound className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">ניהול צוות</h2>
        </div>
        <div className="glass-card p-12 text-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
            <UsersRound className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">עדיין אין צוות</h3>
          <p className="text-sm text-muted-foreground">צור צוות חדש כדי להתחיל לנהל חברי צוות ולהקצות לידים</p>
          <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                צור צוות חדש
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>צור צוות חדש</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createTeam.mutate(teamName);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>שם הצוות</Label>
                  <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="למשל: צוות משכנתאות מרכז" required />
                </div>
                <Button type="submit" className="w-full" disabled={createTeam.isPending}>
                  {createTeam.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  צור צוות
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <UsersRound className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">ניהול צוות</h2>
            <p className="text-xs text-muted-foreground">{currentTeam.name}</p>
          </div>
        </div>
        <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              הוסף חבר צוות
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>הוסף חבר צוות</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addMember.mutate({ email: memberEmail, role: memberRole, department: memberDept });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>אימייל המשתמש</Label>
                <Input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="user@example.com"
                  dir="ltr"
                  required
                />
                <p className="text-[10px] text-muted-foreground">המשתמש צריך להיות רשום במערכת</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>תפקיד</Label>
                  <Select value={memberRole} onValueChange={setMemberRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">מנהל</SelectItem>
                      <SelectItem value="member">חבר צוות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>מחלקה</Label>
                  <Select value={memberDept} onValueChange={setMemberDept}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEPARTMENT_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={addMember.isPending}>
                {addMember.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                הוסף לצוות
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">חברי צוות</p>
          <p className="text-2xl font-bold text-foreground">{members.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">לידים פעילים</p>
          <p className="text-2xl font-bold text-primary">{leads.filter((l) => !["closed", "rejected"].includes(l.status)).length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">ממתינים להקצאה</p>
          <p className="text-2xl font-bold text-warning">{unassignedLeads.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">אושרו החודש</p>
          <p className="text-2xl font-bold text-success">{leads.filter((l) => l.status === "approved").length}</p>
        </div>
      </div>

      <Tabs defaultValue="members" dir="rtl">
        <TabsList>
          <TabsTrigger value="members">חברי צוות</TabsTrigger>
          <TabsTrigger value="assignment">הקצאת לידים</TabsTrigger>
          <TabsTrigger value="performance">מעקב ביצועים</TabsTrigger>
          <TabsTrigger value="chat">צ׳אט צוות</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4 space-y-3">
          {membersLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : members.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">אין חברי צוות. הוסף חברים כדי להתחיל.</p>
            </div>
          ) : (
            members.map((member) => {
              const dept = DEPARTMENT_CONFIG[member.department || "sales"];
              const DeptIcon = dept?.icon || User;
              const stats = memberStats[member.user_id];
              const isOwner = member.role === "owner";

              return (
                <div
                  key={member.id}
                  className="glass-card p-4 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  {/* Avatar */}
                  <div className={cn("p-2.5 rounded-full shrink-0", dept?.color === "text-primary" ? "bg-primary/10" : dept?.color === "text-success" ? "bg-success/10" : dept?.color === "text-warning" ? "bg-warning/10" : "bg-destructive/10")}>
                    <DeptIcon className={cn("w-5 h-5", dept?.color || "text-muted-foreground")} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{member.profile?.full_name || "ללא שם"}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {ROLE_CONFIG[member.role] || member.role}
                      </span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full", dept?.color === "text-primary" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>
                        {dept?.label || member.department}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {member.profile?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {member.profile.email}
                        </span>
                      )}
                      {member.profile?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {member.profile.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <p className="font-bold text-foreground">{stats?.total || 0}</p>
                      <p className="text-muted-foreground">לידים</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-success">{stats?.approved || 0}</p>
                      <p className="text-muted-foreground">אושרו</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-primary">{stats?.inProgress || 0}</p>
                      <p className="text-muted-foreground">בטיפול</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isOwner && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedMember(member);
                          setMemberRole(member.role);
                          setMemberDept(member.department || "sales");
                          setEditMemberOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (confirm("להסיר חבר צוות זה?")) removeMember.mutate(member.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Assignment Tab */}
        <TabsContent value="assignment" className="mt-4 space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">לידים ממתינים להקצאה ({unassignedLeads.length})</h3>
            </div>
            {unassignedLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">כל הלידים מוקצים 🎉</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unassignedLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-all"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{lead.full_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{STATUS_LABELS[lead.status] || lead.status}</span>
                        {lead.mortgage_amount && (
                          <span>₪{Number(lead.mortgage_amount).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <Select
                      onValueChange={(userId) => assignLead.mutate({ leadId: lead.id, userId })}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue placeholder="הקצה ל..." />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {m.profile?.full_name || m.profile?.email || "חבר צוות"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Already assigned */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">לידים מוקצים</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leads
                .filter((l) => l.assigned_to)
                .map((lead) => {
                  const assignee = members.find((m) => m.user_id === lead.assigned_to);
                  return (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{lead.full_name}</p>
                        <p className="text-xs text-muted-foreground">{STATUS_LABELS[lead.status]}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {assignee?.profile?.full_name || "משתמש"}
                        </span>
                        <Select
                          onValueChange={(userId) => assignLead.mutate({ leadId: lead.id, userId })}
                        >
                          <SelectTrigger className="w-8 h-8 p-0 border-0">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((m) => (
                              <SelectItem key={m.user_id} value={m.user_id}>
                                {m.profile?.full_name || m.profile?.email || "חבר צוות"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-4 space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">ביצועי צוות</h3>
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">אין חברי צוות</p>
            ) : (
              <div className="space-y-4">
                {members.map((member) => {
                  const stats = memberStats[member.user_id] || { total: 0, approved: 0, inProgress: 0, value: 0 };
                  const conversionRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

                  return (
                    <div key={member.id} className="p-4 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{member.profile?.full_name || "ללא שם"}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {DEPARTMENT_CONFIG[member.department || "sales"]?.label}
                          </span>
                        </div>
                        <span className={cn(
                          "text-sm font-bold",
                          conversionRate >= 50 ? "text-success" : conversionRate >= 25 ? "text-warning" : "text-muted-foreground"
                        )}>
                          {conversionRate}% המרה
                        </span>
                      </div>

                      {/* Progress bars */}
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">סה״כ</span>
                            <span className="font-bold text-foreground">{stats.total}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-muted-foreground rounded-full" style={{ width: `${Math.min(100, stats.total * 10)}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">בטיפול</span>
                            <span className="font-bold text-primary">{stats.inProgress}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">אושרו</span>
                            <span className="font-bold text-success">{stats.approved}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-success rounded-full" style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">שווי</span>
                            <span className="font-bold text-foreground">₪{stats.value > 0 ? (stats.value / 1000).toFixed(0) + "K" : "0"}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-warning rounded-full" style={{ width: `${Math.min(100, stats.value / 50000)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
        {/* Team Chat Tab */}
        <TabsContent value="chat" className="mt-4">
          {currentTeam ? (
            <TeamChat teamId={currentTeam.id} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">צור צוות כדי להתחיל צ׳אט</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <Dialog open={editMemberOpen} onOpenChange={setEditMemberOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת חבר צוות</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMember.mutate({ id: selectedMember.id, role: memberRole, department: memberDept });
              }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">{selectedMember.profile?.full_name || selectedMember.profile?.email}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>תפקיד</Label>
                  <Select value={memberRole} onValueChange={setMemberRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">מנהל</SelectItem>
                      <SelectItem value="member">חבר צוות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>מחלקה</Label>
                  <Select value={memberDept} onValueChange={setMemberDept}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEPARTMENT_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={updateMember.isPending}>
                {updateMember.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                עדכן
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;
