import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils";

export interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: "solid" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Shows a spinner, keeps the button's width, and blocks clicks while announcing busy state. */
  loading?: boolean;
}

export function Button({
  variant = "solid",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("orbit-button", `orbit-button--${variant}`, `orbit-button--${size}`, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      {...rest}
    >
      {loading && <span className="orbit-spinner" aria-hidden="true" />}
      <span className="orbit-button__label">{children}</span>
    </button>
  );
}
