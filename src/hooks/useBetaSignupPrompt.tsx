
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface BetaSignupContextType {
  showBetaSignup: boolean;
  setShowBetaSignup: (value: boolean) => void;
}

const BetaSignupContext = createContext<BetaSignupContextType | undefined>(undefined);

export const BetaSignupProvider: React.FC<{
  children: ReactNode;
  initialValue?: boolean;
  onChange?: (value: boolean) => void;
}> = ({ children, initialValue = false, onChange }) => {
  const [showBetaSignup, setInternalShowBetaSignup] = useState(initialValue);
  
  // Create the setShowBetaSignup function with useCallback to prevent recreation
  // and include onChange in dependencies
  const setShowBetaSignup = useCallback((value: boolean) => {
    if (value !== showBetaSignup) {
      setInternalShowBetaSignup(value);
      
      if (onChange) {
        onChange(value);
      }
    }
  }, [onChange, showBetaSignup]);
  
  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    showBetaSignup,
    setShowBetaSignup,
  }), [showBetaSignup, setShowBetaSignup]);
  
  return (
    <BetaSignupContext.Provider value={contextValue}>
      {children}
    </BetaSignupContext.Provider>
  );
};

export const useBetaSignupPrompt = () => {
  const context = useContext(BetaSignupContext);
  if (context === undefined) {
    throw new Error('useBetaSignupPrompt must be used within a BetaSignupProvider');
  }
  return context;
};
