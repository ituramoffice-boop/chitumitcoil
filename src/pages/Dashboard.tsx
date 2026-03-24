import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, LogOut, Phone } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardOverview from "@/components/DashboardOverview";
import SmartBuckets from "@/components/SmartBuckets";
import FinancialScenarios from "@/components/FinancialScenarios";
import ReportsPage from "@/components/ReportsPage";
import ClientDashboard from "./ClientDashboard";
import ConsultantDashboard from "./ConsultantDashboard";
import TeamManagement from "./TeamManagement";
import AgencyReports from "./AgencyReports";
import LeadManagement from "./LeadManagement";
import { SignatureManager } from "@/components/SignatureManager";
import { DialerDashboard } from "@/components/DialerDashboard";
import { SalesLeaderboard } from "@/components/SalesLeaderboard";
import ClientManagement from "./ClientManagement";
import ConsultantSettings from "./ConsultantSettings";
import { supabase } from "@/integrations/supabase/client";

const sectionComponents: Record<string, React.FC> = {
  upload: SmartBuckets,
  scenarios: FinancialScenarios,
  reports: ReportsPage,
  clients: () => <LeadManagement />,
  signatures: () => <SignatureManager />,
  dialer: () => <DialerDashboard />,
  "sales-results": () => <SalesLeaderboard />,
  "client-management": () => <ClientManagement />,
  team: () => <TeamManagement />,
  "agency-reports": () => <AgencyReports />,
};


const Dashboard = () => {
  const { user, role, loading } = useAuth();
  const { section } = useParams<{ section?: string }>();
  const [adminMode, setAdminMode] = useState<"crm" | "admin">("crm");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Client gets simplified view
  if (role === "client") return <ClientDashboard />;

  // Consultant always gets CRM dashboard
  if (role === "consultant") return <ConsultantDashboard />;

  // Admin: toggle between CRM and Admin dashboard
  if (role === "admin") {
    if (adminMode === "crm" && !section) {
      return <ConsultantDashboard onSwitchToAdmin={() => setAdminMode("admin")} />;
    }

    const ActiveSection = section ? (sectionComponents[section] || DashboardOverview) : DashboardOverview;

    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 sticky top-0 z-50">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Button variant="outline" size="sm" onClick={() => setAdminMode("crm")}>
                  🔄 מצב מכירות
                </Button>
                <SignOutButton />
              </div>
            </header>
            <main className="flex-1 p-6 overflow-auto">
              <ActiveSection />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return <Navigate to="/auth" replace />;
};

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <Button variant="ghost" size="sm" onClick={signOut}>
      <LogOut className="w-4 h-4 ml-1" />
      יציאה
    </Button>
  );
}

export default Dashboard;
