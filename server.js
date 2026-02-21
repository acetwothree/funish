const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Static server running' });
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).send('API endpoint not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Static server running on port ${PORT}`);
  console.log(`Serving from: ${__dirname}`);
});
