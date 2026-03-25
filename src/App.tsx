import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { SplashScreen } from "@/components/SplashScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionRoute } from "@/components/SubscriptionRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./pages/ClientDashboard";
import SelfCheck from "./pages/SelfCheck";
import MortgageCalculatorLanding from "./pages/MortgageCalculatorLanding";
import PropertyValueCalculator from "./pages/PropertyValueCalculator";
import PropertyLoanFunnel from "./pages/PropertyLoanFunnel";
import MortgageInsurance from "./pages/MortgageInsurance";
import RemoteSign from "./pages/RemoteSign";
import Pitch from "./pages/Pitch";
import Investors from "./pages/Investors";
import ConsultantDirectory from "./pages/ConsultantDirectory";
import ConsultantProfile from "./pages/ConsultantProfile";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Accessibility from "./pages/Accessibility";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { AccessibilityBadge } from "@/components/AccessibilityBadge";
import Unsubscribe from "./pages/Unsubscribe";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import DemoHub from "./pages/DemoHub";
import AdvisorPricing from "./pages/AdvisorPricing";
import AdvisorPlans from "./pages/AdvisorPlans";
import MasterAdmin from "./pages/MasterAdmin";
import CEOReport from "./pages/CEOReport";
import AdminMobile from "./pages/AdminMobile";
import Milestone2000 from "./pages/Milestone2000";
import GetStarted from "./pages/GetStarted";
import MasterAdminDemo from "./pages/MasterAdminDemo";
import MarketingAssetsHub from "./pages/MarketingAssetsHub";
import JoinTheElite from "./pages/JoinTheElite";
import WarRoom from "./pages/WarRoom";
import VIPEntrance from "./pages/VIPEntrance";
import { DemoBanner } from "@/components/DemoBanner";

// Protected pages
import AdminDashboard from "./pages/AdminDashboard";
import AgencyReports from "./pages/AgencyReports";
import ClientManagement from "./pages/ClientManagement";
import ConsultantDashboard from "./pages/ConsultantDashboard";
import ConsultantSettings from "./pages/ConsultantSettings";
import LeadManagement from "./pages/LeadManagement";
import TeamManagement from "./pages/TeamManagement";
import SalesAcademy from "./pages/SalesAcademy";
import WhatsAppAIManager from "./pages/WhatsAppAIManager";
import CampaignsDashboard from "./pages/CampaignsDashboard";
import InsuranceDashboard from "./pages/InsuranceDashboard";

const queryClient = new QueryClient();

const App = () => {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DemoProvider>
           <AuthProvider>
             <WorkspaceProvider>
             <Routes>
               {/* Public routes */}
               <Route path="/" element={<Index />} />
               <Route path="/auth" element={<Auth />} />
               <Route path="/self-check" element={<SelfCheck />} />
               <Route path="/calculator" element={<MortgageCalculatorLanding />} />
               <Route path="/property-value" element={<PropertyValueCalculator />} />
               <Route path="/property-loan" element={<PropertyLoanFunnel />} />
               <Route path="/mortgage-insurance" element={<MortgageInsurance />} />
               <Route path="/sign/:token" element={<RemoteSign />} />
               <Route path="/pitch" element={<Pitch />} />
               <Route path="/investors" element={<Investors />} />
               <Route path="/directory" element={<ConsultantDirectory />} />
               <Route path="/consultant/:userId" element={<ConsultantProfile />} />
               <Route path="/demo" element={<DemoHub />} />
               <Route path="/advisor-pricing" element={<AdvisorPricing />} />
               <Route path="/advisor-plans" element={<AdvisorPlans />} />
               <Route path="/get-started" element={<GetStarted />} />
               <Route path="/join-the-elite" element={<JoinTheElite />} />
               <Route path="/vip/:advisorSlug" element={<VIPEntrance />} />
               <Route path="/milestone-2000" element={<Milestone2000 />} />
               <Route path="/accessibility" element={<Accessibility />} />
               <Route path="/reset-password" element={<ResetPassword />} />
               <Route path="/terms" element={<Terms />} />
               <Route path="/privacy" element={<Privacy />} />
               <Route path="/unsubscribe" element={<Unsubscribe />} />

               {/* Client routes */}
               <Route path="/client-dashboard" element={
                 <ProtectedRoute allowedRoles={["client", "consultant", "admin"]}>
                   <ClientDashboard />
                 </ProtectedRoute>
               } />

               {/* Consultant + Admin routes */}
               <Route path="/dashboard" element={
                 <ProtectedRoute allowedRoles={["consultant", "admin"]}>
                   <Dashboard />
                 </ProtectedRoute>
               } />
                <Route path="/dashboard/academy" element={
                  <SubscriptionRoute allowedRoles={["consultant", "admin"]}>
                    <SalesAcademy />
                  </SubscriptionRoute>
                } />
               <Route path="/dashboard/:section" element={
                 <ProtectedRoute allowedRoles={["consultant", "admin"]}>
                   <Dashboard />
                 </ProtectedRoute>
               } />
               <Route path="/consultant-dashboard" element={
                 <ProtectedRoute allowedRoles={["consultant", "admin"]}>
                   <SalesAcademy />
                 </ProtectedRoute>
               } />
               <Route path="/consultant-dashboard" element={
                 <ProtectedRoute allowedRoles={["consultant", "admin"]}>
                   <ConsultantDashboard />
                 </ProtectedRoute>
               } />
               <Route path="/consultant-settings" element={
                 <ProtectedRoute allowedRoles={["consultant", "admin"]}>
                   <ConsultantSettings />
                 </ProtectedRoute>
               } />
               <Route path="/lead-management" element={
                 <ProtectedRoute allowedRoles={["consultant", "admin"]}>
                   <LeadManagement />
                 </ProtectedRoute>
               } />
               <Route path="/client-management" element={
                 <ProtectedRoute allowedRoles={["consultant", "admin"]}>
                   <ClientManagement />
                 </ProtectedRoute>
               } />
               <Route path="/team-management" element={
                 <ProtectedRoute allowedRoles={["consultant", "admin"]}>
                   <TeamManagement />
                 </ProtectedRoute>
               } />
               <Route path="/agency-reports" element={
                 <ProtectedRoute allowedRoles={["consultant", "admin"]}>
                   <AgencyReports />
                 </ProtectedRoute>
               } />

               {/* Admin-only routes */}
               <Route path="/admin-dashboard" element={
                 <ProtectedRoute allowedRoles={["admin"]}>
                   <AdminDashboard />
                 </ProtectedRoute>
               } />
               <Route path="/master-admin" element={
                 <ProtectedRoute allowedRoles={["admin"]}>
                   <MasterAdmin />
                 </ProtectedRoute>
               } />
               <Route path="/master-admin/demo" element={
                 <ProtectedRoute allowedRoles={["admin"]}>
                   <MasterAdminDemo />
                 </ProtectedRoute>
               } />
               <Route path="/master-admin/marketing" element={
                 <ProtectedRoute allowedRoles={["admin"]}>
                   <MarketingAssetsHub />
                 </ProtectedRoute>
               } />
                <Route path="/admin/war-room" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <WarRoom />
                  </ProtectedRoute>
                } />
                 <Route path="/admin/whatsapp-ai" element={
                   <ProtectedRoute allowedRoles={["admin"]}>
                     <WhatsAppAIManager />
                   </ProtectedRoute>
                 } />
                 <Route path="/admin/campaigns" element={
                   <ProtectedRoute allowedRoles={["admin"]}>
                     <CampaignsDashboard />
                   </ProtectedRoute>
                 } />
               <Route path="/ceo-report" element={
                 <ProtectedRoute allowedRoles={["admin"]}>
                   <CEOReport />
                 </ProtectedRoute>
               } />
               <Route path="/admin-mobile" element={
                 <ProtectedRoute allowedRoles={["admin"]}>
                   <AdminMobile />
                 </ProtectedRoute>
               } />

               <Route path="*" element={<NotFound />} />
             </Routes>
             <AccessibilityBadge />
             <MobileBottomNav />
             <PWAInstallPrompt />
             <DemoBanner />
             </WorkspaceProvider>
           </AuthProvider>
          </DemoProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
