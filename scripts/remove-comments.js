const fs = require('fs');
const path = require('path');

// Recursive function to get all files
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git' && file !== 'dist' && file !== 'build') {
        getFiles(filePath, fileList);
      }
    } else {
      if (/\.(ts|tsx|js)$/.test(file)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

function removeComments(content) {
  // Regex to match strings (double, single, backtick) OR comments (multi-line, single-line)
  // We capture strings in group 1, so we can preserve them.
  // We capture comments in group 2 (multi) and group 3 (single).
  const regex = /("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`)|(\/\*[\s\S]*?\*\/)|(\/\/.*)/g;
  
  return content.replace(regex, (match, string, multiLineComment, singleLineComment) => {
    if (string) {
      return string; // Preserve string
    }
    // It's a comment, return empty string (or newline for single line to be safe with ASI, though usually fine)
    return ''; 
  });
}

const rootDir = path.join(__dirname, '..');
const files = getFiles(rootDir);

console.log(`Found ${files.length} files. Removing comments...`);

let count = 0;
files.forEach(file => {
  // Skip this script itself
  if (file.includes('remove-comments.js')) return;

  const content = fs.readFileSync(file, 'utf8');
  const newContent = removeComments(content);
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    count++;
  }
});

console.log(`Removed comments from ${count} files.`);
