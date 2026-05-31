import { getDateKey, useCalendar } from "../../context/CalendarContext.tsx";
import { cn } from "../../utils/utlis.tsx";
import { format, isSameDay } from "date-fns";
import { CalendarDayEventDialog } from "./CalendarDayEventDialog.tsx";
import type { CalendarDayEntry } from "./CalendarDayEventDialog.tsx";

export function CalendarMonthDay({day, index}: { day: Date, index: number }) {
  const {selectedMonth, holidays, calendarEventsByDate, dayItems} = useCalendar();

  const today = new Date();
  const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
  const dateKey = getDateKey(day);
  const itemsThisDay = dayItems[dateKey] ?? [];

  const holidaysThisDay = holidays.filter(holiday =>
    isSameDay(new Date(holiday.date), day)
  );

  const eventsThisDay = calendarEventsByDate[dateKey] ?? [];
  const dayEntries: CalendarDayEntry[] = [
    ...holidaysThisDay.map((holiday) => ({
      id: `holiday-${holiday.name}`,
      text: holiday.name,
      className: "bg-amber-50 border border-amber-200 text-amber-600",
      style: undefined,
    })),
    ...eventsThisDay.map((event) => ({
      id: `event-${event.id}`,
      text: event.title,
      timeText: getEventTimeText(event, day),
      location: event.location,
      className: "",
      style: { borderColor: event.color, backgroundColor: event.color, color: event.textColor },
    })),
    ...itemsThisDay.map((item) => ({
      id: `item-${item.id}`,
      itemId: item.id,
      text: item.text,
      timeText: undefined,
      location: undefined,
      className: "bg-emerald-50 border border-emerald-200 text-emerald-700",
      style: undefined,
    })),
  ];
  const visibleSmallDayEntries = dayEntries.slice(0, 1);
  const visibleLargeDayEntries = dayEntries.slice(0, 2);
  const smallOverflowEntryCount = dayEntries.length - visibleSmallDayEntries.length;
  const largeOverflowEntryCount = dayEntries.length - visibleLargeDayEntries.length;

  return (
    <CalendarDayEventDialog day={day} entries={dayEntries}>
        <button
          key={index}
          className={cn(
            "flex border-r border-b border-blue-100 p-1 lg:p-2 text-left transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-inset",
            day.getMonth() === selectedMonth.getMonth() ? "bg-white" : "bg-gray-50",
            isToday ? "" : ""
          )}
        >
          <div className="flex flex-col justify-start w-full min-w-0">
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "flex w-6 h-6 lg:w-8 lg:h-8 rounded-full items-center justify-center select-none",
                  "text-xs lg:text-base",
                  day.getMonth() === selectedMonth.getMonth() ? 'text-black' : 'text-gray-400',
                  isToday ? 'bg-rose-500 text-white font-bold' : '',
                )}>
                {format(day, "d")}
              </div>

            </div>
            <div className="mt-1 flex flex-col gap-0.5 min-w-0 tall:hidden">
              {visibleSmallDayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(entry.className, "px-1 lg:py-1 rounded text-xs line-clamp-1")}
                  style={entry.style}
                >
                  {entry.text}
                  {smallOverflowEntryCount > 0 && (
                    <span className="ml-1 font-medium text-gray-500">
                      +{smallOverflowEntryCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-1 hidden flex-col gap-0.5 min-w-0 tall:flex">
              {visibleLargeDayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(entry.className, "px-1 lg:py-1 rounded text-xs line-clamp-1")}
                  style={entry.style}
                >
                  {entry.text}
                </div>
              ))}
              {largeOverflowEntryCount > 0 && (
                <div className="px-1 py-0.5 text-xs font-medium text-gray-500">
                  +{largeOverflowEntryCount} more
                </div>
              )}
            </div>
          </div>
        </button>
    </CalendarDayEventDialog>
  );
}

function getEventTimeText(event: { start: Date; end: Date; allDay: boolean }, day: Date) {
  if (event.allDay) return undefined;

  const startTime = format(event.start, "h:mm a");
  const endTime = format(event.end, "h:mm a");

  if (isSameDay(event.start, day) && isSameDay(event.end, day)) {
    return `${startTime}-${endTime}`;
  }

  if (isSameDay(event.start, day)) {
    return `Starts ${startTime}`;
  }

  if (isSameDay(event.end, day)) {
    return `Ends ${endTime}`;
  }

  return "Continues";
}
