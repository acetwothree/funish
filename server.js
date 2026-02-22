const express = require('express');
const { createServer } = require('http');
const path = require('path');
const fs = require('fs');

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
  console.log('Health check hit at:', new Date().toISOString());
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit at:', new Date().toISOString());
  res.json({ 
    message: 'Simple server is working!', 
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/create-lobby', express.json({type: '*/*'}), (req, res) => {
  try {
    console.log('Create lobby request received at:', new Date().toISOString());
    console.log('Request body:', req.body);
    
    const { username, playerId } = req.body;
    if (!username) {
      console.log('Error: Username required');
      return res.status(400).json({ error: 'Username required' });
    }
    
    const code = generateCode();
    // Use the player ID from browser, or generate a new one
    const finalPlayerId = playerId || 'player_' + Math.random().toString(36).substring(2, 15);
    const lobby = {
      code,
      players: [{ username, id: finalPlayerId }],
      createdAt: new Date().toISOString()
    };
    
    lobbies.set(code, lobby);
    console.log('Created lobby:', code);
    console.log('Host player ID:', finalPlayerId);
    console.log('All lobbies:', Array.from(lobbies.keys()));
    
    res.json({ success: true, code, playerId: finalPlayerId });
  } catch (error) {
    console.error('Create lobby error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create lobby: ' + error.message });
  }
});

app.get('/api/lobby/:code', (req, res) => {
  try {
    console.log('Get lobby request for code:', req.params.code);
    const { code } = req.params;
    const lobby = lobbies.get(code.toUpperCase());
    
    if (!lobby) {
      console.log('Lobby not found:', code);
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    console.log('Found lobby:', lobby);
    res.json(lobby);
  } catch (error) {
    console.error('Get lobby error:', error);
    res.status(500).json({ error: 'Failed to get lobby' });
  }
});

app.post('/api/join-lobby', express.json({type: '*/*'}), (req, res) => {
  try {
    console.log('Join lobby request received at:', new Date().toISOString());
    console.log('Request body:', req.body);
    
    const { code, username } = req.body;
    if (!code || !username) {
      console.log('Error: Code and username required');
      return res.status(400).json({ error: 'Code and username required' });
    }
    
    const lobby = lobbies.get(code.toUpperCase());
    if (!lobby) {
      console.log('Lobby not found:', code);
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    const newPlayer = { username, id: 'player' + Date.now() };
    lobby.players.push(newPlayer);
    lobbies.set(code.toUpperCase(), lobby);
    
    console.log('Player joined lobby:', code, username);
    console.log('Updated lobby:', lobby);
    
    res.json({ success: true, lobby });
  } catch (error) {
    console.error('Join lobby error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to join lobby: ' + error.message });
  }
});

// Root endpoint to verify server - MUST come before static serving
app.get('/', (req, res) => {
  console.log('Root endpoint hit - SIMPLE SERVER is running!');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Simple Server Test</title>
      <meta charset="UTF-8">
    </head>
    <body style="font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0;">
      <h1>🎮 Simple Server Running!</h1>
      <p>✅ Express server is active</p>
      <p>✅ API endpoints are working</p>
      <p>✅ No Socket.io dependencies</p>
      <p>✅ CommonJS Module System</p>
      <p><a href="/api/test" style="color: #007bff;">Test API</a></p>
      <p><a href="/api/health" style="color: #28a745;">Health Check</a></p>
      <hr>
      <p><strong>Server Info:</strong></p>
      <ul>
        <li>Port: ${PORT}</li>
        <li>Time: ${new Date().toISOString()}</li>
        <li>Process: Simple Server (CommonJS)</li>
      </ul>
      <hr>
      <p><strong>Test Create Lobby:</strong></p>
      <button onclick="testCreateLobby()" style="background: #FF6B9D; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Test Create Lobby</button>
      <div id="result"></div>
      <script>
        function testCreateLobby() {
          const playerUsername = 'TestUser';
          const playerId = 'player_' + Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('funish_player_id', playerId);
          
          fetch('/api/create-lobby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: playerUsername, playerId })
          })
          .then(response => response.json())
          .then(data => {
            document.getElementById('result').innerHTML = '<p style="color: green;">✅ Lobby created: ' + data.code + '</p>';
          })
          .catch(error => {
            document.getElementById('result').innerHTML = '<p style="color: red;">❌ Error: ' + error.message + '</p>';
          });
        }
      </script>
    </body>
    </html>
  `);
});

// Serve static files from build output (after root route)
app.use(express.static(distPath));

// Serve assets from correct path
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Fallback to index.html or lobby page
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).send('API endpoint not found');
  }
  
  // Check if this is a lobby page (4-character code)
  const pathParts = req.path.split('/').filter(part => part.length > 0);
  if (pathParts.length === 1 && pathParts[0].length === 4 && /^[A-Z0-9]+$/i.test(pathParts[0])) {
    // This is a lobby page, serve our lobby HTML
    const lobbyCode = pathParts[0].toUpperCase();
    console.log('Serving lobby page for code:', lobbyCode);
    
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Funish Games - Lobby ${lobbyCode}</title>
        <link rel="stylesheet" crossorigin href="/assets/index-ClSqbOJN.css">
      </head>
      <body>
        <div id="root"></div>
        <script>
          // Simple server API - no Socket.io needed
          let currentLobby = null;
          
          // Generate player ID
          function generatePlayerId() {
            const saved = sessionStorage.getItem('funish_player_id');
            if (saved) {
              console.log('Using existing player ID:', saved);
              return saved;
            }
            const newId = 'player_' + Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('funish_player_id', newId);
            console.log('Generated new player ID:', newId);
            return newId;
          }
          
          // Show lobby screen
          function showLobbyScreen(lobby) {
            const root = document.getElementById('root');
            
            // Helper function to safely get player initial
            function getPlayerInitial(player) {
              if (!player || !player.username) return '?';
              return player.username.charAt(0).toUpperCase();
            }
            
            // Get current user ID and check if they're in lobby
            const currentUserId = generatePlayerId();
            const userInLobby = lobby.players && lobby.players.some(player => player.id === currentUserId);
            
            console.log('=== LOBBY DEBUG ===');
            console.log('Current user ID:', currentUserId);
            console.log('Players in lobby:', lobby.players);
            console.log('Player IDs:', lobby.players.map(p => p.id));
            console.log('User in lobby:', userInLobby);
            console.log('==================');
            
            if (userInLobby) {
              // User is already in lobby, show normal lobby view
              const playerCount = lobby.players ? lobby.players.length : 0;
              console.log('Showing HOST view - user is in lobby');
              console.log('Player data structure:', JSON.stringify(lobby.players, null, 2));
              console.log('Player count calculation:', lobby.players, '->', lobby.players.length, '->', playerCount);
              
              // Generate player HTML and log it
              const playerHtml = lobby.players && lobby.players.length > 0 ? 
                lobby.players.map(player => '<div style="background: rgba(255,255,255,0.1); border-radius: 10px; padding: 15px; text-align: center;"><div style="width: 40px; height: 40px; background: #4ECDC4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin: 0 auto 10px;">' + getPlayerInitial(player) + '</div><div style="color: white; font-weight: bold;">' + (player.username || 'Unknown') + '</div></div>').join('') : 
                '<p style="color: rgba(255,255,255,0.7);">Waiting for players...</p>';
              
              console.log('Generated player HTML:', playerHtml);
              
              root.innerHTML = '<div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;"><div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; text-align: center; max-width: 600px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.1);"><h2 style="font-size: 36px; color: white; margin-bottom: 20px;">LOBBY: ' + lobby.code + '</h2><p style="color: rgba(255,255,255,0.9); margin-bottom: 20px;">Share this code with your friends!</p><div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 20px; margin-bottom: 20px;"><h3 style="color: white; margin-bottom: 15px;">PLAYERS (' + playerCount + ')</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">' + playerHtml + '</div></div>' + (playerCount >= 2 ? '<button onclick="startHiddenRuleGame()" style="background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; border: none; padding: 15px 30px; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer; width: 100%; margin-bottom: 10px;">🎮 Start Hidden Rule Game</button>' : '<p style="color: rgba(255,255,255,0.7); margin-bottom: 10px;">Need at least 2 players to start</p>') + '<button onclick="window.location.href=\'/\'" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; cursor: pointer;">🚪 Leave Lobby</button></div></div>';
              
              // Set up auto-refresh for host to see new players
              setupAutoRefresh(lobby.code);
            } else {
              // User is not in lobby, show join interface
              const playerCount = lobby.players ? lobby.players.length : 0;
              console.log('Showing VISITOR view - user not in lobby');
              console.log('Player data structure:', JSON.stringify(lobby.players, null, 2));
              console.log('Player count calculation:', lobby.players, '->', lobby.players.length, '->', playerCount);
              
              // Generate player HTML and log it
              const playerHtml = lobby.players && lobby.players.length > 0 ? 
                lobby.players.map(player => '<div style="background: rgba(255,255,255,0.1); border-radius: 10px; padding: 15px; text-align: center;"><div style="width: 40px; height: 40px; background: #4ECDC4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin: 0 auto 10px;">' + getPlayerInitial(player) + '</div><div style="color: white; font-weight: bold;">' + (player.username || 'Unknown') + '</div></div>').join('') : 
                '<p style="color: rgba(255,255,255,0.7);">Waiting for players...</p>';
              
              console.log('Generated player HTML:', playerHtml);
              
              root.innerHTML = '<div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;"><div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; text-align: center; max-width: 500px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.1);"><h2 style="font-size: 36px; color: white; margin-bottom: 20px;">JOIN LOBBY: ' + lobby.code + '</h2><p style="color: rgba(255,255,255,0.9); margin-bottom: 30px;">Your friend is waiting for you!</p><div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 20px; margin-bottom: 20px;"><h3 style="color: white; margin-bottom: 15px;">PLAYERS IN LOBBY (' + playerCount + ')</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">' + playerHtml + '</div></div><div style="margin-bottom: 20px;"><label style="display: block; font-weight: bold; margin-bottom: 8px; color: white;">Your Name</label><input type="text" id="joinUsername" placeholder="Enter your name" style="width: 100%; padding: 12px; border-radius: 10px; border: none; font-size:16px; box-sizing: border-box;" /></div><button onclick="joinThisLobby()" style="background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; border: none; padding: 15px 30px; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer; width: 100%;">👥 Join Lobby</button><button onclick="window.location.href=\'/\'" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; cursor: pointer; margin-top: 10px;">🚪 Back to Main</button></div></div>';
            }
          }
          
          // Auto-refresh function for lobby
          function setupAutoRefresh(lobbyCode) {
            console.log('Setting up auto-refresh for lobby:', lobbyCode);
            
            // Clear any existing refresh interval
            if (window.lobbyRefreshInterval) {
              clearInterval(window.lobbyRefreshInterval);
            }
            
            // Set up new refresh interval (check every 3 seconds)
            window.lobbyRefreshInterval = setInterval(() => {
              console.log('Auto-refreshing lobby...');
              fetch('/api/lobby/' + lobbyCode)
                .then(response => response.json())
                .then(lobby => {
                  if (lobby.error) {
                    console.log('Lobby no longer exists:', lobby.error);
                    clearInterval(window.lobbyRefreshInterval);
                    window.location.href = '/';
                  } else {
                    console.log('Lobby updated, refreshing display');
                    showLobbyScreen(lobby);
                  }
                })
                .catch(error => {
                  console.error('Auto-refresh error:', error);
                });
            }, 3000); // Refresh every 3 seconds
          }
          
          // Start Hidden Rule Game function
          window.startHiddenRuleGame = function() {
            const lobbyCode = window.location.pathname.substring(1).toUpperCase();
            console.log('Starting Hidden Rule Game for lobby:', lobbyCode);
            
            // Initialize game state
            const gameState = {
              phase: 'rule-setting',
              ruleMaker: lobbyCode === 'HOST' ? lobbyCode : lobbyCode, // First player becomes rule maker
              rule: '',
              hint: '',
              hintAvailable: false,
              timer: 60,
              timerStarted: false,
              roundOver: false,
              submissions: [],
              ruleGuesses: [],
              correctGuessers: [],
              currentRound: 1,
              totalRounds: 3,
              revealing: false,
              transitioning: false
            };
            
            // Store game state in sessionStorage for persistence
            sessionStorage.setItem('hiddenRuleGameState', JSON.stringify(gameState));
            
            // Clear auto-refresh and show game
            if (window.lobbyRefreshInterval) {
              clearInterval(window.lobbyRefreshInterval);
            }
            
            showHiddenRuleGame(gameState);
          };
          
          // Show Hidden Rule Game
          function showHiddenRuleGame(gameState) {
            const root = document.getElementById('root');
            const lobbyCode = window.location.pathname.substring(1).toUpperCase();
            const currentUserId = generatePlayerId();
            
            // Get current lobby data
            fetch('/api/lobby/' + lobbyCode)
              .then(response => response.json())
              .then(lobby => {
                const players = lobby.players || [];
                const isHost = players[0] && players[0].id === currentUserId;
                const isRuleMaker = gameState.ruleMaker === currentUserId;
                
                root.innerHTML = generateHiddenRuleGameHTML(gameState, players, currentUserId, isHost, isRuleMaker, lobbyCode);
              });
          }
          
          // Generate Hidden Rule Game HTML (adapted from original React component)
          function generateHiddenRuleGameHTML(gameState, players, currentUserId, isHost, isRuleMaker, lobbyCode) {
            const ruleMaker = players.find(p => p.id === gameState.ruleMaker);
            const mySubmission = gameState.submissions.find(s => s.playerId === currentUserId && s.status === 'pending');
            const hasGuessedCorrectly = gameState.correctGuessers.includes(currentUserId);
            
            let html = '<div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: Arial, sans-serif; padding: 20px;">';
            html += '<div style="max-width: 1200px; margin: 0 auto; position: relative;">';
            
            // Game Header
            html += '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px;">';
            
            // Rule Maker Card
            html += '<div style="background: #FF6B9D; padding: 20px; border-radius: 15px; display: flex; align-items: center; justify-content: center; gap: 10px; position: relative; overflow: hidden;">';
            html += '<span style="color: white; font-size: 24px;">🛡️</span>';
            html += '<div style="text-align: center; color: white;">';
            html += '<p style="font-size: 10px; margin: 0; opacity: 0.8;">RULE MAKER</p>';
            html += '<p style="font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase;">' + (ruleMaker && ruleMaker.username ? ruleMaker.username : '???') + '</p>';
            html += '</div>';
            if (isRuleMaker) {
              html += '<div style="position: absolute; inset: 0; background: rgba(255,255,255,0.2); animation: pulse 2s infinite;"></div>';
            }
            html += '</div>';
            
            // Timer Card
            html += '<div style="background: white; padding: 20px; border-radius: 15px; display: flex; align-items: center; justify-content: center; gap: 10px;">';
            html += '<span style="color: #4ECDC4; font-size: 24px;">⏰</span>';
            html += '<div style="text-align: center;">';
            html += '<p style="font-size: 10px; color: #666; margin: 0;">' + (gameState.roundOver ? 'STATUS' : !gameState.timerStarted ? 'WAITING' : 'TIME LEFT') + '</p>';
            html += '<p style="font-size: 24px; font-weight: bold; margin: 0; color: ' + (gameState.timer <= 10 && !gameState.roundOver ? '#FF6B9D' : 'black') + ';">';
            html += (gameState.roundOver ? 'WAITING FOR RULE GUESSES' : !gameState.timerStarted ? 'RULE...' : '0:' + gameState.timer.toString().padStart(2, '0'));
            html += '</p>';
            html += '</div>';
            html += '</div>';
            
            // Round Card
            html += '<div style="background: #FFD93D; padding: 20px; border-radius: 15px; display: flex; align-items: center; justify-content: center; gap: 10px;">';
            html += '<span style="color: black; font-size: 24px;">⭐</span>';
            html += '<div style="text-align: center;">';
            html += '<p style="font-size: 10px; color: rgba(0,0,0,0.6); margin: 0;">ROUND</p>';
            html += '<p style="font-size: 24px; font-weight: bold; margin: 0;">' + gameState.currentRound + ' / ' + gameState.totalRounds + '</p>';
            html += '</div>';
            html += '</div>';
            
            html += '</div>';
            
            // Main Game Area
            html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">';
            
            // Left Side: Actions
            html += '<div style="background: white; padding: 30px; border-radius: 20px; border: 4px solid black;">';
            html += (isRuleMaker ? generateRuleMakerUI(gameState) : generateGuesserUI(gameState, mySubmission, hasGuessedCorrectly, ruleMaker));
            html += '</div>';
            
            // Right Side: Submissions Feed
            html += '<div style="background: white; padding: 30px; border-radius: 20px; border: 4px solid black; min-height: 500px;">';
            html += '<h3 style="font-size: 24px; margin-bottom: 20px;">SUBMISSIONS</h3>';
            html += '<div style="max-height: 600px; overflow-y: auto;">';
            
            if (gameState.submissions.length === 0) {
              html += '<p style="text-align: center; color: #999; font-style: italic; padding: 40px;">No submissions yet...</p>';
            } else {
              gameState.submissions.slice().reverse().forEach(sub => {
                html += generateSubmissionHTML(sub, isRuleMaker);
              });
            }
            
            html += '</div>';
            html += '</div>';
            html += '</div>';
            
            // Footer
            html += '<div style="text-align: center; margin-top: 30px;">';
            html += '<button onclick="window.location.href=\'/'" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; cursor: pointer;">🚪 Leave Game</button>';
            html += '</div>';
            
            html += '</div>';
            html += '</div>';
            
            return html;
          }
          
          // Generate Rule Maker UI
          function generateRuleMakerUI(gameState) {
            if (!gameState.rule) {
              let html = '<div>';
              html += '<h3 style="font-size: 24px; margin-bottom: 20px;">🛡️ YOU ARE THE RULE MAKER!</h3>';
              html += '<div style="background: rgba(255,107,157,0.1); padding: 15px; border-radius: 10px; border: 2px solid #FF6B9D; margin-bottom: 20px;">';
              html += '<p style="font-size: 12px; color: #FF6B9D; font-weight: bold;">🤫 SHHH! DO NOT TALK OUT LOUD!</p>';
              html += '</div>';
              html += '<div style="background: rgba(78,205,196,0.1); padding: 15px; border-radius: 10px; border: 2px dashed #4ECDC4; margin-bottom: 20px;">';
              html += '<p style="font-size: 10px; color: #4ECDC4; margin-bottom: 10px;">CREATIVE EXAMPLES:</p>';
              html += '<ul style="font-size: 12px; color: #666; margin: 0; padding-left: 20px;">';
              html += '<li>"Words that contain a double letter" (Apple, Moon)</li>';
              html += '<li>"Words that are things you can find in a kitchen" (Fork, Oven)</li>';
              html += '<li>"Words that end with a vowel" (Pizza, Radio)</li>';
              html += '</ul>';
              html += '</div>';
              html += '<textarea id="ruleInput" placeholder="Enter your secret rule..." style="width: 100%; height: 80px; padding: 15px; border: 2px solid #4ECDC4; border-radius: 10px; font-size: 16px; resize: none; margin-bottom: 15px;" maxlength="200"></textarea>';
              html += '<button onclick="setRule()" style="background: #FFD93D; color: black; border: none; padding: 15px 30px; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer; width: 100%;">ESTABLISH RULE</button>';
              html += '</div>';
              return html;
            } else {
              let html = '<div>';
              html += '<h3 style="font-size: 24px; margin-bottom: 20px;">🛡️ YOU ARE THE RULE MAKER!</h3>';
              html += '<div style="background: white; padding: 15px; border-radius: 10px; border: 2px solid black; margin-bottom: 20px;">';
              html += '<p style="font-size: 12px; color: #666; margin-bottom: 5px;">YOUR RULE:</p>';
              html += '<p style="font-size: 18px; font-weight: bold;">' + gameState.rule + '</p>';
              html += '</div>';
              html += '<div style="background: rgba(78,205,196,0.1); padding: 20px; border-radius: 10px; border: 2px dashed #4ECDC4;">';
              html += '<h4 style="font-size: 14px; color: #4ECDC4; margin-bottom: 10px;">💡 GIVE A HINT</h4>';
              
              if (gameState.hint) {
                html += '<div style="background: white; padding: 10px; border-radius: 8px; border: 2px solid black; text-align: center;">';
                html += '<p style="font-size: 14px; font-weight: bold; color: #4ECDC4;">HINT GIVEN: ' + gameState.hint + '</p>';
                html += '</div>';
              } else if (gameState.hintAvailable) {
                html += '<div>';
                html += '<input id="hintInput" type="text" placeholder="Type a word that fits..." style="width: 100%; padding: 10px; border: 2px solid #4ECDC4; border-radius: 8px; font-size: 14px; margin-bottom: 10px;" maxlength="50" />';
                html += '<button onclick="setHint()" style="background: #4ECDC4; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 12px; cursor: pointer; width: 100%;">SEND HINT</button>';
                html += '</div>';
              } else {
                html += '<p style="text-align: center; font-size: 12px; color: #999;">Hint available at 0:30</p>';
              }
              
              html += '</div>';
              html += '</div>';
              return html;
            }
          }
          
          // Generate Guesser UI
          function generateGuesserUI(gameState, mySubmission, hasGuessedCorrectly, ruleMaker) {
            if (!gameState.rule) {
              let html = '<div style="text-align: center; color: #999; padding: 40px;">';
              html += '<div style="font-size: 48px; animation: spin 2s linear infinite;">🤫</div>';
              html += '<p style="font-size: 14px; margin-top: 10px;">Waiting for ' + (ruleMaker && ruleMaker.username ? ruleMaker.username : '???') + ' to set a rule...</p>';
              html += '</div>';
              return html;
            } else {
              let html = '<div>';
              html += '<h3 style="font-size: 24px; margin-bottom: 20px;">🤔 GUESS THE RULE</h3>';
              
              if (gameState.hint) {
                html += '<div style="background: rgba(78,205,196,0.2); padding: 15px; border-radius: 10px; border: 2px solid #4ECDC4; margin-bottom: 20px;">';
                html += '<p style="font-size: 10px; color: #4ECDC4; margin-bottom: 5px;">💡 HINT FROM ' + (ruleMaker && ruleMaker.username ? ruleMaker.username : '???') + '</p>';
                html += '<p style="font-size: 16px; font-weight: bold;">"' + gameState.hint + '" fits the rule!</p>';
                html += '</div>';
              }
              
              html += '<div style="margin-bottom: 20px;">';
              html += '<p style="font-size: 14px; color: #666; margin-bottom: 10px;">Type words to find the rule!</p>';
              
              const placeholder = mySubmission ? "Waiting for review..." : hasGuessedCorrectly ? "Word accepted!" : "Type a word...";
              const disabled = !!mySubmission || hasGuessedCorrectly;
              const inputStyle = mySubmission || hasGuessedCorrectly ? 'background: #f5f5f5; opacity: 0.5;' : '';
              
              html += '<input id="entryInput" type="text" placeholder="' + placeholder + '" disabled="' + disabled + '" ';
              html += 'style="width: 100%; padding: 15px; border: 2px solid #4ECDC4; border-radius: 10px; font-size: 16px; margin-bottom: 10px; ' + inputStyle + '" maxlength="50" />';
              
              if (!hasGuessedCorrectly) {
                const buttonBg = mySubmission ? '#ccc' : '#4ECDC4';
                const buttonCursor = mySubmission ? 'cursor: not-allowed;' : '';
                const buttonText = mySubmission ? 'PENDING' : 'SUBMIT WORD';
                
                html += '<button onclick="submitEntry()" disabled="' + !!mySubmission + '" ';
                html += 'style="background: ' + buttonBg + '; color: white; border: none; padding: 15px 30px; border-radius: 10px; font-size: 16px; cursor: pointer; width: 100%; ' + buttonCursor + '">';
                html += buttonText + '</button>';
              }
              
              html += '</div>';
              
              if (hasGuessedCorrectly) {
                html += '<div style="background: rgba(255,217,61,0.2); padding: 20px; border-radius: 10px; border: 4px dashed #FFD93D;">';
                html += '<h4 style="font-size: 14px; color: #FFD93D; margin-bottom: 10px;">🏆 GUESS THE SECRET RULE!</h4>';
                html += '<p style="font-size: 12px; color: #666; margin-bottom: 10px;">You get ONE chance to guess the rule for a bonus point!</p>';
                html += '<input id="ruleGuessInput" type="text" placeholder="I think the rule is..." ';
                html += 'style="width: 100%; padding: 10px; border: 2px solid #FFD93D; border-radius: 8px; font-size: 14px; margin-bottom: 10px;" maxlength="100" />';
                html += '<button onclick="submitRuleGuess()" style="background: #FFD93D; color: black; border: none; padding: 10px 20px; border-radius: 8px; font-size: 12px; cursor: pointer; width: 100%;">SUBMIT FINAL GUESS</button>';
                html += '</div>';
              }
              
              html += '</div>';
              return html;
            }
          }
          
          // Generate Submission HTML
          function generateSubmissionHTML(submission, isRuleMaker) {
            const statusColors = {
              'pending': '#f5f5f5',
              'accepted': 'rgba(76,205,196,0.2)',
              'rejected': 'rgba(255,107,157,0.2)'
            };
            
            const borderColors = {
              'pending': '#ccc',
              'accepted': '#4ECDC4',
              'rejected': '#FF6B9D'
            };
            
            let html = '<div style="background: ' + statusColors[submission.status] + '; padding: 15px; border-radius: 10px; border: 2px solid ' + borderColors[submission.status] + '; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between;">';
            html += '<div>';
            html += '<p style="font-size: 10px; color: #666; margin: 0;">' + submission.username + '</p>';
            html += '<p style="font-size: 16px; font-weight: bold; margin: 5px 0;">' + submission.text + '</p>';
            html += '</div>';
            
            if (isRuleMaker && submission.status === 'pending') {
              html += '<div style="display: flex; gap: 5px;">';
              html += '<button onclick="reviewSubmission(\'' + submission.id + '\', \'accepted\')" style="width: 40px; height: 40px; background: #4ECDC4; border-radius: 8px; border: 2px solid black; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer;">✓</button>';
              html += '<button onclick="reviewSubmission(\'' + submission.id + '\', \'rejected\')" style="width: 40px; height: 40px; background: #FF6B9D; border-radius: 8px; border: 2px solid black; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer;">✗</button>';
              html += '</div>';
            } else {
              html += '<div style="display: flex; align-items: center; gap: 5px;">';
              if (submission.status === 'accepted') {
                html += '<span style="color: #4ECDC4; font-size: 20px;">✓</span>';
              }
              if (submission.status === 'rejected') {
                html += '<span style="color: #FF6B9D; font-size: 20px;">✗</span>';
              }
              if (submission.status === 'pending') {
                html += '<span style="font-size: 10px; color: #999;">PENDING</span>';
              }
              html += '</div>';
            }
            
            html += '</div>';
            return html;
          }
          
          // Game action functions
          window.setRule = function() {
            const ruleInput = document.getElementById('ruleInput').value;
            if (!ruleInput.trim()) return;
            
            const gameState = JSON.parse(sessionStorage.getItem('hiddenRuleGameState') || '{}');
            gameState.rule = ruleInput;
            gameState.timerStarted = true;
            
            // Start timer
            startGameTimer(gameState);
            
            sessionStorage.setItem('hiddenRuleGameState', JSON.stringify(gameState));
            showHiddenRuleGame(gameState);
          };
          
          window.setHint = function() {
            const hintInput = document.getElementById('hintInput').value;
            if (!hintInput.trim()) return;
            
            const gameState = JSON.parse(sessionStorage.getItem('hiddenRuleGameState') || '{}');
            gameState.hint = hintInput;
            
            sessionStorage.setItem('hiddenRuleGameState', JSON.stringify(gameState));
            showHiddenRuleGame(gameState);
          };
          
          window.submitEntry = function() {
            const entryInput = document.getElementById('entryInput').value;
            if (!entryInput.trim()) return;
            
            const gameState = JSON.parse(sessionStorage.getItem('hiddenRuleGameState') || '{}');
            const currentUserId = generatePlayerId();
            
            // Add submission
            const submission = {
              id: Date.now().toString(),
              playerId: currentUserId,
              username: 'Player ' + currentUserId.substring(0, 4),
              text: entryInput,
              status: 'pending'
            };
            
            gameState.submissions.push(submission);
            sessionStorage.setItem('hiddenRuleGameState', JSON.stringify(gameState));
            
            // Clear input
            document.getElementById('entryInput').value = '';
            
            showHiddenRuleGame(gameState);
          };
          
          window.submitRuleGuess = function() {
            const ruleGuessInput = document.getElementById('ruleGuessInput').value;
            if (!ruleGuessInput.trim()) return;
            
            const gameState = JSON.parse(sessionStorage.getItem('hiddenRuleGameState') || '{}');
            const currentUserId = generatePlayerId();
            
            // Add rule guess
            const ruleGuess = {
              playerId: currentUserId,
              username: 'Player ' + currentUserId.substring(0, 4),
              guess: ruleGuessInput,
              status: 'pending'
            };
            
            gameState.ruleGuesses.push(ruleGuess);
            sessionStorage.setItem('hiddenRuleGameState', JSON.stringify(gameState));
            
            showHiddenRuleGame(gameState);
          };
          
          window.reviewSubmission = function(submissionId, status) {
            const gameState = JSON.parse(sessionStorage.getItem('hiddenRuleGameState') || '{}');
            const submission = gameState.submissions.find(s => s.id === submissionId);
            
            if (submission) {
              submission.status = status;
              
              if (status === 'accepted') {
                // Add to correct guessers
                gameState.correctGuessers.push(submission.playerId);
              }
              
              sessionStorage.setItem('hiddenRuleGameState', JSON.stringify(gameState));
              showHiddenRuleGame(gameState);
            }
          };
          
          // Game timer
          function startGameTimer(gameState) {
            const timerInterval = setInterval(() => {
              gameState.timer--;
              
              if (gameState.timer <= 30 && !gameState.hintAvailable) {
                gameState.hintAvailable = true;
              }
              
              if (gameState.timer <= 0) {
                clearInterval(timerInterval);
                gameState.roundOver = true;
              }
              
              sessionStorage.setItem('hiddenRuleGameState', JSON.stringify(gameState));
              showHiddenRuleGame(gameState);
              
              if (gameState.timer <= 0) {
                clearInterval(timerInterval);
              }
            }, 1000);
          }
          
          // Join this lobby function
          window.joinThisLobby = function() {
            const username = document.getElementById('joinUsername').value;
            
            if (!username.trim()) {
              alert('Enter your name!');
              return;
            }
            
            // Call join lobby API
            fetch('/api/join-lobby', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code: '${lobbyCode}', username })
            })
            .then(response => response.json())
            .then(data => {
              console.log('Joined lobby:', data);
              if (data.success) {
                // Reload the page to show updated lobby
                window.location.reload();
              } else {
                alert('Error: ' + (data.error || 'Failed to join lobby'));
              }
            })
            .catch(error => {
              console.error('Join lobby error:', error);
              alert('Failed to join lobby. Please try again.');
            });
          };
          
          // Initialize page
          document.addEventListener('DOMContentLoaded', function() {
            const lobbyCode = '${lobbyCode}';
            console.log('On lobby page:', lobbyCode);
            
            // Fetch lobby data from server
            fetch('/api/lobby/' + lobbyCode)
              .then(response => response.json())
              .then(lobby => {
                if (lobby.error) {
                  alert('Lobby not found: ' + lobby.error);
                  window.location.href = '/';
                } else {
                  showLobbyScreen(lobby);
                }
              })
              .catch(error => {
                console.error('Fetch lobby error:', error);
                alert('Failed to load lobby. Please try again.');
                window.location.href = '/';
              });
          });
        </script>
      </body>
      </html>
    `);
    return;
  }
  
  // For all other routes, serve the static index.html
  res.sendFile(path.join(distPath, 'index.html'));
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('=== SIMPLE SERVER STARTED SUCCESSFULLY ===');
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving from: ${distPath}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
