export function getCountyCodeFromConstituencyHref(href: string) {
  const segments = href.split("/").filter(Boolean);
  return segments[3] ?? "";
}

export function getCountyHrefFromConstituencyHref(href: string) {
  const countyCode = getCountyCodeFromConstituencyHref(href);
  return countyCode ? `/ogy2026/egyeni-valasztokeruletek/${countyCode}` : "/ogy2026/egyeni-valasztokeruletek";
}
