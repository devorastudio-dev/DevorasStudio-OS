export const GENERIC_LOGIN_ERROR =
  "Não foi possível entrar. Verifique suas credenciais e tente novamente.";

export const GENERIC_RECOVERY_MESSAGE =
  "Se o endereço estiver cadastrado, enviaremos as instruções de recuperação.";

export interface AuthOperationsPort {
  resetPasswordForEmail: (
    email: string,
    options: { redirectTo: string },
  ) => Promise<{ error: unknown }>;
  signInWithPassword: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ error: unknown }>;
  signOut: () => Promise<{ error: unknown }>;
}

export async function performPasswordLogin(
  auth: Pick<AuthOperationsPort, "signInWithPassword">,
  credentials: { email: string; password: string },
): Promise<boolean> {
  try {
    const { error } = await auth.signInWithPassword(credentials);
    return !error;
  } catch {
    return false;
  }
}

export async function requestPasswordRecovery(
  auth: Pick<AuthOperationsPort, "resetPasswordForEmail">,
  email: string,
  redirectTo: string,
): Promise<typeof GENERIC_RECOVERY_MESSAGE> {
  try {
    await auth.resetPasswordForEmail(email, { redirectTo });
  } catch {
    // A resposta permanece idêntica para evitar enumeração de contas.
  }

  return GENERIC_RECOVERY_MESSAGE;
}

export async function performLogout(
  auth: Pick<AuthOperationsPort, "signOut">,
): Promise<boolean> {
  try {
    const { error } = await auth.signOut();
    return !error;
  } catch {
    return false;
  }
}
