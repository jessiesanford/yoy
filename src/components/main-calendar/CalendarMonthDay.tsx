import * as Dialog from "@radix-ui/react-dialog";
import { PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { type FormEvent, useState } from "react";
import { getDateKey, useCalendar } from "../../context/CalendarContext.tsx";
import { cn } from "../../utils/utlis.tsx";
import { format, isSameDay } from "date-fns";

export function CalendarMonthDay({day, index}: { day: Date, index: number }) {
  const {selectedMonth, holidays, calendars, dayItems, addDayItem, removeDayItem} = useCalendar();
  const [newItemText, setNewItemText] = useState("");

  const today = new Date();
  const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
  const dateKey = getDateKey(day);
  const itemsThisDay = dayItems[dateKey] ?? [];

  const holidaysThisDay = holidays.filter(holiday =>
    isSameDay(new Date(holiday.date), day)
  );

  const eventsThisDay = calendars.flatMap((calendar) =>
    calendar.events
      .filter((event) => isSameDay(event.start, day))
      .map((event) => ({
        ...event,
        color: calendar.color,
      }))
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    addDayItem(day, newItemText);
    setNewItemText("");
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          key={index}
          className={cn(
            "flex border-r border-b border-blue-100 p-2 text-left transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-inset",
            day.getMonth() === selectedMonth.getMonth() ? "bg-white" : "bg-gray-50",
            isToday ? "" : ""
          )}
        >
          <div className="flex flex-col justify-start w-full min-w-0">
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "flex w-8 h-8 rounded-lg items-center justify-center select-none",
                  day.getMonth() === selectedMonth.getMonth() ? 'text-black' : 'text-gray-400',
                  isToday ? 'bg-rose-500 text-white font-bold' : '',
                )}>
                {format(day, "d")}
              </div>
              {itemsThisDay.length > 0 && (
                <div className="ml-auto flex h-5 min-w-5 items-center justify-center rounded bg-blue-500 px-1 text-xs font-medium text-white">
                  {itemsThisDay.length}
                </div>
              )}
            </div>
            <div className="mt-1 flex flex-col gap-1.5 min-w-0">
              {holidaysThisDay.map((holiday) => (
                <div
                  key={holiday.name}
                  className="bg-amber-50 border border-amber-200 text-amber-600 px-1 py-0.5 rounded text-xs line-clamp-1"
                >
                  {holiday.name}
                </div>
              ))}
              {eventsThisDay.map((event) => (
                <div
                  key={event.id}
                  className="bg-blue-50 border border-blue-200 text-blue-600 px-1 py-0.5 rounded text-xs line-clamp-1"
                  style={{ borderColor: event.color }}
                >
                  {event.title}
                </div>
              ))}
              {itemsThisDay.map((item) => (
                <div
                  key={item.id}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-1 py-0.5 rounded text-xs line-clamp-1"
                >
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-5 text-gray-900 shadow-xl focus:outline-none">
          <div className="mb-4 flex items-start gap-3">
            <div>
              <Dialog.Title className="text-lg font-medium">
                {format(day, "MMMM d, yyyy")}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500">
                Add or remove saved items for this day.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="ml-auto rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900" aria-label="Close">
                <XIcon size={18} weight="bold" />
              </button>
            </Dialog.Close>
          </div>

          <form className="flex gap-2" onSubmit={handleSubmit}>
            <input
              className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={newItemText}
              onChange={(event) => setNewItemText(event.target.value)}
              placeholder="Add an item"
            />
            <button
              type="submit"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-gray-800 text-white transition hover:bg-blue-500"
              aria-label="Add item"
            >
              <PlusIcon size={18} weight="bold" />
            </button>
          </form>

          <div className="mt-4 flex max-h-64 flex-col gap-2 overflow-auto">
            {itemsThisDay.length === 0 ? (
              <div className="rounded border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-500">
                Nothing saved for this day yet.
              </div>
            ) : (
              itemsThisDay.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <div className="min-w-0 flex-1 break-words">{item.text}</div>
                  <button
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-emerald-700 transition hover:bg-emerald-100"
                    aria-label={`Remove ${item.text}`}
                    onClick={() => removeDayItem(day, item.id)}
                    type="button"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
