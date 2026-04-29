import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const requiresRole = allowedRoles.length > 0;
  const roleDenied = !!user && requiresRole && (!role || !allowedRoles.includes(role));
  const shouldRedirectToPricing = !!user && !roleDenied && role !== "admin" && !isSubscribed;

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (roleDenied) {
      navigate("/", { replace: true });
      return;
    }
    if (shouldRedirectToPricing) {
      navigate("/advisor-pricing", { replace: true });
    }
  }, [authLoading, wsLoading, user, roleDenied, shouldRedirectToPricing, navigate]);

  if (authLoading || wsLoading || !user || roleDenied || shouldRedirectToPricing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admins always have access
  if (role === "admin") {
    return <>{children}</>;
  }

  return <>{children}</>;
}
