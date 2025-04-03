
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BetaSignupContextType {
  showBetaSignup: boolean;
  setShowBetaSignup: React.Dispatch<React.SetStateAction<boolean>>;
}

const BetaSignupContext = createContext<BetaSignupContextType | undefined>(undefined);

export const BetaSignupProvider: React.FC<{
  children: ReactNode;
  initialValue?: boolean;
  onChange?: (value: boolean) => void;
}> = ({ children, initialValue = false, onChange }) => {
  const [showBetaSignup, setInternalShowBetaSignup] = useState(initialValue);
  
  // Create a wrapper setter that calls onChange if provided
  const setShowBetaSignup = (value: React.SetStateAction<boolean>) => {
    setInternalShowBetaSignup(prevValue => {
      const newValue = typeof value === 'function' ? value(prevValue) : value;
      if (onChange && newValue !== prevValue) {
        onChange(newValue);
      }
      return newValue;
    });
  };
  
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
