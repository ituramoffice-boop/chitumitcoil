import { Shield, Lock, CheckCircle } from "lucide-react";

export function ComplianceBanner() {
  return (
    <div className="border-t border-border/30 bg-card/40 backdrop-blur-sm py-4 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Badges */}
        <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap mb-2">
          {[
            { icon: Shield, label: "ISO 27001 Ready" },
            { icon: Lock, label: "GDPR Compliant" },
            { icon: CheckCircle, label: "AES-256 Encryption" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="w-3.5 h-3.5 text-gold/70" />
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] text-muted-foreground/60">
          חיתומית פועלת תחת תקני האבטחה המחמירים ביותר להגנה על מידע פיננסי
        </p>
      </div>
    </div>
  );
}
