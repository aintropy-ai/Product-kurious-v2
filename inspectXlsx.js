import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function inspectXlsx(filePath) {
  console.log(`\n=== Inspecting ${path.basename(filePath)} ===`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  console.log(`Sheet name: ${sheetName}`);

  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Total rows: ${data.length}`);

  if (data.length > 0) {
    console.log('\nColumns:', Object.keys(data[0]));
    console.log('\nFirst row sample:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

// Inspect Squad file
const squadFile = path.join(__dirname, 'assets', 'KNN_enriched_metadata_K1_squad.xlsx');
inspectXlsx(squadFile);

// Inspect PubmedQA file
const pubmedqaFile = path.join(__dirname, 'assets', 'PUBMEDQA_Rag_results.xlsx');
inspectXlsx(pubmedqaFile);
