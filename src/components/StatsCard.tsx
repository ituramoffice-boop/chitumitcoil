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
  default: "glow-accent border-accent/20",
  success: "glow-primary border-primary/20",
  warning: "border-warning/20",
  danger: "glow-danger border-destructive/20",
};

const iconVariantStyles = {
  default: "text-accent",
  success: "text-primary",
  warning: "text-warning",
  danger: "text-destructive",
};

export function StatsCard({ title, value, subtitle, icon: Icon, variant = "default" }: StatsCardProps) {
  return (
    <div className={cn("glass-card p-5 animate-slide-in", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("p-2.5 rounded-lg bg-secondary", iconVariantStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
