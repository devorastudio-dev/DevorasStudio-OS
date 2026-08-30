"use server";

import { redirect } from "next/navigation";

import {
  GENERIC_LOGIN_ERROR,
  GENERIC_RECOVERY_MESSAGE,
  performLogout,
  performPasswordLogin,
  requestPasswordRecovery,
} from "../../lib/auth/operations";
import { destinationPath, getInternalAuthState } from "../../lib/auth/access";
import {
  emailSchema,
  getApplicationUrl,
  loginSchema,
  safeNextPath,
  updatePasswordSchema,
} from "../../lib/auth/validation";
import { createClient } from "../../lib/supabase/server";
import { recordAuditEvent } from "../../lib/audit/record";
import type { AuthFormState } from "./auth-action-state";

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { message: GENERIC_LOGIN_ERROR };

  const supabase = await createClient();
  const authenticated = await performPasswordLogin(supabase.auth, parsed.data);

  if (!authenticated) {
    await recordAuditEvent({
      action: "auth.login.failed",
      outcome: "failure",
      metadata: { source: "dashboard" },
    });
    return { message: GENERIC_LOGIN_ERROR };
  }
  await recordAuditEvent({
    action: "auth.login.succeeded",
    outcome: "success",
    metadata: { source: "dashboard" },
  });

  const nextPath = safeNextPath(formData.get("next")?.toString());
  const authState = await getInternalAuthState();
  if (
    authState.destination === "mfa-enroll" ||
    authState.destination === "mfa-challenge"
  ) {
    redirect(
      `${destinationPath(authState.destination)}?next=${encodeURIComponent(nextPath)}`,
    );
  }
  redirect(destinationPath(authState.destination));
}

export async function logoutAction(): Promise<never> {
  const supabase = await createClient();
  await recordAuditEvent({
    action: "auth.logout.succeeded",
    outcome: "success",
    metadata: { source: "dashboard" },
  });
  await performLogout(supabase.auth);
  redirect("/auth/login");
}

export async function requestRecoveryAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));

  if (!parsed.success) {
    return { message: GENERIC_RECOVERY_MESSAGE, success: true };
  }

  const supabase = await createClient();

  try {
    const redirectTo = `${getApplicationUrl()}/auth/callback?next=${encodeURIComponent("/auth/update-password?mode=recovery")}`;
    const message = await requestPasswordRecovery(
      supabase.auth,
      parsed.data,
      redirectTo,
    );
    await recordAuditEvent({
      action: "auth.password_reset.requested",
      outcome: "success",
      metadata: { source: "dashboard" },
    });
    return { message, success: true };
  } catch {
    return { message: GENERIC_RECOVERY_MESSAGE, success: true };
  }
}

export async function updatePasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = updatePasswordSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Senha inválida." };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { message: "O link é inválido ou expirou. Solicite um novo." };
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (passwordError) {
    return { message: "Não foi possível atualizar a senha. Tente novamente." };
  }

  await recordAuditEvent({
    action: "auth.password_reset.completed",
    outcome: "success",
    metadata: {
      mode: formData.get("mode") === "invite" ? "invite" : "recovery",
    },
  });

  if (formData.get("mode") === "invite") {
    const { error: invitationError } = await supabase.rpc(
      "accept_my_organization_invitation",
    );

    if (invitationError) {
      await performLogout(supabase.auth);
      redirect("/auth/login?error=invalid-invitation");
    }
    await recordAuditEvent({
      action: "auth.invitation.accepted",
      outcome: "success",
      metadata: { source: "dashboard" },
    });
  }

  redirect("/");
}
