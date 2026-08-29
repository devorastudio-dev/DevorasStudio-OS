import { forwardRef, type HTMLAttributes } from "react";

import { classNames } from "../lib/class-names";

export type BadgeVariant = "neutral" | "success" | "warning" | "error" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", ...props }, ref) => (
    <span
      className={classNames("dv-badge", `dv-badge--${variant}`, className)}
      ref={ref}
      {...props}
    />
  ),
);

Badge.displayName = "Badge";
