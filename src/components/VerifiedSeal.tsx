import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedSealProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerifiedSeal({ size = "md", className }: VerifiedSealProps) {
  const sizes = {
    sm: { wrapper: "w-16 h-16", icon: "w-5 h-5", text: "text-[7px]", ring: "border-2" },
    md: { wrapper: "w-24 h-24", icon: "w-7 h-7", text: "text-[9px]", ring: "border-[3px]" },
    lg: { wrapper: "w-32 h-32", icon: "w-10 h-10", text: "text-[11px]", ring: "border-4" },
  };
  const s = sizes[size];

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className={cn(
        s.wrapper,
        "rounded-full flex flex-col items-center justify-center",
        s.ring,
        "border-gold/50 bg-gradient-to-br from-gold/10 via-transparent to-gold/5",
        "shadow-[0_0_20px_-5px_hsl(43,74%,52%,0.3)]"
      )}>
        <ShieldCheck className={cn(s.icon, "text-gold mb-0.5")} />
        <span className={cn(s.text, "font-bold text-gold text-center leading-tight")}>
          VERIFIED
        </span>
      </div>
      <span className={cn(s.text, "text-muted-foreground text-center leading-tight")}>
        Chitumit AI Screening
      </span>
    </div>
  );
}
