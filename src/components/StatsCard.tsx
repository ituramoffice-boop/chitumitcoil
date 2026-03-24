import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "glow-gold border-gold/20",
  success: "glow-cyan border-cyan-glow/20",
  warning: "border-gold/20 glow-gold",
  danger: "border-destructive/20",
};

const iconVariantStyles = {
  default: "text-gold",
  success: "text-cyan-glow",
  warning: "text-gold",
  danger: "text-destructive",
};

export function StatsCard({ title, value, subtitle, icon: Icon, variant = "default" }: StatsCardProps) {
  return (
    <div className={cn("glass-card p-5 animate-slide-in", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold gradient-header">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("p-2.5 rounded-lg bg-secondary/80", iconVariantStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
