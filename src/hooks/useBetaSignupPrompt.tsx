
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
  
  // Use useCallback to prevent the function from being recreated on every render
  // Fixed the infinite loop by properly using dependencies array
  const setShowBetaSignup = useCallback((value: boolean) => {
    // Only update state and call onChange if the value is actually changing
    if (value !== showBetaSignup) {
      setInternalShowBetaSignup(value);
      
      // Only call onChange if it exists
      if (onChange) {
        onChange(value);
      }
    }
  }, [onChange, showBetaSignup]);
  
  // Memoize the context value to prevent unnecessary rerenders of consumers
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
