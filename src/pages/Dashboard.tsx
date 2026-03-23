import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardOverview from "@/components/DashboardOverview";
import SmartBuckets from "@/components/SmartBuckets";
import FinancialScenarios from "@/components/FinancialScenarios";
import ReportsPage from "@/components/ReportsPage";
import AdminDashboard from "./AdminDashboard";
import ClientDashboard from "./ClientDashboard";
import ConsultantDashboard from "./ConsultantDashboard";

const sectionComponents: Record<string, React.FC> = {
  upload: SmartBuckets,
  scenarios: FinancialScenarios,
  reports: ReportsPage,
  clients: () => <AdminDashboard />,
};

const Dashboard = () => {
  const { user, role, loading } = useAuth();
  const { section } = useParams<{ section?: string }>();

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

  // Consultant or Admin without specific section gets full CRM dashboard
  if (role === "consultant" || (role === "admin" && !section)) return <ConsultantDashboard />;

  // Admin with specific section gets sidebar layout
  const ActiveSection = section ? (sectionComponents[section] || DashboardOverview) : DashboardOverview;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 sticky top-0 z-50">
            <SidebarTrigger />
            <SignOutButton />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <ActiveSection />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
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
