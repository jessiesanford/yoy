import * as Dialog from "@radix-ui/react-dialog";
import { Checkbox } from 'radix-ui'
import { cn } from "../../utils/utlis.tsx";
import {
  CheckIcon,
  TrashIcon,
  XIcon
} from "@phosphor-icons/react";
import { useCalendar } from "../../context/CalendarContext.tsx";
import { AnimatePresence, motion } from "framer-motion";
import { ClickAwayListener } from "../ClickAwayListener.tsx";
import { Button } from "../Button.tsx";

export function Sidebar() {
  const {
    settingsSidebarOpen,
    setSettingsSidebarOpen,
    sidebarCalendarOpen,
    setSidebarCalendarOpen,
    importCalendar,
    connectGoogleCalendar,
    syncGoogleCalendar,
    removeCalendar,
    visibleCalendarIds,
    setCalendarVisibility,
    googleSyncStatus,
    calendars,
  } = useCalendar();

  const handleImportCalendar = async () => {
    importCalendar();
  };

  const googleCalendarCount = calendars.filter((calendar) => calendar.source === "google").length;

  return (
    <AnimatePresence>
      {settingsSidebarOpen && (
        <Dialog.Root open>
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={"bg-black/30 fixed inset-0 absolute"}
              />
            </Dialog.Overlay>
            <ClickAwayListener onClickAway={() => setSettingsSidebarOpen(false)}>
              <Dialog.Content asChild aria-describedby={undefined}>
                <motion.div
                  className="bg-white text-gray-900 p-6 pl-12 h-screen fixed top-0 left-[-30px] w-[400px] overflow-hidden"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <div className="flex items-center mb-10">
                    <Dialog.Title className="font-medium text-xl">True Calendar</Dialog.Title>
                    <button className="ml-auto cursor-pointer" aria-label="Close" onClick={() => {
                      setSettingsSidebarOpen(false)
                    }}>
                      <XIcon size={20} weight="bold" className=""/>
                    </button>
                  </div>

                  <div className="flex flex-col gap-8">
                    <div className={"flex flex-col gap-4"}>
                      <div className="font-medium text-xl">Settings</div>
                      <div className="flex items-center">
                        <Checkbox.Root
                          className={cn(
                            "w-6 h-6 bg-white border border-gray-200 rounded-md flex",
                            "items-center justify-center shadow-sm",
                            "hover:border-gray-400 focus:outline-none transition-all"
                          )}
                          checked={sidebarCalendarOpen}
                          onCheckedChange={(checked) => {
                            // @ts-expect-error - this is being stupid
                            setSidebarCalendarOpen(checked)
                          }}
                          id="show-months-calendar"
                        >
                          <Checkbox.Indicator className="text-black">
                            <CheckIcon weight={"bold"}/>
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <label htmlFor="show-months-calendar" className="pl-4 p-1.5 text-[15px] w-full leading-none select-none">
                          Show Months Sidebar
                        </label>
                      </div>
                    </div>

                    <div className={"flex flex-col gap-4"}>

                      <div className="font-medium text-xl">Calendars</div>

                      {calendars.map((calendar) => {
                        return (
                          <div className="flex items-center gap-2" key={calendar.id}>
                            <Checkbox.Root
                              className={cn(
                                "h-6 w-6 shrink-0 bg-white border border-gray-200 rounded-md flex",
                                "items-center justify-center shadow-sm",
                                "hover:border-gray-400 focus:outline-none transition-all"
                              )}
                              checked={visibleCalendarIds.includes(calendar.id)}
                              onCheckedChange={(checked) => {
                                setCalendarVisibility(calendar.id, checked === true)
                              }}
                              id={calendar.name}
                            >
                              <Checkbox.Indicator className="text-black">
                                <CheckIcon weight={"bold"}/>
                              </Checkbox.Indicator>
                            </Checkbox.Root>
                            <label htmlFor={calendar.name} className="min-w-0 flex-1 truncate p-1.5 pl-4 text-[15px] leading-none select-none">
                              {calendar.name}
                            </label>
                            <button
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-gray-500 transition hover:bg-gray-100 hover:text-red-600"
                              aria-label={`Remove ${calendar.name}`}
                              onClick={() => removeCalendar(calendar)}
                              type="button"
                            >
                              <TrashIcon size={16} />
                            </button>
                          </div>
                        )
                      })}

                      <Button className="w-40 m-auto" onClick={() => {
                        handleImportCalendar()
                      }}>
                        Import
                      </Button>

                      <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
                        <Button className="w-40 m-auto" onClick={() => {
                          connectGoogleCalendar()
                        }}>
                          Connect Google
                        </Button>
                        <Button className="w-40 m-auto" onClick={() => {
                          syncGoogleCalendar()
                        }}>
                          Sync Google
                        </Button>
                        {(googleSyncStatus || googleCalendarCount > 0) && (
                          <div className="text-center text-xs text-gray-500">
                            {googleSyncStatus || `${googleCalendarCount} Google calendars connected.`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </motion.div>
              </Dialog.Content>
            </ClickAwayListener>

          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>

  )
}

export function DD() {
  return (
    <>
      <Dialog.Root open={true}>
        <Dialog.Portal>
          <Dialog.Overlay className={"bg-black/20 fixed inset-0"}/>
          <Dialog.Content className={cn(
            "bg-white text-gray-900 p-4 rounded-xl absolute top-1/2 left-1/2 translate transform -translate-x-1/2 -translate-y-1/2",
          )}>
            <Dialog.Title className="font-medium text-xl">Edit profile</Dialog.Title>
            <Dialog.Description className="text-gray-500">
              Make changes to your profile here. Click save when you're done.
            </Dialog.Description>
            Test
            <Dialog.Close asChild>
              <button className="Button green">Save changes</button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <button className="IconButton" aria-label="Close">
                x
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
