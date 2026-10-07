import {
  cloneElement, useEffect, useId, useLayoutEffect, useRef, useState,
  type FocusEvent, type MouseEvent, type ReactElement, type ReactNode,
} from "react";
import { Portal } from "../theme/ThemeProvider";
import { cx } from "../utils";

type TriggerProps = {
  "aria-describedby"?: string;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  ref?: unknown;
};

export interface TooltipProps {
  content: ReactNode;
  /** A single focusable element (button, link, input). */
  children: ReactElement<TriggerProps>;
  side?: "top" | "bottom";
  delay?: number;
  className?: string;
}

const GAP = 8;

/**
 * Supplementary description shown on hover *and* keyboard focus (WCAG 1.4.13): it can be
 * dismissed with Escape, stays open while the pointer is over it, and is linked to the
 * trigger through aria-describedby so screen readers announce it.
 */
export function Tooltip({ content, children, side = "top", delay = 400, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();

  const show = (immediate = false) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), immediate ? 0 : delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), 100); // grace period to move onto the tooltip
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !tipRef.current) return;
    const t = triggerRef.current.getBoundingClientRect();
    const tip = tipRef.current.getBoundingClientRect();
    // Flip to the other side if there isn't room.
    const fitsTop = t.top - tip.height - GAP >= 0;
    const placeTop = side === "top" ? fitsTop : t.bottom + tip.height + GAP > window.innerHeight && fitsTop;
    const top = placeTop ? t.top - tip.height - GAP : t.bottom + GAP;
    const left = Math.min(Math.max(GAP, t.left + t.width / 2 - tip.width / 2), window.innerWidth - tip.width - GAP);
    setPos({ top, left });
  }, [open, side]);

  const child = children;
  const trigger = cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = child.props.ref;
      if (typeof childRef === "function") childRef(node);
      else if (childRef && typeof childRef === "object") (childRef as { current: unknown }).current = node;
    },
    "aria-describedby": cx(child.props["aria-describedby"], open && id) || undefined,
    onMouseEnter: (e: MouseEvent) => {
      child.props.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: MouseEvent) => {
      child.props.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: FocusEvent) => {
      child.props.onFocus?.(e);
      show(true);
    },
    onBlur: (e: FocusEvent) => {
      child.props.onBlur?.(e);
      setOpen(false);
    },
  });

  return (
    <>
      {trigger}
      {open && (
        <Portal>
          <div
            ref={tipRef}
            id={id}
            role="tooltip"
            className={cx("orbit-tooltip", className)}
            style={pos ?? { top: -9999, left: -9999 }}
            onMouseEnter={() => show(true)}
            onMouseLeave={hide}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}
