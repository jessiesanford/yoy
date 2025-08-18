import { useCalendar } from "../../context/CalendarContext.tsx";
import { cn } from "../../utils/utlis.tsx";
import { format, isSameDay } from "date-fns";

export function CalendarMonthDay({day, index}: { day: Date, index: number }) {
  const {selectedMonth, holidays} = useCalendar();

  const today = new Date();
  const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();

  const hds = holidays.filter(holiday =>
    isSameDay(new Date(holiday.date), day)
  );

  return (
    <div key={index}
         className={cn(
           "flex border-r border-b border-blue-200 p-2",
           day.getMonth() === selectedMonth.getMonth() ? "bg-blue-50" : "bg-blue-50",
           isToday ? "bg-blue-200 font-bold" : ""
         )}
    >
      <div className="flex flex-col justify-start w-full">
        <div
          className={cn(
            "flex w-8 h-8 rounded-2xl items-center justify-center select-none",
            isToday ? 'bg-rose-500 text-white' : '',
            day.getMonth() === selectedMonth.getMonth() ? 'text-black' : 'text-gray-300'
          )}>
          {format(day, "d")}
        </div>
        <div className="mt-1 flex flex-col gap-0.5">
          {hds.map((holiday) => (
            <div
              key={holiday.name}
              className="bg-blue-200 px-1 py-0.5 rounded text-sm"
            >
              {holiday.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}