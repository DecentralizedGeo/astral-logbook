#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Create export directory
const exportDir = path.join('.next', 'export');
fs.mkdirSync(exportDir, { recursive: true });

// Create export-detail.json
fs.writeFileSync('.next/export-detail.json', '{}');

// Create 404.html
const html404 = `<!DOCTYPE html>
<html>
<head>
    <title>404 - Page Not Found</title>
</head>
<body>
    <h1>404 - Page Not Found</h1>
</body>
</html>`;

fs.writeFileSync(path.join(exportDir, '404.html'), html404);

console.log('✅ Created export files for Vercel deployment');
