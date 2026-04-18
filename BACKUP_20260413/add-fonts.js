const fs = require('fs');
const path = require('path');
const dir = __dirname;
const pages = ['index.html','about.html','team.html','services.html','insights.html','careers.html','contact.html'];

// Google Fonts preconnect + link to add after <meta charset>
const fontLinks = `  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap"/>`;

pages.forEach(p => {
  const fp = path.join(dir, p);
  let content = fs.readFileSync(fp, 'utf8');

  // Check if already has fonts
  if (content.includes('fonts.googleapis.com')) {
    console.log('Already has fonts: ' + p);
    return;
  }

  // Insert after <meta charset line
  content = content.replace(
    /(<meta charset="UTF-8"\/>)/,
    `$1\n${fontLinks}`
  );

  fs.writeFileSync(fp, content, 'utf8');
  console.log('Added fonts: ' + p);
});
console.log('Done!');
