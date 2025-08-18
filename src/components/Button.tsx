import { cn } from "../utils/utlis.tsx";

export function Button({ onClick, className, children }: { onClick: () => void, className?: string,
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