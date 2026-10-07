import { createContext, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "../utils";

export type ThemeSetting = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeSetting;
  resolved: ResolvedTheme;
  setTheme: (theme: ThemeSetting) => void;
  /** Token overrides, re-applied inside portals so overlays match the themed subtree. */
  style?: CSSProperties;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeSetting;
  /** Controlled theme; pair with `onThemeChange`. */
  theme?: ThemeSetting;
  onThemeChange?: (theme: ThemeSetting) => void;
  /** Override any token, e.g. `{ "--orbit-color-accent": "#0f766e" }`. */
  tokens?: Record<`--orbit-${string}`, string>;
  className?: string;
}

export function ThemeProvider({ children, defaultTheme = "system", theme, onThemeChange, tokens, className }: ThemeProviderProps) {
  const [internal, setInternal] = useState<ThemeSetting>(defaultTheme);
  const setting = theme ?? internal;
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const update = () => setSystem(mq.matches ? "dark" : "light");
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const resolved = setting === "system" ? system : setting;
  const style = tokens as CSSProperties | undefined;
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: setting,
      resolved,
      style,
      setTheme: (next) => {
        if (theme === undefined) setInternal(next);
        onThemeChange?.(next);
      },
    }),
    [setting, resolved, style, theme, onThemeChange],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className={cx("orbit-root", className)} data-theme={resolved} style={style}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/**
 * Renders into document.body but keeps the theme: a portal escapes the provider's DOM
 * subtree, so data-theme and token overrides are re-applied on the portal container.
 */
export function Portal({ children }: { children: ReactNode }) {
  const ctx = useContext(ThemeContext);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // SSR-safe: document doesn't exist on the server
  return createPortal(
    <div className="orbit-portal" data-theme={ctx?.resolved ?? "light"} style={ctx?.style}>
      {children}
    </div>,
    document.body,
  );
}
