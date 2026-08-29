import { forwardRef, type HTMLAttributes } from "react";

import { classNames } from "../lib/class-names";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string;
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, label = "Carregando", ...props }, ref) => (
    <span
      aria-label={label}
      className={classNames("dv-spinner", className)}
      ref={ref}
      role="status"
      {...props}
    />
  ),
);

Spinner.displayName = "Spinner";
