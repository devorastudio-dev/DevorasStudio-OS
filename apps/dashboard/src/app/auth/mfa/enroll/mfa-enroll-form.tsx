"use client";

import { Alert, Button, Input, Label } from "@devora/ui";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { createClient } from "../../../../lib/supabase/client";
import { SubmitButton } from "../../submit-button";
import { totpCodeSchema } from "../mfa-code";
import { prepareMfaEnrollment } from "./mfa-enrollment";

type Enrollment = { factorId: string; qrCode: string; secret: string };

export function MfaEnrollForm({ nextPath }: Readonly<{ nextPath: string }>) {
  const startedAttempt = useRef(-1);
  const [attempt, setAttempt] = useState(0);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (startedAttempt.current === attempt) return;
    startedAttempt.current = attempt;
    setLoading(true);
    setMessage(undefined);
    setEnrollment(null);
    void (async () => {
      try {
        const supabase = createClient();
        await supabase.rpc("record_audit_event", {
          event_action: "auth.mfa.enrollment_started",
          event_outcome: "success",
          event_metadata: { source: "dashboard" },
        });
        setEnrollment(await prepareMfaEnrollment(supabase.auth.mfa));
      } catch {
        setMessage("Não foi possível iniciar a configuração de MFA.");
      } finally {
        setLoading(false);
      }
    })();
  }, [attempt]);

  async function verify(formData: FormData) {
    if (!enrollment || pending) return;
    const parsed = totpCodeSchema.safeParse(formData.get("code"));
    if (!parsed.success) return setMessage("Informe o código de seis dígitos.");
    setPending(true);
    setMessage(undefined);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.factorId,
      code: parsed.data,
    });
    if (error) {
      await supabase.rpc("record_audit_event", {
        event_action: "auth.mfa.challenge.failed",
        event_outcome: "failure",
        event_metadata: { source: "dashboard" },
      });
      setPending(false);
      setMessage(
        "Não foi possível confirmar o código. Gere um novo código e tente novamente.",
      );
      return;
    }
    await supabase.rpc("record_audit_event", {
      event_action: "auth.mfa.enrollment_completed",
      event_outcome: "success",
      event_metadata: { source: "dashboard" },
    });
    await supabase.rpc("record_audit_event", {
      event_action: "auth.mfa.factor_added",
      event_outcome: "success",
      event_entity_type: "mfa_factor",
      event_metadata: { source: "dashboard" },
    });
    window.location.assign(nextPath);
  }

  if (!enrollment)
    return (
      <div className="space-y-4">
        <Alert variant={message ? "error" : "warning"}>
          {message ?? "Preparando o QR Code…"}
        </Alert>
        {!loading && message ? (
          <Button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Tentar novamente
          </Button>
        ) : null}
      </div>
    );

  const qrSource = enrollment.qrCode.startsWith("data:")
    ? enrollment.qrCode
    : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(enrollment.qrCode)}`;
  return (
    <form action={verify} className="space-y-5">
      {message ? <Alert variant="error">{message}</Alert> : null}
      <ol className="list-decimal space-y-2 pl-5 text-sm text-text-muted">
        <li>
          Abra Google Authenticator, Microsoft Authenticator, 1Password ou outro
          aplicativo TOTP.
        </li>
        <li>Leia o QR Code ou informe a chave textual.</li>
        <li>Digite abaixo o código atual de seis dígitos.</li>
      </ol>
      {/* O SVG é fornecido diretamente pelo Supabase para o fator desta sessão. */}
      <Image
        alt="QR Code para cadastrar o Devora OS no aplicativo autenticador"
        className="mx-auto size-56"
        height={224}
        src={qrSource}
        unoptimized
        width={224}
      />
      <div>
        <Label htmlFor="totp-secret">Chave textual alternativa</Label>
        <Input id="totp-secret" readOnly value={enrollment.secret} />
      </div>
      <div>
        <Label htmlFor="totp-code">Código de seis dígitos</Label>
        <Input
          autoComplete="one-time-code"
          id="totp-code"
          inputMode="numeric"
          maxLength={6}
          name="code"
          pattern="[0-9]{6}"
          required
        />
      </div>
      <SubmitButton>Ativar MFA</SubmitButton>
    </form>
  );
}
