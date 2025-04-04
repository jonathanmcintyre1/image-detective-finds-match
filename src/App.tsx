
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BetaSignupProvider } from "@/hooks/useBetaSignupPrompt";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useState, useCallback, useMemo } from "react";

// Create the QueryClient outside of the component to prevent re-creation on each render
const queryClient = new QueryClient();

const App = () => {
  const [betaSignupVisible, setBetaSignupVisible] = useState(false);
  
  // Properly memoize the callback to prevent it from causing re-renders
  const handleBetaSignupChange = useCallback((value: boolean) => {
    if (value !== betaSignupVisible) {
      setBetaSignupVisible(value);
    }
  }, [betaSignupVisible]);
  
  // Memoize the BetaSignupProvider props to prevent unnecessary re-renders
  const betaSignupProviderProps = useMemo(() => ({
    initialValue: betaSignupVisible,
    onChange: handleBetaSignupChange
  }), [betaSignupVisible, handleBetaSignupChange]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BetaSignupProvider 
          initialValue={betaSignupProviderProps.initialValue} 
          onChange={betaSignupProviderProps.onChange}
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
