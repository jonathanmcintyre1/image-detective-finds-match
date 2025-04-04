
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

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
  const setShowBetaSignup = useCallback((value: boolean) => {
    setInternalShowBetaSignup(value);
    
    // Only call onChange if it exists AND the value is actually changing
    if (onChange && value !== showBetaSignup) {
      onChange(value);
    }
  }, [onChange, showBetaSignup]);
  
  return (
    <BetaSignupContext.Provider value={{ showBetaSignup, setShowBetaSignup }}>
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
