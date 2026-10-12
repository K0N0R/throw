import fs from 'node:fs/promises';
import path from 'path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// The folder where your static files are located
const staticFolder = path.join(__dirname, 'frontend/assets');
// The output file for the preload config
const outputFile = path.join(__dirname, 'frontend/preload-config.json');

// Function to recursively collect file paths
async function collectFilePaths(dir, fileList = []) {
    const files = await fs.readdir(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
            // Recursively collect files from subdirectories
            await collectFilePaths(filePath, fileList);
        } else {
            // Store the relative path to the file
            fileList.push(path.relative(staticFolder, filePath).replace(/\\/g, '/'));
        }
    }

    return fileList;
}

// Generate the preload config
export async function generatePreloadConfig() {
    const allFilePaths = await collectFilePaths(staticFolder);
    const filteredFilePaths = allFilePaths.filter((i) => {
        if (i.includes('.html') || i.includes('.css')) {
            return false;
        }
        if (i.includes('.png')) {
            return !allFilePaths.includes(
                i
                    .replace('_2', '')
                    .replace('_3', '')
                    .replace('_4', '')
                    .replace('_5', '')
                    .replace('.png', '.json'),
            );
        }
        return true;
    });

    // Write the array of file paths to preload-config.json
    await fs.writeFile(outputFile, JSON.stringify(filteredFilePaths, null, 2));

    console.log(`Preload config created at: ${outputFile}`);
}
