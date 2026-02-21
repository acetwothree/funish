import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = Number(process.env.PORT) || 3000;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const HOST = process.env.HOST || '0.0.0.0';
  const APP_URL = process.env.APP_URL || `http://${HOST}:${PORT}`;

  console.log(`Starting server in ${NODE_ENV} mode on ${HOST}:${PORT}`);
  console.log(`Application URL: ${APP_URL}`);

  // Game State Management
  const lobbies = new Map<string, any>();

  function generateCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Auto-join room if user connects with a room code
    socket.on("auto-join-room", ({ roomCode, username, playerId }) => {
      const lobbyCode = roomCode.toUpperCase();
      let lobby = lobbies.get(lobbyCode);
      if (!lobby) {
        socket.emit("error", "Lobby not found");
        return;
      }

      // Join the Socket.io room for this lobby
      socket.join(lobbyCode);
      
      // Store metadata on socket for easy retrieval
      (socket as any).playerId = playerId;
      (socket as any).lobbyCode = lobbyCode;

      // Add or update player in the lobby state
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

      // Broadcast update to all players in the room
      io.to(lobbyCode).emit("lobby-update", updateData);
      socket.emit("auto-joined", { success: true, roomCode: lobbyCode });
    });

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

      // Join the Socket.io room for this lobby
      socket.join(lobbyCode);
      
      // Store metadata on socket for easy retrieval
      (socket as any).playerId = playerId;
      (socket as any).lobbyCode = lobbyCode;

      // Add or update player in the lobby state
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

      // Broadcast update to all players in the room
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
          correctGuessers: [] // Track who guessed correctly this round
        }
      };
      
      lobbies.set(code, lobby);
      socket.emit("lobby-created", code);
    });

    socket.on("select-game", ({ code, game, playerId }) => {
      const lobbyCode = code.toUpperCase();
      const lobby = lobbies.get(lobbyCode);
      if (lobby && lobby.host === playerId) {
        lobby.selectedGame = game;
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
          // Shuffle players for the queue
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

    function startRoundTimer(lobbyCode: string) {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby || lobby.gameData.timerStarted) return;
      
      lobby.gameData.timerStarted = true;
      const interval = setInterval(() => {
        const currentLobby = lobbies.get(lobbyCode);
        if (!currentLobby || currentLobby.gameState !== "playing") {
          clearInterval(interval);
          return;
        }

        if (currentLobby.gameData.timer > 0) {
          currentLobby.gameData.timer--;
          if (currentLobby.gameData.timer === 30) {
            currentLobby.gameData.hintAvailable = true;
          }
          
          io.to(lobbyCode).emit("lobby-update", {
            players: Array.from(currentLobby.players.values()),
            gameState: currentLobby.gameState,
            selectedGame: currentLobby.selectedGame,
            settings: currentLobby.settings,
            gameData: currentLobby.gameData,
            hostId: currentLobby.host
          });
        } else {
          // Timer hit 0, but we wait for all guesses to be reviewed
          clearInterval(interval);
          io.to(lobbyCode).emit("lobby-update", {
            players: Array.from(currentLobby.players.values()),
            gameState: currentLobby.gameState,
            selectedGame: currentLobby.selectedGame,
            settings: currentLobby.settings,
            gameData: currentLobby.gameData,
            hostId: currentLobby.host
          });
        }
      }, 1000);
      (lobby as any).gameInterval = interval;
    }

    function handleNextRound(lobbyCode: string) {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby) return;

      // 1. Reveal the rule first
      lobby.gameData.revealing = true;
      io.to(lobbyCode).emit("lobby-update", {
        players: Array.from(lobby.players.values()),
        gameState: lobby.gameState,
        selectedGame: lobby.selectedGame,
        settings: lobby.settings,
        gameData: lobby.gameData,
        hostId: lobby.host
      });

      // 2. Wait 4 seconds then decide whether to show leaderboard or end game
      setTimeout(() => {
        const currentLobby = lobbies.get(lobbyCode);
        if (!currentLobby) return;

        currentLobby.gameData.revealing = false;

        if (currentLobby.gameData.currentRound < currentLobby.gameData.totalRounds) {
          // Show intermediate leaderboard
          currentLobby.gameData.transitioning = true;
          io.to(lobbyCode).emit("lobby-update", {
            players: Array.from(currentLobby.players.values()),
            gameState: currentLobby.gameState,
            selectedGame: currentLobby.selectedGame,
            settings: currentLobby.settings,
            gameData: currentLobby.gameData,
            hostId: currentLobby.host
          });

          // 3. Wait 5 more seconds then move to next round
          setTimeout(() => {
            const finalLobby = lobbies.get(lobbyCode);
            if (!finalLobby) return;

            finalLobby.gameData.currentRound++;
            finalLobby.gameData.ruleMakerIndex = (finalLobby.gameData.ruleMakerIndex + 1) % finalLobby.gameData.ruleMakerQueue.length;
            finalLobby.gameData.ruleMaker = finalLobby.gameData.ruleMakerQueue[finalLobby.gameData.ruleMakerIndex];
            finalLobby.gameData.rule = "";
            finalLobby.gameData.hint = "";
            finalLobby.gameData.hintAvailable = false;
            finalLobby.gameData.submissions = [];
            finalLobby.gameData.timer = 60;
            finalLobby.gameData.timerStarted = false;
            finalLobby.gameData.roundOver = false;
            finalLobby.gameData.revealing = false;
            finalLobby.gameData.correctGuessers = [];
            finalLobby.gameData.ruleGuesses = [];
            finalLobby.gameData.transitioning = false;

            if ((finalLobby as any).gameInterval) clearInterval((finalLobby as any).gameInterval);

            io.to(lobbyCode).emit("lobby-update", {
              players: Array.from(finalLobby.players.values()),
              gameState: finalLobby.gameState,
              selectedGame: finalLobby.selectedGame,
              settings: finalLobby.settings,
              gameData: finalLobby.gameData,
              hostId: finalLobby.host
            });
          }, 5000);
        } else {
          // End game immediately after reveal
          currentLobby.gameState = "game-over";
          currentLobby.gameData.transitioning = false;
          currentLobby.gameData.revealing = false;

          io.to(lobbyCode).emit("lobby-update", {
            players: Array.from(currentLobby.players.values()),
            gameState: currentLobby.gameState,
            selectedGame: currentLobby.selectedGame,
            settings: currentLobby.settings,
            gameData: currentLobby.gameData,
            hostId: currentLobby.host
          });
        }
      }, 4000);
    }

    socket.on("set-hint", ({ code, hint, playerId }) => {
      const lobbyCode = code.toUpperCase();
      const lobby = lobbies.get(lobbyCode);
      if (lobby && lobby.gameData.ruleMaker === playerId && lobby.gameData.hintAvailable) {
        if (hint.length > 50) return socket.emit("error", "Hint too long!");
        lobby.gameData.hint = hint;
        lobby.gameData.hintAvailable = false;
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

    socket.on("update-settings", ({ code, settings, playerId }) => {
      const lobbyCode = code.toUpperCase();
      const lobby = lobbies.get(lobbyCode);
      if (lobby && lobby.host === playerId) {
        lobby.settings = { ...lobby.settings, ...settings };
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

    socket.on("set-rule", ({ code, rule, playerId }) => {
      const lobbyCode = code.toUpperCase();
      const lobby = lobbies.get(lobbyCode);
      if (lobby && lobby.gameData.ruleMaker === playerId) {
        if (rule.length > 200) return socket.emit("error", "Rule too long!");
        lobby.gameData.rule = rule;
        startRoundTimer(lobbyCode);
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

    socket.on("submit-rule-guess", ({ code, guess, playerId }) => {
      const lobbyCode = code.toUpperCase();
      const lobby = lobbies.get(lobbyCode);
      if (lobby && lobby.gameState === "playing") {
        if (guess.length > 100) return socket.emit("error", "Guess too long!");
        const player = lobby.players.get(playerId);
        if (player && playerId !== lobby.gameData.ruleMaker) {
          // Only allow one guess per round
          const existing = lobby.gameData.ruleGuesses.find((g: any) => g.playerId === playerId);
          if (existing) return;

          lobby.gameData.ruleGuesses.push({
            playerId,
            username: player.username,
            guess,
            status: 'pending'
          });

          checkRoundEnd(lobbyCode);

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
    });

    function checkRoundEnd(lobbyCode: string) {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby) return;

      const guessers = Array.from(lobby.players.keys()).filter(id => id !== lobby.gameData.ruleMaker);
      
      // All guessers have had a word accepted
      const allWordsAccepted = guessers.length > 0 && guessers.every(id => 
        lobby.gameData.correctGuessers.includes(id)
      );

      if (allWordsAccepted && !lobby.gameData.roundOver) {
        lobby.gameData.roundOver = true;
        if ((lobby as any).gameInterval) {
          clearInterval((lobby as any).gameInterval);
        }
      }

      // Round ends only when all guessers have submitted a rule guess AND they have been reviewed
      const allReviewed = guessers.length > 0 && guessers.every(id => {
        const guess = lobby.gameData.ruleGuesses.find((g: any) => g.playerId === id);
        return guess && guess.status !== 'pending';
      });

      if (allReviewed) {
        handleNextRound(lobbyCode);
      }
    }

    socket.on("submit-entry", ({ code, text, playerId }) => {
      const lobbyCode = code.toUpperCase();
      const lobby = lobbies.get(lobbyCode);
      if (lobby && lobby.gameState === "playing") {
        if (text.length > 50) return socket.emit("error", "Word too long!");
        const player = lobby.players.get(playerId);
        if (player && playerId !== lobby.gameData.ruleMaker) {
          lobby.gameData.submissions.push({
            id: Math.random().toString(36).substr(2, 9),
            playerId: playerId,
            username: player.username,
            text,
            status: 'pending'
          });
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
    });

    socket.on("review-submission", ({ code, submissionId, status, playerId }) => {
      const lobbyCode = code.toUpperCase();
      const lobby = lobbies.get(lobbyCode);
      if (lobby && lobby.gameData.ruleMaker === playerId) {
        const sub = lobby.gameData.submissions.find((s: any) => s.id === submissionId);
        if (sub && sub.status === 'pending') {
          sub.status = status;
          if (status === 'accepted') {
            const player = lobby.players.get(sub.playerId);
            if (player) {
              // Scoring logic:
              // 1st person: 3 points
              // Others: 1 point
              // Rule maker: 3 points when someone guesses correctly (once per round)
              if (lobby.gameData.correctGuessers.length === 0) {
                player.score += 3;
                const ruleMaker = lobby.players.get(lobby.gameData.ruleMaker);
                if (ruleMaker) ruleMaker.score += 3;
              } else {
                player.score += 1;
              }
              lobby.gameData.correctGuessers.push(sub.playerId);
            }
          }

          checkRoundEnd(lobbyCode);

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
    });

    socket.on("end-game", ({ code, playerId }) => {
      const lobbyCode = code.toUpperCase();
      const lobby = lobbies.get(lobbyCode);
      if (lobby && lobby.host === playerId) {
        if ((lobby as any).gameInterval) clearInterval((lobby as any).gameInterval);
        lobby.gameState = "waiting";
        lobby.gameData = {
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
        };
        // Reset scores
        lobby.players.forEach((p: any) => p.score = 0);
        
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

    socket.on("review-rule-guess", ({ code, playerId, status, ruleMakerId }) => {
      const lobbyCode = code.toUpperCase();
      const lobby = lobbies.get(lobbyCode);
      if (lobby && lobby.gameData.ruleMaker === ruleMakerId) {
        const guess = lobby.gameData.ruleGuesses.find((g: any) => g.playerId === playerId);
        if (guess && guess.status === 'pending') {
          guess.status = status;
          if (status === 'accepted') {
            const player = lobby.players.get(playerId);
            if (player) player.score += 1; // Bonus point for guessing the rule
          }
          
          checkRoundEnd(lobbyCode);

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
    });
    socket.on("disconnect", () => {
      const playerId = (socket as any).playerId;
      const lobbyCode = (socket as any).lobbyCode;
      
      if (playerId && lobbyCode) {
        const lobby = lobbies.get(lobbyCode);
        if (lobby && lobby.players.has(playerId)) {
          const player = lobby.players.get(playerId);
          // Only remove if this was the last socket for this playerId
          // (In case of multiple tabs, which we don't really support but good to be safe)
          if (player.socketId === socket.id) {
            lobby.players.delete(playerId);
            if (lobby.players.size === 0) {
              lobbies.delete(lobbyCode);
            } else {
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
      }
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Wildcard route for direct room access (e.g., funnish.games/ABCD)
  app.get("/:roomCode", (req, res, next) => {
    const { roomCode } = req.params;
    // Skip if it looks like a file or API route
    if (roomCode.includes(".") || roomCode === "api") {
      return next();
    }
    
    // Validate room code format (4 characters, alphanumeric)
    if (!/^[A-Za-z0-9]{4}$/.test(roomCode)) {
      return next();
    }
    
    console.log(`Direct access to room: ${roomCode}`);
    
    if (NODE_ENV === "production") {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    } else {
      // In dev, Vite handles the routing
      next();
    }
  });

  // Vite middleware for development
  if (NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Direct room access: http://${HOST}:${PORT}/ABCD`);
  });
}

startServer();
