import express from 'express';
import path from 'path';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(process.cwd(), 'dist');

// Basic middleware
app.use(express.json());

// Debug route
app.get('/__debug/status', async (req, res) => {
  try {
    const fs = await import('fs');
    res.json({
      message: 'ES modules server is running!',
      workingDirectory: process.cwd(),
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

// Serve static files
app.use(express.static(distPath));

// Fallback to index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/__debug/')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`ES modules server running on port ${PORT}`);
  console.log(`Serving from: ${distPath}`);
});
