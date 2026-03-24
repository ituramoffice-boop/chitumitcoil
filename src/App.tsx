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
               <Route path="/sign/:token" element={<RemoteSign />} />
               <Route path="/pitch" element={<Pitch />} />
               <Route path="/investors" element={<Investors />} />
               <Route path="/directory" element={<ConsultantDirectory />} />
               <Route path="/consultant/:userId" element={<ConsultantProfile />} />
               <Route path="/dashboard" element={<Dashboard />} />
               <Route path="/dashboard/:section" element={<Dashboard />} />
               <Route path="/client-dashboard" element={<ClientDashboard />} />
               <Route path="/demo" element={<DemoHub />} />
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
