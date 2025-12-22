const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../Vendor and Admin add property and pricing details.xlsx');
const outputPath = path.join(__dirname, 'excel_content.json');

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetNames = workbook.SheetNames;

const result = {};

sheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    result[sheetName] = XLSX.utils.sheet_to_json(sheet);
});

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`Written to ${outputPath}`);
