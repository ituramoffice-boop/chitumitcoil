import { forwardRef } from "react";
import { Home, Calculator, LayoutDashboard, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "בית", path: "/" },
  { icon: Calculator, label: "מחשבון", path: "/calculator" },
  { icon: LayoutDashboard, label: "דשבורד", path: "/dashboard" },
  { icon: User, label: "פרופיל", path: "/auth" },
];

export const MobileBottomNav = forwardRef<HTMLElement>((_props, ref) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (!isMobile) return null;

  const handleNav = (path: string) => {
    if (path === "/auth" && user) {
      navigate("/dashboard/consultant-settings");
    } else {
      navigate(path);
    }
  };

  return (
    <nav ref={ref} className="fixed bottom-0 inset-x-0 z-50 border-t border-border/50 bg-card/90 backdrop-blur-xl safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path || (path === "/dashboard" && location.pathname.startsWith("/dashboard"));
          return (
            <button
              key={path}
              onClick={() => handleNav(path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                active ? "text-gold" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
MobileBottomNav.displayName = "MobileBottomNav";
