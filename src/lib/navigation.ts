export type NavItem = {
  href: string;
  label: string;
  secondary?: boolean;
  external?: boolean;
  danger?: boolean;
  icon?: string;
};

const PRIMARY_SECTION_ITEMS: NavItem[] = [
  { href: "/ogy2026/egyeni-valasztokeruletek", label: "⚠ EVK 2026 ⚠", danger: true },
  { href: "/mandatumbecsles", label: "Mandátumbecslés" },
  { href: "/dashboard", label: "Grafikon" },
];

export function getPrimarySectionItems(currentPath?: string) {
  return PRIMARY_SECTION_ITEMS.filter((item) => item.href !== currentPath);
}

export function getRootNavItems() {
  return PRIMARY_SECTION_ITEMS;
}

export function getSectionNavItems(currentPath?: string, extraItems: NavItem[] = []) {
  return [{ href: "/", label: "Főoldal" }, ...extraItems, ...getPrimarySectionItems(currentPath)];
}
