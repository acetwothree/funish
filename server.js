const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from dist folder
app.use(express.static(distPath));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'React app server running' });
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
