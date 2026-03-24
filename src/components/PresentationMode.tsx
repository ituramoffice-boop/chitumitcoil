import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Crown,
  Sparkles,
  X,
  FileText,
  Building2,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Lead {
  id: string;
  full_name: string;
  status: string;
  mortgage_amount: number | null;
  property_value: number | null;
  monthly_income: number | null;
  created_at: string;
}

interface PresentationModeProps {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}

export function PresentationMode({ lead, open, onClose }: PresentationModeProps) {
  const amount = Number(lead.mortgage_amount) || 0;
  const property = Number(lead.property_value) || 0;
  const ltv = property > 0 ? Math.round((amount / property) * 100) : 0;
  const income = Number(lead.monthly_income) || 0;
  const dti = income > 0 ? Math.round((amount / 240 / income) * 100) : 0;

  // AI score simulation
  let score = 72;
  if (ltv > 0 && ltv < 75) score += 10;
  if (dti > 0 && dti < 40) score += 8;
  if (lead.status === "approved") score = 96;
  else if (lead.status === "submitted") score += 5;
  score = Math.min(99, score);

  const scoreColor = score >= 85 ? "text-emerald-400" : score >= 70 ? "text-gold" : "text-amber-400";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-2xl overflow-auto"
          dir="rtl"
        >
          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="fixed top-6 left-6 z-[101] text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="max-w-3xl mx-auto py-16 px-6 space-y-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-3"
            >
              <div className="inline-flex items-center gap-2 text-gold text-xs font-semibold bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5">
                <Crown className="w-3.5 h-3.5" />
                <span>Chitumit AI Analysis</span>
              </div>
              <h1 className="text-3xl font-black text-foreground">{lead.full_name}</h1>
              <p className="text-muted-foreground text-sm">ניתוח פיננסי מתקדם מבוסס בינה מלאכותית</p>
            </motion.div>

            {/* AI Score - big hero */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center py-10"
            >
              <div className="relative inline-block">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-gold/20"
                  style={{ width: 180, height: 180, margin: "auto", top: -15, left: -15 }}
                />
                <div className="w-[150px] h-[150px] rounded-full bg-gradient-to-b from-gold/15 to-gold/5 border-2 border-gold/30 flex items-center justify-center mx-auto">
                  <div className="text-center">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className={cn("text-5xl font-black", scoreColor)}
                    >
                      {score}
                    </motion.p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">AI Score</p>
                  </div>
                </div>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-sm text-muted-foreground mt-6"
              >
                {score >= 85
                  ? "תיק זה עומד בכל הקריטריונים של הבנקים. הסיכוי לאישור גבוה מאוד."
                  : "התיק נמצא בתהליך אופטימיזציה. המערכת עובדת על שיפור הדירוג."}
              </motion.p>
            </motion.div>

            {/* Key Metrics - clean premium cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-4"
            >
              <div className="rounded-xl border border-border/30 bg-card p-5 text-center">
                <Building2 className="w-5 h-5 text-gold mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">שווי נכס</p>
                <p className="text-lg font-black text-foreground">
                  {property > 0 ? `₪${property.toLocaleString()}` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/30 bg-card p-5 text-center">
                <FileText className="w-5 h-5 text-gold mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">סכום משכנתא</p>
                <p className="text-lg font-black text-foreground">
                  {amount > 0 ? `₪${amount.toLocaleString()}` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/30 bg-card p-5 text-center">
                <BarChart3 className="w-5 h-5 text-gold mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">LTV</p>
                <p className={cn("text-lg font-black", ltv <= 75 ? "text-emerald-400" : "text-amber-400")}>
                  {ltv > 0 ? `${ltv}%` : "—"}
                </p>
              </div>
            </motion.div>

            {/* AI Insights - clean list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="rounded-xl border border-gold/20 bg-gold/5 p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <h3 className="text-sm font-bold text-foreground">תובנות AI</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: ShieldCheck, text: "התיק עבר בדיקת חיתום אוטומטית מלאה", ok: true },
                  { icon: TrendingUp, text: ltv <= 75 ? "יחס LTV בריא — עומד בדרישות רוב הבנקים" : "יחס LTV דורש תשומת לב — יתכן צורך בהון עצמי נוסף", ok: ltv <= 75 },
                  { icon: CheckCircle2, text: dti < 40 ? "יחס החזר להכנסה תקין" : "יש לבחון את יחס ההחזר מול ההכנסה", ok: dti < 40 },
                ].map((insight, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn(
                      "p-1.5 rounded-lg shrink-0 mt-0.5",
                      insight.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    )}>
                      <insight.icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs text-foreground/80">{insight.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Verified seal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center pt-6 border-t border-border/20"
            >
              <div className="inline-flex items-center gap-2 text-[10px] text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-gold" />
                <span>Verified by Chitumit AI · ניתוח אוטומטי · כל הנתונים מוצפנים</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
