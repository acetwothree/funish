import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Trophy, Send, Check, X, User, Clock, Info, Lightbulb, Star } from 'lucide-react';
import { Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';

interface Submission {
  id: string;
  playerId: string;
  username: string;
  text: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function HiddenRuleGame({ code, players, gameData, gameState, socket, isHost, playerId }: { code: string, players: any[], gameData: any, gameState: string, socket: Socket, isHost: boolean, playerId: string }) {
  const [ruleInput, setRuleInput] = useState('');
  const [entryInput, setEntryInput] = useState('');
  const [hintInput, setHintInput] = useState('');
  const [ruleGuessInput, setRuleGuessInput] = useState('');
  const [showHowTo, setShowHowTo] = useState(false);
  
  const isRuleMaker = playerId === gameData.ruleMaker;
  const ruleMaker = players.find(p => p.id === gameData.ruleMaker);
  const mySubmission = gameData.submissions.find((s: any) => s.playerId === playerId && s.status === 'pending');
  const hasGuessedCorrectly = gameData.correctGuessers.includes(playerId);
  const myRuleGuess = gameData.ruleGuesses?.find((g: any) => g.playerId === playerId);

  const handleSetRule = () => {
    if (!ruleInput.trim()) return;
    socket.emit('set-rule', { code, rule: ruleInput, playerId });
  };

  const handleSetHint = () => {
    if (!hintInput.trim()) return;
    socket.emit('set-hint', { code, hint: hintInput, playerId });
    setHintInput('');
  };

  const handleSubmitEntry = () => {
    if (!entryInput.trim() || mySubmission || hasGuessedCorrectly) return;
    socket.emit('submit-entry', { code, text: entryInput, playerId });
    setEntryInput('');
  };

  const handleSubmitRuleGuess = () => {
    if (!ruleGuessInput.trim() || myRuleGuess) return;
    socket.emit('submit-rule-guess', { code, guess: ruleGuessInput, playerId });
    setRuleGuessInput('');
  };

  const handleReview = (submissionId: string, status: 'accepted' | 'rejected') => {
    socket.emit('review-submission', { code, submissionId, status, playerId });
    if (status === 'accepted') {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.5 }
      });
    }
  };

  const handleReviewRuleGuess = (pId: string, status: 'accepted' | 'rejected') => {
    socket.emit('review-rule-guess', { code, playerId: pId, status, ruleMakerId: playerId });
  };

  const handleReturnToLobby = () => {
    if (!isHost) return;
    socket.emit('end-game', { code, playerId });
  };

  const handlePlayAgain = () => {
    if (!isHost) return;
    // For simplicity, we'll go back to lobby and let them start again
    // but we could also implement a direct restart
    socket.emit('end-game', { code, playerId });
  };

  if (gameData.revealing) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto mt-12 p-8 fun-card bg-fun-pink text-white text-center"
      >
        <div className="bg-white text-fun-pink py-2 px-6 rounded-full inline-block mb-4 font-bungee text-sm">
          THE ROUND IS OVER!
        </div>
        <h2 className="text-4xl mb-6 font-fredoka font-bold">THE SECRET RULE WAS:</h2>
        <div className="bg-white/20 p-8 rounded-3xl border-4 border-white mb-8">
          <p className="text-5xl font-bungee leading-tight">{gameData.rule}</p>
        </div>
        <div className="flex items-center justify-center gap-2 font-bungee text-xs opacity-80">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
            ⏳
          </motion.div>
          PREPARING LEADERBOARD...
        </div>
      </motion.div>
    );
  }

  if (gameData.transitioning) {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mt-12 p-8 fun-card bg-white text-center"
      >
        <div className="bg-fun-pink text-white py-2 px-6 rounded-full inline-block mb-4 font-bungee text-sm">
          ROUND {gameData.currentRound} COMPLETE!
        </div>
        <h2 className="text-5xl mb-8">NEXT ROUND STARTING...</h2>
        
        <div className="space-y-4 mb-8">
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 border-black ${i === 0 ? 'bg-fun-yellow/20' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <span className="font-bungee text-xl">#{i + 1}</span>
                <span className="font-fredoka font-bold text-lg">{p.username}</span>
              </div>
              <span className="font-bungee text-lg">{p.score} PTS</span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-center gap-2 text-gray-400 font-bungee text-xs">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
            ⏳
          </motion.div>
          PREPARING NEXT ROUND...
        </div>
      </motion.div>
    );
  }

  if (gameState === 'game-over') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto mt-12 p-8 fun-card bg-white text-center"
      >
        <div className="mb-6">
          <Trophy size={80} className="mx-auto text-fun-yellow mb-2" />
          <h2 className="text-5xl mb-2">GAME OVER!</h2>
          <p className="font-bungee text-fun-pink text-2xl">
            {winner.username} WINS!
          </p>
        </div>
        
        <div className="space-y-4 mb-12">
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 border-black ${i === 0 ? 'bg-fun-yellow/20 scale-105' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <span className="font-bungee text-2xl">#{i + 1}</span>
                <span className="font-fredoka font-bold text-xl">{p.username}</span>
              </div>
              <span className="font-bungee text-xl">{p.score} PTS</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handlePlayAgain} 
              disabled={!isHost}
              className={`fun-button ${isHost ? 'bg-fun-green' : 'bg-gray-300 cursor-not-allowed opacity-50'}`}
            >
              PLAY AGAIN
            </button>
            <button 
              onClick={handleReturnToLobby} 
              disabled={!isHost}
              className={`fun-button ${isHost ? 'bg-fun-blue' : 'bg-gray-300 cursor-not-allowed opacity-50'}`}
            >
              LOBBY
            </button>
          </div>
          {!isHost && (
            <p className="font-fredoka text-gray-400 italic">Waiting for host to decide...</p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4 pb-20 relative">
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
              <div className="space-y-4 font-fredoka text-lg">
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

      {/* Game Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="fun-card px-6 py-4 bg-fun-pink flex items-center justify-center gap-3 relative overflow-hidden">
          <Shield className="text-white relative z-10" />
          <div className="text-center relative z-10">
            <p className="text-[10px] font-bungee text-white/80 leading-none">RULE MAKER</p>
            <p className="font-bungee text-white text-xl uppercase">{ruleMaker?.username || '???'}</p>
          </div>
          {isRuleMaker && (
            <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
          )}
        </div>

        <div className="fun-card px-6 py-4 bg-white flex items-center justify-center gap-4">
          <Clock className={gameData.timer <= 10 && !gameData.roundOver ? 'text-fun-pink animate-bounce' : 'text-fun-blue'} />
          <div className="text-center">
            <p className="text-[10px] font-bungee text-gray-400 leading-none">
              {gameData.roundOver ? 'STATUS' : !gameData.timerStarted ? 'WAITING' : 'TIME LEFT'}
            </p>
            <p className={`font-bungee text-2xl ${gameData.timer <= 10 && !gameData.roundOver ? 'text-fun-pink' : 'text-black'}`}>
              {gameData.roundOver ? (
                <span className="text-fun-blue text-sm">WAITING FOR RULE GUESSES</span>
              ) : !gameData.timerStarted ? (
                <span className="text-gray-300">RULE...</span>
              ) : (
                `0:${gameData.timer.toString().padStart(2, '0')}`
              )}
            </p>
          </div>
        </div>

        <div className="fun-card px-6 py-4 bg-fun-yellow flex items-center justify-center gap-4">
          <Star className="text-black" />
          <div className="text-center">
            <p className="text-[10px] font-bungee text-black/60 leading-none">ROUND</p>
            <p className="font-bungee text-2xl">{gameData.currentRound} / {gameData.totalRounds}</p>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {isRuleMaker ? (
            <div className="fun-card p-6 bg-fun-yellow/20 border-fun-yellow h-full">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="text-fun-yellow" />
                <h3 className="text-2xl">YOU ARE THE RULE MAKER!</h3>
              </div>
              
              <div className="bg-fun-pink/10 p-4 rounded-xl border-2 border-fun-pink mb-6 flex items-center gap-3">
                <X className="text-fun-pink" />
                <p className="font-bungee text-xs text-fun-pink">SHHH! DO NOT TALK OUT LOUD!</p>
              </div>

              {!gameData.rule ? (
                <div className="space-y-4">
                  <div className="p-4 bg-fun-blue/5 rounded-xl border-2 border-fun-blue border-dashed mb-4">
                    <p className="text-[10px] font-bungee text-fun-blue mb-2">CREATIVE EXAMPLES:</p>
                    <ul className="text-xs font-fredoka space-y-1 text-gray-600">
                      <li>• "Words that contain a double letter" (e.g. Apple, Moon)</li>
                      <li>• "Words that are things you can find in a kitchen" (e.g. Fork, Oven)</li>
                      <li>• "Words that end with a vowel" (e.g. Pizza, Radio)</li>
                      <li>• "Words that have exactly 3 syllables" (e.g. Banana, Computer)</li>
                      <li>• "Words that are both a noun and a verb" (e.g. Park, Water)</li>
                    </ul>
                  </div>
                  <textarea 
                    placeholder="Enter your secret rule..."
                    className="fun-input w-full h-24 resize-none"
                    value={ruleInput}
                    maxLength={200}
                    onChange={(e) => setRuleInput(e.target.value)}
                  />
                  <button 
                    onClick={handleSetRule}
                    className="fun-button bg-fun-yellow w-full"
                  >
                    ESTABLISH RULE
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-white rounded-xl border-2 border-black">
                    <p className="text-xs font-bungee text-gray-400 mb-1">YOUR RULE:</p>
                    <p className="font-fredoka font-bold text-xl">{gameData.rule}</p>
                  </div>

                  <div className="p-6 bg-fun-blue/10 rounded-2xl border-2 border-fun-blue border-dashed">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="text-fun-blue" />
                      <h4 className="font-bungee text-sm">GIVE A HINT</h4>
                    </div>
                    {gameData.hint ? (
                      <div className="p-3 bg-white rounded-lg border-2 border-black text-center">
                        <p className="font-fredoka font-bold text-fun-blue">HINT GIVEN: {gameData.hint}</p>
                      </div>
                    ) : gameData.hintAvailable ? (
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          placeholder="Type a word that fits..."
                          className="fun-input w-full text-sm"
                          value={hintInput}
                          maxLength={50}
                          onChange={(e) => setHintInput(e.target.value)}
                        />
                        <button onClick={handleSetHint} className="fun-button bg-fun-blue w-full text-xs">SEND HINT</button>
                      </div>
                    ) : (
                      <p className="text-center font-fredoka text-xs text-gray-400">Hint available at 0:30</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="fun-card bg-white p-6 h-full flex flex-col">
              <h3 className="text-2xl mb-4">GUESS THE RULE</h3>
              
              {gameData.hint && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-fun-blue/20 p-4 rounded-xl border-2 border-fun-blue mb-6 flex items-center gap-3"
                >
                  <Lightbulb className="text-fun-blue shrink-0" />
                  <div>
                    <p className="text-[10px] font-bungee text-fun-blue leading-none">HINT FROM {ruleMaker?.username}</p>
                    <p className="font-fredoka font-bold text-lg">"{gameData.hint}" fits the rule!</p>
                  </div>
                </motion.div>
              )}

              {!gameData.rule ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                    🤫
                  </motion.div>
                  <p className="font-bungee text-xs mt-2">Waiting for {ruleMaker?.username} to set a rule...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Word Submission */}
                  <div className="space-y-4">
                    <p className="font-fredoka font-bold text-sm text-gray-600">Type words to find the rule!</p>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder={mySubmission ? "Waiting for review..." : hasGuessedCorrectly ? "Word accepted!" : "Type a word..."}
                        disabled={!!mySubmission || hasGuessedCorrectly}
                        className={`fun-input w-full ${mySubmission || hasGuessedCorrectly ? 'bg-gray-100 opacity-50' : ''}`}
                        value={entryInput}
                        maxLength={50}
                        onChange={(e) => setEntryInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitEntry()}
                      />
                    </div>
                    {!hasGuessedCorrectly && (
                      <button 
                        onClick={handleSubmitEntry}
                        disabled={!!mySubmission}
                        className={`fun-button w-full flex items-center justify-center gap-2 ${mySubmission ? 'bg-gray-300' : 'bg-fun-blue'}`}
                      >
                        <Send size={18} />
                        {mySubmission ? 'PENDING' : 'SUBMIT WORD'}
                      </button>
                    )}
                  </div>

                  {/* Rule Guessing - Only available after a word is accepted */}
                  {hasGuessedCorrectly && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="p-6 bg-fun-yellow/10 rounded-2xl border-4 border-fun-yellow border-dashed"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="text-fun-yellow" />
                        <h4 className="font-bungee text-sm">GUESS THE SECRET RULE!</h4>
                      </div>
                      {myRuleGuess ? (
                        <div className="p-3 bg-white rounded-lg border-2 border-black text-center">
                          <p className="text-[10px] font-bungee text-gray-400 uppercase">YOUR GUESS:</p>
                          <p className="font-fredoka font-bold">"{myRuleGuess.guess}"</p>
                          <p className="text-[10px] font-bungee text-fun-pink mt-1 italic">REVIEWED AT END OF ROUND</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs font-fredoka text-gray-600">You get <span className="font-bold">ONE</span> chance to guess the rule for a bonus point!</p>
                          <input 
                            type="text" 
                            placeholder="I think the rule is..."
                            className="fun-input w-full text-sm"
                            value={ruleGuessInput}
                            maxLength={100}
                            onChange={(e) => setRuleGuessInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmitRuleGuess()}
                          />
                          <button onClick={handleSubmitRuleGuess} className="fun-button bg-fun-yellow w-full text-xs">SUBMIT FINAL GUESS</button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Submissions Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="fun-card bg-white p-6 min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl">SUBMISSIONS</h3>
              <div className="flex gap-2">
                {players.filter(p => p.id !== gameData.ruleMaker).map(p => (
                  <div key={p.id} className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bungee ${gameData.correctGuessers.includes(p.id) ? 'bg-fun-green text-white' : 'bg-white'}`}>
                    {p.username[0].toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2">
              {/* Rule Guesses Review (Only for Rule Maker) */}
              {isRuleMaker && gameData.ruleGuesses?.some((g: any) => g.status === 'pending') && (
                <div className="mb-8 p-4 bg-fun-yellow/10 rounded-2xl border-2 border-fun-yellow">
                  <h4 className="font-bungee text-xs text-fun-yellow mb-3">PENDING RULE GUESSES</h4>
                  <div className="space-y-3">
                    {gameData.ruleGuesses.filter((g: any) => g.status === 'pending').map((guess: any) => (
                      <div key={guess.playerId} className="bg-white p-3 rounded-xl border-2 border-black flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bungee text-gray-400">{guess.username}</p>
                          <p className="font-fredoka font-bold">"{guess.guess}"</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleReviewRuleGuess(guess.playerId, 'accepted')} className="w-8 h-8 bg-fun-green rounded-lg border-2 border-black flex items-center justify-center text-white"><Check size={16}/></button>
                          <button onClick={() => handleReviewRuleGuess(guess.playerId, 'rejected')} className="w-8 h-8 bg-fun-pink rounded-lg border-2 border-black flex items-center justify-center text-white"><X size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {gameData.submissions.length === 0 ? (
                  <p className="text-center text-gray-400 font-fredoka py-20 italic">No submissions yet...</p>
                ) : (
                  [...gameData.submissions].reverse().map((sub: Submission) => (
                    <motion.div 
                      key={sub.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={`p-4 rounded-2xl border-2 border-black flex items-center justify-between ${
                        sub.status === 'accepted' ? 'bg-fun-green/10 border-fun-green' : 
                        sub.status === 'rejected' ? 'bg-fun-pink/10 border-fun-pink' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User size={12} className="text-gray-400" />
                          <span className="text-[10px] font-bungee text-gray-500">{sub.username}</span>
                        </div>
                        <p className="font-fredoka font-bold text-lg">{sub.text}</p>
                      </div>

                      {isRuleMaker && sub.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleReview(sub.id, 'accepted')}
                            className="w-12 h-12 bg-fun-green rounded-xl border-2 border-black flex items-center justify-center text-white hover:scale-110 transition-transform"
                          >
                            <Check size={24} />
                          </button>
                          <button 
                            onClick={() => handleReview(sub.id, 'rejected')}
                            className="w-12 h-12 bg-fun-pink rounded-xl border-2 border-black flex items-center justify-center text-white hover:scale-110 transition-transform"
                          >
                            <X size={24} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {sub.status === 'accepted' && <Check className="text-fun-green" size={24} />}
                          {sub.status === 'rejected' && <X className="text-fun-pink" size={24} />}
                          {sub.status === 'pending' && <span className="text-[10px] font-bungee text-gray-400">PENDING</span>}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      {isHost && (
        <div className="mt-12 text-center">
          <button 
            onClick={handleReturnToLobby}
            className="fun-button bg-gray-200 text-black text-xs"
          >
            QUIT GAME
          </button>
        </div>
      )}
    </div>
  );
}
