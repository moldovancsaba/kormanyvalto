export function getCountyCodeFromConstituencyHref(href: string) {
  const segments = href.split("/").filter(Boolean);
  if (segments[0] === "ogy2026" && segments[1] === "egyeni-valasztokeruletek") {
    return segments[2] ?? "";
  }
  return "";
}

export function getCountyHrefFromConstituencyHref(href: string) {
  const countyCode = getCountyCodeFromConstituencyHref(href);
  return countyCode ? `/ogy2026/egyeni-valasztokeruletek/${countyCode}` : "/ogy2026/egyeni-valasztokeruletek";
}
