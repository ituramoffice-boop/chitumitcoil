import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building2, User } from "lucide-react";
import { toast } from "sonner";

export function WorkspaceSettings() {
  const { businessType, setBusinessType } = useWorkspace();

  const handleChange = async (type: "solo" | "agency") => {
    await setBusinessType(type);
    toast.success(type === "solo" ? "מצב יועץ עצמאי הופעל" : "מצב משרד/סוכנות הופעל");
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">סוג פעילות</h4>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleChange("solo")}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
            businessType === "solo"
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border hover:border-primary/30 hover:bg-secondary/50"
          )}
        >
          <User className={cn("w-6 h-6", businessType === "solo" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-sm font-medium", businessType === "solo" ? "text-primary" : "text-foreground")}>
            יועץ עצמאי
          </span>
          <span className="text-[10px] text-muted-foreground text-center">תצוגה מאוחדת ופשוטה</span>
        </button>
        <button
          onClick={() => handleChange("agency")}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
            businessType === "agency"
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border hover:border-primary/30 hover:bg-secondary/50"
          )}
        >
          <Building2 className={cn("w-6 h-6", businessType === "agency" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-sm font-medium", businessType === "agency" ? "text-primary" : "text-foreground")}>
            משרד / סוכנות
          </span>
          <span className="text-[10px] text-muted-foreground text-center">ניהול צוות ומחלקות</span>
        </button>
      </div>
    </div>
  );
}
