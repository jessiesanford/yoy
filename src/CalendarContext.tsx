import React, { createContext, useContext, useState } from "react";
import { addMonths, subMonths } from "date-fns";

interface CalendarContextType {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  nextMonth: () => void;
  prevMonth: () => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));

  return (
    <CalendarContext.Provider value={{ currentMonth, setCurrentMonth, nextMonth, prevMonth }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
};