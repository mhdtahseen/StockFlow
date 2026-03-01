import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.resolve(__dirname, "../src/data/deviceCatalog.ts");
const outputPath = path.resolve(__dirname, "./seed_catalog.sql");

// Read the TS file
const raw = readFileSync(catalogPath, "utf-8");

// Extract just the object literal (strip types and export)
const startIdx = raw.indexOf("= {") + 2;
const endIdx = raw.lastIndexOf("};") + 1;
const objStr = raw.slice(startIdx, endIdx);

// Convert to valid JSON-ish:
let jsonStr = objStr
  .replace(/\/\/.*$/gm, "") // Remove single-line comments
  .replace(/(\s+)(\w+)(\s*:)/g, '$1"$2"$3') // Add quotes around keys
  .replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas

let catalog;
try {
  catalog = JSON.parse(jsonStr);
} catch (e) {
  console.error("JSON parse error:", e.message);
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    console.error("Around:", jsonStr.slice(Math.max(0, pos - 100), pos + 100));
  }
  process.exit(1);
}

// Generate SQL
const lines = [];
lines.push("-- ═══════════════════════════════════════════════════════");
lines.push("-- DEVICE CATALOG SEED DATA");
lines.push(`-- Generated at ${new Date().toISOString()}`);
lines.push("-- ═══════════════════════════════════════════════════════");
lines.push("");
lines.push("BEGIN;");
lines.push("");

let modelCount = 0;
let colorCount = 0;

for (const [brand, brandData] of Object.entries(catalog)) {
  const models = brandData.models || {};

  for (const [model, spec] of Object.entries(models)) {
    modelCount++;
    const storageArr = (spec.storage || [])
      .map((s) => `'${s.replace(/'/g, "''")}'`)
      .join(",");
    const ramArr = (spec.ram || [])
      .map((r) => `'${r.replace(/'/g, "''")}'`)
      .join(",");

    const safeBrand = brand.replace(/'/g, "''");
    const safeModel = model.replace(/'/g, "''");

    lines.push(`-- ${brand} > ${model}`);
    lines.push(`WITH ins AS (`);
    lines.push(`  INSERT INTO catalog_models (brand, model, storage, ram)`);
    lines.push(
      `  VALUES ('${safeBrand}', '${safeModel}', ARRAY[${storageArr}], ARRAY[${ramArr}])`,
    );
    lines.push(`  ON CONFLICT (brand, model) DO NOTHING`);
    lines.push(`  RETURNING id`);
    lines.push(`)`);

    const colors = spec.colors || [];
    if (colors.length > 0) {
      const colorValues = colors
        .map((c) => {
          colorCount++;
          const safeLabel = c.label.replace(/'/g, "''");
          const safeHex = c.hex.replace(/'/g, "''");
          return `((SELECT id FROM catalog_models WHERE brand = '${safeBrand}' AND model = '${safeModel}'), '${safeLabel}', '${safeHex}')`;
        })
        .join(",\n  ");

      lines.push(`INSERT INTO catalog_model_colors (model_id, label, hex)`);
      lines.push(`VALUES ${colorValues}`);
      lines.push(`ON CONFLICT (model_id, label) DO NOTHING;`);
    } else {
      lines.push(`SELECT 1 FROM ins;`);
    }

    lines.push("");
  }
}

lines.push("COMMIT;");
lines.push("");
lines.push(`-- Total: ${modelCount} models, ${colorCount} colors`);

writeFileSync(outputPath, lines.join("\n"));
console.log(`✅ Generated ${outputPath}`);
console.log(`   ${modelCount} models, ${colorCount} colors`);
