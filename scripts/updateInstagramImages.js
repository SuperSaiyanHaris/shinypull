import { readFileSync, writeFileSync } from 'fs';

// Read the seed file
const filePath = './scripts/seedInstagram.js';
let content = readFileSync(filePath, 'utf-8');

// Instagram gradient colors for avatars
const colors = ['e1306c', 'fd1d1d', 'f77737', 'fcaf45', '833ab4', 'c13584', 'd62976', 'fa7e1e'];
let colorIndex = 0;

//Replace all Instagram CDN URLs with UI Avatars
content = content.replace(
  /image: 'https:\/\/scontent-[^']+'/g,
  (match) => {
    const color = colors[colorIndex % colors.length];
    colorIndex++;
    // Extract display name from the line above
    const lines = content.substring(0, content.indexOf(match)).split('\n');
    const lastLine = lines[lines.length - 1];
    const nameMatch = lastLine.match(/displayName: '([^']+)'/);
    if (nameMatch) {
      const name = nameMatch[1].replace(/'/g, '').replace(/ /g, '+');
      return `image: 'https://ui-avatars.com/api/?name=${name}&size=200&bold=true&background=${color}&color=fff'`;
    }
    return match;
  }
);

// Write back
writeFileSync(filePath, content);
console.log('✅ Updated all Instagram profile images to use UI Avatars');
