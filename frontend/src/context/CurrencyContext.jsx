import React, { createContext, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const { settings } = useContext(AuthContext);

  const symbol = settings?.currency_symbol || '₹';
  const currencyCode = settings?.currency || 'INR';

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `${symbol}${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ symbol, currencyCode, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};
