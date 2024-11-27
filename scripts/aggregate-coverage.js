const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packagesDir = path.resolve(__dirname, '../packages');
const coverageDir = path.resolve(__dirname, '../coverage');
const mergedCoverageFile = path.join(coverageDir, 'coverage-final.json');

if (!fs.existsSync(coverageDir)) {
  fs.mkdirSync(coverageDir);
}

const coverageFiles = [];

fs.readdirSync(packagesDir).forEach(packageName => {
  const packageDir = path.join(packagesDir, packageName);
  const packageCoverageFile = path.join(packageDir, 'coverage', 'coverage-final.json');

  if (fs.existsSync(packageCoverageFile)) {
    coverageFiles.push(packageCoverageFile);
  }
});

if (coverageFiles.length === 0) {
  console.log('No coverage files found.');
  process.exit(0);
}

const mergeCommand = `npx nyc merge ${coverageFiles.join(' ')} -o ${mergedCoverageFile}`;
execSync(mergeCommand);

console.log(`Merged coverage report saved to ${mergedCoverageFile}`);
