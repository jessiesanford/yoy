import { useCalendar } from "../../context/CalendarContext.tsx";
import { addMonths, format, subMonths } from "date-fns";
import { Button } from "../Button.tsx";
import { AnimatePresence, motion } from "framer-motion";
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
    <div className={`flex p-5 bg-gray-700 text-3xl select-none`}>

      <div className="flex items-center gap-2">
        <div className="text-gray-500 border-r border-gray-500 pr-4 mr-4">
          {format(selectedMonth, "yyyy")}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedMonth.toISOString()} // important!
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className=""
          >
            <div className="flex items-center gap-2">
              <div className=" text-white font-medium mr-2">
                {format(selectedMonth, "MMMM")}
              </div>
              <div style={{ color: monthColor }}>
                {monthIcon}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

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
        <Button
          onClick={() => {
            setSettingsSidebarOpen(!settingsSidebarOpen);
          }}>
          <ListIcon size={20}/>
        </Button>
      </div>
    </div>
  )
}