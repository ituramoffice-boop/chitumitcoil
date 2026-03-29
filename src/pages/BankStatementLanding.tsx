import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AIScannerWidget from "@/components/AIScannerWidget";
import { TrustBankLogos } from "@/components/TrustBankLogos";
import { ReadinessScore } from "@/components/ReadinessScore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck, Lock, Landmark, TrendingDown, PiggyBank,
  AlertTriangle, CheckCircle2, CreditCard, Building2
} from "lucide-react";

export default function BankStatementLanding() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const analysis = result?.ai_analysis as Record<string, unknown> | undefined;

  const avgIncome = analysis?.average_monthly_net_income as number | undefined;
  const mortgagePayment = analysis?.mortgage_monthly_payment as number | undefined;
  const mortgageBank = analysis?.mortgage_bank as string | undefined;
  const obligationRatio = analysis?.obligation_ratio as number | undefined;
  const insurancePayments = analysis?.identified_insurance_payments as Array<{
    company: string;
    monthly_amount: number;
    type: string;
  }> | undefined;
  const recurringLoans = analysis?.recurring_loan_repayments as Array<{
    description: string;
    monthly_amount: number;
  }> | undefined;
  const salaryDiscrepancy = analysis?.salary_discrepancy as {
    payslip_net: number;
    bank_deposit: number;
    difference: number;
  } | undefined;
  const totalObligations = (mortgagePayment || 0) +
    (insurancePayments?.reduce((s, p) => s + p.monthly_amount, 0) || 0) +
    (recurringLoans?.reduce((s, l) => s + l.monthly_amount, 0) || 0);

  const healthScore = analysis
    ? Math.max(0, Math.min(100, Math.round(
        100 - (obligationRatio || 0) * 1.2 -
        (insurancePayments && insurancePayments.length > 3 ? 10 : 0) -
        (salaryDiscrepancy && Math.abs(salaryDiscrepancy.difference) > 500 ? 15 : 0)
      )))
    : 0;

  const estimatedSavings = analysis
    ? Math.round(
        (insurancePayments?.reduce((s, p) => s + p.monthly_amount * 0.15, 0) || 0) +
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
                onSubmit={(data) => setResult(data)}
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
                    {mortgageBank && <p className="text-[10px] text-blue-200/40">{mortgageBank}</p>}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-blue-200/50 text-xs">סה״כ התחייבויות</p>
                    <p className="text-lg font-bold text-white">₪{totalObligations.toLocaleString()}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${(obligationRatio || 0) > 40 ? "bg-red-500/10 border border-red-500/20" : "bg-white/5"}`}>
                    <p className="text-blue-200/50 text-xs">יחס התחייבויות/הכנסה</p>
                    <p className={`text-lg font-bold ${(obligationRatio || 0) > 40 ? "text-red-400" : "text-emerald-300"}`}>
                      {obligationRatio ? `${obligationRatio}%` : "—"}
                    </p>
                    {(obligationRatio || 0) > 40 && (
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
            {insurancePayments && insurancePayments.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-xl border-gold/10">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-bold text-gold flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    תשלומי ביטוח שזוהו
                  </h3>
                  <div className="space-y-2">
                    {insurancePayments.map((p, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-white">{p.company}</p>
                          <p className="text-xs text-blue-200/40">{p.type}</p>
                        </div>
                        <p className="text-sm font-bold text-amber-300">₪{p.monthly_amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Salary Discrepancy */}
            {salaryDiscrepancy && Math.abs(salaryDiscrepancy.difference) > 100 && (
              <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-300">פער בין תלוש לזיכוי בבנק</p>
                      <p className="text-xs text-red-200/60 mt-1">
                        נטו בתלוש: ₪{salaryDiscrepancy.payslip_net.toLocaleString()} · זיכוי בבנק: ₪{salaryDiscrepancy.bank_deposit.toLocaleString()} · הפרש: ₪{Math.abs(salaryDiscrepancy.difference).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
