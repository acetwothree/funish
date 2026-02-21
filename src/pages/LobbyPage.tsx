import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useSocket } from '../hooks/useSocket';
import { Users, Settings, Play, Copy, LogOut, Info, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AnimatePresence } from 'motion/react';
import HiddenRuleGame from '../components/HiddenRuleGame';

export default function LobbyPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, connected, playerId } = useSocket();
  const [players, setPlayers] = useState<any[]>([]);
  const [gameState, setGameState] = useState('waiting');
  const [selectedGame, setSelectedGame] = useState('hidden-rule');
  const [gameData, setGameData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [username, setUsername] = useState(location.state?.username || '');
  const [tempName, setTempName] = useState('');
  const [showHowTo, setShowHowTo] = useState(false);
  const [autoJoined, setAutoJoined] = useState(false);

  // Handle direct URL access - check if lobby exists and prompt for username
  useEffect(() => {
    if (connected && socket && code && !location.state?.username && !autoJoined) {
      console.log('Checking if lobby exists for direct URL access:', code);
      
      socket.emit('check-lobby', code.toUpperCase(), (exists: boolean) => {
        if (!exists) {
          alert('Lobby not found! Redirecting to home...');
          navigate('/');
        }
      });
    }
  }, [connected, socket, code, location.state, navigate, autoJoined]);

  // Auto-join room if we have username and it's a direct URL access
  useEffect(() => {
    if (connected && socket && username && code && !location.state?.username && !autoJoined) {
      console.log('Auto-joining room from direct URL:', code);
      
      socket.emit('auto-join-room', { roomCode: code, username, playerId });
      
      socket.once('auto-joined', ({ success, roomCode }) => {
        if (success) {
          setAutoJoined(true);
          console.log('Successfully auto-joined room:', roomCode);
        }
      });
    }
  }, [connected, socket, username, code, location.state, playerId, autoJoined]);

  useEffect(() => {
    if (connected && socket && username && code) {
      console.log('Registering lobby-update listener for', code);
      
      const handleUpdate = (data: any) => {
        console.log('Received lobby update:', data);
        setPlayers(data.players);
        setGameState(data.gameState);
        setSelectedGame(data.selectedGame);
        setSettings(data.settings);
        setGameData(data.gameData);
        setHostId(data.hostId);
      };

      socket.on('lobby-update', handleUpdate);

      console.log('Emitting join-lobby for', code, 'as', username, 'with playerId', playerId);
      socket.emit('join-lobby', { code, username, playerId });

      socket.on('error', (msg) => {
        alert(msg);
        navigate('/');
      });

      return () => {
        socket.off('lobby-update', handleUpdate);
        socket.off('error');
      };
    }
  }, [connected, socket, username, code, navigate, playerId]);

  const handleJoinWithInput = () => {
    if (!tempName.trim()) return;
    setUsername(tempName);
  };

  const handleStartGame = () => {
    socket?.emit('start-game', { code, playerId });
  };

  const handleSelectGame = (game: string) => {
    socket?.emit('select-game', { code, game, playerId });
  };

  const handleUpdateRounds = (rounds: number) => {
    socket?.emit('update-settings', { code, settings: { roundsPerPlayer: rounds }, playerId });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(window.location.href);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const isHost = playerId === hostId;

  // Auto-rejoin if players list is empty after a delay
  useEffect(() => {
    if (connected && socket && username && code && players.length === 0) {
      const timer = setTimeout(() => {
        if (players.length === 0) {
          console.log('Players list still empty, re-joining...');
          socket.emit('join-lobby', { code, username, playerId });
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [connected, socket, username, code, players.length, playerId]);

  if (!username) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4"
      >
        <div className="fun-card bg-white w-full max-w-md p-8 space-y-6">
          <h2 className="text-3xl text-center">
            {location.state?.username ? 'JOIN LOBBY' : 'DIRECT ACCESS'}
          </h2>
          <p className="text-center font-fredoka text-lg">
            {location.state?.username ? `JOIN LOBBY: ${code}` : `Welcome to lobby: ${code}`}
          </p>
          <div className="space-y-2">
            <label className="block font-bungee text-sm">Your Name</label>
            <input 
              type="text" 
              placeholder="CoolGamer123"
              className="fun-input w-full"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinWithInput()}
            />
          </div>
          <button 
            onClick={handleJoinWithInput}
            className="fun-button bg-fun-blue w-full flex items-center justify-center gap-2"
          >
            <Users size={20} />
            {location.state?.username ? 'Join Game' : 'Enter Lobby'}
          </button>
        </div>
      </motion.div>
    );
  }

  if (gameState === 'playing' || gameState === 'game-over') {
    return <HiddenRuleGame code={code!} players={players} gameData={gameData} gameState={gameState} socket={socket!} isHost={isHost} playerId={playerId} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto"
    >
      <button 
        onClick={() => setShowHowTo(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-fun-blue text-white rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center z-40 hover:scale-110 transition-transform"
      >
        <Info size={24} />
      </button>

      <AnimatePresence>
        {showHowTo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              className="fun-card bg-white max-w-lg p-8 relative"
            >
              <button onClick={() => setShowHowTo(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full">
                <X />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <Info className="text-fun-blue" />
                <h2 className="text-3xl uppercase">How to Play</h2>
              </div>
              <div className="space-y-4 font-fredoka text-lg text-left">
                <p>🤫 <span className="font-bold">Rule Maker</span> sets a secret rule. <span className="text-fun-pink font-bold">SHHH!</span></p>
                <p>🤔 <span className="font-bold">Guessers</span> type words to find the rule.</p>
                <p>✅ <span className="font-bold">Approved?</span> Once a word is accepted, you get <span className="font-bold">ONE</span> chance to guess the secret rule!</p>
                <p>🏆 <span className="font-bold">Scoring:</span> 1st correct word = 3pts, others = 1pt. Rule Maker gets 3pts if guessed. <span className="text-fun-green font-bold">+1 Bonus</span> for guessing the rule!</p>
                <p>⏳ <span className="font-bold">Timer:</span> 60s starts <span className="font-bold">AFTER</span> the rule is set. Round ends when all rules are guessed and reviewed!</p>
              </div>
              <button onClick={() => setShowHowTo(false)} className="fun-button bg-fun-blue w-full mt-8">GOT IT!</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Lobby Info */}
        <div className="flex-1 space-y-6">
          <div className="fun-card p-6 bg-fun-yellow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl">LOBBY: {code}</h2>
              <button onClick={copyCode} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                <Copy size={24} />
              </button>
            </div>
            <p className="font-fredoka font-bold">Share this code with your friends!</p>
          </div>

          <div className="fun-card bg-white p-6 min-h-[400px]">
            <div className="flex items-center gap-2 mb-6">
              <Users className="text-fun-pink" />
              <h3 className="text-2xl">PLAYERS ({players.length})</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {players.map((player) => (
                <motion.div 
                  key={player.id}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center p-4 rounded-2xl border-2 border-black bg-gray-50 relative"
                >
                  <div className="w-12 h-12 rounded-full bg-fun-blue border-2 border-black mb-2 flex items-center justify-center font-bungee text-white">
                    {player.username[0].toUpperCase()}
                  </div>
                  <span className="font-fredoka font-bold truncate w-full text-center">{player.username}</span>
                  {player.id === socket?.id && (
                    <span className="absolute -top-2 -right-2 bg-fun-pink text-white text-[10px] font-bungee px-2 py-1 rounded-full border-2 border-black">YOU</span>
                  )}
                  {hostId === player.id && (
                    <span className="absolute -bottom-2 bg-fun-yellow text-black text-[8px] font-bungee px-2 py-0.5 rounded-full border-2 border-black">HOST</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Settings & Actions */}
        <div className="w-full md:w-80 space-y-6">
          <div className="fun-card bg-white p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="text-fun-purple" />
              <h3 className="text-2xl">SETTINGS</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bungee text-gray-400">GAME MODE</label>
                {[
                  { id: 'hidden-rule', name: 'Hidden Rule', color: 'bg-fun-pink' },
                  { id: 'jeopardy', name: 'Jeopardy', color: 'bg-fun-blue', disabled: true },
                  { id: 'connections', name: 'Connections', color: 'bg-fun-yellow', disabled: true }
                ].map((game) => (
                  <button
                    key={game.id}
                    disabled={game.disabled || !isHost}
                    onClick={() => handleSelectGame(game.id)}
                    className={`w-full p-3 rounded-xl border-2 border-black font-bungee text-xs text-left transition-all flex items-center justify-between ${
                      selectedGame === game.id ? game.color + ' translate-x-1 translate-y-1 shadow-none' : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    } ${game.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {game.name}
                    {game.disabled && <span className="text-[8px] opacity-50">SOON</span>}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bungee text-gray-400">ROUNDS PER PLAYER</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      disabled={!isHost}
                      onClick={() => handleUpdateRounds(r)}
                      className={`flex-1 py-2 rounded-lg border-2 border-black font-bungee text-xs transition-all ${
                        settings?.roundsPerPlayer === r ? 'bg-fun-yellow' : 'bg-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => handleStartGame()}
              disabled={!isHost || players.length < 2}
              className={`fun-button w-full py-6 text-2xl flex items-center justify-center gap-3 ${
                isHost && players.length >= 2 ? 'bg-fun-green' : 'bg-gray-300 cursor-not-allowed opacity-50'
              }`}
            >
              <Play size={28} fill={isHost && players.length >= 2 ? "white" : "gray"} />
              START!
            </button>

            {isHost && players.length < 2 && (
              <p className="text-center font-fredoka text-[10px] text-fun-pink font-bold">
                Need at least 2 players to start!
              </p>
            )}
            
            {!isHost && (
              <p className="text-center font-fredoka text-sm text-gray-500 animate-pulse">
                Waiting for host to start...
              </p>
            )}

            <button 
              onClick={() => navigate('/')}
              className="fun-button bg-fun-pink w-full flex items-center justify-center gap-2"
            >
              <LogOut size={20} />
              Leave
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
