import fs from "node:fs";
import path from "node:path";

export type RegionGeometry = {
  regionCode: string;
  sourcePathId: string;
  pathData: string;
};

export type SvgRegionMapData = {
  width: number;
  height: number;
  viewBox: string;
  regions: RegionGeometry[];
};

export type SvgRegionMapConfig = {
  datasetDirectory: string;
  baselineSvgFileName: string;
  highlightColorHex: string;
  regionCodeByVariantFileName: Record<string, string>;
  fallbackSvgFilePath: string;
  fallbackRegionCodeByPathId: Record<string, string>;
  viewBoxPadding: number;
};

type ParsedPathElement = {
  id: string;
  d: string;
  style: string;
  fill: string;
};

function extractAttribute(tag: string, attributeName: string): string | null {
  const match = tag.match(new RegExp(`\\b${attributeName}="([^"]+)"`, "i"));
  return match?.[1] ?? null;
}

function parseSvgCanvas(svgContent: string): { width: number; height: number; viewBox: string } {
  const svgTag = svgContent.match(/<svg\b[\s\S]*?>/i)?.[0] ?? "";
  const explicitViewBox = extractAttribute(svgTag, "viewBox");

  if (explicitViewBox) {
    const parts = explicitViewBox.split(/[\s,]+/).map((item) => Number(item));
    if (parts.length === 4 && parts.every((item) => Number.isFinite(item))) {
      return { width: parts[2], height: parts[3], viewBox: explicitViewBox };
    }
  }

  const rawWidth = extractAttribute(svgTag, "width") ?? "1024";
  const rawHeight = extractAttribute(svgTag, "height") ?? "768";
  const width = Number.parseFloat(rawWidth.replace(/[^0-9.\-]/g, ""));
  const height = Number.parseFloat(rawHeight.replace(/[^0-9.\-]/g, ""));
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1024;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 768;

  return {
    width: safeWidth,
    height: safeHeight,
    viewBox: `0 0 ${safeWidth} ${safeHeight}`,
  };
}

function parsePathElements(svgContent: string): ParsedPathElement[] {
  const pathTags = svgContent.match(/<path\b[\s\S]*?(?:\/?>|<\/path>)/gi) ?? [];
  const elements: ParsedPathElement[] = [];

  for (const tag of pathTags) {
    const id = extractAttribute(tag, "id");
    const d = extractAttribute(tag, "d");
    if (!id || !d) continue;

    elements.push({
      id,
      d,
      style: extractAttribute(tag, "style") ?? "",
      fill: extractAttribute(tag, "fill") ?? "",
    });
  }

  return elements;
}

function extractPathBounds(pathData: string): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const numericValues = pathData.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!numericValues || numericValues.length < 2) return null;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let index = 0; index + 1 < numericValues.length; index += 2) {
    const x = Number.parseFloat(numericValues[index]);
    const y = Number.parseFloat(numericValues[index + 1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function buildViewBoxFromRegions(regions: RegionGeometry[], padding: number): string | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const region of regions) {
    const bounds = extractPathBounds(region.pathData);
    if (!bounds) continue;

    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;
}

function findHighlightedPathId(svgContent: string, highlightColorHex: string): string | null {
  const normalizedHighlightColor = highlightColorHex.toLowerCase();
  for (const item of parsePathElements(svgContent)) {
    const style = item.style.toLowerCase();
    const fill = item.fill.toLowerCase();
    if (style.includes(normalizedHighlightColor) || fill === normalizedHighlightColor) {
      return item.id;
    }
  }
  return null;
}

function loadFromVariantFiles(config: SvgRegionMapConfig): SvgRegionMapData | null {
  const baselineSvgPath = path.join(config.datasetDirectory, config.baselineSvgFileName);
  if (!fs.existsSync(baselineSvgPath)) return null;

  const baselineSvgContent = fs.readFileSync(baselineSvgPath, "utf8");
  const canvas = parseSvgCanvas(baselineSvgContent);
  const baselinePathsById = new Map(parsePathElements(baselineSvgContent).map((item) => [item.id, item]));

  const regions: RegionGeometry[] = [];
  for (const [variantFileName, regionCode] of Object.entries(config.regionCodeByVariantFileName)) {
    const variantSvgPath = path.join(config.datasetDirectory, variantFileName);
    if (!fs.existsSync(variantSvgPath)) continue;

    const variantSvgContent = fs.readFileSync(variantSvgPath, "utf8");
    const highlightedPathId = findHighlightedPathId(variantSvgContent, config.highlightColorHex);
    if (!highlightedPathId) continue;

    const baselinePath = baselinePathsById.get(highlightedPathId);
    if (!baselinePath) continue;

    regions.push({
      regionCode,
      sourcePathId: highlightedPathId,
      pathData: baselinePath.d,
    });
  }

  return {
    width: canvas.width,
    height: canvas.height,
    viewBox: buildViewBoxFromRegions(regions, config.viewBoxPadding) ?? canvas.viewBox,
    regions,
  };
}

function loadFromFallbackSvg(config: SvgRegionMapConfig): SvgRegionMapData {
  const fallbackSvgContent = fs.readFileSync(config.fallbackSvgFilePath, "utf8");
  const canvas = parseSvgCanvas(fallbackSvgContent);
  const fallbackPaths = parsePathElements(fallbackSvgContent);

  const regions: RegionGeometry[] = [];
  for (const pathElement of fallbackPaths) {
    const regionCode = config.fallbackRegionCodeByPathId[pathElement.id];
    if (!regionCode) continue;

    regions.push({
      regionCode,
      sourcePathId: pathElement.id,
      pathData: pathElement.d,
    });
  }

  return {
    width: canvas.width,
    height: canvas.height,
    viewBox: buildViewBoxFromRegions(regions, config.viewBoxPadding) ?? canvas.viewBox,
    regions,
  };
}

export function loadSvgRegionMapData(config: SvgRegionMapConfig): SvgRegionMapData {
  return loadFromVariantFiles(config) ?? loadFromFallbackSvg(config);
}
