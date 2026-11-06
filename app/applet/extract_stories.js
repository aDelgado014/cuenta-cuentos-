import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const dir = './public/assets/aistudio';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

async function extract() {
  for (const file of files) {
    const filePath = path.join(dir, file);
    const dataBuffer = fs.readFileSync(filePath);
    try {
      const data = await pdf(dataBuffer);
      console.log(`=== FILE: ${file} ===`);
      console.log(data.text);
      console.log('\n===================================\n');
    } catch (err) {
      console.error(`Error reading ${file}:`, err.message);
    }
  }
}

extract();
