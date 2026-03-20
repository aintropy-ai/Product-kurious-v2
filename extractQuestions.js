import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractQuestionsFromXlsx(filePath, outputPath, columnName = 'Question', count = 50) {
  try {
    console.log(`Reading ${filePath}...`);

    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} total rows`);

    // Extract questions
    const questions = data
      .map(row => row[columnName])
      .filter(q => q && typeof q === 'string' && q.trim().length > 0);

    console.log(`Found ${questions.length} questions in column "${columnName}"`);

    // Shuffle and select random questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // Write to file with special delimiter for multi-line questions
    fs.writeFileSync(outputPath, selected.join('\n---\n'), 'utf-8');

    console.log(`Extracted ${selected.length} questions to ${outputPath}`);
    return selected.length;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Extract Squad questions
const squadFile = path.join(__dirname, 'assets', 'KNN_enriched_metadata_K1_squad.xlsx');
const squadOutput = path.join(__dirname, 'assets', 'squad_questions_preloaded.txt');
extractQuestionsFromXlsx(squadFile, squadOutput, 'question', 50);

// Extract PubmedQA questions
const pubmedqaFile = path.join(__dirname, 'assets', 'PUBMEDQA_Rag_results.xlsx');
const pubmedqaOutput = path.join(__dirname, 'assets', 'pubmedqa_questions_preloaded.txt');
extractQuestionsFromXlsx(pubmedqaFile, pubmedqaOutput, 'question', 50);

// Extract ChemRAG questions
const chemragFile = path.join(__dirname, 'assets', 'chemrag_examples.xlsx');
const chemragOutput = path.join(__dirname, 'assets', 'chemrag_questions_preloaded.txt');
extractQuestionsFromXlsx(chemragFile, chemragOutput, 'question', 50);

console.log('\nDone!');
