
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BetaSignupProvider } from "@/hooks/useBetaSignupPrompt";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useState, useCallback } from "react";

// Create the QueryClient outside of the component to prevent re-creation on each render
const queryClient = new QueryClient();

const App = () => {
  const [betaSignupVisible, setBetaSignupVisible] = useState(false);
  
  // Simple onChange handler with proper dependency
  const handleBetaSignupChange = useCallback((value: boolean) => {
    setBetaSignupVisible(value);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BetaSignupProvider 
          initialValue={betaSignupVisible} 
          onChange={handleBetaSignupChange}
        >
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </BetaSignupProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
