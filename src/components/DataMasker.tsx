import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface DataMaskerProps {
  value: string;
  type: "id" | "account" | "phone" | "email";
}

function maskValue(value: string, type: string): string {
  if (!value) return "-";
  switch (type) {
    case "id":
      return value.length > 4 ? "***" + value.slice(-4) : "***";
    case "account":
      return value.length > 4 ? "****" + value.slice(-4) : "****";
    case "phone":
      return value.length > 4 ? "***-***" + value.slice(-4) : "***";
    case "email": {
      const [local, domain] = value.split("@");
      if (!domain) return "***";
      return local.slice(0, 2) + "***@" + domain;
    }
    default:
      return "***";
  }
}

const DataMasker = ({ value, type }: DataMaskerProps) => {
  const { role } = useAuth();
  const [revealed, setRevealed] = useState(false);

  // Admin can toggle, others always masked
  const isAdmin = role === "admin";
  const showFull = isAdmin && revealed;

  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-sm">
        {showFull ? value : maskValue(value, type)}
      </span>
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setRevealed(!revealed)}
        >
          {revealed ? (
            <EyeOff className="w-3 h-3" />
          ) : (
            <Eye className="w-3 h-3" />
          )}
        </Button>
      )}
    </span>
  );
};

export default DataMasker;
