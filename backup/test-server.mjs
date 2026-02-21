console.log('Starting test server...');
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const app = (req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  console.log(`Headers:`, req.headers);
  
  // Try to serve index.html to see what we get
  if (req.url === '/' || req.url === '/index.html') {
    const indexPath = join(process.cwd(), 'index.html');
    const publicIndexPath = join(process.cwd(), 'public', 'index.html');
    const distIndexPath = join(process.cwd(), 'dist', 'index.html');
    
    console.log(`Checking index files:`);
    console.log(`  Root index.html exists: ${existsSync(indexPath)}`);
    console.log(`  Public index.html exists: ${existsSync(publicIndexPath)}`);
    console.log(`  Dist index.html exists: ${existsSync(distIndexPath)}`);
    
    // Try root index.html first
    if (existsSync(indexPath)) {
      const content = readFileSync(indexPath, 'utf8');
      console.log(`Serving root index.html (first 200 chars):`, content.substring(0, 200));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }
  }
  
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Request received: ${req.method} ${req.url}\nWorking dir: ${process.cwd()}`);
};

const port = process.env.PORT || 3000;
const server = createServer(app);
server.listen(port, '0.0.0.0', () => {
  console.log(`Test server listening on port ${port}`);
  console.log(`Working directory: ${process.cwd()}`);
});
