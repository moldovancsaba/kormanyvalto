import { NextRequest, NextResponse } from "next/server";
import {
  APP_SESSION_COOKIE,
  OAUTH_STATE_COOKIE,
  createAppSessionCookie,
  exchangeCodeForTokens,
  isSsoConfigured,
  normalizeReturnTo,
  readOAuthStateFromRequest,
  shouldUseSecureCookies,
  verifyIdToken,
} from "../../../../lib/auth";
import { NO_CACHE_HEADERS } from "../../../../lib/http";
import { checkRateLimit } from "../../../../lib/rateLimit";

function buildErrorRedirect(req: NextRequest, returnTo: string, reason: string) {
  const redirectUrl = new URL(normalizeReturnTo(returnTo), req.url);
  redirectUrl.searchParams.set("authError", reason);
  return redirectUrl;
}

export async function GET(req: NextRequest) {
  const rate = await checkRateLimit(req, "api-auth-callback", 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_CACHE_HEADERS, "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error") || requestUrl.searchParams.get("error_description");

  const oauthState = await readOAuthStateFromRequest(req);
  const returnTo = oauthState?.returnTo || "/";

  if (!isSsoConfigured()) {
    const response = NextResponse.redirect(buildErrorRedirect(req, returnTo, "sso_not_configured"), { headers: NO_CACHE_HEADERS });
    response.cookies.set(OAUTH_STATE_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: shouldUseSecureCookies(), path: "/", maxAge: 0 });
    return response;
  }

  if (error || !code || !state || !oauthState || oauthState.state !== state) {
    const response = NextResponse.redirect(buildErrorRedirect(req, returnTo, error ? "oauth_failed" : "invalid_state"), {
      headers: NO_CACHE_HEADERS,
    });
    response.cookies.set(OAUTH_STATE_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: shouldUseSecureCookies(), path: "/", maxAge: 0 });
    return response;
  }

  try {
    const tokens = await exchangeCodeForTokens(code, oauthState.codeVerifier);
    const verifiedUser = await verifyIdToken(tokens.id_token, oauthState.nonce);
    const sessionToken = await createAppSessionCookie(verifiedUser);

    const response = NextResponse.redirect(new URL(returnTo, req.url), { headers: NO_CACHE_HEADERS });
    response.cookies.set(APP_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: shouldUseSecureCookies(),
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set(OAUTH_STATE_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: shouldUseSecureCookies(), path: "/", maxAge: 0 });
    return response;
  } catch {
    const response = NextResponse.redirect(buildErrorRedirect(req, returnTo, "auth_failed"), { headers: NO_CACHE_HEADERS });
    response.cookies.set(OAUTH_STATE_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: shouldUseSecureCookies(), path: "/", maxAge: 0 });
    return response;
  }
}
