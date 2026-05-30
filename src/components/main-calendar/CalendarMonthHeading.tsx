import { useCalendar } from "../../context/CalendarContext.tsx";
import { addMonths, format, subMonths } from "date-fns";
import { Button } from "../Button.tsx";
import { monthColors, monthIcons } from "../../calendarConstants.tsx";
import { ListIcon } from "@phosphor-icons/react";

export function CalendarMonthHeading() {
  const {
    selectedMonth,
    setSelectedMonth,
    settingsSidebarOpen,
    setSettingsSidebarOpen
  } = useCalendar();
  const monthName = format(selectedMonth, "MMMM");
  const monthColor = monthColors[monthName];
  const monthIcon = monthIcons[monthName];

  return (
    <div className={`flex p-3 lg:p-5 bg-gray-700 text-xl lg:text-2xl select-none`}>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => {
            setSettingsSidebarOpen(!settingsSidebarOpen);
          }}
          className={"mr-4 bg-transparent hover:bg-transparent p-0"}
        >
          <ListIcon size={24}/>
        </Button>
        <div className="text-gray-500 border-r border-gray-500 pr-4 mr-4">
          {format(selectedMonth, "yyyy")}
        </div>
        <div className="flex items-center gap-2">
          <div className=" text-white font-medium mr-2">
            {format(selectedMonth, "MMMM")}
          </div>
          <div style={{ color: monthColor }}>
            {monthIcon}
          </div>
        </div>
      </div>

      <div className={"flex gap-2 ml-auto"}>
        <Button
          onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
          ◀
        </Button>
        <Button
          onClick={() => setSelectedMonth(new Date())}>
          Today
        </Button>
        <Button
          onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
          ▶
        </Button>
      </div>
    </div>
  )
}