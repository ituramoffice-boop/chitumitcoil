import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AIScannerWidget from "@/components/AIScannerWidget";
import { TrustBankLogos } from "@/components/TrustBankLogos";
import { ReadinessScore } from "@/components/ReadinessScore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ShieldCheck, Lock, Landmark, TrendingDown, PiggyBank,
  AlertTriangle, CheckCircle2, CreditCard, Building2, Mail, Loader2, Search
} from "lucide-react";
import { AnalysisResultDashboard } from "@/components/AnalysisResultDashboard";
import { calculateDTI, calculateTotalLiabilities, extractVerifiedSalary } from "@/lib/analysis-utils";

interface AnalysisResult {
  verifiedSalary: number;
  totalLiabilities: number;
  dtiRatio: number;
  clientName?: string;
}

export default function BankStatementLanding() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [deepScanMode, setDeepScanMode] = useState(false);

  const mapAnalysisResult = (data: Record<string, unknown>) => {
    const parsedData = ((data.ai_analysis as Record<string, unknown> | undefined) ?? data) as Record<string, unknown>;
    
    console.log("=== FULL RAW DATA FROM EDGE FUNCTION ===", JSON.stringify(data, null, 2));
    console.log("=== PARSED DATA (ai_analysis or root) ===", JSON.stringify(parsedData, null, 2));

    if (!parsedData || typeof parsedData !== "object") {
      console.warn("parsedData is empty or not an object, setting null");
      setAnalysisResult(null);
      return;
    }

    // Extract backend values first
    const salaryFromBackend = Number(
      parsedData.verified_salary ??
      (parsedData.salary_verification as { average_monthly_deposit?: number } | undefined)?.average_monthly_deposit ??
      (parsedData.summary as { verifiedSalary?: number } | undefined)?.verifiedSalary ??
      0
    );
    const liabilitiesFromBackend = Number(
      parsedData.total_monthly_obligations ?? 
      (parsedData.summary as { totalLiabilities?: number } | undefined)?.totalLiabilities ??
      0
    );
    const dtiFromBackend = Number(parsedData.total_dti_ratio ?? parsedData.debt_to_income_ratio ?? 0);

    console.log("=== BACKEND VALUES ===", { salaryFromBackend, liabilitiesFromBackend, dtiFromBackend });

    // Try client-side extraction from transactions as fallback
    const rawTransactions = Array.isArray(parsedData.transactions)
      ? (parsedData.transactions as Array<Record<string, unknown>>)
      : [];

    console.log(`=== TRANSACTIONS COUNT: ${rawTransactions.length} ===`);

    const normalizedTransactions = rawTransactions
      .map((tx) => {
        const rawAmount = Number(tx.amount ?? 0);
        const txType = String(tx.type ?? "").toLowerCase();
        const hasDebit = tx.debit != null && Number(tx.debit) > 0;
        const hasCredit = tx.credit != null && Number(tx.credit) > 0;
        
        // Use debit/credit fields from AI if available, they're more reliable than "type"
        let inferredType: "debit" | "credit";
        if (hasCredit && !hasDebit) {
          inferredType = "credit";
        } else if (hasDebit && !hasCredit) {
          inferredType = "debit";
        } else {
          inferredType = txType === "credit" ? "credit" : "debit";
        }

        const rawReference = String(tx.reference_code ?? tx.bank_code ?? "");
        const referenceCode = rawReference.split("/")[0]?.trim();
        const amount = hasCredit ? Number(tx.credit) : hasDebit ? Number(tx.debit) : Math.abs(rawAmount);

        return {
          description: String(tx.description ?? ""),
          reference_code: referenceCode,
          amount,
          type: inferredType,
        };
      })
      .filter((tx) => tx.description || tx.amount > 0);

    const salaryFromTransactions = extractVerifiedSalary(normalizedTransactions);
    const liabilitiesFromTransactions = calculateTotalLiabilities(normalizedTransactions);
    const dtiFromTransactions = calculateDTI(liabilitiesFromTransactions, salaryFromTransactions);

    console.log("=== CLIENT-SIDE EXTRACTION ===", { salaryFromTransactions, liabilitiesFromTransactions, dtiFromTransactions });

    // Prefer non-zero values: backend first, then client-side fallback
    const verifiedSalary = salaryFromBackend || salaryFromTransactions;
    const totalLiabilities = liabilitiesFromBackend || liabilitiesFromTransactions;
    const dtiRatio = dtiFromBackend || dtiFromTransactions;

    const clientName =
      (parsedData.personal as { account_holder?: string } | undefined)?.account_holder ||
      (parsedData.client as { full_name?: string } | undefined)?.full_name ||
      undefined;

    console.log("=== FINAL DASHBOARD VALUES ===", { verifiedSalary, totalLiabilities, dtiRatio, clientName });

    setAnalysisResult({
      verifiedSalary,
      totalLiabilities,
      dtiRatio,
      clientName,
    });
  };

  const analysis = result?.ai_analysis as Record<string, unknown> | undefined;

  // New schema mappings
  const personal = analysis?.personal as { account_holder?: string; bank_name?: string; account_number?: string } | undefined;
  const salaryVerification = analysis?.salary_verification as {
    net_deposits?: number[];
    average_monthly_deposit?: number;
    matches_payslip?: boolean;
    discrepancy_amount?: number;
    discrepancy_alert?: string;
  } | undefined;
  const mortgage = analysis?.mortgage as {
    detected?: boolean;
    monthly_payment?: number;
    bank_name?: string;
    estimated_remaining?: string;
  } | undefined;
  const existingLoans = analysis?.existing_loans as Array<{
    description: string;
    monthly_payment: number;
    lender: string;
  }> | undefined;
  const insuranceCharges = analysis?.insurance_charges as Array<{
    company: string;
    monthly_amount: number;
    description: string;
  }> | undefined;
  const standingOrders = analysis?.standing_orders as Array<{
    description: string;
    monthly_amount: number;
    recipient: string;
    category: string;
  }> | undefined;
  const totalObligations = analysisResult?.totalLiabilities ?? ((analysis?.total_monthly_obligations as number) || 0);
  const debtToIncome = analysisResult?.dtiRatio ?? ((analysis?.debt_to_income_ratio as number) || 0);
  const wowAlerts = analysis?.wow_alerts as string[] | undefined;
  const advisorSummary = analysis?.advisor_summary as string | undefined;
  const crossRefStatus = analysis?.cross_reference_status as string | undefined;

  const avgIncome = salaryVerification?.average_monthly_deposit || 0;
  const mortgagePayment = mortgage?.monthly_payment || 0;
  const verifiedSalary = analysisResult?.verifiedSalary ?? ((analysis?.verified_salary as number) || 0);
  const verifiedBy = analysis?.verified_by as string || "";
  const totalDtiRatio = analysisResult?.dtiRatio ?? ((analysis?.total_dti_ratio as number) || 0);
  const dtiStatus = analysis?.dti_status as "green" | "yellow" | "red" | undefined;

  const healthScore = analysis
    ? Math.max(0, Math.min(100, Math.round(
        100 - (debtToIncome || 0) * 1.2 -
        (insuranceCharges && insuranceCharges.length > 3 ? 10 : 0) -
        (salaryVerification && !salaryVerification.matches_payslip ? 15 : 0)
      )))
    : 0;

  const estimatedSavings = analysis
    ? Math.round(
        (insuranceCharges?.reduce((s, p) => s + p.monthly_amount * 0.15, 0) || 0) +
        (mortgagePayment ? mortgagePayment * 0.08 : 0)
      )
    : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-[hsl(220,30%,12%)] via-[hsl(220,25%,15%)] to-[hsl(220,20%,10%)] text-foreground">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(45,70%,50%,0.08),transparent_60%)]" />
        <div className="max-w-3xl mx-auto px-4 pt-16 pb-10 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 mb-6">
              <Landmark className="w-4 h-4 text-gold" />
              <span className="text-xs font-semibold text-gold">ניתוח AI מתקדם</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
              בדיקת זכאות למחזור משכנתא
              <br />
              <span className="text-gold">וחיסכון בעלויות</span>
            </h1>
            <p className="text-base text-blue-200/70 max-w-lg mx-auto">
              העלו דף חשבון בנק – ה-AI יזהה משכנתא, ביטוחים, הלוואות ויחשב את פוטנציאל החיסכון שלכם
            </p>
          </motion.div>
        </div>
      </header>

      {/* Scanner Section */}
      <section className="max-w-2xl mx-auto px-4 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border-gold/10">
            <CardContent className="p-6">
              <AIScannerWidget
                type="bank_statement"
                onSubmit={(data) => {
                  setResult(data);
                  setDeepScanMode(false);
                  mapAnalysisResult(data);
                }}
                extraBody={deepScanMode ? { deep_scan: true } : undefined}
                key={deepScanMode ? "deep" : "normal"}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-5"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300">הצפנה בנקאית 256-bit · המידע לא נשמר</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        </motion.div>

        {/* Trust Bank Logos */}
        <div className="mt-8">
          <TrustBankLogos />
        </div>
      </section>

      {/* Results Section */}
      <AnimatePresence>
        {analysis && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto px-4 pb-20 space-y-6"
          >
            {/* Deep Scan Button */}
            {!deepScanMode && (
              <Card className="bg-white/5 backdrop-blur-xl border-gold/10">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">רוצים ניתוח מעמיק יותר?</p>
                    <p className="text-xs text-white/50">סריקה מעמיקה מנתחת את כל העמודים</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gold/30 text-gold hover:bg-gold/10"
                    onClick={() => {
                      setDeepScanMode(true);
                      setResult(null);
                      setAnalysisResult(null);
                    }}
                  >
                    <Search className="w-3.5 h-3.5 ml-1.5" />
                    סריקה מעמיקה
                  </Button>
                </CardContent>
              </Card>
            )}

            <AnalysisResultDashboard analysisResult={analysisResult} />
            {/* Financial Health Score + Savings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Health Score */}
              <Card className="bg-white/5 backdrop-blur-xl border-gold/10">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <p className="text-sm text-blue-200/60 font-medium">ציון בריאות פיננסית</p>
                  <ReadinessScore score={healthScore} />
                  <Badge
                    variant={healthScore >= 70 ? "default" : "destructive"}
                    className={healthScore >= 70 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : ""}
                  >
                    {healthScore >= 80 ? "מצוין" : healthScore >= 60 ? "טוב" : healthScore >= 40 ? "דורש שיפור" : "נדרשת תשומת לב"}
                  </Badge>
                </CardContent>
              </Card>

              {/* Estimated Savings */}
              <Card className="bg-emerald-500/10 backdrop-blur-xl border-emerald-500/20">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <PiggyBank className="w-10 h-10 text-emerald-400" />
                  <p className="text-sm text-emerald-200/70 font-medium">חיסכון חודשי משוער</p>
                  <p className="text-4xl font-black text-emerald-300">
                    ₪{estimatedSavings.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-200/50">
                    ₪{(estimatedSavings * 12).toLocaleString()} בשנה
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Verified Salary & DTI Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Verified Salary */}
              <Card className="bg-white/5 backdrop-blur-xl border-gold/10">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-sm text-blue-200/60 font-medium">שכר מאומת</p>
                  <p className="text-3xl font-black text-white">
                    ₪{verifiedSalary.toLocaleString()}
                  </p>
                  {verifiedBy && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] font-bold text-emerald-300">{verifiedBy}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* DTI Gauge */}
              <Card className={`backdrop-blur-xl ${
                dtiStatus === "red" ? "bg-red-500/10 border-red-500/20" :
                dtiStatus === "yellow" ? "bg-amber-500/10 border-amber-500/20" :
                "bg-emerald-500/10 border-emerald-500/20"
              }`}>
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <p className="text-sm text-blue-200/60 font-medium">יחס החזר חוב (DTI)</p>
                  {/* Visual gauge */}
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                        className="stroke-white/10" />
                      <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                        strokeDasharray={`${Math.min(totalDtiRatio, 100) * 2.64} 264`}
                        strokeLinecap="round"
                        className={
                          dtiStatus === "red" ? "stroke-red-400" :
                          dtiStatus === "yellow" ? "stroke-amber-400" :
                          "stroke-emerald-400"
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-black ${
                        dtiStatus === "red" ? "text-red-400" :
                        dtiStatus === "yellow" ? "text-amber-400" :
                        "text-emerald-300"
                      }`}>
                        {totalDtiRatio}%
                      </span>
                    </div>
                  </div>
                  <Badge className={
                    dtiStatus === "red" ? "bg-red-500/20 text-red-300 border-red-500/30" :
                    dtiStatus === "yellow" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  }>
                    {dtiStatus === "red" ? "מעל הסף – סיכון" :
                     dtiStatus === "yellow" ? "קרוב לסף – זהירות" :
                     "תקין – ירוק"}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Income & Mortgage */}
            <Card className="bg-white/5 backdrop-blur-xl border-gold/10">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-bold text-gold flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  סיכום הכנסות והתחייבויות
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-blue-200/50 text-xs">הכנסה חודשית ממוצעת</p>
                    <p className="text-lg font-bold text-white">₪{avgIncome?.toLocaleString() || "—"}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-blue-200/50 text-xs">החזר משכנתא</p>
                    <p className="text-lg font-bold text-white">₪{mortgagePayment?.toLocaleString() || "—"}</p>
                    {mortgage?.bank_name && <p className="text-[10px] text-blue-200/40">{mortgage.bank_name}</p>}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-blue-200/50 text-xs">סה״כ התחייבויות</p>
                    <p className="text-lg font-bold text-white">₪{totalObligations.toLocaleString()}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${debtToIncome > 40 ? "bg-red-500/10 border border-red-500/20" : "bg-white/5"}`}>
                    <p className="text-blue-200/50 text-xs">יחס התחייבויות/הכנסה</p>
                    <p className={`text-lg font-bold ${debtToIncome > 40 ? "text-red-400" : "text-emerald-300"}`}>
                      {debtToIncome ? `${debtToIncome}%` : "—"}
                    </p>
                    {debtToIncome > 40 && (
                      <p className="text-[10px] text-red-300 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        מעל הסף המומלץ
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insurance Payments */}
            {insuranceCharges && insuranceCharges.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-xl border-gold/10">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-bold text-gold flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    תשלומי ביטוח שזוהו
                  </h3>
                  <div className="space-y-2">
                    {insuranceCharges.map((p, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-white">{p.company}</p>
                          <p className="text-xs text-blue-200/40">{p.description}</p>
                        </div>
                        <p className="text-sm font-bold text-amber-300">₪{p.monthly_amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Standing Orders */}
            {standingOrders && standingOrders.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-xl border-gold/10">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-bold text-gold flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    הוראות קבע והעברות חוזרות
                  </h3>
                  <div className="space-y-2">
                    {standingOrders.map((o, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-white">{o.recipient || o.description}</p>
                          <p className="text-xs text-blue-200/40">{o.category}</p>
                        </div>
                        <p className="text-sm font-bold text-amber-300">₪{o.monthly_amount?.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/5 text-xs">
                    <span className="text-blue-200/50">סה״כ הוראות קבע</span>
                    <span className="font-bold text-amber-300">
                      ₪{standingOrders.reduce((s, o) => s + (o.monthly_amount || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Salary Discrepancy */}
            {salaryVerification && !salaryVerification.matches_payslip && salaryVerification.discrepancy_amount && Math.abs(salaryVerification.discrepancy_amount) > 100 && (
              <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-300">פער בין תלוש לזיכוי בבנק</p>
                      <p className="text-xs text-red-200/60 mt-1">
                        {salaryVerification.discrepancy_alert || `הפרש: ₪${Math.abs(salaryVerification.discrepancy_amount).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Send Report by Email */}
            <Card className="bg-white/5 backdrop-blur-xl border-gold/10">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-bold text-gold flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  שלח לי את הדוח למייל
                </h3>
                {emailSent ? (
                  <div className="flex items-center gap-2 text-emerald-300 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    הדוח נשלח בהצלחה! בדוק את תיבת המייל שלך
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="הזן את כתובת המייל שלך"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-blue-200/30 text-sm"
                      dir="ltr"
                    />
                    <Button
                      disabled={!emailInput || sendingEmail}
                      onClick={async () => {
                        setSendingEmail(true);
                        try {
                          const wowAlerts = analysis?.wow_alerts as string[] || [];
                          const findingsCount = wowAlerts.length + ((analysis?.risks as any[])?.length || 0);
                          const scanType = "דף בנק";
                          const clientName = (analysis?.personal as any)?.account_holder || (analysis?.client as any)?.full_name || "";

                          const { error } = await supabase.functions.invoke("send-email", {
                            body: {
                              type: "analysis_ready",
                              to: emailInput,
                              data: {
                                client_name: clientName,
                                scan_type: scanType,
                                findings_count: findingsCount,
                                wow_alerts: wowAlerts,
                                link: window.location.href,
                              },
                            },
                          });
                          if (error) throw error;
                          setEmailSent(true);
                          toast.success("הדוח נשלח למייל בהצלחה!");
                        } catch (e) {
                          console.error("Email send error:", e);
                          toast.error("שגיאה בשליחה – נסה שנית");
                        } finally {
                          setSendingEmail(false);
                        }
                      }}
                      className="bg-gold hover:bg-gold/90 text-black font-bold shrink-0"
                    >
                      {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלח"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center pt-4"
            >
              <a
                href="https://wa.me/972000000000?text=היי, קיבלתי את ניתוח העו״ש ואשמח לשיחת ייעוץ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gold text-black font-bold text-sm hover:bg-gold/90 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5" />
                דברו עם יועץ – חינם
              </a>
              <p className="text-xs text-blue-200/30 mt-3">ללא התחייבות · שיחה של 5 דקות</p>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
