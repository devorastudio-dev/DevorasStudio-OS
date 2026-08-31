"use client";
import { Alert, Button } from "@devora/ui";
export default function ProposalsError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Alert variant="error">
      <p>Não foi possível carregar o módulo de propostas.</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </Alert>
  );
}
