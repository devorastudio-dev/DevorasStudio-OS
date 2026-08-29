import { forwardRef, type HTMLAttributes } from "react";

import { classNames } from "../lib/class-names";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div className={classNames("dv-card", className)} ref={ref} {...props} />
  ),
);

Card.displayName = "Card";
