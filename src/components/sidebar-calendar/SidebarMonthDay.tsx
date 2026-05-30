import { cn } from "../../utils/utlis.tsx";
import { format, isSameDay } from "date-fns";
import { useCalendar } from "../../context/CalendarContext.tsx";

export function SidebarMonthDay({ day, month }: { day: Date, month: Date }) {
  const today = new Date();
  const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
  const isOverflowDay = day.getMonth() !== month.getMonth();
  const { setSelectedMonth, holidays } = useCalendar();

  const holidaysThisDay = holidays.filter(holiday =>
    isSameDay(new Date(holiday.date), day)
  );

  const getStyling = () => {
    if (isOverflowDay) return "text-gray-300";

    if (isToday) {
      return "bg-rose-500 hover:bg-rose-600 font-bold text-white";
    }

    if (holidaysThisDay.length > 0) {
      return "bg-amber-50 border border-amber-200 text-amber-600"
    }

    if (day.getMonth() === month.getMonth()) {
      return "text-gray-600";
    }

    return "";
  };

  return (
    <div
      className={cn(
        "flex border-r border-b border-0 p-2 rounded-lg",
        'cursor-pointer hover:bg-blue-100 hover:border-blue-100 hover:text-black',
        getStyling()
      )}
      onClick={() => {
           setSelectedMonth(day)
      }}
    >
      <div>
        <div
          className={cn(
            "ml-auto flex w-4 h-4 p-2 rounded-2xl items-center justify-center text-xs",
          )}>
          {format(day, "d")}
        </div>
      </div>
    </div>
  )
}