"use client";

import { Button } from "@devora/ui";
import { useFormStatus } from "react-dom";

export function PipelineSubmit({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? "Salvando…" : children}
    </Button>
  );
}
