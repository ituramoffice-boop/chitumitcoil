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
import { DemoBanner } from "@/components/DemoBanner";

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
               <Route path="/dashboard" element={<Dashboard />} />
               <Route path="/dashboard/:section" element={<Dashboard />} />
               <Route path="/client-dashboard" element={<ClientDashboard />} />
                <Route path="/demo" element={<DemoHub />} />
                <Route path="/advisor-pricing" element={<AdvisorPricing />} />
                 <Route path="/advisor-plans" element={<AdvisorPlans />} />
                  <Route path="/master-admin" element={<MasterAdmin />} />
                  <Route path="/ceo-report" element={<CEOReport />} />
                  <Route path="/admin-mobile" element={<AdminMobile />} />
                  <Route path="/milestone-2000" element={<Milestone2000 />} />
               <Route path="/accessibility" element={<Accessibility />} />
               <Route path="/reset-password" element={<ResetPassword />} />
               <Route path="/terms" element={<Terms />} />
               <Route path="/privacy" element={<Privacy />} />
               <Route path="/unsubscribe" element={<Unsubscribe />} />
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
