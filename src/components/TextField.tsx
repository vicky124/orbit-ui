import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cx } from "../utils";

export interface TextFieldProps extends Omit<ComponentPropsWithRef<"input">, "children"> {
  label: ReactNode;
  description?: ReactNode;
  /** When set, the input is marked invalid and the message is announced with it. */
  error?: ReactNode;
}

export function TextField({ label, description, error, id, required, className, ...rest }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const descriptionId = description ? `${autoId}-description` : undefined;
  const errorId = error ? `${autoId}-error` : undefined;
  const describedBy = cx(descriptionId, errorId, rest["aria-describedby"]) || undefined;

  return (
    <div className={cx("orbit-field", className)}>
      <label className="orbit-field__label" htmlFor={inputId}>
        {label}
        {required && <span className="orbit-field__required" aria-hidden="true">*</span>}
      </label>
      {description && <div id={descriptionId} className="orbit-field__description">{description}</div>}
      <input
        {...rest}
        id={inputId}
        className="orbit-input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {error && (
        <div id={errorId} className="orbit-field__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
