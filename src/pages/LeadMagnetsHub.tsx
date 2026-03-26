import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Calculator, Search, FileText, Shield, BarChart3, Brain,
  Copy, ExternalLink, AlertTriangle, Send, Sparkles, TrendingUp,
  Users, ArrowRight, CheckCircle2, XCircle
} from "lucide-react";

const widgets = [
  {
    id: "mortgage-insurance",
    title: "מחשבון ביטוח משכנתא",
    titleEn: "Mortgage Insurance Calculator",
    description: "לקוח מזין סכום הלוואה וגיל – מקבל השוואת פרמיות מיידית",
    icon: Calculator,
    color: "from-amber-500/20 to-amber-600/10",
    leads: 142,
    conversion: "34%",
  },
  {
    id: "lost-savings",
    title: "איתור חסכונות אבודים",
    titleEn: "Lost Savings Locator",
    description: "סריקה של קרנות פנסיה ישנות ופוליסות שנשכחו",
    icon: Search,
    color: "from-emerald-500/20 to-emerald-600/10",
    leads: 89,
    conversion: "41%",
  },
  {
    id: "masleka-order",
    title: "הזמנת מסלקה פנסיונית",
    titleEn: "Masleka Pension Order",
    description: "הלקוח חותם על טופס הרשאה – אתה מקבל את כל המידע",
    icon: FileText,
    color: "from-blue-500/20 to-blue-600/10",
    leads: 203,
    conversion: "52%",
  },
  {
    id: "har-habituach",
    title: "סורק הר הביטוח",
    titleEn: "Har HaBituach Scanner",
    description: "ניתוח AI אוטומטי של מסמכי הר הביטוח של הלקוח",
    icon: Shield,
    color: "from-purple-500/20 to-purple-600/10",
    leads: 67,
    conversion: "28%",
  },
  {
    id: "price-compare",
    title: "השוואת מחירים חכמה",
    titleEn: "Smart Price Comparison",
    description: "השוואה בזמן אמת מול 5 חברות ביטוח – תוצאות תוך שניות",
    icon: BarChart3,
    color: "from-cyan-500/20 to-cyan-600/10",
    leads: 118,
    conversion: "37%",
  },
];

const payslipData = [
  { item: "קרן פנסיה (עובד)", payslip: "702 ₪", masleka: "702 ₪", match: true },
  { item: "קרן פנסיה (מעסיק)", payslip: "877 ₪", masleka: "427 ₪", match: false, diff: "450 ₪" },
  { item: "ביטוח מנהלים", payslip: "585 ₪", masleka: "585 ₪", match: true },
  { item: "קרן השתלמות (עובד)", payslip: "351 ₪", masleka: "351 ₪", match: true },
  { item: "קרן השתלמות (מעסיק)", payslip: "527 ₪", masleka: "527 ₪", match: true },
  { item: "אובדן כושר עבודה", payslip: "234 ₪", masleka: "0 ₪", match: false, diff: "234 ₪" },
];

export default function LeadMagnetsHub() {
  const [autoReconcile, setAutoReconcile] = useState(false);

  const copyLink = (widgetId: string) => {
    const url = `${window.location.origin}/widget/${widgetId}`;
    navigator.clipboard.writeText(url);
    toast.success("הקישור הועתק ללוח!", { description: "שלח ללקוח דרך WhatsApp או מייל" });
  };

  const generatePdf = () => {
    toast.success("מפיק דוח PDF מותאם אישית...", {
      description: "הדוח ישלח ישירות ל-WhatsApp של הלקוח",
      duration: 4000,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <Sparkles className="h-7 w-7 text-primary" />
                Lead Magnets & Marketing Hub
              </h1>
              <p className="text-muted-foreground mt-1">ווידג'טים חכמים ללכידת לידים – שתול, שתף, מכור</p>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary px-3 py-1.5 text-sm">
              <Users className="h-4 w-4 ml-1" />
              619 לידים החודש
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* CRM Note */}
        <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">כל הגשת לקוח זורמת ישירות ל-CRM שלך</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              כל ווידג'ט מחובר אוטומטית למערכת ניהול הלידים. הלקוח ממלא → אתה מקבל התראה → הליד נוצר עם כל הפרטים.
            </p>
          </div>
        </div>

        {/* Grid: 5 small widgets + 1 large CPA widget */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {widgets.map((w) => (
            <Card key={w.id} className="group border-border/40 bg-card/80 hover:border-primary/40 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${w.color}`}>
                    <w.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{w.leads} לידים</span>
                    <span className="text-primary font-semibold">{w.conversion}</span>
                  </div>
                </div>
                <CardTitle className="text-base mt-3">{w.title}</CardTitle>
                <CardDescription className="text-xs">{w.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => copyLink(w.id)}
                  >
                    <Copy className="h-3.5 w-3.5 ml-1" />
                    העתק קישור ללקוח
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* CPA Mode – Double-size highlight widget */}
          <Card className="md:col-span-2 lg:col-span-3 border-primary/50 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg shadow-primary/5 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <CardHeader className="relative">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">AI Payslip & Pension Reconciler</CardTitle>
                    <CardDescription className="text-sm">CPA Mode – התאמת תלושי שכר מול מסלקה פנסיונית</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-destructive/90 text-destructive-foreground animate-pulse">
                    <AlertTriangle className="h-3.5 w-3.5 ml-1" />
                    פער: חסרים 450 ₪ מהמעסיק
                  </Badge>
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    <Sparkles className="h-3 w-3 ml-1" />
                    327 לידים
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-6">
              {/* Simulated Dashboard */}
              <div className="rounded-xl border border-border/60 bg-background/60 backdrop-blur-sm overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-px bg-border/30 text-xs font-semibold text-muted-foreground p-3 border-b border-border/40">
                  <span>פריט</span>
                  <span className="text-center">ניכוי בתלוש</span>
                  <span className="text-center">הפקדה במסלקה</span>
                  <span className="text-center">סטטוס</span>
                </div>
                {/* Table Rows */}
                {payslipData.map((row, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-4 gap-px p-3 text-sm border-b border-border/20 last:border-0 ${
                      !row.match ? "bg-destructive/5" : ""
                    }`}
                  >
                    <span className="font-medium text-foreground">{row.item}</span>
                    <span className="text-center text-muted-foreground">{row.payslip}</span>
                    <span className={`text-center ${!row.match ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                      {row.masleka}
                    </span>
                    <div className="flex items-center justify-center">
                      {row.match ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-destructive" />
                          <span className="text-xs text-destructive font-semibold">-{row.diff}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border/40 bg-background/40 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">3,276 ₪</p>
                  <p className="text-xs text-muted-foreground mt-1">סה״כ ניכויים בתלוש</p>
                </div>
                <div className="rounded-lg border border-border/40 bg-background/40 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">2,592 ₪</p>
                  <p className="text-xs text-muted-foreground mt-1">סה״כ הפקדות במסלקה</p>
                </div>
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-center">
                  <p className="text-2xl font-bold text-destructive">684 ₪</p>
                  <p className="text-xs text-destructive/80 mt-1">פער חודשי שלא הופקד</p>
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <Switch checked={autoReconcile} onCheckedChange={setAutoReconcile} />
                  <div>
                    <p className="text-sm font-medium text-foreground">התאמה אוטומטית חודשית</p>
                    <p className="text-xs text-muted-foreground">
                      {autoReconcile ? "מופעל – סריקה ב-1 לכל חודש" : "כבוי – הפעל לניטור שוטף"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => copyLink("cpa-reconciler")}>
                    <Copy className="h-4 w-4 ml-1.5" />
                    העתק קישור ללקוח
                  </Button>
                  <Button
                    onClick={generatePdf}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      הפק PDF מכירה ושלח ב-WhatsApp
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
