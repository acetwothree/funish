import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
const PORT = Number(process.env.PORT) || 3000;
const lobbies = new Map();
function generateCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("check-lobby", (code, callback) => {
        const exists = lobbies.has(code.toUpperCase());
        callback(exists);
    });
    socket.on("join-lobby", ({ code, username, playerId }) => {
        const lobbyCode = code.toUpperCase();
        let lobby = lobbies.get(lobbyCode);
        if (!lobby) {
            socket.emit("error", "Lobby not found");
            return;
        }
        socket.join(lobbyCode);
        socket.playerId = playerId;
        socket.lobbyCode = lobbyCode;
        lobby.players.set(playerId, {
            id: playerId,
            socketId: socket.id,
            username,
            score: 0,
            ready: true
        });
        const updateData = {
            players: Array.from(lobby.players.values()),
            gameState: lobby.gameState,
            selectedGame: lobby.selectedGame,
            settings: lobby.settings,
            gameData: lobby.gameData,
            hostId: lobby.host
        };
        io.to(lobbyCode).emit("lobby-update", updateData);
    });
    socket.on("create-lobby", ({ username, playerId }) => {
        const code = generateCode();
        const lobby = {
            code,
            host: playerId,
            players: new Map(),
            gameState: "waiting",
            selectedGame: "hidden-rule",
            settings: {
                maxPlayers: 8,
                roundTime: 60,
                roundsPerPlayer: 1
            },
            gameData: {
                ruleMaker: null,
                ruleMakerIndex: -1,
                ruleMakerQueue: [],
                currentRound: 0,
                totalRounds: 0,
                rule: "",
                hint: "",
                hintAvailable: false,
                submissions: [],
                timer: 60,
                correctGuessers: []
            }
        };
        lobbies.set(code, lobby);
        socket.emit("lobby-created", code);
    });
    socket.on("start-game", ({ code, playerId }) => {
        const lobbyCode = code.toUpperCase();
        const lobby = lobbies.get(lobbyCode);
        if (lobby && lobby.host === playerId) {
            if (lobby.players.size < 2) {
                socket.emit("error", "Need at least 2 players to start!");
                return;
            }
            lobby.gameState = "playing";
            if (lobby.selectedGame === "hidden-rule") {
                const playerIds = Array.from(lobby.players.keys());
                lobby.gameData.ruleMakerQueue = playerIds.sort(() => Math.random() - 0.5);
                lobby.gameData.ruleMakerIndex = 0;
                lobby.gameData.ruleMaker = lobby.gameData.ruleMakerQueue[0];
                lobby.gameData.currentRound = 1;
                lobby.gameData.totalRounds = lobby.gameData.ruleMakerQueue.length * (lobby.settings.roundsPerPlayer || 1);
                lobby.gameData.submissions = [];
                lobby.gameData.rule = "";
                lobby.gameData.hint = "";
                lobby.gameData.hintAvailable = false;
                lobby.gameData.timer = 60;
                lobby.gameData.timerStarted = false;
                lobby.gameData.roundOver = false;
                lobby.gameData.revealing = false;
                lobby.gameData.correctGuessers = [];
                lobby.gameData.ruleGuesses = [];
                lobby.gameData.transitioning = false;
            }
            io.to(lobbyCode).emit("lobby-update", {
                players: Array.from(lobby.players.values()),
                gameState: lobby.gameState,
                selectedGame: lobby.selectedGame,
                settings: lobby.settings,
                gameData: lobby.gameData,
                hostId: lobby.host
            });
        }
    });
    socket.on("disconnect", () => {
        const playerId = socket.playerId;
        const lobbyCode = socket.lobbyCode;
        if (playerId && lobbyCode) {
            const lobby = lobbies.get(lobbyCode);
            if (lobby && lobby.players.has(playerId)) {
                lobby.players.delete(playerId);
                if (lobby.players.size === 0) {
                    lobbies.delete(lobbyCode);
                }
                else {
                    if (lobby.host === playerId) {
                        lobby.host = Array.from(lobby.players.keys())[0];
                    }
                    io.to(lobbyCode).emit("lobby-update", {
                        players: Array.from(lobby.players.values()),
                        gameState: lobby.gameState,
                        selectedGame: lobby.selectedGame,
                        settings: lobby.settings,
                        gameData: lobby.gameData,
                        hostId: lobby.host
                    });
                }
            }
        }
    });
});
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
app.get('/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    if (/^[A-Za-z0-9]{4}$/.test(roomCode)) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    else {
        res.status(404).send('Invalid room code');
    }
});
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
