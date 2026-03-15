import fs from "node:fs";
import path from "node:path";
import { loadSvgRegionMapData, type SvgRegionMapData } from "./svgRegionMap";

export type HungaryCountyShape = {
  countyCode: string;
  sourcePathId: string;
  pathData: string;
};

export type HungaryCountyMapData = {
  width: number;
  height: number;
  viewBox: string;
  counties: HungaryCountyShape[];
};

const HUNGARY_COUNTY_VARIANT_FILE_TO_COUNTY_CODE: Record<string, string> = {
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

const HUNGARY_COUNTY_FALLBACK_PATH_ID_TO_COUNTY_CODE: Record<string, string> = {
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

const HUNGARY_COUNTY_MAP_SOURCE_DIRECTORY_CANDIDATES = [
  path.join(process.cwd(), "public", "images", "counties"),
  path.join(process.cwd(), "public", "images", "couties"),
];
const HUNGARY_COUNTY_MAP_FALLBACK_SVG_FILE_PATH = path.join(process.cwd(), "public", "images", "HU_counties_colored.svg");
const HUNGARY_COUNTY_MAP_BASELINE_FILE_NAME = "HU_county_empty.svg";
const HUNGARY_COUNTY_MAP_HIGHLIGHT_COLOR_HEX = "#4e8348";
const HUNGARY_COUNTY_MAP_VIEWBOX_PADDING = 16;

let cachedHungaryCountyMapData: HungaryCountyMapData | null = null;

function resolveHungaryCountyMapSourceDirectory(): string {
  for (const directoryPath of HUNGARY_COUNTY_MAP_SOURCE_DIRECTORY_CANDIDATES) {
    const baselineFilePath = path.join(directoryPath, HUNGARY_COUNTY_MAP_BASELINE_FILE_NAME);
    if (fs.existsSync(baselineFilePath)) return directoryPath;
  }
  return HUNGARY_COUNTY_MAP_SOURCE_DIRECTORY_CANDIDATES[0];
}

function toHungaryCountyMapData(genericMapData: SvgRegionMapData): HungaryCountyMapData {
  return {
    width: genericMapData.width,
    height: genericMapData.height,
    viewBox: genericMapData.viewBox,
    counties: genericMapData.regions.map((region) => ({
      countyCode: region.regionCode,
      sourcePathId: region.sourcePathId,
      pathData: region.pathData,
    })),
  };
}

export function getHungaryCountyMapData(): HungaryCountyMapData {
  if (cachedHungaryCountyMapData) return cachedHungaryCountyMapData;

  const genericMapData = loadSvgRegionMapData({
    datasetDirectory: resolveHungaryCountyMapSourceDirectory(),
    baselineSvgFileName: HUNGARY_COUNTY_MAP_BASELINE_FILE_NAME,
    highlightColorHex: HUNGARY_COUNTY_MAP_HIGHLIGHT_COLOR_HEX,
    regionCodeByVariantFileName: HUNGARY_COUNTY_VARIANT_FILE_TO_COUNTY_CODE,
    fallbackSvgFilePath: HUNGARY_COUNTY_MAP_FALLBACK_SVG_FILE_PATH,
    fallbackRegionCodeByPathId: HUNGARY_COUNTY_FALLBACK_PATH_ID_TO_COUNTY_CODE,
    viewBoxPadding: HUNGARY_COUNTY_MAP_VIEWBOX_PADDING,
  });

  cachedHungaryCountyMapData = toHungaryCountyMapData(genericMapData);
  return cachedHungaryCountyMapData;
}
