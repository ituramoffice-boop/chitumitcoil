import { CheckCircle2, Upload, Brain, Calculator, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  key: string;
  label: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  { key: "upload", label: "העלאת מסמכים", icon: Upload },
  { key: "analysis", label: "ניתוח AI", icon: Brain },
  { key: "feasibility", label: "בדיקת היתכנות", icon: Calculator },
  { key: "approval", label: "אישור עקרוני", icon: ShieldCheck },
];

interface Props {
  currentStep: number; // 0-3
}

export function ClientProgressTracker({ currentStep }: Props) {
  return (
    <div className="glass-card p-6 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[400px]">
        {STEPS.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                    isDone
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : isActive
                      ? "bg-primary/20 text-primary ring-2 ring-primary/50 animate-pulse-glow"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <span className={cn(
                  "text-xs font-medium text-center whitespace-nowrap",
                  isDone ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-1 mx-2 rounded-full transition-all duration-500",
                  isDone ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
