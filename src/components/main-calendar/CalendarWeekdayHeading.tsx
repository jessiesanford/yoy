export function CalendarWeekdayHeading() {
  return (
    <div className="grid grid-cols-7 gap-0 bg-gray-400 select-none">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className={"p-1.5"}>{day}</div>
      ))}
    </div>
  )
}