// Minimal IFC -> FRAG converter (Node script)
// How to run (debug ): `node tools/ifc-to-frag.js`
// Context : IFC = Industry Foundation Classes (BIM format), FRAG = ThatOpen's fragment format (optimized for web rendering).

import fs from 'node:fs';                          // Node standard library for file I/O (read/write bytes)
import path from 'node:path';                      // standard for path handling (joins, resolves absolute paths)
import { fileURLToPath } from 'node:url';          // Utility to derive __filename/__dirname in ESM (ECMAScript Modules)
import { IfcImporter } from '@thatopen/fragments'; // Converter class (library API) that turns IFC bytes -> FRAG bytes

const __filename = fileURLToPath(import.meta.url); // Resolve current file path from file:// URL (where am I?)
const __dirname = path.dirname(__filename);        // Directory of this script (base for relative paths)
const projectRootAbsPath = path.resolve(__dirname, '..'); // absolute path to my-threejs-app (project root)

const inputIfcModelPath = path.resolve(projectRootAbsPath, 'public/model/custom_psets.ifc');        // Input IFC model file path
const outputFragModelPath = path.resolve(projectRootAbsPath, 'public/fragments/custom_psets.frag'); // Output FRAG file path
const webIfcWasmDirectory = path.resolve(projectRootAbsPath, 'node_modules/web-ifc') + path.sep;    // Absolute directory to web-ifc WASM files

async function convertIfcToFrag() {                                             // Pipeline read -> convert -> write
  const inputIfcFileBytes = new Uint8Array(fs.readFileSync(inputIfcModelPath)); // Load IFC file into bytes (Uint8Array)
  const ifcImporter = new IfcImporter();                                        // Create importer (converter instance)
  ifcImporter.wasm.path = webIfcWasmDirectory;                                  // Configure path to web-ifc WASM runtime files
  ifcImporter.wasm.absolute = true;                                             // Indicate path is absolute on disk
  const outputFragFileBytes = await ifcImporter.process({ bytes: inputIfcFileBytes }); // Convert IFC -> FRAG (returns bytes)
  fs.mkdirSync(path.dirname(outputFragModelPath), { recursive: true });    // Ensure output folder exists
  fs.writeFileSync(outputFragModelPath, Buffer.from(outputFragFileBytes)); // Write FRAG bytes to file
  console.log('Wrote FRAG:', outputFragModelPath);                         // Success message with output path
}

convertIfcToFrag().catch((err) => {                                      // Error handling (fail fast with readable diagnostics)
  console.error('Conversion failed:', err);                              // Log full error object (stack/message)
  process.exit(1);                                                       // exit code (conventional CLI failure)
});
// @ts-check
