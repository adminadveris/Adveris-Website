const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'about.html',
  'services.html',
  'team.html',
  'insights.html',
  'careers.html',
  'contact.html'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if LinkedIn already exists to avoid duplicates
  if (content.includes('LinkedIn ↗')) {
    console.log(`LinkedIn already in ${file}`);
    continue;
  }
  
  // Regex to find the end of the Contact column
  const regex = /(<\/div>\s*<\/div>\s*<div class="footer-bottom">)/;
  
  if (regex.test(content)) {
    content = content.replace(regex, `<a href="https://linkedin.com/company/placeholder" target="_blank" rel="noopener">LinkedIn ↗</a>\n        $1`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    // Some files might have different formatting, let's try a fallback
    const fallbackRegex = /(<div class="footer-col">\s*<h4>Contact.*?<\/a>\s*)(<\/div>)/is;
    if (fallbackRegex.test(content)) {
      content = content.replace(fallbackRegex, `$1<a href="https://linkedin.com/company/placeholder" target="_blank" rel="noopener">LinkedIn ↗</a>\n        $2`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file} via fallback`);
    } else {
      console.log(`Failed to find insertion point in ${file}`);
    }
  }
}
