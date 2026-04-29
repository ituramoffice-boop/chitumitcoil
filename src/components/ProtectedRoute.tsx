import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDemo } from "@/contexts/DemoContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("consultant" | "client" | "admin")[];
}

const DEFAULT_ALLOWED_ROLES: ("consultant" | "client" | "admin")[] = ["consultant", "admin"];

export function ProtectedRoute({ children, allowedRoles = DEFAULT_ALLOWED_ROLES }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const { isDemoMode } = useDemo();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDemo = isDemoMode || searchParams.get("demo") === "true";
  const requiresRole = allowedRoles.length > 0;
  const roleDenied = !!user && requiresRole && (!role || !allowedRoles.includes(role));

  useEffect(() => {
    if (isDemo || loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (roleDenied) {
      navigate("/", { replace: true });
    }
  }, [isDemo, loading, user, roleDenied, navigate]);

  if (isDemo) {
    return <>{children}</>;
  }

  if (loading || !user || roleDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
