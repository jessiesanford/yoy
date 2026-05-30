/* eslint-disable react-refresh/only-export-components */
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
  connectGoogleCalendar: (clientId?: string, clientSecret?: string) => Promise<void>;
  syncGoogleCalendar: () => Promise<void>;
  removeCalendar: (calendar: Calendar) => Promise<void>;
  googleSyncStatus: string | null;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  events: CalendarEvent[]
  source: "ics" | "google";
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

function mapGoogleCalendars(calendars: GoogleCalendarPayload[]): Calendar[] {
  return calendars.map((calendar) => ({
    id: `google-${calendar.id}`,
    name: calendar.name,
    color: calendar.color,
    source: "google",
    events: calendar.events.map((event) => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    })),
  }));
}

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
  const [googleSyncStatus, setGoogleSyncStatus] = useState<string | null>(null);
  const [sidebarCalendarOpen, setSidebarCalendarOpen] = useState(true);
  const [settingsSidebarOpen, setSettingsSidebarOpen] = useState(true);

  useEffect(() => {
    window.electronAPI.getCalendars().then((allData) => {
      const icsCalendars: Calendar[] = allData.map((data, index) => ({
        id: `ics-${index}`,
        name: getRandomWord(),
        events: parseICS(data),
        color: getRandomColor(),
        source: "ics",
      }));
      setCalendars((prev) => [
        ...prev.filter((calendar) => calendar.source !== "ics"),
        ...icsCalendars,
      ]);

      const allEvents = allData.flatMap((data) => parseICS(data));

      setEvents(allEvents);
    });

    window.electronAPI.getGoogleCalendars().then((googleCalendars) => {
      setCalendars((prev) => [
        ...prev.filter((calendar) => calendar.source !== "google"),
        ...mapGoogleCalendars(googleCalendars),
      ]);
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
    setCalendars((prev) => [
      ...prev,
      {
        id: `ics-${crypto.randomUUID()}`,
        name: getRandomWord(),
        color: getRandomColor(),
        events: parsedEvents,
        source: "ics",
      },
    ]);
  };

  const connectGoogleCalendar = async (clientId?: string, clientSecret?: string) => {
    const trimmedClientId = clientId?.trim();
    if (!trimmedClientId) {
      setGoogleSyncStatus("Paste a Google OAuth desktop client ID first.");
      return;
    }

    setGoogleSyncStatus("Connecting to Google...");
    try {
      const googleCalendars = await window.electronAPI.connectGoogleCalendar(trimmedClientId, clientSecret?.trim());
      setCalendars((prev) => [
        ...prev.filter((calendar) => calendar.source !== "google"),
        ...mapGoogleCalendars(googleCalendars),
      ]);
      setGoogleSyncStatus("Google Calendar synced.");
    } catch (error) {
      setGoogleSyncStatus(error instanceof Error ? error.message : "Google Calendar sync failed.");
    }
  };

  const syncGoogleCalendar = async () => {
    setGoogleSyncStatus("Syncing Google Calendar...");
    try {
      const googleCalendars = await window.electronAPI.syncGoogleCalendar();
      setCalendars((prev) => [
        ...prev.filter((calendar) => calendar.source !== "google"),
        ...mapGoogleCalendars(googleCalendars),
      ]);
      setGoogleSyncStatus("Google Calendar synced.");
    } catch (error) {
      setGoogleSyncStatus(error instanceof Error ? error.message : "Google Calendar sync failed.");
    }
  };

  const removeCalendar = async (calendar: Calendar) => {
    if (calendar.source === "google") {
      const googleCalendarId = calendar.id.replace(/^google-/, "");
      setGoogleSyncStatus("Removing Google calendar...");

      try {
        const googleCalendars = await window.electronAPI.removeGoogleCalendar(googleCalendarId);
        setCalendars((prev) => [
          ...prev.filter((existingCalendar) => existingCalendar.source !== "google"),
          ...mapGoogleCalendars(googleCalendars),
        ]);
        setGoogleSyncStatus("Google calendar removed.");
      } catch (error) {
        setGoogleSyncStatus(error instanceof Error ? error.message : "Google calendar removal failed.");
      }

      return;
    }

    setCalendars((prev) => prev.filter((existingCalendar) => existingCalendar.id !== calendar.id));
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
        const remaining = { ...prev };
        delete remaining[key];
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
    connectGoogleCalendar,
    syncGoogleCalendar,
    removeCalendar,
    googleSyncStatus,
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
