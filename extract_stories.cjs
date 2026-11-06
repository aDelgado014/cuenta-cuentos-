const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const dir = './public/assets/aistudio';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

async function extract() {
  for (const file of files) {
    const filePath = path.join(dir, file);
    const dataBuffer = fs.readFileSync(filePath);
    try {
      const data = await pdfParse(dataBuffer);
      console.log(`=== FILE: ${file} ===`);
      console.log(`Title: ${data.text.split('\n')[0]}`);
      console.log(`Pages: ${data.numpages}`);
      console.log(`Text preview: ${data.text.slice(0, 300)}...`);
      console.log('\n-----------------------------------\n');
    } catch (err) {
      console.error(`Error reading ${file}:`, err.message);
    }
  }
}

extract();
