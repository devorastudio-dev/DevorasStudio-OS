import { AuthFormShell } from "../auth-form-shell";
import { RecoveryForm } from "./recovery-form";

export default function ForgotPasswordPage() {
  return (
    <AuthFormShell
      description="A resposta é sempre a mesma para proteger a existência das contas."
      title="Recuperar acesso"
    >
      <RecoveryForm />
    </AuthFormShell>
  );
}
