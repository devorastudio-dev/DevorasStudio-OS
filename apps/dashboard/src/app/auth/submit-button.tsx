"use client";

import { Button, Spinner } from "@devora/ui";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: Readonly<{ children: string }>) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? <Spinner label="Enviando" /> : null}
      {pending ? "Enviando..." : children}
    </Button>
  );
}
