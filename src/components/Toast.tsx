import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Portal } from "../theme/ThemeProvider";
import { cx } from "../utils";

export type ToastTone = "neutral" | "success" | "danger";

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  tone?: ToastTone;
  /** ms before auto-dismiss; 0 keeps it until closed. Paused while hovered or focused. */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, "tone" | "duration">> {
  id: number;
  title: ReactNode;
  description?: ReactNode;
}

interface ToastApi {
  toast: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children, duration = 5_000, max = 3 }: { children: ReactNode; duration?: number; max?: number }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const [paused, setPaused] = useState(false);

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);
  const toast = useCallback(
    (o: ToastOptions) => {
      const id = nextId.current++;
      setItems((prev) => [...prev, { id, title: o.title, description: o.description, tone: o.tone ?? "neutral", duration: o.duration ?? duration }].slice(-max));
      return id;
    },
    [duration, max],
  );
  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Portal>
        {/* The region always exists so screen readers register it before the first toast. */}
        <ol
          className="orbit-toast-region"
          aria-label="Notifications"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {items.map((t) => (
            <ToastView key={t.id} item={t} paused={paused} onDismiss={() => dismiss(t.id)} />
          ))}
        </ol>
      </Portal>
    </ToastContext.Provider>
  );
}

function ToastView({ item, paused, onDismiss }: { item: ToastItem; paused: boolean; onDismiss: () => void }) {
  const remaining = useRef(item.duration);
  useEffect(() => {
    if (paused || item.duration === 0) return;
    const started = Date.now();
    const timer = window.setTimeout(onDismiss, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - started; // resume where we left off
    };
  }, [paused, item.duration, onDismiss]);

  return (
    // Errors interrupt (alert); everything else waits politely (status).
    <li className={cx("orbit-toast", `orbit-toast--${item.tone}`)} role={item.tone === "danger" ? "alert" : "status"} aria-atomic="true">
      <div className="orbit-toast__title">{item.title}</div>
      {item.description && <div className="orbit-toast__description">{item.description}</div>}
      <button type="button" className="orbit-toast__close" aria-label="Dismiss notification" onClick={onDismiss}>
        ×
      </button>
    </li>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
