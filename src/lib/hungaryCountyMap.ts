import fs from "node:fs";
import path from "node:path";

export type HungaryCountyPath = {
  maz: string;
  id: string;
  d: string;
};

export type HungaryCountyMapData = {
  width: number;
  height: number;
  viewBox: string;
  paths: HungaryCountyPath[];
};

type ParsedPath = {
  id: string;
  d: string;
  style: string;
};

const COUNTY_FILE_TO_MAZ: Record<string, string> = {
  "HU_capital_Budapest.svg": "01",
  "HU_county_Baranya.svg": "02",
  "HU_county_Bacs-Kiskun.svg": "03",
  "HU_county_Bekes.svg": "04",
  "HU_county_Borsod_Abauj_Zemplen.svg": "05",
  "HU_county_Csongrad.svg": "06",
  "HU_county_Fejer.svg": "07",
  "HU_county_Gyor-Moson-Sopron.svg": "08",
  "HU_county_Hajdu-Bihar.svg": "09",
  "HU_county_Heves.svg": "10",
  "HU_county_Jasz-Nagykun-Szolnok.svg": "11",
  "HU_county_Komarom-Esztergom.svg": "12",
  "HU_county_Nograd.svg": "13",
  "HU_county_Pest.svg": "14",
  "HU_county_Somogy.svg": "15",
  "HU_county_Szabolcs-Szatmar-Bereg.svg": "16",
  "HU_county_Tolna.svg": "17",
  "HU_county_Vas.svg": "18",
  "HU_county_Veszprem.svg": "19",
  "HU_county_Zala.svg": "20",
};

const HIGHLIGHT_HEX = "#4e8348";

let cachedData: HungaryCountyMapData | null = null;

function extractAttribute(tag: string, attribute: string): string | null {
  const match = tag.match(new RegExp(`\\b${attribute}="([^"]+)"`, "i"));
  return match?.[1] ?? null;
}

function parseSvgSize(svg: string): { width: number; height: number; viewBox: string } {
  const svgTag = svg.match(/<svg\b[\s\S]*?>/i)?.[0] ?? "";
  const explicitViewBox = extractAttribute(svgTag, "viewBox");

  if (explicitViewBox) {
    const parts = explicitViewBox.split(/[\s,]+/).map((part) => Number(part));
    if (parts.length === 4 && parts.every((part) => Number.isFinite(part))) {
      return { width: parts[2], height: parts[3], viewBox: explicitViewBox };
    }
  }

  const rawWidth = extractAttribute(svgTag, "width") ?? "841.88977";
  const rawHeight = extractAttribute(svgTag, "height") ?? "595.27557";
  const width = Number.parseFloat(rawWidth.replace(/[^0-9.\-]/g, ""));
  const height = Number.parseFloat(rawHeight.replace(/[^0-9.\-]/g, ""));
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 841.88977;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 595.27557;

  return {
    width: safeWidth,
    height: safeHeight,
    viewBox: `0 0 ${safeWidth} ${safeHeight}`,
  };
}

function getPathBounds(d: string): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const numbers = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!numbers || numbers.length < 2) return null;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i + 1 < numbers.length; i += 2) {
    const x = Number.parseFloat(numbers[i]);
    const y = Number.parseFloat(numbers[i + 1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function buildViewBoxFromPaths(paths: HungaryCountyPath[]): string | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const item of paths) {
    const bounds = getPathBounds(item.d);
    if (!bounds) continue;
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  const pad = 16;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return `${minX - pad} ${minY - pad} ${width + pad * 2} ${height + pad * 2}`;
}

function parsePaths(svg: string): ParsedPath[] {
  const pathTags = svg.match(/<path\b[\s\S]*?\/>/gi) ?? [];
  const out: ParsedPath[] = [];

  for (const tag of pathTags) {
    const id = extractAttribute(tag, "id");
    const d = extractAttribute(tag, "d");
    if (!id || !d) continue;

    out.push({
      id,
      d,
      style: extractAttribute(tag, "style") ?? "",
    });
  }

  return out;
}

function findHighlightedPathId(svg: string): string | null {
  const paths = parsePaths(svg);
  for (const item of paths) {
    if (item.style.toLowerCase().includes(HIGHLIGHT_HEX)) {
      return item.id;
    }
  }
  return null;
}

export function getHungaryCountyMapData(): HungaryCountyMapData {
  if (cachedData) return cachedData;

  const dir = path.join(process.cwd(), "public", "images", "couties");
  const emptySvgPath = path.join(dir, "HU_county_empty.svg");

  if (fs.existsSync(emptySvgPath)) {
    const emptySvg = fs.readFileSync(emptySvgPath, "utf8");
    const size = parseSvgSize(emptySvg);
    const emptyPaths = parsePaths(emptySvg);
    const pathById = new Map(emptyPaths.map((item) => [item.id, item]));

    const paths: HungaryCountyPath[] = [];
    for (const [fileName, maz] of Object.entries(COUNTY_FILE_TO_MAZ)) {
      const svgPath = path.join(dir, fileName);
      if (!fs.existsSync(svgPath)) continue;

      const svg = fs.readFileSync(svgPath, "utf8");
      const highlightedId = findHighlightedPathId(svg);
      if (!highlightedId) continue;

      const geometry = pathById.get(highlightedId);
      if (!geometry) continue;

      paths.push({
        maz,
        id: highlightedId,
        d: geometry.d,
      });
    }

    cachedData = {
      ...size,
      viewBox: buildViewBoxFromPaths(paths) ?? size.viewBox,
      paths,
    };
    return cachedData;
  }

  const fallbackSvgPath = path.join(process.cwd(), "public", "images", "HU_counties_colored.svg");
  const fallbackSvg = fs.readFileSync(fallbackSvgPath, "utf8");
  const fallbackSize = parseSvgSize(fallbackSvg);
  const fallbackPaths = parsePaths(fallbackSvg);
  const fallbackByMaz = new Map<string, HungaryCountyPath>();
  const fallbackPathToMaz: Record<string, string> = {
    path2230: "01",
    path1331: "02",
    path4896: "03",
    path3097: "04",
    path1349: "05",
    path4015: "06",
    path7528: "07",
    path2218: "08",
    path1315: "09",
    path4022: "10",
    path4010: "11",
    path2229: "12",
    path5788: "13",
    path3992: "14",
    path1337: "15",
    path2293: "16",
    path7536: "17",
    path2235: "18",
    path2221: "19",
    path2219: "20",
  };
  for (const item of fallbackPaths) {
    const maz = fallbackPathToMaz[item.id];
    if (!maz) continue;
    fallbackByMaz.set(maz, { maz, id: item.id, d: item.d });
  }

  cachedData = {
    ...fallbackSize,
    viewBox: buildViewBoxFromPaths([...fallbackByMaz.values()]) ?? fallbackSize.viewBox,
    paths: [...fallbackByMaz.values()],
  };

  return cachedData;
}

export function getHungaryCountyPaths(): HungaryCountyPath[] {
  return getHungaryCountyMapData().paths;
}
