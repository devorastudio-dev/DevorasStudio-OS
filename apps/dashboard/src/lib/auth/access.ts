import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "../supabase/server";

export type MembershipState = "active" | "inactive" | "missing" | "ambiguous";

export interface DashboardAccess {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  profileName: string | null;
  user: User;
}

export function classifyMemberships(
  memberships: ReadonlyArray<{ status: "active" | "invited" | "suspended" }>,
): MembershipState {
  if (memberships.length === 0) return "missing";
  if (memberships.length !== 1) return "ambiguous";
  return memberships[0]?.status === "active" ? "active" : "inactive";
}

export async function getDashboardAccess(): Promise<{
  access: DashboardAccess | null;
  user: User | null;
}> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { access: null, user: null };
  }

  const user = userData.user;
  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, status")
    .eq("user_id", user.id)
    .limit(2);

  if (
    membershipError ||
    classifyMemberships(memberships ?? []) !== "active" ||
    !memberships?.[0]
  ) {
    return { access: null, user };
  }

  const organizationId = memberships[0].organization_id;
  const [{ data: organization }, { data: profile }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!organization) {
    return { access: null, user };
  }

  return {
    access: {
      organization,
      profileName: profile?.full_name ?? null,
      user,
    },
    user,
  };
}

export async function requireDashboardAccess(): Promise<DashboardAccess> {
  const { access, user } = await getDashboardAccess();

  if (!user) redirect("/auth/login");
  if (!access) redirect("/auth/access-pending");

  return access;
}
