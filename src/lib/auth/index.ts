import { createHash, randomBytes, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { createRemoteJWKSet, jwtVerify, JWTPayload, SignJWT } from "jose";
import { SITE_URL } from "../siteMetadata";

export const APP_SESSION_COOKIE = "kv_session";
export const OAUTH_STATE_COOKIE = "kv_oauth";
export const ANON_VOTER_COOKIE = "kv_anon";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const OAUTH_MAX_AGE = 60 * 15;

type OAuthStatePayload = {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
};

export type AppSession = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  provider: "google";
  exp?: number;
  iat?: number;
};

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getSecret() {
  const secret = process.env.APP_SESSION_SECRET?.trim() || process.env.SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing APP_SESSION_SECRET or SESSION_SECRET.");
  }
  return new TextEncoder().encode(secret);
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

export function isSsoConfigured() {
  return Boolean(
    process.env.SSO_CLIENT_ID?.trim() &&
      process.env.SSO_CLIENT_SECRET?.trim() &&
      process.env.SSO_AUTH_URL?.trim() &&
      process.env.SSO_TOKEN_URL?.trim() &&
      process.env.SSO_JWKS_URL?.trim() &&
      process.env.SSO_ISSUER?.trim()
  );
}

export function getAppBaseUrl() {
  return process.env.APP_BASE_URL?.trim() || SITE_URL;
}

export function shouldUseSecureCookies() {
  return process.env.NODE_ENV === "production" && getAppBaseUrl().startsWith("https://");
}

export function getSsoRedirectUri() {
  return process.env.SSO_REDIRECT_URI?.trim() || `${getAppBaseUrl()}/api/auth/callback`;
}

export function getSsoScopes() {
  return process.env.SSO_SCOPES?.trim() || "openid profile email";
}

export function normalizeReturnTo(input: string | null | undefined) {
  if (!input) {
    return "/";
  }

  try {
    if (input.startsWith("/")) {
      return input;
    }

    const baseUrl = new URL(getAppBaseUrl());
    const candidate = new URL(input, baseUrl);
    if (candidate.origin !== baseUrl.origin) {
      return "/";
    }
    return `${candidate.pathname}${candidate.search}${candidate.hash}` || "/";
  } catch {
    return "/";
  }
}

function base64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createCodeVerifier() {
  return base64Url(randomBytes(32));
}

function createCodeChallenge(verifier: string) {
  const hash = createHash("sha256").update(verifier).digest();
  return base64Url(hash);
}

function createRandomToken() {
  return base64Url(randomBytes(24));
}

async function signToken(payload: JWTPayload, expiresInSec: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSec}s`)
    .sign(getSecret());
}

async function verifySignedToken<T extends JWTPayload>(token: string): Promise<T | null> {
  try {
    const verified = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    return verified.payload as T;
  } catch {
    return null;
  }
}

export async function createOAuthStateCookie(returnTo: string) {
  const payload: OAuthStatePayload = {
    state: createRandomToken(),
    nonce: createRandomToken(),
    codeVerifier: createCodeVerifier(),
    returnTo: normalizeReturnTo(returnTo),
  };

  const token = await signToken(payload, OAUTH_MAX_AGE);
  return {
    token,
    payload,
  };
}

export async function readOAuthStateFromRequest(req: NextRequest) {
  const token = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySignedToken<OAuthStatePayload & JWTPayload>(token);
}

export async function createAppSessionCookie(session: AppSession) {
  return signToken(session, SESSION_MAX_AGE);
}

export async function readAppSessionFromRequest(req: NextRequest): Promise<AppSession | null> {
  const token = req.cookies.get(APP_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const payload = await verifySignedToken<AppSession & JWTPayload>(token);
  if (!payload?.sub || !payload.email || !payload.name) {
    return null;
  }
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
    provider: "google",
    exp: payload.exp,
    iat: payload.iat,
  };
}

export async function readAppSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(APP_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const payload = await verifySignedToken<AppSession & JWTPayload>(token);
  if (!payload?.sub || !payload.email || !payload.name) {
    return null;
  }
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
    provider: "google",
    exp: payload.exp,
    iat: payload.iat,
  };
}

export function buildAuthorizeUrl(oauthState: OAuthStatePayload, loginHint?: string) {
  const authUrl = new URL(getRequiredEnv("SSO_AUTH_URL"));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", getRequiredEnv("SSO_CLIENT_ID"));
  authUrl.searchParams.set("redirect_uri", getSsoRedirectUri());
  authUrl.searchParams.set("scope", getSsoScopes());
  authUrl.searchParams.set("state", oauthState.state);
  authUrl.searchParams.set("nonce", oauthState.nonce);
  authUrl.searchParams.set("code_challenge", createCodeChallenge(oauthState.codeVerifier));
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("provider", "google");
  if (loginHint) {
    authUrl.searchParams.set("login_hint", loginHint);
  }
  return authUrl.toString();
}

type TokenResponse = {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

export async function exchangeCodeForTokens(code: string, codeVerifier: string) {
  const res = await fetch(getRequiredEnv("SSO_TOKEN_URL"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: getSsoRedirectUri(),
      client_id: getRequiredEnv("SSO_CLIENT_ID"),
      client_secret: getRequiredEnv("SSO_CLIENT_SECRET"),
      code_verifier: codeVerifier,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text || res.statusText}`);
  }

  return (await res.json()) as TokenResponse;
}

function getJwks() {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(getRequiredEnv("SSO_JWKS_URL")));
  }
  return jwksCache;
}

export async function verifyIdToken(idToken: string, expectedNonce?: string) {
  const verified = await jwtVerify(idToken, getJwks(), {
    issuer: getRequiredEnv("SSO_ISSUER"),
    audience: getRequiredEnv("SSO_CLIENT_ID"),
  });

  const payload = verified.payload;
  if (expectedNonce && payload.nonce && payload.nonce !== expectedNonce) {
    throw new Error("Nonce mismatch.");
  }
  if (!payload.sub || !payload.email || !payload.name) {
    throw new Error("Missing required user claims in ID token.");
  }

  return {
    sub: payload.sub,
    email: String(payload.email),
    name: String(payload.name),
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
    provider: "google" as const,
  };
}

export function createAnonymousActorId() {
  return `anon_${randomUUID()}`;
}

export function getExistingAnonymousActorId(req: NextRequest) {
  return req.cookies.get(ANON_VOTER_COOKIE)?.value?.trim() || null;
}
