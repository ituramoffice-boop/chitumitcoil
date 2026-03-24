import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { SplashScreen } from "@/components/SplashScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SelfCheck from "./pages/SelfCheck";
import MortgageCalculatorLanding from "./pages/MortgageCalculatorLanding";
import PropertyValueCalculator from "./pages/PropertyValueCalculator";
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
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <WorkspaceProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/self-check" element={<SelfCheck />} />
              <Route path="/calculator" element={<MortgageCalculatorLanding />} />
              <Route path="/property-value" element={<PropertyValueCalculator />} />
              <Route path="/sign/:token" element={<RemoteSign />} />
              <Route path="/pitch" element={<Pitch />} />
              <Route path="/investors" element={<Investors />} />
              <Route path="/directory" element={<ConsultantDirectory />} />
              <Route path="/consultant/:userId" element={<ConsultantProfile />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/:section" element={<Dashboard />} />
              <Route path="/accessibility" element={<Accessibility />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AccessibilityBadge />
            <MobileBottomNav />
            <PWAInstallPrompt />
            </WorkspaceProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
