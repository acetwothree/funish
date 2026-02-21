import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { PartyPopper, Play, Users } from 'lucide-react';

export default function LandingPage() {
  const [username, setUsername] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const { socket, playerId } = useSocket();
  const navigate = useNavigate();

  const handleCreateLobby = () => {
    if (!username.trim()) return alert('Enter a username!');
    socket?.emit('create-lobby', { username, playerId });
    socket?.once('lobby-created', (code) => {
      navigate(`/${code}`, { state: { username } });
    });
  };

  const handleJoinLobby = () => {
    if (!username.trim()) return alert('Enter a username!');
    if (!lobbyCode.trim()) return alert('Enter a lobby code!');
    const code = lobbyCode.toUpperCase();
    
    socket?.emit('check-lobby', code, (exists: boolean) => {
      if (exists) {
        navigate(`/${code}`, { state: { username } });
      } else {
        alert('Lobby not found! Check the code and try again.');
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4"
    >
      <div className="text-center mb-12">
        <motion.div 
          animate={{ rotate: [-1, 1, -1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex items-center justify-center gap-1 mb-4"
        >
          <h1 className="text-7xl md:text-9xl text-fun-pink drop-shadow-lg tracking-tight">FUN</h1>
          <h1 className="text-4xl md:text-6xl text-fun-blue drop-shadow-lg rotate-12 -translate-y-4">ish</h1>
        </motion.div>
        <p className="text-xl font-fredoka font-bold text-gray-600 max-w-md mx-auto">
          Games you create for your friends in real time!
        </p>
      </div>

      <div className="fun-card bg-white w-full max-w-md p-8 space-y-6">
        <div className="space-y-2">
          <label className="block font-bungee text-sm">Your Name</label>
          <input 
            type="text" 
            placeholder="CoolGamer123"
            className="fun-input w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4">
          <button 
            onClick={handleCreateLobby}
            className="fun-button bg-fun-green flex items-center justify-center gap-2"
          >
            <PartyPopper size={20} />
            Create Lobby
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t-4 border-black"></div>
            <span className="flex-shrink mx-4 font-bungee text-sm">OR</span>
            <div className="flex-grow border-t-4 border-black"></div>
          </div>

          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="ABCD"
              className="fun-input w-full text-center uppercase tracking-widest text-2xl"
              maxLength={4}
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
            />
            <button 
              onClick={handleJoinLobby}
              className="fun-button bg-fun-blue w-full flex items-center justify-center gap-2"
            >
              <Users size={20} />
              Join Lobby
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16 w-full max-w-4xl">
        <h3 className="text-center font-bungee text-gray-400 mb-8">Available Games</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Hidden Rule', color: 'bg-fun-pink', icon: '🤫' },
            { name: 'Jeopardy', color: 'bg-fun-blue', icon: '❓' },
            { name: 'Connections', color: 'bg-fun-yellow', icon: '🔗' }
          ].map((game) => (
            <div key={game.name} className="fun-card bg-white p-6 flex flex-col items-center opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed group">
              <div className={`w-16 h-16 ${game.color} rounded-2xl border-4 border-black flex items-center justify-center mb-4 text-3xl group-hover:scale-110 transition-transform`}>
                {game.icon}
              </div>
              <span className="font-bungee text-sm">{game.name}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
