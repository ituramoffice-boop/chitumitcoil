import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Users, Calendar, Settings, Phone, Video, FileText,
  Shield, Bot, Clock, ChevronLeft, Sparkles, Eye, MessageCircle,
  TrendingUp, Zap, Star, CheckCheck, X, Download, Lock,
  CreditCard, Heart, Building2, User, Mail, Hash, AlertTriangle, RotateCcw,
  Search, Flame, Snowflake, ThermometerSun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDemo } from "@/contexts/DemoContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { icon: Home, label: "ראשי", active: true },
  { icon: Users, label: "לידים חדשים" },
  { icon: Calendar, label: "יומן פגישות" },
  { icon: Settings, label: "הגדרות AI" },
];

type HeatStatus = "hot" | "warm" | "cold";

interface LeadRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  lead_score: number | null;
  ai_analysis: any;
  created_at: string;
  lead_source: string | null;
  mortgage_amount: number | null;
  monthly_income: number | null;
  property_value: number | null;
  notes: string | null;
  next_step: string | null;
  heat_status: string | null;
}

function getHeatFromScore(score: number | null): HeatStatus {
  if (!score) return "cold";
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

const HEAT_CONFIG: Record<HeatStatus, { label: string; icon: any; bg: string; text: string; border: string }> = {
  hot: { label: "חם 🔥", icon: Flame, bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  warm: { label: "פושר", icon: ThermometerSun, bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  cold: { label: "קר ❄️", icon: Snowflake, bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
};

function CrossRefIndicator({ status }: { status: string | null }) {
  if (!status) return null;
  const s = status.toLowerCase();
  const color = s === "green" ? "bg-emerald-400" : s === "yellow" ? "bg-amber-400" : "bg-red-400";
  const label = s === "green" ? "תקין" : s === "yellow" ? "חריגה קלה" : "חריגה חמורה";
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-white/60">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function WowAlerts({ alerts }: { alerts: string[] | null }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {alerts.slice(0, 3).map((alert, i) => {
        const isWarning = alert.includes("⚠️") || alert.includes("נמוכ") || alert.includes("חריג");
        return (
          <span
            key={i}
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              isWarning
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}
          >
            {alert}
          </span>
        );
      })}
    </div>
  );
}

function getScanType(ai: any): string {
  if (!ai) return "—";
  if (ai.salary_verification || ai.payslip_data) return "תלוש שכר";
  if (ai.mortgage || ai.bank_name || ai.monthly_transactions) return "דף חשבון";
  return "לא ידוע";
}

function FullAnalysisPanel({ lead, open, onClose, heatStatus, onChangeHeat }: {
  lead: LeadRow | null;
  open: boolean;
  onClose: () => void;
  heatStatus: HeatStatus;
  onChangeHeat: (h: HeatStatus) => void;
}) {
  if (!lead) return null;
  const ai = lead.ai_analysis as any;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-lg bg-[#0d1225] border-white/10 text-white overflow-y-auto" dir="rtl">
        <SheetHeader>
          <SheetTitle className="text-white text-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-amber-600 flex items-center justify-center text-black font-bold">
              {lead.full_name.charAt(0)}
            </div>
            {lead.full_name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Client name from bank statement */}
          {ai?.client?.full_name && ai.client.full_name !== lead.full_name && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center gap-2">
              <User size={14} className="text-[hsl(var(--primary))]" />
              <div>
                <p className="text-white/40 text-[10px]">שם מדף הבנק</p>
                <p className="text-white/80 text-sm font-medium">{ai.client.full_name}</p>
              </div>
              {ai.client.bank_name && (
                <Badge variant="outline" className="mr-auto text-[10px] text-white/50 border-white/10">
                  {ai.client.bank_name} • {ai.client.account_number || ""}
                </Badge>
              )}
            </div>
          )}

          {/* Contact info */}
          <div className="grid grid-cols-2 gap-3">
            {lead.phone && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-white/40 text-[10px] mb-1">טלפון</p>
                <p className="text-white/80 text-sm font-medium">{lead.phone}</p>
              </div>
            )}
            {lead.email && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-white/40 text-[10px] mb-1">אימייל</p>
                <p className="text-white/80 text-sm font-medium truncate">{lead.email}</p>
              </div>
            )}
            {lead.mortgage_amount && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-white/40 text-[10px] mb-1">סכום משכנתא</p>
                <p className="text-white/80 text-sm font-medium">₪{lead.mortgage_amount.toLocaleString()}</p>
              </div>
            )}
            {lead.monthly_income && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-white/40 text-[10px] mb-1">הכנסה חודשית</p>
                <p className="text-white/80 text-sm font-medium">₪{lead.monthly_income.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Employer */}
          {ai?.employer?.name && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[hsl(var(--primary))]" />
                <div>
                  <p className="text-white/40 text-[10px]">מעסיק</p>
                  <p className="text-white/80 text-sm font-semibold">{ai.employer.name}</p>
                </div>
              </div>
              <Badge className={`text-[10px] ${
                ai.employer.confidence === "high" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                ai.employer.confidence === "medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                "bg-red-500/20 text-red-400 border-red-500/30"
              }`}>
                {ai.employer.confidence === "high" ? "✓ מאומת" :
                 ai.employer.confidence === "medium" ? "בינוני" : "לא מזוהה"}
              </Badge>
            </div>
          )}
          {ai?.employer_name && !ai?.employer?.name && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center gap-2">
              <Building2 size={16} className="text-[hsl(var(--primary))]" />
              <div>
                <p className="text-white/40 text-[10px]">מעסיק</p>
                <p className="text-white/80 text-sm font-semibold">{ai.employer_name}</p>
              </div>
            </div>
          )}

          {/* Health Insurance / קופת חולים */}
          {ai?.health_insurance?.provider && ai.health_insurance.provider !== "unknown" && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-pink-400" />
                <div>
                  <p className="text-white/40 text-[10px]">קופת חולים</p>
                  <p className="text-white/80 text-sm font-semibold">{ai.health_insurance.provider}</p>
                  {ai.health_insurance.monthly_payment > 0 && (
                    <p className="text-white/50 text-[10px]">₪{ai.health_insurance.monthly_payment.toLocaleString()}/חודש</p>
                  )}
                </div>
              </div>
              <Badge className={`text-[10px] ${
                ai.health_insurance.confidence === "high" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                ai.health_insurance.confidence === "medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                "bg-red-500/20 text-red-400 border-red-500/30"
              }`}>
                {ai.health_insurance.confidence === "high" ? "✓ מאומת" :
                 ai.health_insurance.confidence === "medium" ? "בינוני" : "לא מזוהה"}
              </Badge>
            </div>
          )}

          {/* Heat selector */}
          <div>
            <p className="text-white/40 text-xs mb-2">סטטוס חום</p>
            <div className="flex gap-2">
              {(["hot", "warm", "cold"] as HeatStatus[]).map(h => {
                const cfg = HEAT_CONFIG[h];
                return (
                  <button
                    key={h}
                    onClick={() => onChangeHeat(h)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all ${
                      heatStatus === h
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-current`
                        : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60"
                    }`}
                  >
                    <cfg.icon size={14} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Analysis JSON */}
          {ai && (
            <>
              {/* Advisor Summary */}
              {ai.advisor_summary && (
                <div className="bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-[hsl(var(--primary))]" />
                    <span className="text-[hsl(var(--primary))] text-sm font-semibold">סיכום יועץ AI</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{ai.advisor_summary}</p>
                </div>
              )}

              {/* Wow Alerts */}
              {ai.wow_alerts && ai.wow_alerts.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs mb-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> התראות AI
                  </p>
                  <div className="space-y-1.5">
                    {ai.wow_alerts.map((alert: string, i: number) => {
                      const isWarning = alert.includes("⚠️") || alert.includes("נמוכ");
                      return (
                        <div key={i} className={`text-xs px-3 py-2 rounded-xl border ${
                          isWarning
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {alert}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cross-reference */}
              {ai.cross_reference_status && (
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs">הצלבה:</span>
                  <CrossRefIndicator status={ai.cross_reference_status} />
                </div>
              )}

              {/* Salary Verification */}
              {ai.salary_verification && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <p className="text-white/40 text-xs mb-2">אימות שכר</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-white/40 text-[10px]">ממוצע הפקדה</span>
                      <p className="text-white/80 font-medium">₪{ai.salary_verification.average_monthly_deposit?.toLocaleString() || "—"}</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-[10px]">התאמה לתלוש</span>
                      <p className={ai.salary_verification.matches_payslip ? "text-emerald-400" : "text-red-400"}>
                        {ai.salary_verification.matches_payslip ? "✓ תואם" : "✗ אי-התאמה"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mortgage */}
              {ai.mortgage?.detected && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <p className="text-white/40 text-xs mb-2">משכנתא מזוהה</p>
                  <p className="text-white/80 text-sm">₪{ai.mortgage.monthly_payment?.toLocaleString() || "—"} / חודש</p>
                  {ai.mortgage.bank_name && <p className="text-white/40 text-[10px]">בנק: {ai.mortgage.bank_name}</p>}
                </div>
              )}

              {/* Total monthly obligations */}
              {ai.total_monthly_obligations && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
                  <span className="text-white/40 text-xs">סה״כ התחייבויות חודשיות</span>
                  <span className="text-[hsl(var(--primary))] font-bold">₪{ai.total_monthly_obligations.toLocaleString()}</span>
                </div>
              )}

              {/* Debt to income */}
              {ai.debt_to_income_ratio != null && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
                  <span className="text-white/40 text-xs">יחס חוב להכנסה</span>
                  <span className={`font-bold ${ai.debt_to_income_ratio > 40 ? "text-red-400" : "text-emerald-400"}`}>
                    {ai.debt_to_income_ratio}%
                  </span>
                </div>
              )}

              {/* Insurance charges */}
              {ai.insurance_charges && ai.insurance_charges.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs mb-2">חיובי ביטוח</p>
                  <div className="space-y-1">
                    {ai.insurance_charges.map((ins: any, i: number) => (
                      <div key={i} className="flex justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs">
                        <span className="text-white/70">{ins.company} — {ins.description}</span>
                        <span className="text-white/80 font-medium">₪{ins.monthly_amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw JSON fallback */}
              <details className="mt-4">
                <summary className="text-white/30 text-[10px] cursor-pointer hover:text-white/50">הצג JSON גולמי</summary>
                <pre className="mt-2 bg-black/30 rounded-xl p-3 text-[10px] text-white/40 overflow-auto max-h-60 whitespace-pre-wrap" dir="ltr">
                  {JSON.stringify(ai, null, 2)}
                </pre>
              </details>
            </>
          )}

          {!ai && (
            <div className="text-center py-8 text-white/30 text-sm">
              אין ניתוח AI עבור ליד זה
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const DEMO_LEADS: LeadRow[] = [
  {
    id: "demo-1", full_name: "ישראל כהן", phone: "054-1234567", email: "israel@email.co.il",
    status: "in_progress", lead_score: 87, created_at: new Date().toISOString(),
    lead_source: "משפך מסלקה", mortgage_amount: 1800000, monthly_income: 22000, property_value: 2500000,
    notes: null, next_step: "פגישת זום מחר", heat_status: null,
    ai_analysis: {
      personal: { account_holder: "ישראל כהן", bank_name: "לאומי", account_number: "4567" },
      salary_verification: { net_deposits: [21500, 22100, 21800], average_monthly_deposit: 21800, matches_payslip: true, discrepancy_amount: 0 },
      mortgage: { detected: true, monthly_payment: 4200, bank_name: "לאומי", remaining_balance: 850000 },
      total_monthly_obligations: 8400,
      debt_to_income_ratio: 38,
      insurance_charges: [
        { company: "מגדל", monthly_amount: 320, description: "ביטוח בריאות" },
        { company: "הראל", monthly_amount: 290, description: "ביטוח בריאות — כפילות" },
      ],
      wow_alerts: ["⚠️ כפל ביטוחי בריאות — חיסכון 290 ש״ח", "🏠 משכנתא: 4,200 ש״ח לחודש", "✅ יחס חוב-הכנסה תקין"],
      cross_reference_status: "green",
      employer: { name: "אלביט מערכות", confidence: "high", verification_method: "MSB code 71", needs_manual_verification: false },
      employer_name: "אלביט מערכות",
      health_insurance: { provider: "מכבי", monthly_payment: 120, confidence: "high" },
      advisor_summary: "לקוח עם פרופיל חזק. מעסיק: אלביט מערכות (מאומת MSB). זוהה כפל ביטוחי בריאות (מגדל + הראל). חיסכון שנתי פוטנציאלי: ₪3,480. יחס חוב/הכנסה 38% — תקין. מומלץ לקבוע פגישה לביטול הכפילות."
    }
  },
  {
    id: "demo-2", full_name: "רונית לוי", phone: "052-9876543", email: "ronit@gmail.com",
    status: "new", lead_score: 62, created_at: new Date(Date.now() - 86400000).toISOString(),
    lead_source: "מחשבון משכנתא", mortgage_amount: 1200000, monthly_income: 15000, property_value: 1700000,
    notes: null, next_step: null, heat_status: null,
    ai_analysis: {
      personal: { account_holder: "רונית לוי", bank_name: "הפועלים", account_number: "8901" },
      salary_verification: { net_deposits: [14200, 14800], average_monthly_deposit: 14500, matches_payslip: false, discrepancy_amount: 500, discrepancy_alert: "הפקדה נמוכה ב-500 ש״ח מהתלוש" },
      mortgage: { detected: false },
      total_monthly_obligations: 5200,
      debt_to_income_ratio: 35,
      wow_alerts: ["⚠️ הפקדת נטו נמוכה ב-500 ש״ח מהתלוש", "⚠️ אין משכנתא פעילה — בקשה חדשה"],
      cross_reference_status: "yellow",
      advisor_summary: "לקוחה חדשה ממחשבון משכנתא. פער קל בהפקדות מול תלוש (500 ש״ח). אין משכנתא פעילה — מבקשת משכנתא ראשונה. דרושה בדיקה נוספת."
    }
  },
  {
    id: "demo-3", full_name: "אבי מזרחי", phone: "050-5551234", email: "avi.m@outlook.com",
    status: "contacted", lead_score: 45, created_at: new Date(Date.now() - 172800000).toISOString(),
    lead_source: "אתר", mortgage_amount: 900000, monthly_income: 12000, property_value: 1300000,
    notes: null, next_step: "שליחת הצעה", heat_status: null,
    ai_analysis: {
      salary_verification: { average_monthly_deposit: 11200, matches_payslip: false, discrepancy_amount: 800 },
      mortgage: { detected: true, monthly_payment: 3100, bank_name: "דיסקונט" },
      total_monthly_obligations: 7800,
      debt_to_income_ratio: 65,
      wow_alerts: ["⚠️ יחס חוב להכנסה גבוה: 65%", "⚠️ הפקדה נמוכה ב-800 ש״ח", "🏠 משכנתא קיימת: 3,100 ש״ח"],
      cross_reference_status: "red",
      advisor_summary: "יחס חוב/הכנסה גבוה מאוד (65%). פער משמעותי בהפקדות. דרוש שיפור פרופיל פיננסי לפני הגשה לבנק. מומלץ תוכנית הבראה 6-12 חודשים."
    }
  },
  {
    id: "demo-4", full_name: "מיכל אברהם", phone: "058-7773344", email: null,
    status: "new", lead_score: 91, created_at: new Date(Date.now() - 3600000).toISOString(),
    lead_source: "תלוש שכר", mortgage_amount: 2200000, monthly_income: 35000, property_value: 3000000,
    notes: null, next_step: null, heat_status: null,
    ai_analysis: {
      salary_verification: { average_monthly_deposit: 34800, matches_payslip: true },
      mortgage: { detected: false },
      total_monthly_obligations: 3200,
      debt_to_income_ratio: 9,
      wow_alerts: ["✅ פרופיל חזק מאוד", "✅ יחס חוב-הכנסה מצוין: 9%", "🔥 VIP — סכום משכנתא מעל 2M"],
      cross_reference_status: "green",
      advisor_summary: "VIP — הכנסה גבוהה, יחס חוב/הכנסה מצוין (9%). בקשה למשכנתא ראשונה בסך 2.2M ש״ח. סיכויי אישור גבוהים מאוד. דרוש תיאום פגישה דחוף."
    }
  },
];

export default function AgentCRMDashboard() {
  const [activeNav, setActiveNav] = useState(0);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const heatOverrides = useMemo(() => {
    const map: Record<string, HeatStatus> = {};
    leads.forEach(l => {
      if (l.heat_status && ["hot", "warm", "cold"].includes(l.heat_status)) {
        map[l.id] = l.heat_status as HeatStatus;
      }
    });
    return map;
  }, [leads]);
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const urlDemo = new URLSearchParams(window.location.search).get("demo") === "true";
  const isDemo = isDemoMode || urlDemo;

  useEffect(() => {
    if (isDemo) {
      setLeads(DEMO_LEADS);
      setLoading(false);
    } else {
      fetchLeads();
    }
  }, [user, isDemoMode]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching leads:", error);
      toast.error("שגיאה בטעינת הלידים");
    } else {
      setLeads((data || []) as LeadRow[]);
    }
    setLoading(false);
  };

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.full_name.toLowerCase().includes(q) ||
      (l.phone && l.phone.includes(q))
    );
  }, [leads, search]);

  const stats = useMemo(() => {
    const hot = leads.filter(l => getHeatFromScore(l.lead_score) === "hot" || heatOverrides[l.id] === "hot").length;
    const withAi = leads.filter(l => l.ai_analysis).length;
    const totalWaste = leads.reduce((sum, l) => {
      const ai = l.ai_analysis as any;
      return sum + (ai?.total_monthly_obligations || 0);
    }, 0);
    return [
      { label: "לידים חמים", value: hot, icon: Zap, color: "text-orange-400" },
      { label: "סה״כ לידים", value: leads.length, icon: Users, color: "text-emerald-400" },
      { label: "ניתוחי AI", value: withAi, icon: Bot, color: "text-[hsl(var(--primary))]" },
      { label: "התחייבויות חודשיות", value: `₪${totalWaste.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
    ];
  }, [leads, heatOverrides]);

  const getHeat = (lead: LeadRow): HeatStatus => heatOverrides[lead.id] || getHeatFromScore(lead.lead_score);

  return (
    <div dir="rtl" className="min-h-screen bg-[#0a0e1a] text-white flex">
      {/* Side Navigation */}
      <nav className="w-16 lg:w-56 bg-[#0d1225]/80 backdrop-blur-xl border-l border-white/5 flex flex-col items-center lg:items-stretch py-6 gap-1 shrink-0">
        <div className="flex items-center justify-center lg:justify-start lg:px-5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-amber-600 flex items-center justify-center text-black font-bold text-lg">
            ח
          </div>
          <span className="hidden lg:block mr-3 font-bold text-lg bg-gradient-to-l from-[hsl(var(--primary))] to-amber-300 bg-clip-text text-transparent">
            Chitumit CRM
          </span>
        </div>
        {NAV_ITEMS.map((item, i) => (
          <button
            key={i}
            onClick={() => setActiveNav(i)}
            className={`relative flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-5 py-3 mx-2 rounded-xl transition-all ${
              activeNav === i
                ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]"
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            <item.icon size={20} />
            <span className="hidden lg:block text-sm font-medium">{item.label}</span>
          </button>
        ))}
        <div className="mt-auto px-3 lg:px-5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <Bot size={20} className="text-emerald-400 mx-auto mb-1" />
            <p className="hidden lg:block text-[10px] text-emerald-400 font-medium">AI Agent פעיל</p>
            <div className="w-2 h-2 rounded-full bg-emerald-400 mx-auto mt-1 animate-pulse" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              לוח בקרה סוכן —{" "}
              <span className="bg-gradient-to-l from-[hsl(var(--primary))] to-amber-300 bg-clip-text text-transparent">
                לידים וניתוח AI
              </span>
            </h1>
            <p className="text-white/40 text-sm mt-1">
              <Bot size={14} className="inline ml-1 text-emerald-400" />
              {leads.length} לידים במערכת
            </p>
          </div>
          <Button onClick={fetchLeads} variant="outline" size="sm" className="border-white/10 text-white/50 hover:text-white gap-1">
            <RotateCcw size={14} /> רענן
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={16} className={stat.color} />
                <span className="text-white/40 text-xs">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="חיפוש לפי שם או טלפון..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 pr-10 h-11 rounded-xl"
          />
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>לא נמצאו לידים</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead, i) => {
              const ai = lead.ai_analysis as any;
              const heat = getHeat(lead);
              const heatCfg = HEAT_CONFIG[heat];
              const scanType = getScanType(ai);
              const totalWaste = ai?.total_monthly_obligations;
              const crossRef = ai?.cross_reference_status;

              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedLead(lead)}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:border-white/15 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))]/20 to-amber-600/20 border border-[hsl(var(--primary))]/20 flex items-center justify-center text-[hsl(var(--primary))] font-bold shrink-0">
                        {lead.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white/90">{lead.full_name}</p>
                          {/* Heat tag */}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${heatCfg.bg} ${heatCfg.text} ${heatCfg.border}`}>
                            <heatCfg.icon size={10} />
                            {heatCfg.label}
                          </span>
                          {/* Scan type */}
                          {scanType !== "—" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              {scanType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-white/40 text-xs">
                          {lead.phone && <span>{lead.phone}</span>}
                          <span>{new Date(lead.created_at).toLocaleDateString("he-IL")}</span>
                          {lead.lead_score != null && <span>ציון: {lead.lead_score}</span>}
                        </div>
                        {/* Wow alerts */}
                        <WowAlerts alerts={ai?.wow_alerts} />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {totalWaste && (
                        <span className="text-xs text-[hsl(var(--primary))] font-bold">₪{totalWaste.toLocaleString()}</span>
                      )}
                      <CrossRefIndicator status={crossRef} />
                      <ChevronLeft size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Side Panel */}
      <FullAnalysisPanel
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        heatStatus={selectedLead ? getHeat(selectedLead) : "cold"}
        onChangeHeat={async (h) => {
          if (selectedLead) {
            const { error } = await supabase
              .from("leads")
              .update({ heat_status: h } as any)
              .eq("id", selectedLead.id);
            if (error) {
              toast.error("שגיאה בשמירת סטטוס");
            } else {
              setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, heat_status: h } : l));
              toast.success(`סטטוס ${HEAT_CONFIG[h].label} עודכן`);
            }
          }
        }}
      />
    </div>
  );
}
