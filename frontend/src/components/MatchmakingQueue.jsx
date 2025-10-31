import React, { useState, useEffect } from 'react';

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
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          background: '#1f2937',
          borderRadius: '16px',
          border: '2px solid #10b981',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '600px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚔️</div>
          <h2 style={{ color: '#10b981', margin: '0 0 24px 0', fontSize: '32px' }}>
            Match Found!
          </h2>
          
          {/* Countdown */}
          <div style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: countdown <= 3 ? '#ef4444' : '#3b82f6',
            margin: '24px 0',
            textShadow: '0 0 20px currentColor'
          }}>
            {countdown}
          </div>

          {/* Players */}
          <div style={{
            background: '#111827',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '24px'
          }}>
            <div style={{ color: '#9ca3af', marginBottom: '12px', fontSize: '14px' }}>
              Players in match:
            </div>
            {matchPlayers.map((player, index) => (
              <div key={index} style={{
                color: '#e5e7eb',
                padding: '8px',
                marginBottom: '4px',
                fontSize: '16px'
              }}>
                {player.playerName} (Level {player.playerLevel})
              </div>
            ))}
          </div>

          <div style={{ color: '#9ca3af', marginTop: '24px', fontSize: '14px' }}>
            Prepare for battle...
          </div>
        </div>
      </div>
    );
  }

  // Queue status screen
  if (inQueue && queueStatus) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          background: '#1f2937',
          borderRadius: '16px',
          border: '2px solid #3b82f6',
          padding: '32px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ color: '#e5e7eb', margin: '0 0 8px 0', fontSize: '24px' }}>
            Searching for Opponents
          </h2>
          <div style={{ color: '#9ca3af', marginBottom: '24px', fontSize: '14px' }}>
            {queueStatus.name || queueStatus.queueType}
          </div>

          {/* Player count */}
          <div style={{
            background: '#111827',
            padding: '24px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#3b82f6',
              marginBottom: '8px'
            }}>
              {queueStatus.currentPlayers} / {queueStatus.minPlayers}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>
              Players in queue
            </div>
          </div>

          {/* Waiting players */}
          {queueStatus.players && queueStatus.players.length > 0 && (
            <div style={{
              background: '#111827',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ color: '#9ca3af', marginBottom: '8px', fontSize: '12px' }}>
                Waiting players:
              </div>
              {queueStatus.players.map((player, index) => (
                <div key={index} style={{
                  color: '#e5e7eb',
                  padding: '4px',
                  fontSize: '14px'
                }}>
                  {player.playerName} (Level {player.playerLevel})
                </div>
              ))}
            </div>
          )}

          {/* Animated dots */}
          <div style={{ color: '#3b82f6', fontSize: '24px', marginBottom: '24px' }}>
            <span className="dot-pulse">●</span>
            <span className="dot-pulse" style={{ animationDelay: '0.2s' }}>●</span>
            <span className="dot-pulse" style={{ animationDelay: '0.4s' }}>●</span>
          </div>

          <button
            onClick={handleLeaveQueue}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              background: '#374151',
              color: '#e5e7eb',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#4b5563'}
            onMouseLeave={(e) => e.target.style.background = '#374151'}
          >
            Leave Queue
          </button>
        </div>

        {/* Animation styles */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          .dot-pulse {
            display: inline-block;
            margin: 0 4px;
            animation: pulse 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // Queue selection screen
  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{ color: '#e5e7eb', fontSize: '18px' }}>
          Loading queues...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        background: '#1f2937',
        borderRadius: '16px',
        border: '2px solid #374151',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#e5e7eb', fontSize: '24px' }}>
            ⚔️ PvP Matchmaking
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Queue grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
          alignContent: 'start'
        }}>
          {queues.map((queue) => (
            <div
              key={queue.type}
              style={{
                background: '#111827',
                border: '2px solid #374151',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#374151'}
              onClick={() => handleJoinQueue(queue.type)}
            >
              <h3 style={{
                margin: '0 0 8px 0',
                color: '#e5e7eb',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {queue.name}
              </h3>
              
              <div style={{
                color: '#9ca3af',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                {queue.teams ? 'Team Battle' : 'Free For All'}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                <div style={{ color: '#9ca3af' }}>
                  Players: {queue.minPlayers}-{queue.maxPlayers}
                </div>
                <div style={{ color: '#9ca3af' }}>
                  Countdown: {queue.countdownSeconds}s
                </div>
              </div>

              {/* Current players in queue */}
              {queue.currentPlayers > 0 && (
                <div style={{
                  background: '#1f2937',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  <div style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>
                    {queue.currentPlayers} players in queue
                  </div>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinQueue(queue.type);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                Join Queue
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

