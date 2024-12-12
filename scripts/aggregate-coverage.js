// coverage-merge.js
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const child_process = require("node:child_process");

// Configuration
const config = {
  // Pattern to match coverage-final.json files in all packages
  coveragePattern: "**/coverage/coverage-final.json",
  // Output directory for merged coverage
  outputDir: "./coverage",
  // Output filename for merged report (Codecov looks for coverage.json by default)
  outputFile: "coverage.json",
};

// Create output directory if it doesn't exist
if (fs.existsSync(config.outputDir)) {
  // remove
  fs.rmSync(config.outputDir, { recursive: true });
}

fs.mkdirSync(config.outputDir, { recursive: true });
// Find all coverage files
const coverageFiles = glob.sync(config.coveragePattern);

if (coverageFiles.length === 0) {
  console.error("No coverage files found!");
  process.exit(1);
}

console.log(`Found ${coverageFiles.length} coverage files`);
console.log(coverageFiles);

// copy files into outputDir
// each coverage file will be renamed to coverage-<count>.json

let counter = 0;
for (const coverageFile of coverageFiles) {
  const outputFile = path.join(config.outputDir, `coverage-${counter}.json`);
  fs.copyFileSync(coverageFile, outputFile);
  counter++;
  console.log(`Copied ${coverageFile} to ${outputFile}`);
}

// run nyc merge command
child_process.execSync(
  `pnpm nyc merge ${config.outputDir} ${path.join(config.outputDir, config.outputFile)}`,
  { stdio: "inherit" },
);

// remove copied files
for (let i = 0; i < counter; i++) {
  fs.rmSync(path.join(config.outputDir, `coverage-${i}.json`));
}
