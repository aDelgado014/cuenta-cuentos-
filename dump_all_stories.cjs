const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const dir = './public/assets/aistudio';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

async function processAll() {
  const stories = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const data = fs.readFileSync(filePath);
    try {
      const parser = new PDFParse({ data });
      const textRes = await parser.getText();
      const infoRes = await parser.getInfo();
      
      stories.push({
        fileName: file,
        pdfPath: `/assets/aistudio/${file}`,
        pagesCount: infoRes.pages || 1,
        rawText: textRes.text,
      });
    } catch (e) {
      console.error('Error on file', file, e);
    }
  }

  console.log('Processed', stories.length, 'stories');
  fs.writeFileSync('./src/data/raw_extracted.json', JSON.stringify(stories, null, 2));
}

processAll();
