import { eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { SidebarMonthDay } from "./SidebarMonthDay.tsx";
import { useCalendar } from "../../context/CalendarContext.tsx";
import { cn } from "../../utils/utlis.tsx";

export function SidebarMonth({ month }: { month: Date }) {
  const { selectedMonth, setSelectedMonth } = useCalendar();

  const startMonth = startOfMonth(month);
  const endMonth = endOfMonth(month);
  const startWeek = startOfWeek(startMonth);
  const endWeek = endOfWeek(endMonth);
  const days = eachDayOfInterval({ start: startWeek, end: endWeek });
  const thisMonthIsCurrentMonth = selectedMonth.getMonth() === month.getMonth() && selectedMonth.getFullYear() === month.getFullYear();

  return (
    <div className={"text-left text-sm select-none"}>
      <div className={cn(
        `flex items-center ${thisMonthIsCurrentMonth ? 'bg-gray-700 hover:bg-gray-800' : 'bg-gray-200 hover:bg-gray-300'}`,
        `px-4 py-2 rounded-t-lg cursor-pointer  transition`,

      )}
           onClick={() => setSelectedMonth(month)}
      >
        <div className={`${thisMonthIsCurrentMonth ? 'text-white' : 'text-black'}`}
        >
          {month.toLocaleString("en-US", { month: "long" })}
        </div>
        <div className={`${thisMonthIsCurrentMonth ? 'text-white' : 'text-black'} ml-auto`}>
          {month.toLocaleString("en-US", { year: "numeric" })}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0 flex-grow mt-0.5">
        {days.map((day, index) =>
          <SidebarMonthDay key={index} day={day} month={month}/>
        )}
      </div>
    </div>
  )
}