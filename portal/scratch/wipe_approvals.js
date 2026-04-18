const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove Status Badges
const statusRegex = /\{editingId && \(\s*<div style=\{\{ display: 'flex', alignItems: 'center', gap: 8 \}\}>\s*<span style=\{\{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.4 \}\}>STATUS<\/span>[\s\S]*?<\/span>\s*<\/div>\s*\)\}/g;
content = content.replace(statusRegex, '');

// 2. Remove Approval Button Blocks
const buttonBlockRegex = /\{editingId && isAdmin && \([\s\S]*?btn-batch--approve[\s\S]*?btn-batch--reject[\s\S]*?\)\}/g;
content = content.replace(buttonBlockRegex, '');

// 3. Fix gridTemplateColumns to '1fr'
const gridRegex = /gridTemplateColumns: editingId && isAdmin \? '1fr 1fr' : '1fr'/g;
content = content.replace(gridRegex, "gridTemplateColumns: '1fr'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Dashboard.tsx surgically updated.');
