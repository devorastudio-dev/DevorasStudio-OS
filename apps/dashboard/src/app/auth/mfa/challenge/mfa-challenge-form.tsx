"use client";

import { Alert, Button, Input, Label } from "@devora/ui";
import { useState } from "react";

import { createClient } from "../../../../lib/supabase/client";
import { SubmitButton } from "../../submit-button";
import { totpCodeSchema } from "../mfa-code";

export function MfaChallengeForm({
  factorId,
  logoutAction,
  nextPath,
}: Readonly<{
  factorId: string;
  logoutAction: () => Promise<never>;
  nextPath: string;
}>) {
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
  async function verify(formData: FormData) {
    if (pending) return;
    const parsed = totpCodeSchema.safeParse(formData.get("code"));
    if (!parsed.success) return setMessage("Informe o código de seis dígitos.");
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: parsed.data,
    });
    if (error) {
      await supabase.rpc("record_audit_event", {
        event_action: "auth.mfa.challenge.failed",
        event_outcome: "failure",
        event_metadata: { source: "dashboard" },
      });
      setPending(false);
      setMessage("Código inválido ou expirado. Tente novamente.");
      return;
    }
    await supabase.rpc("record_audit_event", {
      event_action: "auth.mfa.challenge.succeeded",
      event_outcome: "success",
      event_metadata: { source: "dashboard" },
    });
    window.location.assign(nextPath);
  }
  return (
    <div className="space-y-5">
      <form action={verify} className="space-y-5">
        {message ? <Alert variant="error">{message}</Alert> : null}
        <div>
          <Label htmlFor="mfa-code">Código de seis dígitos</Label>
          <Input
            autoComplete="one-time-code"
            autoFocus
            id="mfa-code"
            inputMode="numeric"
            maxLength={6}
            name="code"
            pattern="[0-9]{6}"
            required
          />
        </div>
        <SubmitButton>Confirmar</SubmitButton>
      </form>
      <form action={logoutAction}>
        <Button className="w-full" type="submit" variant="secondary">
          Sair com segurança
        </Button>
      </form>
    </div>
  );
}
