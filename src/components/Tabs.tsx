import { createContext, useContext, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx, useControllableState } from "../utils";

interface TabsContextValue {
  baseId: string;
  value: string;
  select: (value: string) => void;
  activation: "automatic" | "manual";
  orientation: "horizontal" | "vertical";
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be rendered inside <Tabs>");
  return ctx;
}

const slug = (v: string) => v.replace(/[^a-zA-Z0-9_-]/g, "_");

export interface TabsProps {
  children: ReactNode;
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  /** automatic: arrow keys select; manual: arrows move focus, Enter/Space selects. */
  activation?: "automatic" | "manual";
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Tabs({ children, value, defaultValue, onValueChange, activation = "automatic", orientation = "horizontal", className }: TabsProps) {
  const [current, select] = useControllableState(value, defaultValue, onValueChange);
  const baseId = useId();
  return (
    <TabsContext.Provider value={{ baseId, value: current, select, activation, orientation }}>
      <div className={cx("orbit-tabs", className)} data-orientation={orientation}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  const { orientation, activation, select } = useTabs();
  const ref = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? []);
    const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;
    const [prev, next] = orientation === "horizontal" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];
    let target: number | null = null;
    if (e.key === next) target = (index + 1) % tabs.length;
    else if (e.key === prev) target = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = tabs.length - 1;
    if (target === null) return;
    e.preventDefault();
    tabs[target].focus();
    if (activation === "automatic") select(tabs[target].dataset.value!);
  };

  return (
    <div ref={ref} role="tablist" aria-label={label} aria-orientation={orientation} className={cx("orbit-tabs__list", className)} onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}

export function Tab({ value, children, disabled }: { value: string; children: ReactNode; disabled?: boolean }) {
  const { baseId, value: selectedValue, select } = useTabs();
  const selected = value === selectedValue;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${slug(value)}`}
      aria-controls={`${baseId}-panel-${slug(value)}`}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1} // roving tabindex: Tab key enters/leaves the list in one stop
      disabled={disabled}
      data-value={value}
      className="orbit-tabs__tab"
      onClick={() => select(value)}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const { baseId, value: selectedValue } = useTabs();
  if (value !== selectedValue) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${slug(value)}`}
      aria-labelledby={`${baseId}-tab-${slug(value)}`}
      tabIndex={0}
      className={cx("orbit-tabs__panel", className)}
    >
      {children}
    </div>
  );
}
