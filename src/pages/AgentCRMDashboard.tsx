import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Users, Calendar, Settings, Phone, Video, FileText,
  Shield, Bot, Clock, ChevronLeft, Sparkles, Eye, MessageCircle,
  TrendingUp, Zap, Star, CheckCheck, X, Download, Lock,
  CreditCard, Heart, Building2, User, Mail, Hash, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const NAV_ITEMS = [
  { icon: Home, label: "ראשי", active: true },
  { icon: Users, label: "לידים חדשים", badge: 3 },
  { icon: Calendar, label: "יומן פגישות" },
  { icon: Settings, label: "הגדרות AI" },
];

const PIPELINE_STATS = [
  { label: "לידים חמים", value: 12, icon: Zap, color: "text-orange-400" },
  { label: "פגישות היום", value: 3, icon: Calendar, color: "text-emerald-400" },
  { label: "המרות החודש", value: 8, icon: TrendingUp, color: "text-[hsl(var(--primary))]" },
  { label: "חיסכון שנוצר", value: "₪18,400", icon: Star, color: "text-emerald-400" },
];

const QUEUE_LEADS = [
  { name: "רונית כהן", time: "14:00 היום", score: 87, tag: "ביטוח חיים" },
  { name: "אבי לוי", time: "16:30 היום", score: 72, tag: "פנסיה" },
];
const WA_CHAT = [
  { type: "in" as const, text: "🤖 דוח חיתומית AI הושלם! זיהינו כפל ביטוחי בריאות. פוטנציאל חיסכון: 450 ש״ח.", time: "10:40", delay: 0 },
  { type: "out" as const, text: "רגע, על מה אני משלם כפול?", time: "10:41", delay: 2.5 },
  { type: "in" as const, text: "על סעיף \"תרופות מחוץ לסל\". הסוכן פנוי מחר ב-10:00. מתי נוח?", time: "10:41", delay: 5 },
  { type: "out" as const, text: "10:00 מצוין לי.", time: "10:42", delay: 7.5 },
  { type: "in" as const, text: "מעולה! 📅 הפגישה נקבעה ביומן.", time: "10:42", delay: 10 },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-[#202c33] rounded-xl w-fit">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-white/40"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function WhatsAppLiveLog() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    if (visibleCount >= WA_CHAT.length) return;

    // Show typing indicator before next message
    const nextMsg = WA_CHAT[visibleCount];
    const typingDelay = visibleCount === 0 ? 800 : nextMsg.delay * 1000 - 800;

    const typingTimer = setTimeout(() => {
      if (nextMsg.type === "in") setShowTyping(true);
    }, Math.max(typingDelay, visibleCount === 0 ? 800 : (WA_CHAT[visibleCount - 1]?.delay ?? 0) * 1000 + 400));

    const msgTimer = setTimeout(() => {
      setShowTyping(false);
      setVisibleCount(c => c + 1);
    }, nextMsg.delay * 1000 + (visibleCount === 0 ? 1200 : 1200));

    return () => { clearTimeout(typingTimer); clearTimeout(msgTimer); };
  }, [visibleCount]);

  return (
    <div className="bg-[#0b141a] border border-white/[0.06] rounded-2xl p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={14} className="text-emerald-400" />
        <span className="text-white/50 text-[11px] font-medium">WhatsApp Bot Log</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-auto" />
      </div>
      <div className="space-y-2 max-h-[140px] overflow-y-auto">
        <AnimatePresence>
          {WA_CHAT.slice(0, visibleCount).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`flex ${msg.type === "out" ? "justify-start" : "justify-end"}`}
            >
              <div className={`rounded-xl px-3 py-1.5 max-w-[85%] ${
                msg.type === "in" ? "bg-[#202c33]" : "bg-[#005c4b]"
              }`}>
                <p className="text-white/80 text-[11px] leading-relaxed">{msg.text}</p>
                <p className="text-white/30 text-[9px] mt-0.5 flex items-center gap-1 justify-end">
                  {msg.time}
                  {msg.type === "out" && <span className="text-blue-400">✓✓</span>}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {showTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end"
          >
            <TypingIndicator />
          </motion.div>
        )}
      </div>
    </div>
  );
}

const LEAD_PROFILE = {
  name: "ישראל ישראלי",
  id: "324-567890",
  phone: "054-1234567",
  email: "israel@email.co.il",
  age: 38,
  city: "תל אביב",
  income: "₪22,000",
  employer: "חברת הייטק בע״מ",
  source: "משפך מסלקה",
  capturedAt: "24/03/2026 10:38",
};

const LEAD_DOCUMENTS = [
  { name: "תלוש_שכר_03_2026.pdf", type: "תלוש שכר", size: "245 KB", status: "verified" as const, scannedAt: "10:39" },
  { name: "דוח_מסלקה_פנסיונית.pdf", type: "דו״ח מסלקה", size: "1.2 MB", status: "verified" as const, scannedAt: "10:39" },
  { name: "אישור_העסקה.pdf", type: "אישור מעסיק", size: "89 KB", status: "verified" as const, scannedAt: "10:40" },
  { name: "דוח_BDI_אשראי.pdf", type: "דו״ח אשראי", size: "340 KB", status: "pending" as const, scannedAt: "—" },
];

const INSURANCE_FINDINGS = [
  { company: "מגדל", type: "ביטוח בריאות", premium: "₪320/חודש", flag: "כפילות" },
  { company: "הראל", type: "ביטוח בריאות", premium: "₪290/חודש", flag: "כפילות" },
  { company: "מגדל", type: "ביטוח חיים", premium: "₪180/חודש", flag: null },
  { company: "כלל", type: "פנסיה", premium: "₪1,200/חודש", flag: null },
];

function FullFileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl bg-[#0d1225] border-white/10 text-white p-0 overflow-hidden max-h-[90vh]" dir="rtl">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-amber-600 flex items-center justify-center text-black text-lg font-bold">
              י.י
            </div>
            <div>
              <h2 className="text-xl font-bold">{LEAD_PROFILE.name}</h2>
              <p className="text-white/40 text-sm">{LEAD_PROFILE.phone} • {LEAD_PROFILE.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Lock size={10} /> מוצפן AES-256
            </span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 space-y-6">
          {/* Personal Info Grid */}
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--primary))] mb-3 flex items-center gap-2">
              <User size={14} /> פרטים אישיים
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: Hash, label: "ת.ז", value: LEAD_PROFILE.id },
                { icon: User, label: "גיל", value: LEAD_PROFILE.age },
                { icon: Building2, label: "עיר", value: LEAD_PROFILE.city },
                { icon: CreditCard, label: "הכנסה חודשית", value: LEAD_PROFILE.income },
                { icon: Building2, label: "מעסיק", value: LEAD_PROFILE.employer },
                { icon: Zap, label: "מקור ליד", value: LEAD_PROFILE.source },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-white/40 text-[10px] mb-1">
                    <item.icon size={10} />
                    {item.label}
                  </div>
                  <p className="text-white/80 text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--primary))] mb-3 flex items-center gap-2">
              <FileText size={14} /> מסמכים סרוקים ({LEAD_DOCUMENTS.filter(d => d.status === "verified").length}/{LEAD_DOCUMENTS.length})
            </h3>
            <div className="space-y-2">
              {LEAD_DOCUMENTS.map((doc, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      doc.status === "verified" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                    }`}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{doc.type}</p>
                      <p className="text-white/30 text-[10px]">{doc.name} • {doc.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {doc.status === "verified" ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCheck size={10} /> מאומת {doc.scannedAt}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                        ממתין
                      </span>
                    )}
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/60">
                      <Download size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Insurance Findings */}
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--primary))] mb-3 flex items-center gap-2">
              <Shield size={14} /> ממצאי ביטוח — ניתוח מסלקה
            </h3>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 gap-2 px-4 py-2 text-[10px] text-white/30 font-medium border-b border-white/[0.06]">
                <span>חברה</span>
                <span>סוג</span>
                <span>פרמיה</span>
                <span>סטטוס</span>
              </div>
              {INSURANCE_FINDINGS.map((row, i) => (
                <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-3 text-sm items-center ${
                  i < INSURANCE_FINDINGS.length - 1 ? "border-b border-white/[0.04]" : ""
                }`}>
                  <span className="text-white/70">{row.company}</span>
                  <span className="text-white/60 text-xs">{row.type}</span>
                  <span className="text-white/80 font-medium text-xs">{row.premium}</span>
                  <span>
                    {row.flag ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-1 w-fit">
                        <AlertTriangle size={10} /> {row.flag}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/60 w-fit block">תקין</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-3">
              <Heart size={16} className="text-emerald-400 shrink-0" />
              <p className="text-emerald-400/80 text-xs leading-relaxed">
                <span className="font-bold">חיסכון מזוהה:</span> ביטול כפל בריאות חוסך ללקוח{" "}
                <span className="text-emerald-300 font-bold">₪5,400 בשנה</span> (450 ש״ח × 12 חודשים)
              </p>
            </div>
          </div>

          {/* AI Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--primary))] mb-3 flex items-center gap-2">
              <Bot size={14} /> ציר זמן AI
            </h3>
            <div className="space-y-0 relative">
              <div className="absolute right-[15px] top-2 bottom-2 w-px bg-white/[0.06]" />
              {[
                { time: "10:38", text: "ליד נקלט ממשפך מסלקה", icon: Zap },
                { time: "10:39", text: "תלוש שכר + מסלקה נסרקו (Document AI)", icon: FileText },
                { time: "10:40", text: "AI זיהה כפל ביטוחי — הודעת WhatsApp נשלחה", icon: MessageCircle },
                { time: "10:42", text: "הלקוח אישר פגישה ל-10:00 מחר", icon: Calendar },
                { time: "10:42", text: "פגישת Zoom נקבעה אוטומטית ביומן הסוכן", icon: Video },
              ].map((ev, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 py-2 relative z-10"
                >
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 flex items-center justify-center shrink-0">
                    <ev.icon size={14} className="text-[hsl(var(--primary))]" />
                  </div>
                  <div className="pt-1">
                    <p className="text-white/70 text-xs">{ev.text}</p>
                    <p className="text-white/30 text-[10px]">{ev.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AgentCRMDashboard() {
  const [activeNav, setActiveNav] = useState(0);
  const [showFullFile, setShowFullFile] = useState(false);

  return (
    <div dir="rtl" className="min-h-screen bg-[#0a0e1a] text-white flex">
      {/* Side Navigation - Right */}
      <nav className="w-20 lg:w-64 bg-[#0d1225]/80 backdrop-blur-xl border-l border-white/5 flex flex-col items-center lg:items-stretch py-6 gap-1 shrink-0">
        {/* Logo */}
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
            className={`relative flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-5 py-3 mx-2 rounded-xl transition-all duration-300 group ${
              activeNav === i
                ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            <item.icon size={20} />
            <span className="hidden lg:block text-sm font-medium">{item.label}</span>
            {item.badge && (
              <span className="absolute top-1 left-1 lg:static lg:mr-auto w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center text-white">
                {item.badge}
              </span>
            )}
            {activeNav === i && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full bg-[hsl(var(--primary))]" />
            )}
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
                תור פגישות אוטומטי
              </span>
            </h1>
            <p className="text-white/40 text-sm mt-1">
              <Bot size={14} className="inline ml-1 text-emerald-400" />
              ה-AI קבע 3 פגישות חדשות מאז אתמול
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            סנכרון אחרון: לפני 2 דקות
          </div>
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {PIPELINE_STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={16} className={stat.color} />
                <span className="text-white/40 text-xs">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Lead Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-bl from-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 lg:p-8 mb-6 relative overflow-hidden"
        >
          {/* Glow effects */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-[hsl(var(--primary))]/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />

          {/* Card Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-amber-600 flex items-center justify-center text-black text-xl font-bold shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
                י.י
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold">ישראל ישראלי</h2>
                <p className="text-white/40 text-sm">054-1234567 • israel@email.co.il</p>
              </div>
            </div>
            <motion.div
              animate={{ boxShadow: ["0 0 10px rgba(16,185,129,0.3)", "0 0 25px rgba(16,185,129,0.5)", "0 0 10px rgba(16,185,129,0.3)"] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-4 py-2 text-emerald-400 text-sm font-medium"
            >
              <Bot size={16} />
              🤖 פגישה נקבעה אוטומטית
            </motion.div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
            {/* AI Summary */}
            <div className="lg:col-span-2 bg-black/20 border border-[hsl(var(--primary))]/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[hsl(var(--primary))]" />
                <span className="text-[hsl(var(--primary))] text-sm font-semibold">תקציר AI</span>
              </div>
              <p className="text-white/80 leading-relaxed text-sm lg:text-base">
                זוהה <span className="text-red-400 font-semibold">כפל ביטוחי בריאות</span> (מגדל והראל).
                פוטנציאל חיסכון:{" "}
                <span className="text-emerald-400 font-bold text-lg">450 ש״ח</span> לחודש.
                הלקוח מעוניין בביטול הכפילות ואישר פגישת זום.
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { icon: FileText, text: "תלוש שכר נסרק", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                  { icon: Shield, text: "דו״ח מסלקה מצורף", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                  { icon: CheckCheck, text: "הסכמת GDPR", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                ].map((tag, i) => (
                  <span key={i} className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border ${tag.color}`}>
                    <tag.icon size={12} />
                    {tag.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Next Action */}
            <div className="flex flex-col gap-4">
              {/* Meeting Card */}
              <div className="bg-black/20 border border-emerald-500/20 rounded-2xl p-4 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-emerald-400" />
                  <span className="text-emerald-400 text-sm font-semibold">פעולה הבאה</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Video size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">זום מחר ב-10:00</p>
                    <p className="text-white/40 text-xs flex items-center gap-1">
                      <Clock size={10} /> 30 דקות משוערות
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Log - Live Chat Simulation */}
              <WhatsAppLiveLog />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 relative z-10">
            <Button className="bg-gradient-to-l from-[hsl(var(--primary))] to-amber-600 text-black font-bold hover:opacity-90 rounded-xl h-12 px-8 text-base shadow-[0_0_25px_hsl(var(--primary)/0.3)]">
              <Video size={18} className="ml-2" />
              היכנס לפגישה
            </Button>
            <Button onClick={() => setShowFullFile(true)} variant="outline" className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 rounded-xl h-12 px-8 text-base">
              <Eye size={18} className="ml-2" />
              צפה בתיק המלא
            </Button>
            <Button variant="ghost" className="text-white/40 hover:text-white/70 rounded-xl h-12 px-6">
              <Phone size={16} className="ml-2" />
              חייג ישירות
            </Button>
          </div>
        </motion.div>

        {/* Upcoming Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-white/60 mb-4 flex items-center gap-2">
            <Zap size={16} className="text-[hsl(var(--primary))]" />
            תור פגישות קרוב
          </h3>
          <div className="space-y-3">
            {QUEUE_LEADS.map((lead, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between hover:border-white/10 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 font-bold text-sm">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white/80">{lead.name}</p>
                    <p className="text-white/30 text-xs flex items-center gap-1">
                      <Clock size={10} /> {lead.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">
                    {lead.tag}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    lead.score >= 80 ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                  }`}>
                    {lead.score}
                  </div>
                  <ChevronLeft size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      <FullFileModal open={showFullFile} onClose={() => setShowFullFile(false)} />
    </div>
  );
}
