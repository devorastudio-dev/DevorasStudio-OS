import { forwardRef, type LabelHTMLAttributes } from "react";

import { classNames } from "../lib/class-names";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label className={classNames("dv-label", className)} ref={ref} {...props} />
  ),
);

Label.displayName = "Label";
