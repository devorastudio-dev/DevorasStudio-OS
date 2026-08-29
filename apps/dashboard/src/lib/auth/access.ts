import type { Factor, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "../supabase/server";

export type MembershipState = "active" | "inactive" | "missing" | "ambiguous";
export type InternalDestination =
  "access-pending" | "allowed" | "login" | "mfa-challenge" | "mfa-enroll";

export interface DashboardAccess {
  organization: { id: string; name: string; slug: string };
  profileName: string | null;
  user: User;
}

export interface InternalAuthState {
  access: DashboardAccess | null;
  currentLevel: "aal1" | "aal2" | null;
  destination: InternalDestination;
  factors: ReadonlyArray<Factor<"totp">>;
  membership: MembershipState;
  user: User | null;
}

export function classifyMemberships(
  memberships: ReadonlyArray<{ status: "active" | "invited" | "suspended" }>,
): MembershipState {
  if (memberships.length === 0) return "missing";
  if (memberships.length !== 1) return "ambiguous";
  return memberships[0]?.status === "active" ? "active" : "inactive";
}

export function decideInternalDestination(input: {
  currentLevel: "aal1" | "aal2" | null;
  hasVerifiedTotp: boolean;
  membership: MembershipState;
  user: boolean;
}): InternalDestination {
  if (!input.user) return "login";
  if (input.membership !== "active") return "access-pending";
  if (!input.hasVerifiedTotp) return "mfa-enroll";
  if (input.currentLevel !== "aal2") return "mfa-challenge";
  return "allowed";
}

export function destinationPath(destination: InternalDestination): string {
  const paths: Record<InternalDestination, string> = {
    "access-pending": "/auth/access-pending",
    allowed: "/",
    login: "/auth/login",
    "mfa-challenge": "/auth/mfa/challenge",
    "mfa-enroll": "/auth/mfa/enroll",
  };
  return paths[destination];
}

export async function getInternalAuthState(): Promise<InternalAuthState> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      access: null,
      currentLevel: null,
      destination: "login",
      factors: [],
      membership: "missing",
      user: null,
    };
  }

  const user = userData.user;
  const [{ data: statuses }, factorsResult, assuranceResult] =
    await Promise.all([
      supabase.rpc("get_my_membership_statuses"),
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
  const membership = classifyMemberships(
    (statuses ?? []).map((status) => ({ status })),
  );
  const factors = factorsResult.data?.totp ?? [];
  const reportedLevel = assuranceResult.data?.currentLevel;
  let currentLevel: "aal1" | "aal2" | null = null;
  if (reportedLevel === "aal1") currentLevel = "aal1";
  if (reportedLevel === "aal2") currentLevel = "aal2";
  const destination = decideInternalDestination({
    currentLevel,
    hasVerifiedTotp: factors.length > 0,
    membership,
    user: true,
  });

  if (destination !== "allowed") {
    return {
      access: null,
      currentLevel,
      destination,
      factors,
      membership,
      user,
    };
  }

  const { data: canReadOrganization } = await supabase.rpc("has_permission", {
    permission_key: "organization.read",
  });
  if (!canReadOrganization) {
    return {
      access: null,
      currentLevel,
      destination: "access-pending",
      factors,
      membership,
      user,
    };
  }

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(2);
  const organizationId = memberships?.[0]?.organization_id;
  if (memberships?.length !== 1 || !organizationId) {
    return {
      access: null,
      currentLevel,
      destination: "access-pending",
      factors,
      membership: "ambiguous",
      user,
    };
  }

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
  const access = organization
    ? { organization, profileName: profile?.full_name ?? null, user }
    : null;
  return {
    access,
    currentLevel,
    destination: access ? "allowed" : "access-pending",
    factors,
    membership,
    user,
  };
}

export async function getDashboardAccess() {
  const state = await getInternalAuthState();
  return { access: state.access, user: state.user };
}

export async function requireDashboardAccess(): Promise<DashboardAccess> {
  const state = await getInternalAuthState();
  if (state.destination === "login") redirect("/auth/login");
  if (state.destination === "access-pending") redirect("/auth/access-pending");
  if (state.destination === "mfa-enroll") redirect("/auth/mfa/enroll");
  if (state.destination === "mfa-challenge") redirect("/auth/mfa/challenge");
  if (!state.access) redirect("/auth/access-pending");
  return state.access;
}
