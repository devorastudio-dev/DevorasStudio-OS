"use client";
import type { FormEvent, ReactNode } from "react";
import { useFormStatus } from "react-dom";
export function ProposalSubmit({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Salvando…" : children}
    </button>
  );
}
export function ConfirmRemovalForm({
  action,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
}) {
  function confirmRemoval(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm("Remover este item da proposta?"))
      event.preventDefault();
  }
  return (
    <form action={action} onSubmit={confirmRemoval}>
      {children}
    </form>
  );
}
