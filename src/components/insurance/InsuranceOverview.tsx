import { Shield, Users, FileText, BarChart3, TrendingUp, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DEMO_STATS = [
  { label: "פוליסות פעילות", value: "127", icon: FileText, trend: "+8 החודש", color: "text-primary" },
  { label: "לקוחות פעילים", value: "89", icon: Users, trend: "+5 החודש", color: "text-emerald-400" },
  { label: "פרמיה חודשית כוללת", value: "₪48,320", icon: DollarSign, trend: "+12%", color: "text-gold" },
  { label: "עמלות צפויות", value: "₪6,840", icon: TrendingUp, trend: "החודש", color: "text-cyan-400" },
];

const RENEWALS = [
  { client: "יוסי כהן", policy: "חיים + אובדן כושר", company: "הראל", daysLeft: 5, premium: "₪380" },
  { client: "מירי לוי", policy: "בריאות משלים", company: "כלל", daysLeft: 12, premium: "₪220" },
  { client: "אבי גולן", policy: "רכב חובה + מקיף", company: "הפניקס", daysLeft: 18, premium: "₪540" },
];

const RECENT_ACTIVITY = [
  { text: "פוליסת חיים חדשה — דנה אברהם", time: "לפני 2 שעות", type: "success" },
  { text: "חידוש אוטומטי — רון שמיר, בריאות", time: "לפני 5 שעות", type: "info" },
  { text: "תביעה בטיפול — משה דוד, רכב", time: "אתמול", type: "warning" },
  { text: "לקוח חדש נרשם — שרה מזרחי", time: "אתמול", type: "success" },
];

export function InsuranceOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">סקירה כללית</h2>
        <p className="text-sm text-muted-foreground">תמונת מצב עדכנית של תיק הביטוח שלך</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEMO_STATS.map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-xs text-emerald-400 font-medium">{stat.trend}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Renewals */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              חידושים קרובים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {RENEWALS.map((r) => (
              <div key={r.client} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{r.client}</p>
                  <p className="text-xs text-muted-foreground">{r.policy} • {r.company}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gold">{r.premium}</p>
                  <p className={`text-xs ${r.daysLeft <= 7 ? "text-red-400" : "text-muted-foreground"}`}>
                    {r.daysLeft} ימים
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              פעילות אחרונה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    a.type === "success" ? "bg-emerald-400" : a.type === "warning" ? "bg-amber-400" : "bg-primary"
                  }`} />
                  <p className="text-sm text-foreground">{a.text}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap mr-3">{a.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
