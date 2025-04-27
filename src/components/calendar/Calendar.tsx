import {useState} from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval
} from "date-fns";
import {useCalendar} from "../../CalendarContext.tsx";
import {cn} from "../../utlis.tsx";

function Button({ onClick, label, className, children }: { onClick: () => void; label?: string, className?: string,
  children: React.ReactNode
}) {
  return (
    <button className={cn(
      "py-1.5 px-3 bg-gray-800 hover:bg-blue-500 transition-all text-white text-sm focus:outline-none focus:ring-0 cursor-pointer rounded",
      className
    )}
            onClick={() => onClick()}>
      {children}
    </button>
  )
}

function CalendarMonthHeading() {
  const {currentMonth, setCurrentMonth} = useCalendar();

  return (
    <div className={"flex p-5 bg-black text-white font-semibold text-3xl"}>
      <div>
        {format(currentMonth, "MMMM yyyy")}
      </div>
      <div className={"flex gap-2 ml-auto"}>
        <Button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          ◀
        </Button>
        <Button
          onClick={() => setCurrentMonth(new Date())}>
          Today
        </Button>
        <Button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          ▶
        </Button>
      </div>
    </div>
  )
}

const Calendar = () => {
  const {currentMonth} = useCalendar();

  const startMonth = startOfMonth(currentMonth);
  const endMonth = endOfMonth(currentMonth);
  const startWeek = startOfWeek(startMonth);
  const endWeek = endOfWeek(endMonth);
  const days = eachDayOfInterval({start: startWeek, end: endWeek});

  return (
    <div className="flex flex-col grow h-full">
      <CalendarMonthHeading/>
      <div className="grid grid-cols-7 gap-0 bg-gray-400">
        <CalendarWeekdayHeading/>
      </div>
      <div className="grid grid-cols-7 gap-0 flex-grow bg-gray-400">
        {days.map((day, index) => (
          <CalendarMonthDay day={day} index={index} key={index}/>
        ))}
      </div>
    </div>
  );
};

function CalendarWeekdayHeading() {
  return (
    <>
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className={"p-1.5"}>{day}</div>
      ))}
    </>
  )
}

function CalendarMonthDay({day, index}: { day: Date, index: number }) {
  const {currentMonth} = useCalendar();

  const today = new Date();
  const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();

  return (
    <div key={index}
         className={cn(
           "flex border-r border-b border-gray-400 p-2",
           day.getMonth() === currentMonth.getMonth() ? "bg-gray-200" : "bg-gray-50 text-gray-300",
           isToday ? "bg-gray-300 font-bold" : ""
         )}
    >
      <div>
        <div
          className={cn("ml-auto flex w-8 h-8 rounded-2xl items-center justify-center", isToday ? 'bg-rose-500 text-white' : '')}>{format(day, "d")}</div>
      </div>
    </div>
  );
}

export default Calendar;