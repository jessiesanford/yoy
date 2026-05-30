import { useCalendar } from "../../context/CalendarContext.tsx";
import { SidebarMonth } from "./SidebarMonth.tsx";
import { useEffect, useRef } from "react";

export function SidebarCalendar() {
  const { months, selectedMonth, sidebarCalendarOpen } = useCalendar();
  const containerRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const getKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

  useEffect(() => {
    if (!containerRef.current) return;

    const key = getKey(selectedMonth);
    const el = monthRefs.current[key];
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          el.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      },
      {
        root: containerRef.current,
        threshold: 1,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [selectedMonth]);

  return (
    <div className={`flex flex-col gap-2 bg-white text-gray-900 min-w-[240px] shrink-0 h-screen overflow-auto ${sidebarCalendarOpen ? '' : 'hidden'}`} ref={containerRef}>
      {months.map((month) => {
        const key = getKey(month);
        return (
          <div key={key} ref={(el) => (monthRefs.current[key] = el)}>
            <SidebarMonth month={month} />
          </div>
        );
      })}
    </div>
  )
}
