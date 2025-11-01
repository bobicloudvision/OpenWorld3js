import React, { useState, useEffect } from 'react';
import { FantasyModal, FantasyButton, FantasyCard, FantasyPanel } from './ui';

/**
 * Matchmaking Queue Component
 * Shows available PvP queues and handles joining/leaving
 */
export default function MatchmakingQueue({ socket, onClose, onMatchStarted }) {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inQueue, setInQueue] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);
  const [matchFound, setMatchFound] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [matchPlayers, setMatchPlayers] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Get available queues
    socket.emit('matchmaking:queues', {}, (response) => {
      if (response.ok) {
        setQueues(response.queues);
      }
      setLoading(false);
    });

    // Listen for queue updates
    socket.on('queue:update', (update) => {
      console.log('[matchmaking] Queue update:', update);
      setQueueStatus(update);
    });

    // Listen for match found
    socket.on('match:found', (data) => {
      console.log('[matchmaking] Match found!', data);
      setMatchFound(true);
      setMatchPlayers(data.players);
      setCountdown(data.countdownSeconds);
    });

    // Listen for countdown updates
    socket.on('match:countdown', (data) => {
      setCountdown(data.secondsLeft);
    });

    // Listen for match started
    socket.on('match:started', (data) => {
      console.log('[matchmaking] Match started!', data);
      // Notify parent component (App)
      if (onMatchStarted) {
        onMatchStarted(data);
      }
      if (onClose) onClose();
    });

    // Listen for match cancelled
    socket.on('match:cancelled', (data) => {
      console.log('[matchmaking] Match cancelled:', data.reason);
      alert(`Match cancelled: ${data.reason}`);
      setMatchFound(false);
      setInQueue(false);
      setQueueStatus(null);
    });

    return () => {
      socket.off('queue:update');
      socket.off('match:found');
      socket.off('match:countdown');
      socket.off('match:started');
      socket.off('match:cancelled');
    };
  }, [socket, onClose, onMatchStarted]);

  const handleJoinQueue = (queueType) => {
    if (!socket) return;

    socket.emit('matchmaking:join', { queueType }, (response) => {
      if (response.ok) {
        setInQueue(true);
        setQueueStatus(response);
      } else {
        alert(`Cannot join queue: ${response.error}`);
      }
    });
  };

  const handleLeaveQueue = () => {
    if (!socket) return;

    socket.emit('matchmaking:leave', {}, (response) => {
      if (response.ok) {
        setInQueue(false);
        setQueueStatus(null);
      }
    });
  };

  // Match countdown screen
  if (matchFound) {
    return (
      <FantasyModal isOpen={true} maxWidth="650px" showCloseButton={false} className="text-center">
        <div className="p-10">
          <div className="text-6xl mb-4 filter drop-shadow-lg">⚔️</div>
          <h2 className="text-amber-300 m-0 mb-6 text-4xl font-bold" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(217, 119, 6, 0.8), 0 0 30px rgba(245, 158, 11, 0.5)',
            fontFamily: 'Georgia, serif',
            letterSpacing: '2px'
          }}>
            MATCH FOUND!
          </h2>
          
          {/* Countdown */}
          <div className={`text-8xl font-bold my-8 ${
            countdown <= 3 ? 'text-red-400' : 'text-amber-300'
          }`} style={{ 
            textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 30px currentColor',
            fontFamily: 'Georgia, serif'
          }}>
            {countdown}
          </div>

          {/* Players */}
          <FantasyPanel title="Players in Match:" className="mt-6">
            {matchPlayers.map((player, index) => (
              <div key={index} className="text-amber-100 p-3 mb-2 text-base border-b border-amber-800/50 last:border-0" style={{
                textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
                fontFamily: 'Georgia, serif'
              }}>
                <span className="font-bold">{player.playerName}</span> <span className="text-amber-300">Level {player.playerLevel}</span>
              </div>
            ))}
          </FantasyPanel>

          <div className="text-amber-200 mt-6 text-sm italic" style={{
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}>
            Prepare for battle...
          </div>
        </div>
      </FantasyModal>
    );
  }

  // Queue status screen
  if (inQueue && queueStatus) {
    return (
      <>
        <FantasyModal isOpen={true} maxWidth="550px" showCloseButton={false} className="text-center">
          <div className="p-8">
            <div className="text-6xl mb-4 filter drop-shadow-lg">🔍</div>
            <h2 className="text-amber-300 m-0 mb-3 text-3xl font-bold" style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 15px rgba(217, 119, 6, 0.6)',
              fontFamily: 'Georgia, serif',
              letterSpacing: '1px'
            }}>
              Searching for Opponents
            </h2>
            <div className="text-amber-200 mb-8 text-sm font-semibold uppercase tracking-wider" style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}> 
              {queueStatus.name || queueStatus.queueType}
            </div>

            {/* Player count */}
            <FantasyPanel className="mb-6">
              <div className="text-6xl font-bold text-amber-300 mb-3" style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 20px rgba(217, 119, 6, 0.8)',
                fontFamily: 'Georgia, serif'
              }}>
                {queueStatus.currentPlayers} / {queueStatus.minPlayers}
              </div>
              <div className="text-amber-200 text-sm font-semibold uppercase" style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                Players in Queue
              </div>
            </FantasyPanel>

            {/* Waiting players */}
            {queueStatus.players && queueStatus.players.length > 0 && (
              <FantasyPanel title="Waiting Players:" className="mb-6">
                {queueStatus.players.map((player, index) => (
                  <div key={index} className="text-amber-100 p-2 text-sm border-b border-amber-800/50 last:border-0" style={{
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    fontFamily: 'Georgia, serif'
                  }}>
                    <span className="font-bold">{player.playerName}</span> <span className="text-amber-300">Level {player.playerLevel}</span>
                  </div>
                ))}
              </FantasyPanel>
            )}

            {/* Animated dots */}
            <div className="text-amber-400 text-3xl mb-8" style={{
              textShadow: '0 0 10px rgba(217, 119, 6, 0.8)'
            }}>
              <span className="dot-pulse inline-block mx-2">●</span>
              <span className="dot-pulse inline-block mx-2" style={{ animationDelay: '0.2s' }}>●</span>
              <span className="dot-pulse inline-block mx-2" style={{ animationDelay: '0.4s' }}>●</span>
            </div>

            <FantasyButton onClick={handleLeaveQueue} size="md">
              Leave Queue
            </FantasyButton>
          </div>
        </FantasyModal>

        {/* Animation styles */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          .dot-pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }
        `}</style>
      </>
    );
  }

  // Queue selection screen
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[2000]">
        <div className="text-amber-300 text-xl font-bold" style={{
          textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 15px rgba(217, 119, 6, 0.6)',
          fontFamily: 'Georgia, serif'
        }}>
          Loading queues...
        </div>
      </div>
    );
  }

  return (
    <FantasyModal isOpen={true} onClose={onClose} title="⚔️ PVP MATCHMAKING" maxWidth="900px">
      {/* Queue grid */}
      <div className="flex-1 overflow-auto p-6 grid gap-6 content-start" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {queues.map((queue) => (
          <FantasyCard
            key={queue.type}
            title={queue.name}
            hoverable
            onClick={() => handleJoinQueue(queue.type)}
          >
            <div className="text-amber-300 text-sm mb-5 font-semibold uppercase tracking-wider" style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              {queue.teams ? 'Team Battle' : 'Free For All'}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5 text-sm" style={{ fontFamily: 'Georgia, serif' }}>
              <div className="text-amber-200" style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                <span className="font-bold text-amber-300">Players:</span> {queue.minPlayers}-{queue.maxPlayers}
              </div>
              <div className="text-amber-200" style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                <span className="font-bold text-amber-300">Countdown:</span> {queue.countdownSeconds}s
              </div>
            </div>

            {/* Current players in queue */}
            {queue.currentPlayers > 0 && (
              <div className="bg-amber-800/50 py-3 px-4 rounded border border-amber-600/50 mb-5" style={{
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)'
              }}>
                <div className="text-amber-300 text-sm font-bold" style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                  ⭐ {queue.currentPlayers} players in queue
                </div>
              </div>
            )}

            <FantasyButton
              onClick={(e) => {
                e.stopPropagation();
                handleJoinQueue(queue.type);
              }}
              fullWidth
              size="lg"
            >
              Join Queue
            </FantasyButton>
          </FantasyCard>
        ))}
      </div>
    </FantasyModal>
  );
}

