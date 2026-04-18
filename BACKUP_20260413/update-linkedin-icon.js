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

const newHtml = `<div class="footer-socials">
            <a href="https://linkedin.com/company/placeholder" target="_blank" rel="noopener" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
          </div>`;

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the simple text link with the actual SVG icons box
  const oldLink = '<a href="https://linkedin.com/company/placeholder" target="_blank" rel="noopener">LinkedIn ↗</a>';
  const oldLinkAlt = '<a href="https://linkedin.com/company/placeholder" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>';
  
  if (content.includes(oldLink)) {
    content = content.replace(oldLink, newHtml);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else if (content.includes(oldLinkAlt)) {
    content = content.replace(oldLinkAlt, newHtml);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    // maybe it was formatted differently?
    console.log(`Could not find old link in ${file}`);
  }
}
