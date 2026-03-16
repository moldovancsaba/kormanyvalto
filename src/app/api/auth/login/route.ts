import { NextRequest, NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  buildAuthorizeUrl,
  createOAuthStateCookie,
  isSsoConfigured,
  normalizeReturnTo,
  shouldUseSecureCookies,
} from "../../../../lib/auth";
import { NO_CACHE_HEADERS } from "../../../../lib/http";
import { checkRateLimit } from "../../../../lib/rateLimit";

export async function GET(req: NextRequest) {
  const rate = await checkRateLimit(req, "api-auth-login", 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const returnTo = normalizeReturnTo(new URL(req.url).searchParams.get("returnTo"));

  if (!isSsoConfigured()) {
    return NextResponse.redirect(new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}authError=sso_not_configured`, req.url), {
      headers: NO_CACHE_HEADERS,
    });
  }

  const oauthState = await createOAuthStateCookie(returnTo);
  const redirectUrl = buildAuthorizeUrl(oauthState.payload);
  const response = NextResponse.redirect(redirectUrl, { headers: NO_CACHE_HEADERS });
  response.cookies.set(OAUTH_STATE_COOKIE, oauthState.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 60 * 15,
  });
  return response;
}
