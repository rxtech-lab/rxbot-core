// coverage-merge.js
const fs = require("fs");
const path = require("path");
const glob = require("glob");

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
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Find all coverage files
const coverageFiles = glob.sync(config.coveragePattern);

if (coverageFiles.length === 0) {
  console.error("No coverage files found!");
  process.exit(1);
}

console.log(`Found ${coverageFiles.length} coverage files`);

// Merge coverage data
const mergedCoverage = coverageFiles.reduce((merged, file) => {
  const coverage = JSON.parse(fs.readFileSync(file, "utf8"));

  Object.entries(coverage).forEach(([filePath, fileData]) => {
    // Normalize file paths to be relative to root
    const normalizedPath = path.relative(
      process.cwd(),
      path.resolve(path.dirname(file), "..", "..", filePath),
    );

    // Skip if we already have coverage for this file with more statements covered
    if (
      merged[normalizedPath] &&
      getStatementsCovered(merged[normalizedPath]) >
        getStatementsCovered(fileData)
    ) {
      return;
    }

    merged[normalizedPath] = {
      ...fileData,
      path: normalizedPath,
    };
  });

  return merged;
}, {});

// Helper function to count covered statements
function getStatementsCovered(fileData) {
  return Object.values(fileData.s).filter((count) => count > 0).length;
}

// Write merged coverage to file
const outputPath = path.join(config.outputDir, config.outputFile);
fs.writeFileSync(outputPath, JSON.stringify(mergedCoverage, null, 2));

console.log(`Merged coverage written to ${outputPath}`);
