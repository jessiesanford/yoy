import { CalendarMonthDay } from "./CalendarMonthDay.tsx";
import { eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { useCalendar } from "../../context/CalendarContext.tsx";

export function CalendarMonth() {
  const { selectedMonth } = useCalendar();
  const startMonth = startOfMonth(selectedMonth);
  const endMonth = endOfMonth(selectedMonth);
  const startWeek = startOfWeek(startMonth);
  const endWeek = endOfWeek(endMonth);
  const days = eachDayOfInterval({ start: startWeek, end: endWeek });

  return (
    <div
      className="grid grid-cols-7 gap-0 flex-grow auto-rows-fr"
    >
      {days.map((day, index) => (
        <CalendarMonthDay day={day} index={index} key={index}/>
      ))}
    </div>
  )
}