console.log('Starting ALL requests test server...');
import { createServer } from 'http';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const app = (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n=== ${timestamp} ===`);
  console.log(`Request: ${req.method} ${req.url}`);
  console.log(`User-Agent: ${req.headers['user-agent'] || 'none'}`);
  console.log(`Working directory: ${process.cwd()}`);
  
  // List all files in current directory
  try {
    const files = readdirSync(process.cwd());
    console.log(`Files in working directory:`, files);
  } catch (e) {
    console.log(`Cannot read directory: ${e.message}`);
  }
  
  // Check for all possible index.html files
  const possibleIndexes = [
    join(process.cwd(), 'index.html'),
    join(process.cwd(), 'public', 'index.html'),
    join(process.cwd(), 'dist', 'index.html')
  ];
  
  console.log(`Index file checks:`);
  possibleIndexes.forEach(file => {
    const exists = existsSync(file);
    console.log(`  ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
    if (exists) {
      try {
        const content = readFileSync(file, 'utf8');
        const hasSrcMainTsx = content.includes('/src/main.tsx');
        const hasAssets = content.includes('/assets/');
        console.log(`    -> Contains /src/main.tsx: ${hasSrcMainTsx}`);
        console.log(`    -> Contains /assets/: ${hasAssets}`);
        console.log(`    -> First 100 chars: ${content.substring(0, 100)}`);
      } catch (e) {
        console.log(`    -> Error reading: ${e.message}`);
      }
    }
  });
  
  // Always respond with JSON to show we're the Node.js server
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'NODE.JS SERVER RESPONDED',
    timestamp,
    url: req.url,
    method: req.method,
    workingDirectory: process.cwd(),
    userAgent: req.headers['user-agent']
  }));
};

const port = process.env.PORT || 3000;
const server = createServer(app);
server.listen(port, '0.0.0.0', () => {
  console.log(`ALL requests test server listening on port ${port}`);
  console.log(`Working directory: ${process.cwd()}`);
});
