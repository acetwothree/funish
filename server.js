import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('Directory:', __dirname);
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, "dist");

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

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Game state
const lobbies = new Map();

function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Socket handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-lobby', (data) => {
    const { username } = data;
    const code = generateCode();
    
    const lobby = {
      code,
      players: [{
        id: socket.id,
        username,
        isHost: true
      }],
      gameState: 'waiting',
      selectedGame: 'hidden-rule',
      settings: { roundsPerPlayer: 2 },
      gameData: null,
      hostId: socket.id,
      createdAt: new Date()
    };
    
    lobbies.set(code, lobby);
    socket.join(code);
    socket.emit('lobby-created', code);
    socket.emit('lobby-update', lobby);
    
    console.log(`Lobby created: ${code} by ${username}`);
  });

  socket.on('check-lobby', (code, callback) => {
    const exists = lobbies.has(code);
    callback(exists);
  });

  socket.on('auto-join-room', (data) => {
    const { roomCode, username, playerId } = data;
    const code = roomCode.toUpperCase();
    const lobby = lobbies.get(code);
    
    if (!lobby) {
      socket.emit('error', 'Lobby not found');
      return;
    }
    
    const player = {
      id: playerId,
      username,
      isHost: false
    };
    
    lobby.players.push(player);
    socket.join(code);
    socket.emit('auto-joined', { success: true, roomCode: code });
    io.to(code).emit('lobby-update', lobby);
    
    console.log(`${username} auto-joined lobby ${code}`);
  });

  socket.on('join-lobby', (data) => {
    const { code, username, playerId } = data;
    const lobby = lobbies.get(code);
    
    if (!lobby) {
      socket.emit('error', 'Lobby not found');
      return;
    }
    
    if (lobby.players.length >= 8) {
      socket.emit('error', 'Lobby is full');
      return;
    }
    
    const player = {
      id: playerId,
      username,
      isHost: false
    };
    
    lobby.players.push(player);
    socket.join(code);
    socket.emit('joined-lobby', lobby);
    io.to(code).emit('lobby-update', lobby);
    
    console.log(`${username} joined lobby ${code}`);
  });

  socket.on('start-game', (data) => {
    const { code, playerId } = data;
    const lobby = lobbies.get(code);
    
    if (!lobby || !lobby.players[0]?.isHost || lobby.players[0]?.id !== playerId) {
      socket.emit('error', 'Only the host can start the game');
      return;
    }
    
    lobby.gameState = 'playing';
    lobby.gameData = {
      ruleMaker: lobby.hostId,
      rule: '',
      hint: '',
      submissions: [],
      ruleGuesses: [],
      correctGuessers: [],
      currentPhase: 'rule-setting'
    };
    io.to(code).emit('game-started');
    io.to(code).emit('lobby-update', lobby);
    
    console.log(`Game started in lobby ${code}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from all lobbies
    for (const [code, lobby] of lobbies.entries()) {
      const playerIndex = lobby.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = lobby.players[playerIndex];
        lobby.players.splice(playerIndex, 1);
        
        // If host disconnects, close the lobby
        if (player.isHost) {
          lobbies.delete(code);
          io.to(code).emit('lobby-closed');
        } else {
          io.to(code).emit('lobby-update', lobby);
        }
        
        console.log(`${player.username} left lobby ${code}`);
        break;
      }
    }
  });
});

// Basic middleware
app.use(express.json());

// Debug route
app.get('/__debug/status', (req, res) => {
  try {
    res.json({
      message: 'Server with Socket.io is running!',
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

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('=== SERVER STARTED SUCCESSFULLY ===');
  console.log(`Server with Socket.io running on port ${PORT}`);
  console.log(`Serving from: ${distPath}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
