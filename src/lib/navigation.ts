export type NavItem = {
  href: string;
  label: string;
  secondary?: boolean;
  external?: boolean;
  danger?: boolean;
  icon?: string;
};

const PRIMARY_SECTION_ITEMS: NavItem[] = [
  { href: "/ogy2026/egyeni-valasztokeruletek", label: "egyéni választókerületek", danger: true },
  { href: "/mandatumbecsles", label: "Mandátumbecslés" },
  { href: "/dashboard", label: "Infóközpont" },
];

const VIP_SECTION_ITEMS: NavItem[] = [
  { href: "/vip/ogy2026/egyeni-valasztokeruletek", label: "VIP körzetek", danger: true },
  { href: "/", label: "Normál nézet", secondary: true },
];

export function getPrimarySectionItems(currentPath?: string) {
  return PRIMARY_SECTION_ITEMS.filter((item) => item.href !== currentPath);
}

export function getRootNavItems() {
  return PRIMARY_SECTION_ITEMS;
}

export function getVipNavItems(currentPath?: string, extraItems: NavItem[] = []) {
  return [{ href: "/vip", label: "VIP főoldal" }, ...extraItems, ...VIP_SECTION_ITEMS.filter((item) => item.href !== currentPath)];
}

export function getSectionNavItems(currentPath?: string, extraItems: NavItem[] = []) {
  return [{ href: "/", label: "Főoldal" }, ...extraItems, ...getPrimarySectionItems(currentPath)];
}
