import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const httpServer = createServer(app);
const distPath = path.join(__dirname, "dist");

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = Number(process.env.PORT) || 3000;

// Game state
const lobbies = new Map();

function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Socket handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createLobby', (data) => {
    const code = generateCode();
    const lobby = {
      code,
      players: [{ id: socket.id, ...data }],
      host: socket.id,
      settings: {
        maxPlayers: 8,
        rounds: 5,
        timer: 60
      },
      gameData: null
    };
    lobbies.set(code, lobby);
    socket.join(code);
    socket.emit('lobbyCreated', { code, lobby });
    io.to(code).emit('lobbyUpdate', lobby);
  });

  socket.on('joinLobby', ({ code, player }) => {
    const lobby = lobbies.get(code);
    if (lobby && lobby.players.length < lobby.settings.maxPlayers) {
      lobby.players.push({ id: socket.id, ...player });
      socket.join(code);
      socket.emit('joinedLobby', { code, lobby });
      io.to(code).emit('lobbyUpdate', lobby);
    } else {
      socket.emit('joinError', 'Invalid code or lobby full');
    }
  });

  socket.on('startGame', ({ code }) => {
    const lobby = lobbies.get(code);
    if (lobby && lobby.host === socket.id) {
      if (lobby.players.length < 2) {
        socket.emit('error', 'Need at least 2 players to start!');
        return;
      }
      lobby.gameData = {
        currentRound: 1,
        totalRounds: lobby.settings.rounds,
        timer: lobby.settings.timer,
        phase: 'playing'
      };
      io.to(code).emit('gameStarted', lobby);
      startRoundTimer(code, lobby);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const [code, lobby] of lobbies.entries()) {
      lobby.players = lobby.players.filter(p => p.id !== socket.id);
      if (lobby.players.length === 0) {
        lobbies.delete(code);
      } else {
        io.to(code).emit('lobbyUpdate', lobby);
      }
    }
  });
});

function startRoundTimer(code, lobby) {
  const timer = setInterval(() => {
    lobby.gameData.timer--;
    io.to(code).emit('timerUpdate', lobby.gameData.timer);
    
    if (lobby.gameData.timer <= 0) {
      clearInterval(timer);
      lobby.gameData.phase = 'ended';
      io.to(code).emit('roundEnded', lobby);
    }
  }, 1000);
}

// API routes
app.use(express.json());

// Serve static files from dist
app.use(express.static(distPath));

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Room code route
app.get("/:roomCode", (req, res) => {
  const { roomCode } = req.params;
  if (/^[A-Za-z0-9]{4}$/.test(roomCode)) {
    return res.sendFile(path.join(distPath, "index.html"));
  }
  return res.status(404).send("Invalid room code");
});

// SPA fallback (exclude API routes)
app.get("*", (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/__debug/')) {
    return res.status(404).send('Endpoint not found');
  }
  res.sendFile(path.join(distPath, "index.html"));
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving from: ${distPath}`);
});
