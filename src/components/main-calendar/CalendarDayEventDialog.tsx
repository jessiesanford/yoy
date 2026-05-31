import * as Dialog from "@radix-ui/react-dialog";
import { PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { type CSSProperties, type FormEvent, type ReactNode, useState } from "react";
import { useCalendar } from "../../context/CalendarContext.tsx";

export interface CalendarDayEntry {
  id: string;
  itemId?: string;
  text: string;
  timeText?: string;
  location?: string;
  className: string;
  style?: CSSProperties;
}

interface CalendarDayEventDialogProps {
  day: Date;
  entries: CalendarDayEntry[];
  children: ReactNode;
}

export function CalendarDayEventDialog({ day, entries, children }: CalendarDayEventDialogProps) {
  const { addDayItem, removeDayItem } = useCalendar();
  const [newItemText, setNewItemText] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    addDayItem(day, newItemText);
    setNewItemText("");
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        {children}
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
                View events and add saved items for this day.
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
            {entries.length === 0 ? (
              <div className="rounded border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-500">
                Nothing saved for this day yet.
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`${entry.className} flex items-center gap-2 rounded px-3 py-2 text-sm`}
                  style={entry.style}
                >
                  <div className="min-w-0 flex-1 break-words">
                    <div>{entry.text}</div>
                    {(entry.timeText || entry.location) && (
                      <div className="mt-0.5 text-xs opacity-75">
                        {[entry.timeText, entry.location].filter(Boolean).join(" | ")}
                      </div>
                    )}
                  </div>
                  {entry.itemId && (
                    <button
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-emerald-700 transition hover:bg-emerald-100"
                      aria-label={`Remove ${entry.text}`}
                      onClick={() => removeDayItem(day, entry.itemId!)}
                      type="button"
                    >
                      <TrashIcon size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
