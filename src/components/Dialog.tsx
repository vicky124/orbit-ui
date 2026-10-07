import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { Portal } from "../theme/ThemeProvider";
import { cx, focusableWithin } from "../utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Element to focus on open (default: first focusable element, else the dialog). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Set false for destructive confirmations that must be answered explicitly. */
  dismissOnOverlayClick?: boolean;
  className?: string;
}

let scrollLocks = 0;

function lockScroll(): () => void {
  if (scrollLocks++ === 0) {
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.dataset.orbitScrollLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = scrollbar ? `${scrollbar}px` : ""; // no layout shift
  }
  return () => {
    if (--scrollLocks === 0) {
      document.body.style.overflow = document.body.dataset.orbitScrollLock ?? "";
      document.body.style.paddingRight = "";
      delete document.body.dataset.orbitScrollLock;
    }
  };
}

/**
 * Modal dialog (WAI-ARIA dialog pattern): focus moves in and is trapped, Escape and the
 * overlay close it, background scroll is locked (nesting-safe), and focus returns to the
 * element that opened it.
 */
export function Dialog({
  open, onOpenChange, title, description, children, footer, initialFocusRef,
  dismissOnOverlayClick = true, className,
}: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const mouseDownOnOverlay = useRef(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();
    // Wait a frame so the portal content exists.
    const raf = requestAnimationFrame(() => {
      const target = initialFocusRef?.current ?? (panel.current && focusableWithin(panel.current)[0]) ?? panel.current;
      target?.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      unlock();
      opener?.focus?.();
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation(); // only the top-most dialog closes
      onOpenChange(false);
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const items = focusableWithin(panel.current);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <Portal>
      <div
        className="orbit-dialog__overlay"
        // Only a press that starts AND ends on the overlay closes it (not a drag out of a text field).
        onMouseDown={(e) => (mouseDownOnOverlay.current = e.target === e.currentTarget)}
        onClick={(e) => {
          if (dismissOnOverlayClick && mouseDownOnOverlay.current && e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          aria-describedby={description ? `${id}-description` : undefined}
          tabIndex={-1}
          className={cx("orbit-dialog", className)}
          onKeyDown={onKeyDown}
        >
          <h2 id={`${id}-title`} className="orbit-dialog__title">{title}</h2>
          {description && <p id={`${id}-description`} className="orbit-dialog__description">{description}</p>}
          {children}
          {footer && <div className="orbit-dialog__footer">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}
