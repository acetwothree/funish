import express from 'express';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';

const __filename = new URL('', import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, "dist");

console.log('=== SIMPLE SERVER STARTING ===');
console.log('Port:', PORT);
console.log('Dist path:', distPath);

// Copy latest assets from dist/assets to public/assets on startup
const publicAssetsPath = path.join(__dirname, 'public/assets');
const distAssets = path.join(distPath, 'assets');
console.log('Copying latest assets to public/assets...');
if (!fs.existsSync(publicAssetsPath)) {
  fs.mkdirSync(publicAssetsPath, { recursive: true });
}
if (fs.existsSync(distAssets)) {
  fs.readdirSync(distAssets).forEach(file => {
    const srcFile = path.join(distAssets, file);
    const destFile = path.join(publicAssetsPath, file);
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied ${file} to public/assets`);
  });
  console.log('Assets copied successfully to public/assets');
} else {
  console.log('Dist assets folder not found!');
}

// Simple in-memory lobby storage (no Socket.io needed)
const lobbies = new Map();

function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Simple server is working!', 
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/create-lobby', express.json({type: '*/*'}), (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    
    const code = generateCode();
    const lobby = {
      code,
      players: [{ username, id: 'player1' }],
      createdAt: new Date().toISOString()
    };
    
    lobbies.set(code, lobby);
    console.log('Created lobby:', code);
    
    res.json({ success: true, code });
  } catch (error) {
    console.error('Create lobby error:', error);
    res.status(500).json({ error: 'Failed to create lobby' });
  }
});

app.get('/api/lobby/:code', (req, res) => {
  try {
    const { code } = req.params;
    const lobby = lobbies.get(code.toUpperCase());
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    res.json(lobby);
  } catch (error) {
    console.error('Get lobby error:', error);
    res.status(500).json({ error: 'Failed to get lobby' });
  }
});

app.post('/api/join-lobby', express.json({type: '*/*'}), (req, res) => {
  try {
    const { code, username } = req.body;
    if (!code || !username) {
      return res.status(400).json({ error: 'Code and username required' });
    }
    
    const lobby = lobbies.get(code.toUpperCase());
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    const newPlayer = { username, id: 'player' + Date.now() };
    lobby.players.push(newPlayer);
    lobbies.set(code.toUpperCase(), lobby);
    
    console.log('Player joined lobby:', code, username);
    res.json({ success: true, lobby });
  } catch (error) {
    console.error('Join lobby error:', error);
    res.status(500).json({ error: 'Failed to join lobby' });
  }
});

// Serve static files from build output
app.use(express.static(distPath));

// Serve assets from correct path
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Fallback to index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).send('API endpoint not found');
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('=== SIMPLE SERVER STARTED SUCCESSFULLY ===');
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving from: ${distPath}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
