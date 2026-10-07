import { useCallback, useRef, useState } from "react";

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * State that can be controlled (`value` + `onChange`) or uncontrolled (`defaultValue`),
 * the same contract native inputs have.
 */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const current = controlled ? (value as T) : internal;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInternal(next);
      onChangeRef.current?.(next);
    },
    [controlled],
  );
  return [current, set];
}

const FOCUSABLE = [
  "a[href]", "area[href]", "button:not([disabled])", "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])", "textarea:not([disabled])", "iframe", "[contenteditable]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("inert") && el.getAttribute("aria-hidden") !== "true",
  );
}

/** Merge event handlers: the consumer's runs first and can `preventDefault()` ours. */
export function composeHandlers<E extends { defaultPrevented: boolean }>(
  theirs: ((e: E) => void) | undefined,
  ours: (e: E) => void,
): (e: E) => void {
  return (e) => {
    theirs?.(e);
    if (!e.defaultPrevented) ours(e);
  };
}
