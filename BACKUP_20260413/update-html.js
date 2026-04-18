const fs = require('fs');
const path = require('path');

const directoryPath = __dirname;
const headInsertion = '  <link rel="stylesheet" href="css/consent.css"/>\n';
const bodyInsertion = '  <script src="js/consent.js"></script>\n';

fs.readdir(directoryPath, function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }
  
  files.forEach(function (file) {
    if (path.extname(file) === '.html') {
      const filePath = path.join(directoryPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Insert CSS if not already present
      if (!content.includes('css/consent.css')) {
        // Find </head> and insert before
        content = content.replace('</head>', headInsertion + '</head>');
        modified = true;
      }

      // Insert JS if not already present
      if (!content.includes('js/consent.js')) {
        // Find <script src="js/lenis.min.js"></script> and insert before
        let lenisScriptNode = '<script src="js/lenis.min.js"></script>';
        if (content.includes(lenisScriptNode)) {
          content = content.replace(lenisScriptNode, bodyInsertion + '  ' + lenisScriptNode);
        } else {
          // fallback to </body>
          content = content.replace('</body>', bodyInsertion + '</body>');
        }
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  });
});
