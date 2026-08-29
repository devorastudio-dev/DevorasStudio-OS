import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(20),
});
const roleSchema = z.enum([
  "administrador",
  "socio",
  "colaborador",
  "financeiro",
]);
const uuidSchema = z.string().uuid();

function args(values: readonly string[]) {
  const command = values[0];
  const options = new Map<string, string>();
  for (let index = 1; index < values.length; index += 2) {
    const key = values[index],
      value = values[index + 1];
    if (!key?.startsWith("--") || !value)
      throw new Error("Argumentos invalidos.");
    options.set(key, value);
  }
  return {
    command,
    organizationId: uuidSchema.parse(options.get("--organization-id")),
    userId: options.has("--user-id")
      ? uuidSchema.parse(options.get("--user-id"))
      : undefined,
    role: options.has("--role")
      ? roleSchema.parse(options.get("--role"))
      : undefined,
    confirm: options.get("--confirm"),
  };
}

export async function runRoleCommand(
  values: readonly string[],
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const input = args(values),
    env = envSchema.parse(environment);
  const client = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const membershipQuery = client
    .from("organization_members")
    .select("id,user_id,status")
    .eq("organization_id", input.organizationId);
  const { data: memberships, error: membershipError } = input.userId
    ? await membershipQuery.eq("user_id", input.userId)
    : await membershipQuery;
  if (membershipError) throw new Error("Nao foi possivel consultar membros.");

  if (input.command === "list")
    return (
      memberships?.map((member) => ({
        status: member.status,
        userId: member.user_id,
      })) ?? []
    );
  if (!input.userId) throw new Error("Informe --user-id.");
  const membership = memberships?.[0];
  if (!membership || membership.status !== "active")
    throw new Error("O membro precisa estar ativo.");
  const { data: roles, error: roleError } = await client
    .from("roles")
    .select("id,slug")
    .eq("organization_id", input.organizationId);
  if (roleError) throw new Error("Nao foi possivel consultar papeis.");

  if (input.command === "effective") {
    const { data, error } = await client
      .from("organization_member_roles")
      .select("roles(slug,role_permissions(permissions(key)))")
      .eq("membership_id", membership.id);
    if (error) throw new Error("Nao foi possivel consultar a matriz efetiva.");
    return data ?? [];
  }

  const roleSlug = input.command === "bootstrap" ? "administrador" : input.role;
  if (!roleSlug) throw new Error("Informe --role.");
  const role = roles?.find((item) => item.slug === roleSlug);
  if (!role) throw new Error("Papel nao encontrado na organizacao.");
  if (input.command === "bootstrap" && input.confirm !== "BOOTSTRAP")
    throw new Error("Confirme com --confirm BOOTSTRAP.");
  if (
    (input.command === "assign" || input.command === "remove") &&
    input.confirm !== "APPLY"
  )
    throw new Error("Confirme com --confirm APPLY.");

  if (input.command === "bootstrap") {
    const adminRole = roles?.find((item) => item.slug === "administrador");
    const { count } = await client
      .from("organization_member_roles")
      .select("membership_id", { count: "exact", head: true })
      .eq("role_id", adminRole?.id ?? "");
    const { count: existing } = await client
      .from("organization_member_roles")
      .select("membership_id", { count: "exact", head: true })
      .eq("membership_id", membership.id)
      .eq("role_id", role.id);
    if (existing) return "O bootstrap ja estava aplicado.";
    if (count)
      throw new Error("A organizacao ja possui Administrador atribuido.");
  }

  if (input.command === "assign" || input.command === "bootstrap") {
    const { error } = await client.from("organization_member_roles").upsert(
      {
        organization_id: input.organizationId,
        membership_id: membership.id,
        role_id: role.id,
      },
      { onConflict: "membership_id,role_id", ignoreDuplicates: true },
    );
    if (error) throw new Error("Nao foi possivel atribuir o papel.");
    return "Papel atribuido com seguranca.";
  }
  if (input.command === "remove") {
    const { error } = await client
      .from("organization_member_roles")
      .delete()
      .eq("membership_id", membership.id)
      .eq("role_id", role.id);
    if (error)
      throw new Error(
        "Nao foi possivel remover o papel; confira a protecao do ultimo Administrador.",
      );
    return "Papel removido com seguranca.";
  }
  throw new Error("Comando desconhecido.");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const result = await runRoleCommand(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Falha inesperada."}\n`,
    );
    process.exitCode = 1;
  }
}
