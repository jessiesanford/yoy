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
  calendars: Calendar[]
  holidays: HolidaysTypes.Holiday[];
  sidebarCalendarOpen: boolean,
  setSidebarCalendarOpen: Dispatch<SetStateAction<boolean>>;
  settingsSidebarOpen: boolean,
  setSettingsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  events: CalendarEvent[];
  dayItems: Record<string, DayItem[]>;
  addDayItem: (date: Date, text: string) => void;
  removeDayItem: (date: Date, itemId: string) => void;
  importCalendar: () => void;
}

export interface Calendar {
  name: string;
  color: string;
  events: CalendarEvent[]
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

export interface DayItem {
  id: string;
  text: string;
  createdAt: string;
}

const DAY_ITEMS_STORAGE_KEY = "true-calendar-day-items";

export function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRandomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
}

function getRandomWord() {
  const words = [
    "apple", "river", "mountain", "sunset", "forest",
    "ocean", "cloud", "stone", "flame", "dream",
    "shadow", "storm", "flower", "echo", "light",
    "ember", "wind", "song", "sky", "star"
  ];

  return words[Math.floor(Math.random() * words.length)];
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(selectedMonth);
  const [months, setMonths] = useState(Array.from({ length: 12 }, (_, i) => new Date(selectedYear.getFullYear(), i, 1)));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dayItems, setDayItems] = useState<Record<string, DayItem[]>>(() => {
    const savedItems = localStorage.getItem(DAY_ITEMS_STORAGE_KEY);
    if (!savedItems) return {};

    try {
      return JSON.parse(savedItems) as Record<string, DayItem[]>;
    } catch {
      return {};
    }
  });
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [sidebarCalendarOpen, setSidebarCalendarOpen] = useState(true);
  const [settingsSidebarOpen, setSettingsSidebarOpen] = useState(true);

  useEffect(() => {
    // Load all existing calendars on start
    window.electronAPI.invoke("get-calendars").then((allData: string[]) => {
      const calendars = allData.map((data) => ({
        name: getRandomWord(),
        events: parseICS(data),
        color: getRandomColor(),
      }));
      setCalendars(calendars);

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
    localStorage.setItem(DAY_ITEMS_STORAGE_KEY, JSON.stringify(dayItems));
  }, [dayItems]);

  useEffect(() => {
    const d = Array.from({ length: 12 }, (_, i) => new Date(selectedYear.getFullYear(), i, 1))
    setMonths(d)
  }, [selectedYear]);

  const importCalendar = async () => {
    const savedPath = await (window as Window).electronAPI.importCalendar();
    if (!savedPath) return;

    // Read the file from the saved path
    const data = await (window as Window).electronAPI.readFile(savedPath); // We'll expose readFile in preload
    const parsedEvents = parseICS(data);
    setEvents((prev) => [...prev, ...parsedEvents]);
  };

  const holidays = new Holidays('CA');
  const holidaysForSelectedYear = holidays.getHolidays(selectedMonth.getFullYear());

  const nextMonth = () => setSelectedMonth((prev) => addMonths(prev, 1));
  const prevMonth = () => setSelectedMonth((prev) => subMonths(prev, 1));

  const addDayItem = (date: Date, text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const key = getDateKey(date);
    const item: DayItem = {
      id: crypto.randomUUID(),
      text: trimmedText,
      createdAt: new Date().toISOString(),
    };

    setDayItems((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), item],
    }));
  };

  const removeDayItem = (date: Date, itemId: string) => {
    const key = getDateKey(date);

    setDayItems((prev) => {
      const items = (prev[key] ?? []).filter((item) => item.id !== itemId);
      if (items.length === 0) {
        const { [key]: _removed, ...remaining } = prev;
        return remaining;
      }

      return {
        ...prev,
        [key]: items,
      };
    });
  };

  const provided = {
    selectedMonth,
    setSelectedMonth,
    nextMonth,
    prevMonth,
    months,
    events,
    calendars,
    dayItems,
    addDayItem,
    removeDayItem,
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
