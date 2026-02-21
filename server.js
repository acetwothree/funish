const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

// Copy assets to root on startup (for Hostinger static serving)
const assetsPath = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsPath)) {
  console.log('Copying assets to root for Hostinger static serving...');
  fs.mkdirSync(assetsPath, { recursive: true });
  const distAssets = path.join(distPath, 'assets');
  if (fs.existsSync(distAssets)) {
    fs.readdirSync(distAssets).forEach(file => {
      fs.copyFileSync(
        path.join(distAssets, file),
        path.join(assetsPath, file)
      );
    });
    console.log('Assets copied successfully');
  }
}

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'React app server running' });
});

// Root route - serve dist/index.html explicitly (highest priority)
app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Debug route to show dist contents
app.get('/debug', (req, res) => {
  const fs = require('fs');
  const files = fs.readdirSync(distPath);
  const assets = fs.existsSync(path.join(distPath, 'assets')) ? fs.readdirSync(path.join(distPath, 'assets')) : [];
  res.json({
    distPath,
    files,
    assets,
    workingDirectory: __dirname
  });
});

// Serve static files from dist folder (after explicit routes)
app.use(express.static(distPath));

// Room code route
app.get('/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  if (/^[A-Za-z0-9]{4}$/.test(roomCode)) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  return res.status(404).send('Invalid room code');
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/debug')) {
    return res.status(404).send('API endpoint not found');
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`React app server running on port ${PORT}`);
  console.log(`Serving from: ${distPath}`);
  console.log(`Debug endpoint: /debug`);
});
