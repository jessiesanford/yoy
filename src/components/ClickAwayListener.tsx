import { useEffect, useRef, ReactNode } from "react";

export function ClickAwayListener({ onClickAway, children }: { onClickAway: () => void; children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        const isClickInModal = target.closest('[role="dialog"]') ||
          target.closest('[data-radix-portal]') ||
          target.closest('.modal-overlay') ||
          target.closest('dialog-overlay');

        if (!isClickInModal) {
          onClickAway();
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [onClickAway]);

  return <div ref={containerRef}>{children}</div>
}
