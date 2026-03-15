import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const TARGET_EXTENSIONS = new Set([".ts", ".tsx"]);

const FORBIDDEN_PATTERNS = [
  { name: "inline-style-prop", regex: /\bstyle\s*=\s*\{/g },
  { name: "css-properties-type", regex: /\bCSSProperties\b/g },
  { name: "css-properties-cast", regex: /\bas\s+CSSProperties\b/g },
];

function collectFiles(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function findViolations(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const violations = [];

  for (const rule of FORBIDDEN_PATTERNS) {
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      if (rule.regex.test(lines[lineIndex])) {
        violations.push({
          rule: rule.name,
          line: lineIndex + 1,
          text: lines[lineIndex].trim(),
        });
      }
      rule.regex.lastIndex = 0;
    }
  }

  return violations;
}

function main() {
  const files = collectFiles(SRC_DIR);
  const allViolations = [];

  for (const filePath of files) {
    const violations = findViolations(filePath);
    for (const violation of violations) {
      allViolations.push({ filePath, ...violation });
    }
  }

  if (allViolations.length === 0) {
    console.log("Style rule check passed: no inline style patterns found in src.");
    return;
  }

  console.error("Style rule violations detected:");
  for (const violation of allViolations) {
    const relativePath = path.relative(ROOT, violation.filePath);
    console.error(`- ${relativePath}:${violation.line} [${violation.rule}] ${violation.text}`);
  }
  process.exit(1);
}

main();
