import { forwardRef, type ButtonHTMLAttributes } from "react";

import { classNames } from "../lib/class-names";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, size = "md", type = "button", variant = "primary", ...props },
    ref,
  ) => (
    <button
      className={classNames(
        "dv-button",
        `dv-button--${variant}`,
        `dv-button--${size}`,
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  ),
);

Button.displayName = "Button";
