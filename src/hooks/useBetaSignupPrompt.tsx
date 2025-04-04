import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface BetaSignupContextType {
  showBetaSignup: boolean;
  setShowBetaSignup: (value: boolean) => void;
}

const BetaSignupContext = createContext<BetaSignupContextType | null>(null);

interface BetaSignupProviderProps {
  children: React.ReactNode;
  initialValue?: boolean;
  onChange?: (value: boolean) => void;
}

export const BetaSignupProvider: React.FC<BetaSignupProviderProps> = ({
  children,
  initialValue = false,
  onChange
}) => {
  const [showBetaSignup, setShowBetaSignupState] = useState<boolean>(initialValue);
  const isFirstRender = useRef(true);
  const onChangeRef = useRef(onChange);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setShowBetaSignupState(initialValue);
  }, [initialValue]);

  const setShowBetaSignup = useCallback((value: boolean) => {
    setShowBetaSignupState(value);
    if (onChangeRef.current) {
      onChangeRef.current(value);
    }
  }, []);

  const value = {
    showBetaSignup,
    setShowBetaSignup
  };

  return (
    <BetaSignupContext.Provider value={value}>
      {children}
    </BetaSignupContext.Provider>
  );
};

export const useBetaSignupPrompt = () => {
  const context = useContext(BetaSignupContext);
  
  if (!context) {
    throw new Error('useBetaSignupPrompt must be used within a BetaSignupProvider');
  }
  
  return context;
};
