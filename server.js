import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

console.log('=== SERVER STARTING ===');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('Directory:', __dirname);
const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, "dist");

console.log('Port:', PORT);
console.log('Dist path:', distPath);

// Copy assets to root for Hostinger static serving
const assetsPath = path.join(__dirname, 'assets');
console.log('Copying assets to root for Hostinger static serving...');
if (!fs.existsSync(assetsPath)) {
  fs.mkdirSync(assetsPath, { recursive: true });
}
const distAssets = path.join(distPath, 'assets');
if (fs.existsSync(distAssets)) {
  fs.readdirSync(distAssets).forEach(file => {
    const srcFile = path.join(distAssets, file);
    const destFile = path.join(assetsPath, file);
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied ${file} to root`);
  });
  console.log('Assets copied successfully');
} else {
  console.log('Dist assets folder not found!');
}

// Basic middleware
app.use(express.json());

// Debug route
app.get('/__debug/status', (req, res) => {
  try {
    res.json({
      message: 'Simple server is running!',
      workingDirectory: __dirname,
      distPath: distPath,
      distExists: fs.existsSync(distPath),
      distFiles: fs.existsSync(distPath) ? fs.readdirSync(distPath) : 'dist not found',
      indexExists: fs.existsSync(path.join(distPath, 'index.html')),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files from build output
app.use(express.static(distPath));

// Serve assets from correct path
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Fallback to index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/__debug/')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('=== SERVER STARTED SUCCESSFULLY ===');
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Serving from: ${distPath}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
