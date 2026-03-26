import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Users, Calendar, Settings, Phone, Video, FileText,
  Shield, Bot, Clock, ChevronLeft, Sparkles, Eye, MessageCircle,
  TrendingUp, Zap, Star, CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

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


  const [activeNav, setActiveNav] = useState(0);

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
            <Button variant="outline" className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 rounded-xl h-12 px-8 text-base">
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
    </div>
  );
}
