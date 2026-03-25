import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Loader2 } from "lucide-react";

interface SubscriptionRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("consultant" | "client" | "admin")[];
}

export function SubscriptionRoute({ children, allowedRoles = ["consultant", "admin"] }: SubscriptionRouteProps) {
  const { user, role, loading: authLoading } = useAuth();
  const { isSubscribed, loading: wsLoading } = useWorkspace();

  if (authLoading || wsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Admins always have access
  if (role === "admin") {
    return <>{children}</>;
  }

  if (!isSubscribed) {
    return <Navigate to="/advisor-pricing" replace />;
  }

  return <>{children}</>;
}
