import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.resolve(__dirname, "./seed_catalog.sql");

const sql = readFileSync(sqlPath, "utf-8");

// Split by "-- [Brand] > [Model]" markers
const segments = sql.split(/-- .* > .*/);
const header = segments[0]; // BEGIN etc
const footer = segments[segments.length - 1].split("COMMIT;")[1] || ""; // Total count etc

const models = segments.slice(1);
const batchSize = 50;

console.log(`Total models to seed: ${models.length}`);

for (let i = 0; i < models.length; i += batchSize) {
  const batch = models.slice(i, i + batchSize);
  const query = "BEGIN;\n" + batch.join("\n") + "\nCOMMIT;";

  // I will output the index so I can manually call the tool or handle it.
  // But wait, the assistant can't call tools inside a running script.
  // So I'll just print the queries or use the assistant's flow.

  console.log(`--- BATCH ${i / batchSize + 1} ---`);
  console.log(query);
  console.log(`--- END BATCH ---`);
}
