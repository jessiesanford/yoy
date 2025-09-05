import React, { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { addMonths, subMonths } from "date-fns";
import Holidays, { HolidaysTypes } from "date-holidays";
import { parseICS } from "../utils/parseICS.ts";


interface CalendarContextType {
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  months: Array<Date>;
  holidays: HolidaysTypes.Holiday[];
  sidebarCalendarOpen: boolean,
  setSidebarCalendarOpen: Dispatch<SetStateAction<boolean>>;
  settingsSidebarOpen: boolean,
  setSettingsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  events: CalendarEvent[];
  importCalendar: () => void;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  allDay: boolean;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(selectedMonth);
  const [months, setMonths] = useState(Array.from({ length: 12 }, (_, i) => new Date(selectedYear.getFullYear(), i, 1)));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [sidebarCalendarOpen, setSidebarCalendarOpen] = useState(true);
  const [settingsSidebarOpen, setSettingsSidebarOpen] = useState(true);

  useEffect(() => {
    // Load all existing calendars on start
    window.ipcRenderer.invoke("read-all-ics").then((allData: string[]) => {
      const allEvents = allData.flatMap((data) => parseICS(data));
      setEvents(allEvents);
    });
  }, []);

  useEffect(() => {
    if (selectedYear) {
      setSelectedYear(selectedMonth);
    }
  }, [selectedMonth, selectedYear, setSelectedYear]);

  useEffect(() => {
    const d = Array.from({ length: 12 }, (_, i) => new Date(selectedYear.getFullYear(), i, 1))
    setMonths(d)
  }, [selectedYear]);

  const importCalendar = async () => {
    const savedPath: string | null = await (window as Window).ipcRenderer.pickAndSaveICS();
    if (!savedPath) return;

    // Read the file from the saved path
    const data = await (window as Window).ipcRenderer.readFile(savedPath); // We'll expose readFile in preload
    const parsedEvents = parseICS(data);
    setEvents((prev) => [...prev, ...parsedEvents]);
  };

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
    events,
    holidays: holidaysForSelectedYear,
    sidebarCalendarOpen,
    setSidebarCalendarOpen,
    importCalendar,
    settingsSidebarOpen,
    setSettingsSidebarOpen,
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