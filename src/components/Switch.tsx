import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { composeHandlers, cx, useControllableState } from "../utils";

export interface SwitchProps extends Omit<ComponentPropsWithRef<"button">, "onChange" | "value" | "defaultValue"> {
  label: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/** WAI-ARIA switch: a button with role="switch" and aria-checked, labelled by visible text. */
export function Switch({ label, checked, defaultChecked = false, onCheckedChange, className, onClick, ...rest }: SwitchProps) {
  const [on, setOn] = useControllableState(checked, defaultChecked, onCheckedChange);
  const labelId = useId();
  return (
    <span className={cx("orbit-switch", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        className="orbit-switch__track"
        onClick={composeHandlers(onClick, () => setOn(!on))}
        {...rest}
      >
        <span className="orbit-switch__thumb" aria-hidden="true" />
      </button>
      {/* Clicking the text toggles too, like a native <label>. */}
      <span id={labelId} onClick={() => !rest.disabled && setOn(!on)}>
        {label}
      </span>
    </span>
  );
}
