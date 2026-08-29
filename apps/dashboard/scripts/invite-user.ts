import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import { z } from "zod";

const argumentsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  fullName: z.string().trim().min(1).max(160).optional(),
  organizationId: z.string().uuid(),
});

const environmentSchema = z.object({
  APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(20),
});

type Membership = Readonly<{
  organization_id: string;
  status: "active" | "invited" | "suspended";
}>;

export type InvitationAssessment = "conflict" | "idempotent" | "prepare";

export function assessInvitation(
  memberships: ReadonlyArray<Membership>,
  organizationId: string,
): InvitationAssessment {
  if (memberships.length === 0) return "prepare";

  if (
    memberships.length === 1 &&
    memberships[0]?.organization_id === organizationId &&
    memberships[0].status === "invited"
  ) {
    return "idempotent";
  }

  return "conflict";
}

export function parseArguments(values: readonly string[]) {
  const entries = new Map<string, string>();

  for (let index = 0; index < values.length; index += 2) {
    const flag = values[index];
    const value = values[index + 1];

    if (!flag?.startsWith("--") || !value) {
      throw new Error(
        "Use --email, --organization-id e, opcionalmente, --full-name.",
      );
    }

    entries.set(flag, value);
  }

  return argumentsSchema.parse({
    email: entries.get("--email"),
    fullName: entries.get("--full-name"),
    organizationId: entries.get("--organization-id"),
  });
}

async function findUserByEmail(
  client: SupabaseClient,
  email: string,
): Promise<User | null> {
  const perPage = 1000;

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error("Não foi possível consultar usuários.");

    const found = data.users.find(
      (user) => user.email?.trim().toLowerCase() === email,
    );
    if (found) return found;
    if (data.users.length < perPage) return null;
  }

  throw new Error("A consulta de usuários excedeu o limite seguro.");
}

async function getMemberships(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("organization_members")
    .select("organization_id, status")
    .eq("user_id", userId);

  if (error) throw new Error("Não foi possível verificar o vínculo.");
  return (data ?? []) as Membership[];
}

async function prepareMembership(
  client: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  const { error } = await client.from("organization_members").insert({
    organization_id: organizationId,
    status: "invited",
    user_id: userId,
  });

  if (error) {
    throw new Error(
      "O usuário foi convidado, mas o vínculo não foi preparado. Execute novamente com os mesmos parâmetros.",
    );
  }
}

export async function runInvitation(
  rawArguments: readonly string[],
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const input = parseArguments(rawArguments);
  const env = environmentSchema.parse(environment);
  const client = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );

  const { data: organization, error: organizationError } = await client
    .from("organizations")
    .select("id")
    .eq("id", input.organizationId)
    .maybeSingle();

  if (organizationError || !organization) {
    throw new Error("A organização informada não existe.");
  }

  const existingUser = await findUserByEmail(client, input.email);

  if (existingUser) {
    const assessment = assessInvitation(
      await getMemberships(client, existingUser.id),
      input.organizationId,
    );

    if (assessment === "idempotent") {
      return "O convite já estava preparado; nenhuma duplicidade foi criada.";
    }

    if (assessment === "conflict") {
      throw new Error("O usuário já possui um vínculo incompatível.");
    }

    if (!existingUser.invited_at || existingUser.last_sign_in_at) {
      throw new Error(
        "Uma conta existente sem convite pendente exige revisão administrativa.",
      );
    }

    await prepareMembership(client, input.organizationId, existingUser.id);
    return "Convite preparado com segurança.";
  }

  const { data, error } = await client.auth.admin.inviteUserByEmail(
    input.email,
    {
      data: input.fullName ? { full_name: input.fullName } : {},
      redirectTo: `${env.APP_URL.replace(/\/$/, "")}/auth/confirm`,
    },
  );

  if (error || !data.user) {
    throw new Error("Não foi possível enviar o convite.");
  }

  await prepareMembership(client, input.organizationId, data.user.id);
  return "Convite preparado com segurança.";
}

async function main() {
  try {
    const message = await runInvitation(process.argv.slice(2));
    process.stdout.write(`${message}\n`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha inesperada.";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
