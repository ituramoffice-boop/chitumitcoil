import { ShieldCheck } from "lucide-react";

export function TrustBankLogos({ className = "" }: { className?: string }) {
  const banks = [
    {
      name: "הפועלים",
      abbr: "פ",
      bg: "bg-red-600",
      text: "text-white",
    },
    {
      name: "לאומי",
      abbr: "ל",
      bg: "bg-blue-600",
      text: "text-white",
    },
    {
      name: "דיסקונט",
      abbr: "ד",
      bg: "bg-orange-500",
      text: "text-white",
    },
    {
      name: "מזרחי טפחות",
      abbr: "מ",
      bg: "bg-emerald-600",
      text: "text-white",
    },
    {
      name: "בנק ישראל",
      abbr: "₪",
      bg: "bg-slate-700",
      text: "text-white",
    },
  ];

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 uppercase tracking-widest">
        <ShieldCheck className="w-3 h-3 text-gold" />
        <span>מותאם למדיניות האשראי של</span>
      </div>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {banks.map((bank) => (
          <div
            key={bank.name}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card/80 border border-border/40 hover:border-gold/30 transition-colors"
          >
            <div
              className={`w-7 h-7 rounded-lg ${bank.bg} ${bank.text} flex items-center justify-center text-sm font-black shadow-sm`}
            >
              {bank.abbr}
            </div>
            <span className="text-xs font-medium text-foreground">{bank.name}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-1">
        {/* Visa */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/60 border border-border/30">
          <div className="w-8 h-5 rounded bg-gradient-to-r from-blue-700 to-blue-500 flex items-center justify-center">
            <span className="text-[8px] font-black text-white tracking-wider">VISA</span>
          </div>
        </div>
        {/* Stripe */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/60 border border-border/30">
          <div className="w-8 h-5 rounded bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
            <span className="text-[7px] font-bold text-white">stripe</span>
          </div>
        </div>
        {/* SSL */}
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-card/60 border border-border/30 text-[10px] text-muted-foreground">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>SSL 256-bit</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/50">חישובים מותאמים למדיניות אשראי עדכנית · סליקה מאובטחת</p>
    </div>
  );
}
