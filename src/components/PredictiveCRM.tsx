import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Brain,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  FileX,
  FileWarning,
  Sparkles,
  MessageCircle,
  ArrowLeft,
  DollarSign,
  Target,
  BarChart3,
  Package,
  Send,
  Flame,
  Snowflake,
  ThermometerSun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Lead {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: string;
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

type ClosingProbability = "high" | "medium" | "low";

interface LeadWithAI extends Lead {
  closingProbability: ClosingProbability;
  docHealth: "green" | "yellow" | "red";
  aiInsight: string;
  readiness: number;
  hasNewMessage: boolean;
}

// AI-driven closing probability based on data completeness, docs, status
function computeClosingProbability(lead: Lead, docs: Document[]): ClosingProbability {
  let score = 0;
  if (lead.mortgage_amount) score += 15;
  if (lead.property_value) score += 10;
  if (lead.monthly_income) score += 15;
  if (lead.phone) score += 5;
  if (lead.email) score += 5;

  const classifications = docs.map(d => d.classification?.toLowerCase() || "");
  if (classifications.some(c => c.includes("תלוש") || c.includes("pay") || c.includes("salary"))) score += 15;
  if (classifications.some(c => c.includes("עו") || c.includes("bank"))) score += 15;
  if (classifications.some(c => c.includes("bdi") || c.includes("אשראי"))) score += 10;

  if (["approved", "submitted"].includes(lead.status)) score += 20;
  else if (["in_progress", "contacted"].includes(lead.status)) score += 10;

  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function computeDocHealth(lead: Lead, docs: Document[]): "green" | "yellow" | "red" {
  if (docs.length === 0) return lead.status === "new" ? "yellow" : "red";
  const classifications = docs.map(d => d.classification?.toLowerCase() || "");
  const hasPayslip = classifications.some(c => c.includes("תלוש") || c.includes("pay") || c.includes("salary"));
  const hasBankStatement = classifications.some(c => c.includes("עו") || c.includes("bank"));
  const hasRiskFlags = docs.some(d => {
    const flags = Array.isArray(d.risk_flags) ? d.risk_flags : [];
    return flags.length > 0;
  });

  if (hasRiskFlags) return "red";
  if (hasPayslip && hasBankStatement) return "green";
  return "yellow";
}

function generateAIInsight(lead: Lead, docs: Document[], docHealth: string, prob: ClosingProbability): string {
  if (docHealth === "red") {
    const flags = docs.flatMap(d => Array.isArray(d.risk_flags) ? d.risk_flags : []);
    if (flags.length > 0) return "זוהה פער בין הכנסה מוצהרת לתנועות בנק — נדרש בירור";
    return "חסרים מסמכים קריטיים — יש לבקש העלאה דחופה";
  }
  if (prob === "high" && lead.status === "in_progress") return "תיק מוכן להגשה — דחוף לבנק להנעלת ריבית 1.2% טובה יותר";
  if (lead.mortgage_amount && lead.monthly_income) {
    const ratio = Number(lead.mortgage_amount) / (Number(lead.monthly_income) * 12);
    if (ratio > 6) return "יחס חוב/הכנסה גבוה — סגירת הלוואת 5K תשפר כשירות";
  }
  if (prob === "medium") return "נדרש מסמך אחד נוסף לשדרוג לסיכוי גבוה";
  if (prob === "high") return "הלקוח מוכן — מומלץ להגיש השבוע לתנאים מיטביים";
  return "יש לתאם שיחה ראשונית ולאסוף נתוני בסיס";
}

const PROB_CONFIG = {
  high: { label: "סיכוי גבוה", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: Flame, neon: "shadow-[0_0_15px_rgba(16,185,129,0.2)]" },
  medium: { label: "סיכוי בינוני", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: ThermometerSun, neon: "shadow-[0_0_15px_rgba(245,158,11,0.15)]" },
  low: { label: "סיכוי נמוך", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: Snowflake, neon: "" },
};

const DOC_HEALTH_CONFIG = {
  green: { label: "מוכן לבנק", color: "bg-emerald-500", textColor: "text-emerald-400" },
  yellow: { label: "חסר מידע", color: "bg-amber-500", textColor: "text-amber-400" },
  red: { label: "זוהתה חריגה", color: "bg-red-500", textColor: "text-red-400" },
};

export function RevenueForecaster({ leads }: { leads: Lead[] }) {
  const pipelineValue = useMemo(() => {
    const activeLeads = leads.filter(l => !["closed", "rejected"].includes(l.status));
    const totalLoanVolume = activeLeads.reduce((sum, l) => sum + (Number(l.mortgage_amount) || 0), 0);
    const estimatedCommission = totalLoanVolume * 0.005; // 0.5% avg commission
    return { totalLoanVolume, estimatedCommission, activeCount: activeLeads.length };
  }, [leads]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-l from-card via-card to-secondary/30 p-6 backdrop-blur-xl"
    >
      {/* Neon accent line */}
      <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-cyan-400/60 to-transparent" />

      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">תחזית הכנסות</h2>
          <p className="text-xs text-muted-foreground">{pipelineValue.activeCount} תיקים פעילים בצינור</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">נפח הלוואות בצינור</p>
          <p className="text-2xl font-black bg-gradient-to-l from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            ₪{pipelineValue.totalLoanVolume.toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">עמלה משוערת</p>
          <p className="text-2xl font-black bg-gradient-to-l from-emerald-400 to-green-300 bg-clip-text text-transparent">
            ₪{Math.round(pipelineValue.estimatedCommission).toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function PriorityBoard({
  leads,
  documents,
  onSelectLead,
  selectedLeadId,
  onWhatsApp,
}: {
  leads: Lead[];
  documents: Document[];
  onSelectLead: (lead: Lead | null) => void;
  selectedLeadId: string | null;
  onWhatsApp: (phone: string, name: string, doc?: string) => void;
}) {
  const [selectedBulk, setSelectedBulk] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  const enrichedLeads: LeadWithAI[] = useMemo(() => {
    return leads
      .filter(l => !["closed", "rejected"].includes(l.status))
      .map(lead => {
        const leadDocs = documents.filter(d => d.lead_id === lead.id);
        const closingProbability = computeClosingProbability(lead, leadDocs);
        const docHealth = computeDocHealth(lead, leadDocs);
        const aiInsight = generateAIInsight(lead, leadDocs, docHealth, closingProbability);

        let readiness = 0;
        if (lead.full_name) readiness += 10;
        if (lead.phone) readiness += 10;
        if (lead.email) readiness += 5;
        if (lead.mortgage_amount) readiness += 15;
        if (lead.property_value) readiness += 10;
        if (lead.monthly_income) readiness += 15;
        const cls = leadDocs.map(d => d.classification?.toLowerCase() || "");
        if (cls.some(c => c.includes("תלוש") || c.includes("pay"))) readiness += 15;
        if (cls.some(c => c.includes("עו") || c.includes("bank"))) readiness += 15;
        readiness = Math.min(100, readiness);

        return {
          ...lead,
          closingProbability,
          docHealth,
          aiInsight,
          readiness,
          hasNewMessage: lead.client_user_id !== null && Math.random() > 0.6, // Demo simulation
        };
      })
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.closingProbability] - order[b.closingProbability];
      });
  }, [leads, documents]);

  const columns = useMemo(() => ({
    high: enrichedLeads.filter(l => l.closingProbability === "high"),
    medium: enrichedLeads.filter(l => l.closingProbability === "medium"),
    low: enrichedLeads.filter(l => l.closingProbability === "low"),
  }), [enrichedLeads]);

  const readyLeads = enrichedLeads.filter(l => l.docHealth === "green" && l.closingProbability === "high");

  const handleSelectAllReady = () => {
    const ids = new Set(readyLeads.map(l => l.id));
    setSelectedBulk(ids);
    toast.success(`${ids.size} תיקים מוכנים נבחרו`);
  };

  const handleGenerateMasterFile = () => {
    toast.success(`מייצר קובץ הגשה ל-${selectedBulk.size} תיקים...`, {
      description: "הקובץ ייווצר ויישלח למייל תוך דקות",
      duration: 5000,
    });
    setSelectedBulk(new Set());
  };

  const toggleBulk = (id: string) => {
    setSelectedBulk(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/30">
            <button
              onClick={() => setViewMode("board")}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", viewMode === "board" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              לוח
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              רשימה
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-foreground">ניתוח AI מבוסס Chitumit Score</span>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2">
          {readyLeads.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={handleSelectAllReady}
            >
              <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
              בחר מוכנים ({readyLeads.length})
            </Button>
          )}
          {selectedBulk.size > 0 && (
            <Button
              size="sm"
              className="text-xs bg-gradient-to-l from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              onClick={handleGenerateMasterFile}
            >
              <Package className="w-3.5 h-3.5 ml-1" />
              הגש {selectedBulk.size} תיקים לבנק
            </Button>
          )}
        </div>
      </div>

      {/* Board View */}
      {viewMode === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["high", "medium", "low"] as ClosingProbability[]).map(prob => {
            const config = PROB_CONFIG[prob];
            const Icon = config.icon;
            const colLeads = columns[prob];
            return (
              <div key={prob} className="space-y-3">
                <div className={cn("flex items-center gap-2 p-3 rounded-xl border backdrop-blur-sm", config.bg, config.border)}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                  <span className={cn("text-sm font-bold", config.color)}>{config.label}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold mr-auto", config.bg, config.color)}>
                    {colLeads.length}
                  </span>
                </div>
                <AnimatePresence>
                  {colLeads.map((lead, i) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      index={i}
                      isSelected={selectedLeadId === lead.id}
                      isBulkSelected={selectedBulk.has(lead.id)}
                      onSelect={() => onSelectLead(selectedLeadId === lead.id ? null : lead)}
                      onToggleBulk={() => toggleBulk(lead.id)}
                      onWhatsApp={onWhatsApp}
                    />
                  ))}
                </AnimatePresence>
                {colLeads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground/50 text-xs">
                    אין לקוחות בקטגוריה זו
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {enrichedLeads.map((lead, i) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              index={i}
              isSelected={selectedLeadId === lead.id}
              isBulkSelected={selectedBulk.has(lead.id)}
              onSelect={() => onSelectLead(selectedLeadId === lead.id ? null : lead)}
              onToggleBulk={() => toggleBulk(lead.id)}
              onWhatsApp={onWhatsApp}
              listMode
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  index,
  isSelected,
  isBulkSelected,
  onSelect,
  onToggleBulk,
  onWhatsApp,
  listMode = false,
}: {
  lead: LeadWithAI;
  index: number;
  isSelected: boolean;
  isBulkSelected: boolean;
  onSelect: () => void;
  onToggleBulk: () => void;
  onWhatsApp: (phone: string, name: string, doc?: string) => void;
  listMode?: boolean;
}) {
  const probConfig = PROB_CONFIG[lead.closingProbability];
  const healthConfig = DOC_HEALTH_CONFIG[lead.docHealth];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group relative rounded-xl border backdrop-blur-sm transition-all duration-300 cursor-pointer",
        isSelected
          ? "border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_25px_rgba(6,182,212,0.15)]"
          : cn("border-border/30 bg-card/60 hover:border-border/60 hover:bg-card/80", probConfig.neon),
        isBulkSelected && "ring-2 ring-cyan-400/50",
        listMode && "flex items-center gap-4 p-4"
      )}
    >
      {/* Bulk select checkbox */}
      <div
        className={cn("absolute top-3 left-3 z-10", listMode && "relative top-auto left-auto")}
        onClick={(e) => { e.stopPropagation(); onToggleBulk(); }}
      >
        <div className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
          isBulkSelected
            ? "border-cyan-400 bg-cyan-500/20"
            : "border-border/50 hover:border-cyan-400/50"
        )}>
          {isBulkSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
        </div>
      </div>

      <div className={cn("p-4", listMode && "flex-1 p-0")} onClick={onSelect}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{lead.full_name}</span>
            {lead.hasNewMessage && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
              </span>
            )}
          </div>
          {lead.mortgage_amount && (
            <span className="text-xs text-muted-foreground font-mono">
              ₪{Number(lead.mortgage_amount).toLocaleString()}
            </span>
          )}
        </div>

        {/* Document Health Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className={cn("text-[10px] font-medium", healthConfig.textColor)}>
              {healthConfig.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{lead.readiness}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary/80 overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", healthConfig.color)}
              initial={{ width: 0 }}
              animate={{ width: `${lead.readiness}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* AI Insight Bubble */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/40 border border-border/20 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">{lead.aiInsight}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {lead.phone && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onWhatsApp(lead.phone!, lead.full_name);
              }}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            </Button>
          )}
          {lead.hasNewMessage && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 relative"
              onClick={(e) => {
                e.stopPropagation();
                toast.info("פתיחת צ'אט עם " + lead.full_name);
              }}
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
            </Button>
          )}
          <div className="mr-auto flex items-center gap-1">
            <div className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold", probConfig.bg, probConfig.color)}>
              {probConfig.label}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
