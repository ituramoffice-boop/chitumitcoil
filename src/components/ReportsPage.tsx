import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  LayoutDashboard,
  Users,
  TrendingUp,
  DollarSign,
  Heart,
  Shield,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  Target,
  Eye,
  ArrowLeft,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import RiskReportView from "./RiskReportView";

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

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: "חדש", color: "text-primary", bg: "bg-primary/10" },
  contacted: { label: "יצירת קשר", color: "text-amber-600", bg: "bg-amber-50" },
  in_progress: { label: "בטיפול", color: "text-primary", bg: "bg-primary/10" },
  submitted: { label: "הוגש", color: "text-indigo-600", bg: "bg-indigo-50" },
  approved: { label: "אושר", color: "text-success", bg: "bg-success/10" },
  rejected: { label: "נדחה", color: "text-destructive", bg: "bg-destructive/10" },
  closed: { label: "סגור", color: "text-muted-foreground", bg: "bg-muted" },
};

const ReportsPage = () => {
  const { role } = useAuth();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["report-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const filtered = leads.filter((l) =>
    l.full_name.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (selectedLead) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setSelectedLead(null)}>
          <ArrowLeft className="w-4 h-4 ml-1" />
          חזרה לרשימה
        </Button>
        <RiskReportView lead={selectedLead} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          דוחות סיכונים
        </h2>
        <div className="relative w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש לקוח..." className="pr-10" />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((lead) => {
          const sc = STATUS_CONFIG[lead.status];
          const ltv = lead.property_value ? ((lead.mortgage_amount || 0) / lead.property_value * 100).toFixed(0) : null;
          const dti = lead.monthly_income ? (((lead.mortgage_amount || 0) / 240) / lead.monthly_income * 100).toFixed(0) : null;
          return (
            <div
              key={lead.id}
              className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all"
              onClick={() => setSelectedLead(lead)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{lead.full_name}</span>
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full", sc.color, sc.bg)}>{sc.label}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {lead.mortgage_amount && <span>משכנתא: ₪{Number(lead.mortgage_amount).toLocaleString()}</span>}
                  {ltv && <span>LTV: {ltv}%</span>}
                  {dti && <span>DTI: {dti}%</span>}
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4 ml-1" />
                דוח סיכונים
              </Button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>לא נמצאו לקוחות</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
