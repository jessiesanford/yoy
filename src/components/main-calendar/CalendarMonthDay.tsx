import { useCalendar } from "../../context/CalendarContext.tsx";
import { cn } from "../../utils/utlis.tsx";
import { format, isSameDay } from "date-fns";

export function CalendarMonthDay({day, index}: { day: Date, index: number }) {
  const {selectedMonth, holidays, events} = useCalendar();

  const today = new Date();
  const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();

  const holidaysThisDay = holidays.filter(holiday =>
    isSameDay(new Date(holiday.date), day)
  );

  const eventsThisDay = events.filter((event) => isSameDay(event.start, day));

  return (
    <div key={index}
         className={cn(
           "flex border-r border-b border-blue-100 p-2",
           day.getMonth() === selectedMonth.getMonth() ? "bg-white" : "bg-gray-50",
           isToday ? "" : ""
         )}
    >
      <div className="flex flex-col justify-start w-full">
        <div
          className={cn(
            "flex w-8 h-8 rounded-lg items-center justify-center select-none",
            day.getMonth() === selectedMonth.getMonth() ? 'text-black' : 'text-gray-400',
            isToday ? 'bg-rose-500 text-white font-bold' : '',
          )}>
          {format(day, "d")}
        </div>
        <div className="mt-1 flex flex-col gap-1.5">
          {holidaysThisDay.map((holiday) => (
            <div
              key={holiday.name}
              className="bg-amber-50 border border-amber-200 text-amber-600 px-1 py-0.5 rounded text-xs line-clamp-1"
            >
              {holiday.name}
            </div>
          ))}
          {eventsThisDay.map((event) => (
            <div
              key={event.id}
              className="bg-blue-50 border border-blue-200 text-blue-600 px-1 py-0.5 rounded text-xs line-clamp-1"
            >
              {event.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}