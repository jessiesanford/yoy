export function CalendarWeekdayHeading() {
  return (
    <div className="grid grid-cols-7 gap-0 bg-blue-100 select-none text-sm text-gray-500">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className={"p-1.5"}>{day}</div>
      ))}
    </div>
  )
}