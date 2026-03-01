import { deviceCatalog } from "../src/data/deviceCatalog.ts";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, "./seed_catalog.sql");

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

for (const [brand, brandData] of Object.entries(deviceCatalog)) {
  const models = (brandData as any).models || {};

  for (const [model, spec] of Object.entries(models)) {
    modelCount++;
    const s = spec as any;
    const storageArr = (s.storage || [])
      .map((v: string) => `'${v.replace(/'/g, "''")}'`)
      .join(",");
    const ramArr = (s.ram || [])
      .map((v: string) => `'${v.replace(/'/g, "''")}'`)
      .join(",");

    const safeBrand = brand.replace(/'/g, "''");
    const safeModel = model.replace(/'/g, "''");

    lines.push(`-- ${brand} > ${model}`);
    lines.push(`WITH ins AS (`);
    lines.push(`  INSERT INTO catalog_models (brand, model, storage, ram)`);
    lines.push(
      `  VALUES ('${safeBrand}', '${safeModel}', ARRAY[${storageArr}]::text[], ARRAY[${ramArr}]::text[])`,
    );
    lines.push(
      `  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram`,
    );
    lines.push(`  RETURNING id`);
    lines.push(`)`);

    const colors = s.colors || [];
    if (colors.length > 0) {
      const colorValues = colors
        .map((c: any) => {
          colorCount++;
          const safeLabel = c.label.replace(/'/g, "''");
          const safeHex = c.hex.replace(/'/g, "''");
          return `((SELECT id FROM ins), '${safeLabel}', '${safeHex}')`;
        })
        .join(",\n  ");

      lines.push(`INSERT INTO catalog_model_colors (model_id, label, hex)`);
      lines.push(`VALUES ${colorValues}`);
      lines.push(`ON CONFLICT (model_id, label) DO NOTHING;`);
    } else {
      lines.push(`SELECT id FROM ins;`);
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
