"use client";

import { Alert, Input, Label } from "@devora/ui";
import { useActionState } from "react";

import { updatePasswordAction } from "../actions";
import { SubmitButton } from "../submit-button";

export function PasswordForm({
  mode,
}: Readonly<{ mode: "invite" | "recovery" }>) {
  const [state, action] = useActionState(updatePasswordAction, {});

  return (
    <form action={action} className="space-y-5">
      {state.message ? <Alert variant="error">{state.message}</Alert> : null}
      <input name="mode" type="hidden" value={mode} />
      <div>
        <Label htmlFor="new-password">Nova senha</Label>
        <Input
          aria-describedby="password-requirements"
          autoComplete="new-password"
          id="new-password"
          minLength={12}
          name="password"
          required
          type="password"
        />
        <p className="mt-2 text-sm text-text-muted" id="password-requirements">
          Use 12 ou mais caracteres, com maiúscula, minúscula e número.
        </p>
      </div>
      <div>
        <Label htmlFor="confirm-password">Confirmar senha</Label>
        <Input
          autoComplete="new-password"
          id="confirm-password"
          minLength={12}
          name="confirmPassword"
          required
          type="password"
        />
      </div>
      <SubmitButton>Salvar senha</SubmitButton>
    </form>
  );
}
