"use client";

import { Alert, Input, Label } from "@devora/ui";
import Link from "next/link";
import { useActionState } from "react";

import { requestRecoveryAction } from "../actions";
import { SubmitButton } from "../submit-button";

export function RecoveryForm() {
  const [state, action] = useActionState(requestRecoveryAction, {});

  return (
    <form action={action} className="space-y-5">
      {state.message ? (
        <Alert variant={state.success ? "success" : "error"}>
          {state.message}
        </Alert>
      ) : null}
      <div>
        <Label htmlFor="recovery-email">E-mail</Label>
        <Input
          autoComplete="email"
          id="recovery-email"
          inputMode="email"
          name="email"
          required
          type="email"
        />
      </div>
      <SubmitButton>Enviar instruções</SubmitButton>
      <p className="text-center text-sm">
        <Link className="text-brand-700 underline" href="/auth/login">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
