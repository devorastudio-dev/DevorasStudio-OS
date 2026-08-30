"use client";

import { Button, Input, Label, Textarea } from "@devora/ui";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { initialLeadState, submitLead } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enviando…" : "Enviar mensagem"}
    </Button>
  );
}

export function ContactForm() {
  const [state, action] = useActionState(submitLead, initialLeadState);
  const formRef = useRef<HTMLFormElement>(null);
  const startedAtRef = useRef<HTMLInputElement>(null);
  const landingPathRef = useRef<HTMLInputElement>(null);
  const utmRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (startedAtRef.current) startedAtRef.current.value = String(Date.now());
    if (landingPathRef.current)
      landingPathRef.current.value = window.location.pathname;
    for (const name of ["source", "medium", "campaign", "content", "term"]) {
      const input = utmRefs.current[name];
      if (input) input.value = params.get(`utm_${name}`) ?? "";
    }
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      if (startedAtRef.current) startedAtRef.current.value = String(Date.now());
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="lead-form">
      <div className="field">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          minLength={2}
          maxLength={120}
          required
        />
      </div>
      <div className="field">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </div>
      <div className="form-row">
        <div className="field">
          <Label htmlFor="phone">Telefone (opcional)</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
          />
        </div>
        <div className="field">
          <Label htmlFor="company">Empresa (opcional)</Label>
          <Input
            id="company"
            name="company"
            autoComplete="organization"
            maxLength={160}
          />
        </div>
      </div>
      <div className="field">
        <Label htmlFor="serviceInterest">Assunto</Label>
        <select
          id="serviceInterest"
          name="serviceInterest"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Selecione
          </option>
          <option value="digital_presence">Presença digital</option>
          <option value="business_systems">Sistema para o negócio</option>
          <option value="automation">Automação</option>
          <option value="other">Outro</option>
        </select>
      </div>
      <div className="field">
        <Label htmlFor="message">Conte um pouco sobre o desafio</Label>
        <Textarea
          id="message"
          name="message"
          minLength={20}
          maxLength={2000}
          rows={6}
          required
        />
      </div>
      <div className="honeypot" aria-hidden="true">
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <input
        ref={startedAtRef}
        type="hidden"
        name="startedAt"
        defaultValue="0"
      />
      <input
        ref={landingPathRef}
        type="hidden"
        name="landingPath"
        defaultValue="/"
      />
      {(["source", "medium", "campaign", "content", "term"] as const).map(
        (name) => (
          <input
            key={name}
            ref={(input) => {
              utmRefs.current[name] = input;
            }}
            type="hidden"
            name={`utm${name.charAt(0).toUpperCase()}${name.slice(1)}`}
          />
        ),
      )}
      <label className="consent">
        <input type="checkbox" name="consent" required />{" "}
        <span>
          Concordo com o uso destes dados para retorno do contato, conforme a{" "}
          <Link href="/privacy">Política de Privacidade</Link>.
        </span>
      </label>
      {state.message ? (
        <p
          className={`form-message ${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
