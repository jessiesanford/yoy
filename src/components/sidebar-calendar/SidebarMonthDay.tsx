import { cn } from "../../utils/utlis.tsx";
import { format, isSameDay } from "date-fns";
import { useCalendar } from "../../context/CalendarContext.tsx";

export function SidebarMonthDay({ day, month }: { day: Date, month: Date }) {
  const today = new Date();
  const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
  const { setSelectedMonth, holidays } = useCalendar();

  const holidaysThisDay = holidays.filter(holiday =>
    isSameDay(new Date(holiday.date), day)
  );

  return (
    <div
      className={cn(
        "flex border-r border-b border-0 p-2 rounded-lg",
        'cursor-pointer hover:bg-blue-100',
        day.getMonth() === month.getMonth() ? "bg-white" : "bg-white text-gray-300",
        isToday ? "bg-rose-500 hover:bg-rose-600 font-bold" : "",
        holidaysThisDay.length > 0 ? 'bg-amber-50' : ''
      )}
      onClick={() => {
           setSelectedMonth(day)
      }}
    >
      <div>
        <div
          className={cn(
            "ml-auto flex w-4 h-4 p-2 rounded-2xl items-center justify-center text-xs",
            isToday ? 'text-white' : ''
          )}>
          {format(day, "d")}
        </div>
      </div>
    </div>
  )
}