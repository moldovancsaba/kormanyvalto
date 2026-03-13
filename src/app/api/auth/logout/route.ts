import { NextRequest, NextResponse } from "next/server";
import { APP_SESSION_COOKIE, ANON_VOTER_COOKIE, OAUTH_STATE_COOKIE, isSsoConfigured, normalizeReturnTo } from "../../../../lib/auth";
import { NO_CACHE_HEADERS } from "../../../../lib/http";

export async function GET(req: NextRequest) {
  const returnTo = normalizeReturnTo(new URL(req.url).searchParams.get("returnTo"));
  const response = isSsoConfigured() && process.env.SSO_ISSUER?.trim()
    ? NextResponse.redirect(
        `${process.env.SSO_ISSUER}/api/oauth/logout?post_logout_redirect_uri=${encodeURIComponent(new URL(returnTo, req.url).toString())}`,
        { headers: NO_CACHE_HEADERS }
      )
    : NextResponse.redirect(new URL(returnTo, req.url), { headers: NO_CACHE_HEADERS });

  response.cookies.set(APP_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(ANON_VOTER_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
