import fs from "node:fs";
import path from "node:path";

export type HungaryCountyPath = {
  maz: string;
  id: string;
  d: string;
};

const COUNTY_PATH_TO_MAZ: Record<string, string> = {
  path2230: "01", // Budapest
  path1331: "02", // Baranya
  path4896: "03", // Bacs-Kiskun
  path3097: "04", // Bekes
  path1349: "05", // Borsod-Abauj-Zemplen
  path4015: "06", // Csongrad-Csanad
  path7528: "07", // Fejer
  path2218: "08", // Gyor-Moson-Sopron
  path1315: "09", // Hajdu-Bihar
  path4022: "10", // Heves
  path4010: "11", // Jasz-Nagykun-Szolnok
  path2229: "12", // Komarom-Esztergom
  path5788: "13", // Nograd
  path3992: "14", // Pest
  path1337: "15", // Somogy
  path2293: "16", // Szabolcs-Szatmar-Bereg
  path7536: "17", // Tolna
  path2235: "18", // Vas
  path2221: "19", // Veszprem
  path2219: "20", // Zala
};

let cachedCountyPaths: HungaryCountyPath[] | null = null;

export function getHungaryCountyPaths(): HungaryCountyPath[] {
  if (cachedCountyPaths) return cachedCountyPaths;

  const svgPath = path.join(process.cwd(), "public", "images", "HU_counties_colored.svg");
  const svg = fs.readFileSync(svgPath, "utf8");
  const pathRegex = /<path\b([^>]*?)\/>/g;

  const out: HungaryCountyPath[] = [];
  let match: RegExpExecArray | null;
  while ((match = pathRegex.exec(svg))) {
    const attrs = match[1];
    const id = attrs.match(/\\bid=\"([^\"]+)\"/)?.[1];
    const d = attrs.match(/\\bd=\"([^\"]+)\"/)?.[1];
    if (!id || !d) continue;

    const maz = COUNTY_PATH_TO_MAZ[id];
    if (!maz) continue;
    out.push({ maz, id, d });
  }

  cachedCountyPaths = out;
  return out;
}
