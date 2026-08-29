import { forwardRef, type TextareaHTMLAttributes } from "react";

import { classNames } from "../lib/class-names";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea
      className={classNames("dv-control", "dv-textarea", className)}
      ref={ref}
      rows={rows}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
