import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDemo } from "@/contexts/DemoContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("consultant" | "client" | "admin")[];
}

export function ProtectedRoute({ children, allowedRoles = ["consultant", "admin"] }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const { isDemoMode } = useDemo();
  const [searchParams] = useSearchParams();
  const isDemo = isDemoMode || searchParams.get("demo") === "true";

  if (isDemo) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
