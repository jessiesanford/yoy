import { CalendarMonthHeading } from "./CalendarMonthHeading.tsx";
import { CalendarWeekdayHeading } from "./CalendarWeekdayHeading.tsx";
import { SidebarCalendar } from "../sidebar-calendar/SidebarCalendar.tsx";
import { CalendarMonth } from "./CalendarMonth.tsx";
import { Sidebar } from "../sidebar/Sidebar.tsx";

const Calendar = () => {
  return (
    <div className="flex flex-row h-screen bg-blue-50">
      <Sidebar/>
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