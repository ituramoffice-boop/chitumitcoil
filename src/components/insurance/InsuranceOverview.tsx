import { useState } from "react";
import {
  Shield, Users, FileText, TrendingUp, DollarSign, AlertTriangle,
  Brain, Radar, ShoppingCart, MessageSquare, Zap, Target,
  ArrowUpRight, Clock, Phone, Sparkles, ChevronRight, Copy, Check, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInsuranceClients, useInsurancePolicies } from "@/hooks/useInsuranceData";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ═══════ Realistic Mock Data ═══════ */

const MOCK_GAP_DATA = [
  { id: 1, name: "יוסי כהן", mortgageStatus: "אושר — ₪1,200,000", missingCoverage: ["אין ביטוח חיים", "חסר כיסוי מבנה"], urgency: "high" as const, score: 92 },
  { id: 2, name: "מירב לוי", mortgageStatus: "בתהליך — ₪850,000", missingCoverage: ["אין ביטוח אובדן כושר"], urgency: "medium" as const, score: 78 },
  { id: 3, name: "אבי ישראלי", mortgageStatus: "אושר — ₪2,100,000", missingCoverage: ["חסר ביטוח חיים משלים", "אין ביטוח מבנה"], urgency: "high" as const, score: 95 },
  { id: 4, name: "רונית דוד", mortgageStatus: "אושר — ₪600,000", missingCoverage: ["חסר כיסוי תכולה"], urgency: "low" as const, score: 45 },
  { id: 5, name: "עמית ברק", mortgageStatus: "הוגש — ₪1,500,000", missingCoverage: ["אין ביטוח חיים", "חסר ביטוח בריאות"], urgency: "high" as const, score: 88 },
  { id: 6, name: "שירה גולן", mortgageStatus: "אושר — ₪950,000", missingCoverage: ["חסר ביטוח אובדן כושר"], urgency: "medium" as const, score: 65 },
];

const MOCK_RETENTION = [
  { id: 1, name: "דני אברהם", policyType: "ביטוח חיים", company: "הראל", daysLeft: 5, premium: 320, phone: "050-1234567" },
  { id: 2, name: "נועה שמש", policyType: "ביטוח בריאות", company: "הפניקס", daysLeft: 8, premium: 450, phone: "052-9876543" },
  { id: 3, name: "עידו כץ", policyType: "ביטוח מבנה", company: "מגדל", daysLeft: 12, premium: 180, phone: "054-5551234" },
  { id: 4, name: "ליאת פרידמן", policyType: "אובדן כושר", company: "כלל", daysLeft: 18, premium: 580, phone: "050-7778899" },
  { id: 5, name: "גיל מזרחי", policyType: "ביטוח חיים", company: "מנורה", daysLeft: 22, premium: 290, phone: "053-1112233" },
];

const MOCK_LEADS = [
  { id: 1, advisor: "דוד כהן", mortgageAmount: "₪1,800,000", clientAge: 34, need: "ביטוח חיים + מבנה", price: 180, timeAgo: "לפני 12 דקות" },
  { id: 2, advisor: "יעל רוזנברג", mortgageAmount: "₪950,000", clientAge: 29, need: "ביטוח חיים", price: 90, timeAgo: "לפני 28 דקות" },
  { id: 3, advisor: "משה אלון", mortgageAmount: "₪2,400,000", clientAge: 42, need: "חיים + אובדן כושר + מבנה", price: 250, timeAgo: "לפני שעה" },
  { id: 4, advisor: "רחל בן עמי", mortgageAmount: "₪1,100,000", clientAge: 38, need: "ביטוח מבנה", price: 70, timeAgo: "לפני שעתיים" },
];

/* ═══════ Animated Counter ═══════ */
function AnimCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  return <span>{prefix}{value.toLocaleString()}{suffix}</span>;
}

/* ═══════ Component ═══════ */
export function InsuranceOverview() {
  const { data: clients, isLoading: loadingClients } = useInsuranceClients();
  const { data: policies, isLoading: loadingPolicies } = useInsurancePolicies();
  const [generatingPitch, setGeneratingPitch] = useState<number | null>(null);
  const [pitchResult, setPitchResult] = useState<{ name: string; pitch: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loading = loadingClients || loadingPolicies;

  const activePolicies = policies?.filter((p) => p.status === "active") || [];
  const totalPremium = activePolicies.reduce((s, p) => s + Number(p.monthly_premium || 0), 0);

  // Renewals within 30 days
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);
  const renewalCount = (policies || []).filter(
    (p) => p.status === "active" && p.end_date && new Date(p.end_date) <= in30 && new Date(p.end_date) > now
  ).length;

  const handleGeneratePitch = async (id: number) => {
    const row = MOCK_GAP_DATA.find((r) => r.id === id);
    if (!row) return;
    setGeneratingPitch(id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-pitch", {
        body: {
          clientName: row.name,
          mortgageStatus: row.mortgageStatus,
          missingCoverage: row.missingCoverage,
          score: row.score,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPitchResult({ name: row.name, pitch: data.pitch });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "שגיאה ביצירת הפיץ'");
    } finally {
      setGeneratingPitch(null);
    }
  };

  const handleCopyPitch = () => {
    if (!pitchResult) return;
    navigator.clipboard.writeText(pitchResult.pitch);
    setCopied(true);
    toast.success("הפיץ' הועתק!");
    setTimeout(() => setCopied(false), 2000);
  };

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="space-y-6">
      {/* ── Title ── */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">מרכז פיקוד ביטוח</h2>
        <p className="text-sm text-muted-foreground">תמונת מצב עדכנית, הזדמנויות ואיתותים חכמים</p>
      </div>

      {/* ══════════ KPI Cards ══════════ */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={fadeUp}>
            <Card className="bg-card/60 border-border/40 backdrop-blur-sm hover:border-primary/30 transition-colors group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    <AnimCounter value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ══════════ AI Gap Analyzer ══════════ */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Card className="bg-card/60 border-border/40 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-400/10">
                <Brain className="w-4 h-4 text-cyan-400" />
              </div>
              <span>AI Gap Analyzer</span>
              <Badge variant="outline" className="mr-2 text-[10px] border-cyan-400/30 text-cyan-400">
                {MOCK_GAP_DATA.length} הזדמנויות
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-right py-3 px-3 text-xs font-medium text-muted-foreground">לקוח</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-muted-foreground">סטטוס משכנתא</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-muted-foreground">כיסוי חסר</th>
                    <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground">ציון</th>
                    <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground">פעולה</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_GAP_DATA.map((row) => (
                    <tr key={row.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-medium text-foreground">{row.name}</p>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-xs">{row.mortgageStatus}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {row.missingCoverage.map((cov, i) => (
                            <Badge key={i} variant="outline" className={`text-[10px] ${
                              row.urgency === "high" ? "border-red-400/40 text-red-400 bg-red-400/5" :
                              row.urgency === "medium" ? "border-amber-400/40 text-amber-400 bg-amber-400/5" :
                              "border-border/50 text-muted-foreground"
                            }`}>
                              {cov}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-sm font-bold ${
                          row.score >= 80 ? "text-emerald-400" : row.score >= 60 ? "text-amber-400" : "text-muted-foreground"
                        }`}>
                          {row.score}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleGeneratePitch(row.id)}
                          disabled={generatingPitch === row.id}
                          className="bg-gradient-to-r from-cyan-500 to-primary text-white text-xs h-8 px-3 gap-1 hover:opacity-90"
                        >
                          {generatingPitch === row.id ? (
                            <><Sparkles className="w-3 h-3 animate-spin" /> מייצר...</>
                          ) : (
                            <><Zap className="w-3 h-3" /> AI Pitch</>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ══════════ Retention Radar ══════════ */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-2">
          <Card className="bg-card/60 border-border/40 backdrop-blur-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-400/10">
                  <Radar className="w-4 h-4 text-amber-400" />
                </div>
                <span>Retention Radar</span>
                <Badge variant="outline" className="mr-2 text-[10px] border-amber-400/30 text-amber-400">
                  {MOCK_RETENTION.length} פוליסות לחידוש
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {MOCK_RETENTION.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/30 hover:border-amber-400/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      client.daysLeft <= 7 ? "bg-red-500/15 text-red-400" :
                      client.daysLeft <= 14 ? "bg-amber-400/15 text-amber-400" :
                      "bg-muted/30 text-muted-foreground"
                    }`}>
                      {client.daysLeft}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.policyType} • {client.company} • ₪{client.premium}/חודש</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${
                      client.daysLeft <= 7 ? "border-red-400/40 text-red-400" :
                      client.daysLeft <= 14 ? "border-amber-400/40 text-amber-400" :
                      "border-border/50 text-muted-foreground"
                    }`}>
                      <Clock className="w-3 h-3 ml-1" />
                      {client.daysLeft} ימים
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => window.open(`https://wa.me/972${client.phone.replace(/\D/g, "").slice(1)}`, "_blank")}
                    >
                      <MessageSquare className="w-3 h-3" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════ Lead Marketplace (Cross-Sell) ══════════ */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <Card className="bg-card/60 border-border/40 backdrop-blur-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gold/10">
                  <ShoppingCart className="w-4 h-4 text-gold" />
                </div>
                <span>שוק לידים</span>
                <span className="mr-auto flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_LEADS.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 rounded-xl bg-gradient-to-r from-gold/5 to-transparent border border-gold/10 hover:border-gold/25 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">{lead.timeAgo}</p>
                    <Badge className="bg-gold/15 text-gold border-gold/20 text-[10px]">
                      ₪{lead.price}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground mb-1">
                    <span className="text-gold font-medium">{lead.advisor}</span>
                    {" "}סגר משכנתא {lead.mortgageAmount}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2.5">
                    לקוח בן {lead.clientAge} — צריך: <span className="text-foreground">{lead.need}</span>
                  </p>
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs bg-gold/15 text-gold hover:bg-gold/25 border border-gold/20 gap-1"
                    variant="ghost"
                  >
                    <Target className="w-3 h-3" />
                    רכוש ליד — ₪{lead.price}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
