"use client";

import { Alert, Input, Label } from "@devora/ui";
import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "../actions";
import { SubmitButton } from "../submit-button";

export function LoginForm({
  initialMessage,
  nextPath,
}: Readonly<{ initialMessage?: string; nextPath: string }>) {
  const [state, action] = useActionState(loginAction, {
    message: initialMessage,
  });

  return (
    <form action={action} className="space-y-5">
      {state.message ? <Alert variant="error">{state.message}</Alert> : null}
      <input name="next" type="hidden" value={nextPath} />
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          autoComplete="email"
          id="email"
          inputMode="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          autoComplete="current-password"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>
      <SubmitButton>Entrar</SubmitButton>
      <p className="text-center text-sm">
        <Link className="text-brand-700 underline" href="/auth/forgot-password">
          Esqueci minha senha
        </Link>
      </p>
    </form>
  );
}
