import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const version = {
    version: new Date().getTime().toString(),
    timestamp: new Date().toISOString()
};

const publicDir = path.join(__dirname, 'public');
const versionFilePath = path.join(publicDir, 'version.json');

// Ensure public dir exists
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

fs.writeFileSync(versionFilePath, JSON.stringify(version, null, 2));

console.log(`Generated version.json: ${version.version} at ${versionFilePath}`);
