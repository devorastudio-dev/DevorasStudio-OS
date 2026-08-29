import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "../../../lib/auth/validation";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = safeNextPath(
    request.nextUrl.searchParams.get("next"),
    "/auth/update-password?mode=recovery",
  );

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=invalid-link", request.url),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  const { data: userData } = error
    ? { data: { user: null } }
    : await supabase.auth.getUser();

  if (error || !userData.user) {
    return NextResponse.redirect(
      new URL("/auth/login?error=invalid-link", request.url),
    );
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
