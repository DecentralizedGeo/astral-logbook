#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Create export directory
const exportDir = path.join('.next', 'export');
fs.mkdirSync(exportDir, { recursive: true });

// Update export-detail.json with proper content
const exportDetail = {
  "version": 1,
  "outDirectory": path.resolve('.next', 'export'),
  "success": true
};
fs.writeFileSync('.next/export-detail.json', JSON.stringify(exportDetail, null, 2));

// Create 404.html
const html404 = `<!DOCTYPE html>
<html>
<head>
    <title>404 - Page Not Found</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
</body>
</html>`;

// Create 500.html  
const html500 = `<!DOCTYPE html>
<html>
<head>
    <title>500 - Server Error</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>500 - Server Error</h1>
    <p>Something went wrong on our end.</p>
</body>
</html>`;

fs.writeFileSync(path.join(exportDir, '404.html'), html404);
fs.writeFileSync(path.join(exportDir, '500.html'), html500);

console.log('✅ Created export files for Vercel deployment');
console.log('  - export-detail.json');
console.log('  - export/404.html');
console.log('  - export/500.html');
