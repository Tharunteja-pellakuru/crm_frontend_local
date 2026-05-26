const fs = require('fs');
const path = require('path');

const listPath = path.join(__dirname, 'src/pages/clients/ClientList.jsx');
const content = fs.readFileSync(listPath, 'utf8');

// Find the start and end of the modal
const startIndex = content.indexOf('{showOnboardModal && createPortal(');
let endIndex = startIndex;
let braces = 0;
let foundStart = false;

for (let i = startIndex; i < content.length; i++) {
  if (content[i] === '{') {
    braces++;
    foundStart = true;
  } else if (content[i] === '}') {
    braces--;
  }

  if (foundStart && braces === 0) {
    endIndex = i + 1;
    break;
  }
}

const modalContent = content.substring(startIndex, endIndex);
fs.writeFileSync(path.join(__dirname, 'modal_extracted.txt'), modalContent);
console.log("Extracted modal content to modal_extracted.txt");
