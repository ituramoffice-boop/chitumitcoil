export function TrustBankLogos({ className = "" }: { className?: string }) {
  const banks = [
    { name: "הפועלים", color: "hsl(0, 75%, 50%)" },
    { name: "לאומי", color: "hsl(210, 80%, 45%)" },
    { name: "דיסקונט", color: "hsl(25, 85%, 50%)" },
    { name: "מזרחי", color: "hsl(140, 60%, 40%)" },
  ];

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex items-center gap-4 flex-wrap justify-center">
        {banks.map((bank) => (
          <div
            key={bank.name}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/60 border border-border/30 text-xs text-muted-foreground"
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: bank.color }}
            />
            <span>{bank.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/60 border border-border/30 text-xs text-muted-foreground">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gold" fill="currentColor"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7 3.5v7.64l-7 3.5-7-3.5V7.68l7-3.5z"/></svg>
          <span>Visa / Stripe</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/60">חישובים מותאמים וסליקה מאובטחת</p>
    </div>
  );
}
