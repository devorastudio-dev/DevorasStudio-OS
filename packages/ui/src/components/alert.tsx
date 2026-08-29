import { forwardRef, type HTMLAttributes } from "react";

import { classNames } from "../lib/class-names";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, role, variant = "info", ...props }, ref) => (
    <div
      className={classNames("dv-alert", `dv-alert--${variant}`, className)}
      data-variant={variant}
      ref={ref}
      role={role ?? (variant === "error" ? "alert" : undefined)}
      {...props}
    />
  ),
);

Alert.displayName = "Alert";
