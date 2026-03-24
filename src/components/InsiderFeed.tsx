import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Radar,
  Zap,
  Landmark,
  Clock,
  Phone,
  Send,
  Eye,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ── Types ── */
type AlertLevel = "opportunity" | "intel" | "delay" | "client";
interface FeedItem {
  id: string;
  level: AlertLevel;
  bank?: string;
  title: string;
  body: string;
  time: string;
  action?: { label: string; onClick?: () => void };
}

const LEVEL_CONFIG: Record<AlertLevel, { color: string; bg: string; border: string; icon: typeof Radar }> = {
  opportunity: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: TrendingUp },
  intel: { color: "text-gold", bg: "bg-gold/10", border: "border-gold/20", icon: Radar },
  delay: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", icon: AlertTriangle },
  client: { color: "text-[hsl(var(--cyan-glow))]", bg: "bg-[hsl(var(--cyan-glow))]/10", border: "border-[hsl(var(--cyan-glow))]/20", icon: UserCheck },
};

const BANKS = ["הפועלים", "לאומי", "דיסקונט", "מזרחי-טפחות", "בינלאומי"];

/* ── Mock live feed ── */
function generateFeed(leads: any[]): FeedItem[] {
  const items: FeedItem[] = [
    {
      id: "bp-1",
      level: "opportunity",
      bank: "הפועלים",
      title: "🔥 אישור תיק מורכב",
      body: "סניף פועלים ת\"א אישר כרגע תיק מורכב ב-75% LTV. מומלץ להגיש פרופילים דומים.",
      time: "לפני 12 דקות",
      action: { label: "הגש עכשיו" },
    },
    {
      id: "bp-2",
      level: "delay",
      bank: "לאומי",
      title: "⚠️ עיכובי חיתום",
      body: "עיכובים בחיתום בבנק לאומי מרכז. זמן המתנה משוער: 14 ימי עסקים.",
      time: "לפני 34 דקות",
      action: { label: "ראה חלופות" },
    },
    {
      id: "bp-3",
      level: "opportunity",
      bank: "דיסקונט",
      title: "💰 מבצע ריביות",
      body: "דיסקונט פתח מסלול הטבה לציון חיתומית 90+. ריבית פריים -0.3% למסלול משתנה.",
      time: "לפני שעה",
      action: { label: "צפה בפרטים" },
    },
    {
      id: "bp-4",
      level: "intel",
      bank: "מזרחי-טפחות",
      title: "📊 שינוי מדיניות",
      body: "מזרחי-טפחות העלו סף אישור LTV ל-80% לעובדי הייטק. הזדמנות לתיקים רלוונטיים.",
      time: "לפני שעתיים",
      action: { label: "סנן תיקים מתאימים" },
    },
  ];

  // Add client-specific alerts from leads
  if (leads.length > 0) {
    const recent = leads[0];
    items.push({
      id: "cl-1",
      level: "client",
      title: "📄 מסמך חסר",
      body: `הלקוח ${recent.full_name} העלה תלוש שכר חסר. ה-AI זיהה פוטנציאל לשיפור הציון ב-5 נקודות. עדכן אותו עכשיו.`,
      time: "לפני 8 דקות",
      action: { label: "התקשר ללקוח" },
    });

    const readyLead = leads.find((l: any) => l.status === "submitted" || l.status === "in_progress");
    if (readyLead) {
      items.push({
        id: "cl-2",
        level: "client",
        title: "🚀 תיק מוכן לשיגור",
        body: `תיק ${readyLead.full_name} מוכן לשיגור (Score 88). הניתוח הנרטיבי הושלם.`,
        time: "לפני 22 דקות",
        action: { label: "שגר לבנק" },
      });
    }
  }

  return items;
}

/* ── Ticker ── */
function LiveTicker() {
  const [idx, setIdx] = useState(0);
  const tickers = [
    "📈 ריבית פריים: 6.25% | אג\"ח 10Y: 4.12%",
    "🏦 אישורים היום: 34 תיקים | ממוצע LTV: 68%",
    "⚡ הציון הממוצע שאושר: 79 | שיא: 95",
  ];

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % tickers.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative h-6 overflow-hidden rounded bg-secondary/40 border border-border/20 px-3">
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[10px] text-muted-foreground leading-6 font-mono whitespace-nowrap"
        >
          {tickers[idx]}
        </motion.p>
      </AnimatePresence>
      <div className="absolute top-1 left-2">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
        />
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function InsiderFeed({ leads = [] }: { leads?: any[] }) {
  const [bankFilter, setBankFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const feed = useMemo(() => generateFeed(leads), [leads]);

  const filtered = bankFilter
    ? feed.filter(item => !item.bank || item.bank === bankFilter)
    : feed;

  return (
    <div className="rounded-xl border border-border/30 bg-gradient-to-b from-card to-card/80 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Radar className="w-4 h-4 text-gold" />
          </motion.div>
          <span className="font-bold text-sm text-foreground">דופק השוק — עדכונים חיים</span>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[9px]">
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              LIVE
            </motion.span>
          </Badge>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Ticker */}
            <div className="px-4 pb-3">
              <LiveTicker />
            </div>

            {/* Bank filter */}
            <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
              <button
                onClick={() => setBankFilter(null)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border",
                  !bankFilter ? "bg-gold/15 text-gold border-gold/30" : "bg-secondary/30 text-muted-foreground border-border/20 hover:bg-secondary/50"
                )}
              >
                הכל
              </button>
              {BANKS.map(bank => (
                <button
                  key={bank}
                  onClick={() => setBankFilter(bankFilter === bank ? null : bank)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border",
                    bankFilter === bank ? "bg-gold/15 text-gold border-gold/30" : "bg-secondary/30 text-muted-foreground border-border/20 hover:bg-secondary/50"
                  )}
                >
                  {bank}
                </button>
              ))}
            </div>

            {/* Feed items */}
            <div className="px-4 pb-4 space-y-2 max-h-[400px] overflow-y-auto">
              {filtered.map((item, i) => {
                const cfg = LEVEL_CONFIG[item.level];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      "p-3 rounded-lg border space-y-2 transition-colors hover:bg-secondary/20",
                      cfg.bg, cfg.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn("p-1 rounded shrink-0", cfg.bg)}>
                          <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                        </div>
                        <span className="text-xs font-bold text-foreground truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.bank && (
                          <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                            <Landmark className="w-2.5 h-2.5 ml-0.5" />
                            {item.bank}
                          </Badge>
                        )}
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap">{item.time}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.body}</p>
                    {item.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn("h-7 text-[10px] gap-1", cfg.border, cfg.color, "hover:bg-secondary/40")}
                      >
                        <Zap className="w-3 h-3" />
                        {item.action.label}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
