import { CalendarMonthHeading } from "./CalendarMonthHeading.tsx";
import { CalendarWeekdayHeading } from "./CalendarWeekdayHeading.tsx";
import { SidebarCalendar } from "../sidebar-calendar/SidebarCalendar.tsx";
import { CalendarMonth } from "./CalendarMonth.tsx";

const Calendar = () => {
  return (
    <div className="flex flex-row h-screen bg-blue-50">
      <div className="flex flex-col grow h-full">
        <CalendarMonthHeading/>
        <CalendarWeekdayHeading/>
        <CalendarMonth/>
      </div>
      <SidebarCalendar/>
    </div>
  );
};

export default Calendar;