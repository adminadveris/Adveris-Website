const fs = require('fs');
const path = require('path');
const dir = __dirname;
const pages = ['index.html','about.html','team.html','services.html','insights.html','careers.html','contact.html'];

// Lenis CDN script — must go before main.js
const lenisScript = `  <script src="https://unpkg.com/@studio-freight/lenis@1.0.45/dist/lenis.min.js"></script>`;

pages.forEach(p => {
  const fp = path.join(dir, p);
  let content = fs.readFileSync(fp, 'utf8');

  if (content.includes('lenis')) {
    console.log('Already has Lenis: ' + p);
    return;
  }

  // Insert Lenis before the closing </body> but before main.js
  content = content.replace(
    /(<script src="js\/main\.js">)/,
    `${lenisScript}\n  $1`
  );

  fs.writeFileSync(fp, content, 'utf8');
  console.log('Added Lenis: ' + p);
});
console.log('Done!');
