import { forwardRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDemo } from "@/contexts/DemoContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("consultant" | "client" | "admin")[];
}

const DEFAULT_ALLOWED_ROLES: ("consultant" | "client" | "admin")[] = ["consultant", "admin"];

export const ProtectedRoute = forwardRef<HTMLDivElement, ProtectedRouteProps>(
  function ProtectedRoute({ children, allowedRoles = DEFAULT_ALLOWED_ROLES }, ref) {
  const { user, role, loading } = useAuth();
  const { isDemoMode } = useDemo();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDemo = isDemoMode || searchParams.get("demo") === "true";
  const requiresRole = allowedRoles.length > 0;

  // KEY INSIGHT: if a user is signed in but role is not yet resolved,
  // we are still in a loading state — NOT a denial. This eliminates the
  // window where ProtectedRoute would redirect during the brief gap
  // between SIGNED_IN and the role fetch completing.
  const rolePending = !!user && requiresRole && role === null;
  const roleDenied = !!user && requiresRole && role !== null && !allowedRoles.includes(role);
  const stillLoading = loading || rolePending;

  useEffect(() => {
    if (isDemo || stillLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (roleDenied) {
      navigate("/", { replace: true });
    }
  }, [isDemo, stillLoading, user, roleDenied, navigate]);

  if (isDemo) {
    return <>{children}</>;
  }

  if (stillLoading || !user || roleDenied) {
    return (
      <div ref={ref} className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
});
