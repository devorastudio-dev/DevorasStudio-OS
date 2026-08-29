import { createClient } from "../supabase/server";

export async function hasPermission(
  permissionKey: string,
  organizationId?: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", {
    permission_key: permissionKey,
    organization_id: organizationId,
  });
  return !error && data === true;
}
