import { Spinner } from "@devora/ui";
export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <Spinner /> Carregando propostas…
    </div>
  );
}
