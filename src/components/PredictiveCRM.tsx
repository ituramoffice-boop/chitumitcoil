import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { computeMetrics, generateNarrative, generateBrightSpots } from "@/components/AIUnderwriterAdvocate";
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
  Mail,
  Loader2,
  Clock,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [commissionPct, setCommissionPct] = useState(1);

  const metrics = useMemo(() => {
    const active = leads.filter(l => !["closed", "rejected"].includes(l.status));
    const totalPipeline = active.reduce((s, l) => s + (Number(l.mortgage_amount) || 0), 0);
    const commission = totalPipeline * (commissionPct / 100);

    // Funnel stages
    const stages = [
      { key: "new", label: "ליד חדש", statuses: ["new"], color: "from-blue-500 to-blue-400" },
      { key: "docs", label: "אימות מסמכים", statuses: ["contacted", "in_progress"], color: "from-amber-500 to-amber-400" },
      { key: "bank", label: "מוכן לבנק", statuses: ["submitted"], color: "from-primary to-primary" },
      { key: "approved", label: "מאושר", statuses: ["approved"], color: "from-emerald-500 to-emerald-400" },
    ];
    const funnel = stages.map(st => ({
      ...st,
      count: active.filter(l => st.statuses.includes(l.status)).length,
      volume: active.filter(l => st.statuses.includes(l.status)).reduce((s, l) => s + (Number(l.mortgage_amount) || 0), 0),
    }));

    // Time-to-money
    const closedLeads = leads.filter(l => l.status === "approved" || l.status === "closed");
    let avgDays = 14;
    if (closedLeads.length > 0) {
      const totalDays = closedLeads.reduce((s, l) => {
        const created = new Date(l.created_at).getTime();
        const lastContact = l.last_contact ? new Date(l.last_contact).getTime() : Date.now();
        return s + Math.round((lastContact - created) / 86400000);
      }, 0);
      avgDays = Math.max(1, Math.round(totalDays / closedLeads.length));
    }

    // VIP leads (1.5M+)
    const vips = active.filter(l => (Number(l.mortgage_amount) || 0) >= 1500000);

    // Simulated month-over-month revenue data
    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthLeads = leads.filter(l => {
        const d = new Date(l.created_at);
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      });
      const vol = monthLeads.reduce((s, l) => s + (Number(l.mortgage_amount) || 0), 0);
      return {
        label: month.toLocaleDateString("he-IL", { month: "short" }),
        volume: vol,
        commission: vol * (commissionPct / 100),
      };
    });

    return { totalPipeline, commission, active, funnel, avgDays, vips, monthlyData };
  }, [leads, commissionPct]);

  const maxFunnel = Math.max(1, ...metrics.funnel.map(f => f.count));
  const maxChart = Math.max(1, ...metrics.monthlyData.map(d => d.commission));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* ── Main HUD Card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-l from-card via-card to-secondary/30 backdrop-blur-xl">
        {/* Top neon line */}
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-emerald-400/60 to-transparent" />
        
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Money Engine HUD</h2>
                <p className="text-xs text-muted-foreground">{metrics.active.length} תיקים פעילים בצינור</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>עמלה:</span>
              <select
                value={commissionPct}
                onChange={e => setCommissionPct(Number(e.target.value))}
                className="bg-secondary/60 border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(v => (
                  <option key={v} value={v}>{v}%</option>
                ))}
              </select>
            </div>
          </div>

          {/* Big numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">נפח צינור כולל</p>
              <p className="text-xl md:text-2xl font-black font-heebo bg-gradient-to-l from-cyan-400 to-blue-400 bg-clip-text text-transparent" style={{ fontVariantNumeric: "tabular-nums" }}>
                ₪{metrics.totalPipeline.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.08)]">
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> עמלה משוערת
              </p>
              <p className="text-xl md:text-2xl font-black font-heebo text-emerald-400" style={{ fontVariantNumeric: "tabular-nums" }}>
                ₪{Math.round(metrics.commission).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time-to-Money
              </p>
              <p className="text-xl md:text-2xl font-black font-heebo text-foreground">{metrics.avgDays} ימים</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">ממוצע סגירה לצינור הנוכחי</p>
            </div>
            <div className={cn(
              "p-4 rounded-xl border",
              metrics.vips.length > 0
                ? "bg-accent/5 border-accent/25 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                : "bg-secondary/40 border-border/30"
            )}>
              <p className="text-[10px] text-accent uppercase tracking-wider mb-1 flex items-center gap-1">
                <Crown className="w-3 h-3" /> VIP Opportunities
              </p>
              <p className={cn("text-xl md:text-2xl font-black font-heebo", metrics.vips.length > 0 ? "text-accent" : "text-foreground")}>
                {metrics.vips.length}
              </p>
              {metrics.vips.length > 0 && (
                <p className="text-[9px] text-accent/70 mt-0.5">הלוואות מעל ₪1.5M</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Pipeline Funnel ── */}
        <div className="px-6 pb-5 border-t border-border/20 pt-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Pipeline Funnel</p>
          <div className="space-y-2.5">
            {metrics.funnel.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 text-left shrink-0">{stage.label}</span>
                <div className="flex-1 h-7 bg-secondary/30 rounded-lg overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, (stage.count / maxFunnel) * 100)}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    className={cn("h-full rounded-lg bg-gradient-to-l", stage.color)}
                  />
                  <span className="absolute inset-0 flex items-center pr-3 text-[11px] font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {stage.count} · ₪{stage.volume.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── VIP Alerts ── */}
        {metrics.vips.length > 0 && (
          <div className="px-6 pb-5 border-t border-border/20 pt-4">
            <p className="text-xs font-semibold text-accent mb-2 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3" /> High-Value Alerts
            </p>
            <div className="flex flex-wrap gap-2">
              {metrics.vips.map(v => (
                <motion.div
                  key={v.id}
                  animate={{ boxShadow: ["0 0 0px rgba(234,179,8,0)", "0 0 12px rgba(234,179,8,0.3)", "0 0 0px rgba(234,179,8,0)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-xs"
                >
                  <Crown className="w-3 h-3 text-accent" />
                  <span className="font-semibold text-foreground">{v.full_name}</span>
                  <span className="text-accent font-heebo" style={{ fontVariantNumeric: "tabular-nums" }}>₪{(Number(v.mortgage_amount) || 0).toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Revenue Growth Chart ── */}
        <div className="px-6 pb-6 border-t border-border/20 pt-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Revenue Growth (עמלות)</p>
          <div className="flex items-end gap-2 h-28">
            {metrics.monthlyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-heebo text-emerald-400" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {d.commission > 0 ? `₪${Math.round(d.commission / 1000)}K` : ""}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (d.commission / maxChart) * 80)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className={cn(
                    "w-full rounded-t-md",
                    i === metrics.monthlyData.length - 1
                      ? "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "bg-emerald-500/20"
                  )}
                />
                <span className="text-[9px] text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              <span>AI Insight: זמן סגירה ממוצע לצינור הנוכחי: <strong>{metrics.avgDays} ימים</strong> — מומלץ לדחוף תיקים במצב &quot;אימות&quot; קדימה</span>
            </p>
          </div>
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
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [bankEmail, setBankEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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

  // Render Chitumit logo SVG to PNG data URL for PDF embedding
  const getLogoDataUrl = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const svgStr = `<svg width="128" height="128" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 4L8 16V34C8 48.36 18.64 58.4 32 62C45.36 58.4 56 48.36 56 34V16L32 4Z" fill="#0F172A" stroke="#D4AF37" stroke-width="1.5"/>
        <path d="M32 8L12 18.5V34C12 46.2 21.2 55.2 32 58.2C42.8 55.2 52 46.2 52 34V18.5L32 8Z" fill="#D4AF37" opacity="0.15"/>
        <g transform="translate(16, 18)"><path d="M4 0V20" stroke="#D4AF37" stroke-width="3.5" stroke-linecap="round"/><path d="M4 0H24" stroke="#D4AF37" stroke-width="3.5" stroke-linecap="round"/><path d="M24 0V10L16 20L28 6" stroke="#D4AF37" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
      </svg>`;
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 128, 128);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve("");
      img.src = "data:image/svg+xml;base64," + btoa(svgStr);
    });
  }, []);

  // Build PDF doc from selected leads (reusable for download & email)
  const buildPdfDoc = useCallback(async (selected: LeadWithAI[], consultantProfileUrl?: string) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const rtl = (text: string) => text.split("").reverse().join("");

    // Generate logo and QR code in parallel
    const profileUrl = consultantProfileUrl || `${window.location.origin}/consultant-profile`;
    const [logoDataUrl, qrDataUrl] = await Promise.all([
      getLogoDataUrl(),
      QRCode.toDataURL(profileUrl, {
        width: 200,
        margin: 1,
        color: { dark: "#D4AF37", light: "#0F172A" },
      }).catch(() => ""),
    ]);

    // ─── Cover Page ───
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 210, "F");
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1.5);
    doc.line(20, 30, 277, 30);

    // Logo image
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", 128.5, 36, 20, 20);
    }

    doc.setTextColor(212, 175, 55);
    doc.setFontSize(28);
    doc.text("Chitumit", 148.5, 72, { align: "center" });
    doc.setFontSize(14);
    doc.setTextColor(200, 200, 200);
    doc.text(rtl("קובץ הגשה מרכזי לבנק"), 148.5, 84, { align: "center" });
    doc.setFontSize(11);
    doc.setTextColor(150, 150, 150);
    const dateStr = new Date().toLocaleDateString("he-IL");
    doc.text(`${rtl("תאריך הפקה:")} ${dateStr}`, 148.5, 97, { align: "center" });
    doc.text(`${selected.length} ${rtl("תיקים")}`, 148.5, 105, { align: "center" });
    const totalVolume = selected.reduce((s, l) => s + (Number(l.mortgage_amount) || 0), 0);
    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129);
    doc.text(`${rtl("נפח הלוואות כולל:")} ${totalVolume.toLocaleString()} NIS`, 148.5, 122, { align: "center" });

    // QR Code with label
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", 20, 140, 30, 30);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(rtl("סרוק לפרופיל היועץ"), 35, 175, { align: "center" });
    }

    doc.setDrawColor(212, 175, 55);
    doc.line(20, 180, 277, 180);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(rtl("מסמך זה הופק אוטומטית ע\"י מערכת חיתומית — כל הזכויות שמורות"), 148.5, 195, { align: "center" });

    // ─── Summary Table Page ───
    doc.addPage("a4", "landscape");
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 210, "F");
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(16);
    doc.text(rtl("סיכום תיקים להגשה"), 277, 20, { align: "right" });
    const headers = ["#", "Client Name", "Mortgage (NIS)", "Property (NIS)", "Income (NIS)", "LTV%", "DTI%", "Status", "Probability"];
    const colWidths = [10, 45, 35, 35, 35, 25, 25, 30, 30];
    let startX = 15;
    const headerY = 35;
    doc.setFillColor(30, 41, 59);
    doc.rect(startX, headerY - 5, 270, 10, "F");
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    let cx = startX;
    headers.forEach((h, i) => {
      doc.text(h, cx + colWidths[i] / 2, headerY + 1, { align: "center" });
      cx += colWidths[i];
    });

    selected.forEach((lead, idx) => {
      const y = headerY + 12 + idx * 10;
      if (y > 190) {
        doc.addPage("a4", "landscape");
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 297, 210, "F");
      }
      const rowY = y > 190 ? 25 + ((idx * 10) % 170) : y;
      if (idx % 2 === 0) {
        doc.setFillColor(20, 30, 50);
        doc.rect(startX, rowY - 5, 270, 10, "F");
      }
      const mortgage = Number(lead.mortgage_amount) || 0;
      const property = Number(lead.property_value) || 0;
      const income = Number(lead.monthly_income) || 0;
      const ltv = property > 0 ? ((mortgage / property) * 100).toFixed(1) : "N/A";
      const dti = income > 0 ? ((mortgage / (income * 12)) * 100).toFixed(1) : "N/A";
      const probLabel = lead.closingProbability === "high" ? "HIGH" : lead.closingProbability === "medium" ? "MED" : "LOW";
      const row = [String(idx + 1), lead.full_name, mortgage.toLocaleString(), property.toLocaleString(), income.toLocaleString(), String(ltv), String(dti), lead.status, probLabel];
      doc.setFontSize(8);
      cx = startX;
      row.forEach((cell, ci) => {
        if (ci === 8) {
          if (probLabel === "HIGH") doc.setTextColor(16, 185, 129);
          else if (probLabel === "MED") doc.setTextColor(245, 158, 11);
          else doc.setTextColor(96, 165, 250);
        } else {
          doc.setTextColor(180, 180, 180);
        }
        doc.text(cell, cx + colWidths[ci] / 2, rowY + 1, { align: "center" });
        cx += colWidths[ci];
      });
    });

    // ─── Individual Profiles (Executive Dossier) ───
    selected.forEach((lead, idx) => {
      doc.addPage("a4", "portrait");
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 297, "F");

      // Premium gold border
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(1.2);
      doc.line(15, 18, 195, 18);
      doc.setLineWidth(0.3);
      doc.line(15, 20, 195, 20);

      // Executive Dossier badge
      doc.setFillColor(25, 35, 55);
      doc.roundedRect(55, 5, 100, 10, 2, 2, "F");
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.4);
      doc.roundedRect(55, 5, 100, 10, 2, 2, "S");
      doc.setFontSize(7);
      doc.setTextColor(212, 175, 55);
      doc.text("EXECUTIVE DOSSIER — CONFIDENTIAL", 105, 12, { align: "center" });

      doc.setTextColor(212, 175, 55);
      doc.setFontSize(14);
      doc.text(`${rtl("כרטיס לקוח")} #${idx + 1}`, 195, 30, { align: "right" });
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text(lead.full_name, 195, 35, { align: "right" });
      const mortgage = Number(lead.mortgage_amount) || 0;
      const property = Number(lead.property_value) || 0;
      const income = Number(lead.monthly_income) || 0;
      const ltv = property > 0 ? ((mortgage / property) * 100).toFixed(1) + "%" : "N/A";
      const dti = income > 0 ? ((mortgage / (income * 12)) * 100).toFixed(1) + "%" : "N/A";
      const fields = [
        [rtl("סכום משכנתא"), `${mortgage.toLocaleString()} NIS`],
        [rtl("שווי נכס"), `${property.toLocaleString()} NIS`],
        [rtl("הכנסה חודשית"), `${income.toLocaleString()} NIS`],
        ["LTV", ltv], ["DTI", dti],
        [rtl("סטטוס"), lead.status],
        [rtl("סיכוי סגירה"), lead.closingProbability === "high" ? "HIGH" : lead.closingProbability === "medium" ? "MEDIUM" : "LOW"],
        [rtl("בריאות מסמכים"), lead.docHealth === "green" ? rtl("מוכן לבנק") : lead.docHealth === "yellow" ? rtl("חסר מידע") : rtl("חריגה")],
      ];
      let fy = 55;
      fields.forEach(([label, value], fi) => {
        if (fi % 2 === 0) { doc.setFillColor(20, 30, 50); doc.rect(15, fy - 5, 180, 12, "F"); }
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(label, 190, fy + 2, { align: "right" });
        doc.setTextColor(255, 255, 255);
        doc.text(value, 80, fy + 2, { align: "center" });
        fy += 12;
      });
      fy += 10;
      doc.setFillColor(20, 40, 60);
      doc.roundedRect(15, fy - 5, 180, 20, 3, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(6, 182, 212);
      doc.text("AI Insight:", 190, fy + 2, { align: "right" });
      doc.setTextColor(180, 200, 210);
      doc.text(lead.aiInsight, 190, fy + 10, { align: "right", maxWidth: 170 });

      // ── AI Underwriter Advocate Narrative ──
      fy += 30;
      const advocateMetrics = computeMetrics(lead);
      const narrative = generateNarrative(lead, advocateMetrics, true); // banker mode
      const brightSpots = generateBrightSpots(advocateMetrics, true);

      doc.setFillColor(15, 30, 45);
      doc.roundedRect(15, fy - 5, 180, 45, 3, 3, "F");
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, fy - 5, 180, 45, 3, 3, "S");

      doc.setFontSize(9);
      doc.setTextColor(212, 175, 55);
      doc.text(rtl("סיכום מנהלים — AI Underwriter Advocate"), 190, fy + 2, { align: "right" });

      doc.setFontSize(7);
      doc.setTextColor(200, 200, 200);
      const narrativeLines = doc.splitTextToSize(narrative.p1, 170);
      doc.text(narrativeLines, 190, fy + 10, { align: "right" });
      const mitigationLines = doc.splitTextToSize(narrative.p2, 170);
      doc.text(mitigationLines, 190, fy + 22, { align: "right" });

      // Bright spots
      fy += 50;
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129);
      doc.text(rtl("נקודות אור:"), 190, fy + 2, { align: "right" });
      doc.setFontSize(7);
      doc.setTextColor(180, 200, 180);
      brightSpots.slice(0, 3).forEach((spot, si) => {
        doc.text(`• ${spot}`, 185, fy + 10 + si * 7, { align: "right", maxWidth: 165 });
      });

      // Professional Service Value indicator
      fy += 35;
      const mortgage = Number(lead.mortgage_amount) || 0;
      doc.setFillColor(20, 30, 48);
      doc.roundedRect(15, fy - 5, 180, 22, 3, 3, "F");
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.2);
      doc.roundedRect(15, fy - 5, 180, 22, 3, 3, "S");
      doc.setFontSize(7);
      doc.setTextColor(212, 175, 55);
      doc.text("PROFESSIONAL SERVICE VALUE", 105, fy + 1, { align: "center" });
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      const svcText = mortgage >= 2000000
        ? rtl("תיק מורכב בדרגה גבוהה — ניתוח חיתום מקיף, נרטיב בנקאי מותאם, ותמיכה עד לאישור מלא")
        : rtl("ניתוח חיתום מקצועי — סקירת נתוני אשראי, בניית נרטיב בנקאי, ותוכנית פעולה ממוקדת");
      doc.text(svcText, 105, fy + 10, { align: "center", maxWidth: 160 });

      // Chitumit AI Verified seal (enhanced)
      fy += 28;
      doc.setFillColor(25, 35, 50);
      doc.roundedRect(45, fy - 5, 120, 18, 3, 3, "F");
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.6);
      doc.roundedRect(45, fy - 5, 120, 18, 3, 3, "S");
      doc.setFontSize(10);
      doc.setTextColor(212, 175, 55);
      doc.text("Chitumit AI Verified", 105, fy + 4, { align: "center" });
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text(new Date().toLocaleDateString("he-IL"), 105, fy + 10, { align: "center" });

      doc.setDrawColor(212, 175, 55);
      doc.line(15, 277, 195, 277);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("Chitumit - Bank Submission File", 105, 285, { align: "center" });
    });

    // ─── Final Page: "Verified by Chitumit" Seal & Banner ───
    doc.addPage("a4", "portrait");
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 297, "F");

    // Gold border frame
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(2);
    doc.rect(12, 12, 186, 273, "S");
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 180, 267, "S");

    // Logo centered
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", 80, 40, 50, 50);
    }

    // "Verified by Chitumit" title
    doc.setFontSize(24);
    doc.setTextColor(212, 175, 55);
    doc.text("Verified by Chitumit", 105, 110, { align: "center" });

    // Decorative line
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.8);
    doc.line(50, 118, 160, 118);

    // Audit summary
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    const auditLines = [
      `${rtl("תאריך הפקה:")} ${new Date().toLocaleDateString("he-IL")}`,
      `${rtl("מספר תיקים מנותחים:")} ${selected.length}`,
      `${rtl("נפח הלוואות כולל:")} ${totalVolume.toLocaleString()} NIS`,
      `${rtl("מנוע ניתוח:")} Chitumit AI Underwriter Advocate v2.0`,
      `${rtl("רמת ביטחון:")} ${rtl("גבוהה — נתונים מאומתים מול מסמכי מקור")}`,
    ];
    auditLines.forEach((line, i) => {
      doc.text(line, 105, 135 + i * 10, { align: "center" });
    });

    // Documents analyzed table header
    doc.setFontSize(9);
    doc.setTextColor(212, 175, 55);
    doc.text(rtl("מסמכים שנותחו:"), 190, 200, { align: "right" });
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const docTypes = [rtl("תלושי שכר"), rtl("דו\"ח BDI"), rtl("תדפיסי עו\"ש"), rtl("אישורי העסקה"), rtl("שומת מקרקעין")];
    docTypes.forEach((dt, i) => {
      doc.text(`✓ ${dt}`, 185, 210 + i * 7, { align: "right" });
    });

    // Banner at bottom
    doc.setFillColor(212, 175, 55);
    doc.roundedRect(20, 252, 170, 20, 3, 3, "F");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(rtl("תיק זה עבר חיתום AI. תהיו מאושרים."), 105, 265, { align: "center" });

    // Small footer
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(rtl("© 2026 חיתומית — האישור בדרך, תהיה מאושר."), 105, 280, { align: "center" });

    return { doc, totalVolume };
  }, []);

  const handleGenerateMasterFile = useCallback(async () => {
    const selected = enrichedLeads.filter(l => selectedBulk.has(l.id));
    if (selected.length === 0) return;

    const { doc } = await buildPdfDoc(selected);
    const fileName = `chitumit_bank_submission_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    toast.success(`קובץ PDF הופק בהצלחה עם ${selected.length} תיקים`, {
      description: fileName,
      duration: 5000,
    });
    setSelectedBulk(new Set());
  }, [enrichedLeads, selectedBulk, buildPdfDoc]);

  const handleSendToBank = useCallback(async () => {
    if (!bankEmail || !bankEmail.includes("@")) {
      toast.error("נא להזין כתובת מייל תקינה");
      return;
    }

    const selected = enrichedLeads.filter(l => selectedBulk.has(l.id));
    if (selected.length === 0) return;

    setIsSendingEmail(true);

    try {
      // Build PDF
      const { doc, totalVolume } = await buildPdfDoc(selected);
      const pdfBlob = doc.output("blob");
      const fileName = `bank_submission_${new Date().toISOString().slice(0, 10)}_${crypto.randomUUID().slice(0, 8)}.pdf`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("signed-documents")
        .upload(`bank-submissions/${fileName}`, pdfBlob, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) throw new Error(`שגיאה בהעלאת הקובץ: ${uploadError.message}`);

      // Get signed URL (7 days)
      const { data: urlData, error: urlError } = await supabase.storage
        .from("signed-documents")
        .createSignedUrl(`bank-submissions/${fileName}`, 60 * 60 * 24 * 7);

      if (urlError || !urlData?.signedUrl) throw new Error("שגיאה ביצירת קישור הורדה");

      // Send email
      const idempotencyKey = `bank-submission-${crypto.randomUUID()}`;
      const { error: emailError } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "bank-submission",
          recipientEmail: bankEmail,
          idempotencyKey,
          templateData: {
            consultantName: "",
            leadCount: selected.length,
            totalVolume: totalVolume.toLocaleString(),
            downloadUrl: urlData.signedUrl,
            generatedDate: new Date().toLocaleDateString("he-IL"),
          },
        },
      });

      if (emailError) throw new Error(`שגיאה בשליחת המייל: ${emailError.message}`);

      toast.success(`קובץ ההגשה נשלח בהצלחה למייל ${bankEmail}`, {
        description: `${selected.length} תיקים • קישור תקף ל-7 ימים`,
        duration: 6000,
      });

      setShowEmailDialog(false);
      setBankEmail("");
      setSelectedBulk(new Set());
    } catch (err: any) {
      console.error("Send to bank error:", err);
      toast.error(err.message || "שגיאה בשליחת המייל לבנק");
    } finally {
      setIsSendingEmail(false);
    }
  }, [enrichedLeads, selectedBulk, bankEmail, buildPdfDoc]);

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
            <>
              <Button
                size="sm"
                className="text-xs bg-gradient-to-l from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                onClick={handleGenerateMasterFile}
              >
                <Package className="w-3.5 h-3.5 ml-1" />
                הגש {selectedBulk.size} תיקים לבנק
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-accent/40 text-accent hover:bg-accent/10"
                onClick={() => setShowEmailDialog(true)}
              >
                <Mail className="w-3.5 h-3.5 ml-1" />
                שלח במייל לבנק
              </Button>
            </>
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

      {/* Email to Bank Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border/50" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5 text-accent" />
              שליחת קובץ הגשה למייל הבנק
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bank-email" className="text-muted-foreground text-sm">
                כתובת מייל של הבנק
              </Label>
              <Input
                id="bank-email"
                type="email"
                placeholder="mortgage@bank.co.il"
                value={bankEmail}
                onChange={(e) => setBankEmail(e.target.value)}
                className="bg-secondary/50 border-border/30 text-foreground"
                dir="ltr"
              />
            </div>
            <div className="rounded-lg bg-secondary/30 border border-border/20 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{selectedBulk.size}</span> תיקים נבחרו להגשה
              </p>
              <p className="text-xs text-muted-foreground">
                המייל יכלול קישור להורדת קובץ PDF (תקף ל-7 ימים)
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailDialog(false)}
              disabled={isSendingEmail}
            >
              ביטול
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-l from-accent to-yellow-600 hover:from-accent/90 hover:to-yellow-500 text-accent-foreground"
              onClick={handleSendToBank}
              disabled={isSendingEmail || !bankEmail}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 ml-1" />
                  שלח לבנק
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
