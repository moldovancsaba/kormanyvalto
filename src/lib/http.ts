export const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

function getTrustedOrigins(host: string | null) {
  const trustedOrigins = new Set<string>();

  const addOrigin = (value: string | null | undefined) => {
    if (!value) return;
    try {
      trustedOrigins.add(new URL(value).origin);
    } catch {
      // Ignore invalid configured origins.
    }
  };

  addOrigin(process.env.APP_BASE_URL);
  addOrigin(process.env.NEXT_PUBLIC_APP_URL);
  addOrigin("https://www.kormanyvalto.com");

  if (host) {
    addOrigin(`https://${host}`);
    if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
      addOrigin(`http://${host}`);
    }
  }

  return trustedOrigins;
}

function isOriginAllowed(candidate: string, host: string | null) {
  try {
    const candidateOrigin = new URL(candidate).origin;
    return getTrustedOrigins(host).has(candidateOrigin);
  } catch {
    return false;
  }
}

export function isTrustedOrigin(origin: string | null, referer: string | null, host: string | null) {
  if (origin) {
    return isOriginAllowed(origin, host);
  }

  if (referer) {
    return isOriginAllowed(referer, host);
  }

  return false;
}
