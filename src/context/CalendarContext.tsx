import React, { createContext, useContext, useEffect, useState } from "react";
import { addMonths, subMonths } from "date-fns";
import Holidays, { HolidaysTypes } from "date-holidays";


interface CalendarContextType {
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  months: Array<Date>;
  holidays: HolidaysTypes.Holiday[];
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const months = Array.from({ length: 12 }, (_, i) => new Date(2025, i, 1));
  const [selectedYear, setSelectedYear] = useState(selectedMonth);

  useEffect(() => {
    if (selectedYear) {
      setSelectedYear(selectedMonth);
    }
  }, [selectedMonth, setSelectedYear])

  const holidays = new Holidays('CA');
  const holidaysForSelectedYear = holidays.getHolidays(selectedMonth.getFullYear());

  const nextMonth = () => setSelectedMonth((prev) => addMonths(prev, 1));
  const prevMonth = () => setSelectedMonth((prev) => subMonths(prev, 1));

  const provided = {
    selectedMonth,
    setSelectedMonth,
    nextMonth,
    prevMonth,
    months,
    holidays: holidaysForSelectedYear,
  }

  return (
    <CalendarContext.Provider value={provided}>
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