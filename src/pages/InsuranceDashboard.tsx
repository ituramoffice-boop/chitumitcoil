import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, LayoutDashboard, FileText, Users, BarChart3, LogOut, Menu, X } from "lucide-react";
import { InsuranceOverview } from "@/components/insurance/InsuranceOverview";
import { InsurancePolicies } from "@/components/insurance/InsurancePolicies";
import { InsuranceClients } from "@/components/insurance/InsuranceClients";
import { InsuranceReports } from "@/components/insurance/InsuranceReports";

type Section = "overview" | "policies" | "clients" | "reports";

const NAV_ITEMS: { key: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "סקירה כללית", icon: LayoutDashboard },
  { key: "policies", label: "פוליסות", icon: FileText },
  { key: "clients", label: "לקוחות", icon: Users },
  { key: "reports", label: "דוחות", icon: BarChart3 },
];

const SECTION_COMPONENTS: Record<Section, React.FC> = {
  overview: InsuranceOverview,
  policies: InsurancePolicies,
  clients: InsuranceClients,
  reports: InsuranceReports,
};

const InsuranceDashboard = () => {
  const { user, signOut } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const displayName = user?.user_metadata?.full_name || user?.email || "סוכן";

  const ActiveComponent = SECTION_COMPONENTS[section];

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 right-0 z-50 lg:z-auto
        h-screen w-64 bg-card border-l border-border/50
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}>
        {/* Brand */}
        <div className="h-14 flex items-center gap-2 px-4 border-b border-border/50">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-bold text-foreground text-sm">חיתומית — ביטוח</span>
          <Button variant="ghost" size="icon" className="mr-auto lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User */}
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground">סוכן ביטוח</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => { setSection(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                section === item.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border/50">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            יציאה
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-xl px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-sm font-semibold text-foreground">
              {NAV_ITEMS.find((n) => n.key === section)?.label}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
};

export default InsuranceDashboard;
