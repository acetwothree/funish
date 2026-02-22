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
              
              // Generate player HTML and log it
              const playerHtml = lobby.players && lobby.players.length > 0 ? 
                lobby.players.map(player => '<div style="background: rgba(255,255,255,0.1); border-radius: 10px; padding: 15px; text-align: center;"><div style="width: 40px; height: 40px; background: #4ECDC4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin: 0 auto 10px;">' + getPlayerInitial(player) + '</div><div style="color: white; font-weight: bold;">' + (player.username || 'Unknown') + '</div></div>').join('') : 
                '<p style="color: rgba(255,255,255,0.7);">Waiting for players...</p>';
              
              console.log('Generated player HTML:', playerHtml);
              
              root.innerHTML = '<div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;"><div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; text-align: center; max-width: 600px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.1);"><h2 style="font-size: 36px; color: white; margin-bottom: 20px;">LOBBY: ' + lobby.code + '</h2><p style="color: rgba(255,255,255,0.9); margin-bottom: 20px;">Share this code with your friends!</p><div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 20px; margin-bottom: 20px;"><h3 style="color: white; margin-bottom: 15px;">PLAYERS (' + playerCount + ')</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">' + playerHtml + '</div></div><button onclick="window.location.href=\'/\'" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; cursor: pointer;">🚪 Leave Lobby</button></div></div>';
            } else {
              // User is not in lobby, show join interface
              const playerCount = lobby.players ? lobby.players.length : 0;
              console.log('Showing VISITOR view - user not in lobby');
              console.log('Player data structure:', JSON.stringify(lobby.players, null, 2));
              
              // Generate player HTML and log it
              const playerHtml = lobby.players && lobby.players.length > 0 ? 
                lobby.players.map(player => '<div style="background: rgba(255,255,255,0.1); border-radius: 10px; padding: 15px; text-align: center;"><div style="width: 40px; height: 40px; background: #4ECDC4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin: 0 auto 10px;">' + getPlayerInitial(player) + '</div><div style="color: white; font-weight: bold;">' + (player.username || 'Unknown') + '</div></div>').join('') : 
                '<p style="color: rgba(255,255,255,0.7);">Waiting for players...</p>';
              
              console.log('Generated player HTML:', playerHtml);
              
              root.innerHTML = '<div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;"><div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; text-align: center; max-width: 500px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.1);"><h2 style="font-size: 36px; color: white; margin-bottom: 20px;">JOIN LOBBY: ' + lobby.code + '</h2><p style="color: rgba(255,255,255,0.9); margin-bottom: 30px;">Your friend is waiting for you!</p><div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 20px; margin-bottom: 20px;"><h3 style="color: white; margin-bottom: 15px;">PLAYERS IN LOBBY (' + playerCount + ')</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">' + playerHtml + '</div></div><div style="margin-bottom: 20px;"><label style="display: block; font-weight: bold; margin-bottom: 8px; color: white;">Your Name</label><input type="text" id="joinUsername" placeholder="Enter your name" style="width: 100%; padding: 12px; border-radius: 10px; border: none; font-size:16px; box-sizing: border-box;" /></div><button onclick="joinThisLobby()" style="background: linear-gradient(45deg, #4ECDC4, #44A08D); color: white; border: none; padding: 15px 30px; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer; width: 100%;">👥 Join Lobby</button><button onclick="window.location.href=\'/\'" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; cursor: pointer; margin-top: 10px;">🚪 Back to Main</button></div></div>';
            }
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
