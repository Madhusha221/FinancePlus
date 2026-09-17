import React, { createContext, useState, useEffect } from 'react';

export const DateContext = createContext();

export const DateProvider = ({ children }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Check system time every 30 seconds for seamless midnight rollover
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== currentDate.getDate() || now.getMonth() !== currentDate.getMonth() || now.getFullYear() !== currentDate.getFullYear()) {
        setCurrentDate(now);
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [currentDate]);

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }); // e.g. "Monday, September 7, 2026"

  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
  const monthNum = currentDate.getMonth() + 1;
  const yearNum = currentDate.getFullYear();
  const dayNum = currentDate.getDate();
  const isoDate = currentDate.toISOString().split('T')[0];

  return (
    <DateContext.Provider
      value={{
        currentDate,
        formattedDate,
        dayName,
        monthName,
        monthNum,
        yearNum,
        dayNum,
        isoDate,
      }}
    >
      {children}
    </DateContext.Provider>
  );
};
