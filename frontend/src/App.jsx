import React, { useRef, useEffect } from 'react'
import { io } from 'socket.io-client'
import { me as fetchMe, logout as playerLogout } from './services/authService'
import './App.css'
import './components/GameUI.css'
import AuthOverlay from './components/AuthOverlay'
import HeroSelection from './components/HeroSelection'
import LobbyScene from './components/LobbyScene'
import GameplayScene from './components/GameplayScene'
import ZoneSelector from './components/ZoneSelector'
import ZoneTransition from './components/ZoneTransition'
import MatchmakingQueue from './components/MatchmakingQueue'

export default function App() {
  const playerPositionRef = React.useRef([0, 0, 0]);
  const [authOpen, setAuthOpen] = React.useState(false)
  const [player, setPlayer] = React.useState(null)
  const socketRef = React.useRef(null)
  const [socketReady, setSocketReady] = React.useState(false)
  const [playerHeroes, setPlayerHeroes] = React.useState([])
  const [availableHeroes, setAvailableHeroes] = React.useState([])
  const [loadingHeroes, setLoadingHeroes] = React.useState(false)
  const [showHeroSelection, setShowHeroSelection] = React.useState(false)
  const [currentZone, setCurrentZone] = React.useState(null)
  const [showZoneSelector, setShowZoneSelector] = React.useState(false)
  const [showMatchmaking, setShowMatchmaking] = React.useState(false)
  const [inCombatMatch, setInCombatMatch] = React.useState(false)
  useEffect(() => {
    // Validate stored token on load (non-blocking, logs only)
    fetchMe().then((me) => {
      if (me) {
        console.log('Authenticated player:', me);
        setPlayer(me)
      } else {
        console.log('No valid player session');
        setAuthOpen(true)
      }
    }).catch(() => { console.log('Auth check failed'); setAuthOpen(true) });
  }, []);

  // Connect to socket server when authenticated
  useEffect(() => {
    if (!player) {
      // If logging out or not authenticated, ensure socket is closed
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketReady(false);
      return;
    }

    setSocketReady(false);
    const token = localStorage.getItem('playerToken');
    const socket = io('http://localhost:6060', { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('auth', { token });
    });

    socket.on('auth:ok', ({ player: socketPlayer }) => {
      // Keep frontend player snapshot in sync with backend-socket
      setPlayer(socketPlayer);
      setSocketReady(true);
      socket.emit('get:player');
      // Fetch heroes when authenticated
      socket.emit('get:player:heroes');
      socket.emit('get:heroes:available');
      // Load current zone or default to lobby
      loadZoneData(socket);
    });

    // Handle zone changes
    socket.on('zone:joined', ({ zone, position }) => {
      console.log('[app] Zone changed:', zone.name);
      setCurrentZone(zone);
      // Update player position if needed
      if (position) {
        playerPositionRef.current = [position.x, position.y, position.z];
      }
    });

    socket.on('player', (socketPlayer) => {
      if (socketPlayer) setPlayer(socketPlayer);
    });

    socket.on('heroes:available', (heroes) => {
      setAvailableHeroes(heroes || []);
    });

    // Handle player heroes update
    socket.on('player:heroes', (heroes) => {
      setPlayerHeroes(heroes || []);
      setLoadingHeroes(false);
      
      // Notify other players about hero change if we have an active hero
      const currentPlayer = player || {};
      if (currentPlayer.active_hero_id && heroes) {
        const activeHeroData = heroes.find(h => h.playerHeroId === currentPlayer.active_hero_id);
        if (activeHeroData && socket) {
          socket.emit('player:hero:update', {
            activeHeroId: currentPlayer.active_hero_id,
            heroModel: activeHeroData.model,
            heroModelScale: activeHeroData.modelScale,
            heroModelRotation: activeHeroData.modelRotation,
          });
        }
      }
    });

    // Handle hero selection response
    socket.on('hero:set:active:ok', ({ player: updatedPlayer }) => {
      setPlayer(updatedPlayer);
      // Refresh heroes list - the handler above will notify about hero change
      socket.emit('get:player:heroes');
    });

    socket.on('auth:error', (err) => {
      console.error('Socket auth failed', err);
      setSocketReady(false);
    });

    socket.on('disconnect', () => {
      setSocketReady(false);
    });

    // Handle combat errors
    socket.on('combat:error', (error) => {
      console.error('[app] Combat error:', error);
    });

    // Handle combat end (matchmaking battles)
    socket.on('combat:ended', (data) => {
      console.log('[app] 🏆 Combat ended:', data);
      console.log('[app] inCombatMatch is currently:', inCombatMatch);
      window.__inCombat = false;
      
      // Refresh hero data to get updated experience and level
      socket.emit('get:player:heroes');
      
      // If this was a matchmaking battle, wait before returning to lobby
      if (data.isMatchmaking) {
        console.log('[app] ⏱️ Matchmaking battle ended, waiting 7 seconds to show results...');
        
        // Wait 7 seconds to let players see the victory/defeat modal
        setTimeout(() => {
          console.log('[app] 🔄 NOW switching back to lobby scene...');
          
          // Switch back to lobby scene
          setInCombatMatch(false);
          
          // Return to lobby zone
          socket.emit('zone:list', {}, (response) => {
            if (response.ok && response.zones) {
              const lobby = response.zones.find(z => z.slug === 'starter-lobby' || z.is_safe_zone);
              if (lobby) {
                socket.emit('zone:join', { zoneId: lobby.id }, (joinResponse) => {
                  if (joinResponse.ok) {
                    console.log('[app] ✅ Returned to lobby zone:', joinResponse.zone.name);
                  }
                });
              }
            }
          });
        }, 7000); // Wait 7 seconds to let players see the results
      } else {
        // For non-matchmaking battles, switch immediately
        console.log('[app] Non-matchmaking battle, switching immediately');
        setInCombatMatch(false);
      }
    });

    return () => {
      socket.off('zone:joined');
      socket.off('combat:error');
      socket.off('combat:ended');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [!!player]);

  // Keyboard shortcut: Press 'P' to open matchmaking
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.key === 'p' || e.key === 'P') && player && socketReady) {
        setShowMatchmaking(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [player, socketReady])

  // Helper function to load zone data
  const loadZoneData = React.useCallback((socket) => {
    console.log('[app] Loading zone data...');
    // Request list of zones to find default lobby
    socket.emit('zone:list', {}, (response) => {
      console.log('[app] Zone list response:', response);
      if (response.ok && response.zones) {
        const lobby = response.zones.find(z => z.slug === 'starter-lobby' || z.is_safe_zone);
        console.log('[app] Found lobby zone:', lobby);
        if (lobby) {
          // Auto-join lobby zone
          socket.emit('zone:join', { zoneId: lobby.id }, (joinResponse) => {
            console.log('[app] Zone join response:', joinResponse);
            if (joinResponse.ok) {
              setCurrentZone(joinResponse.zone);
              console.log('[app] Auto-joined zone:', joinResponse.zone.name);
            } else {
              console.error('[app] Failed to join zone:', joinResponse.error);
            }
          });
        } else {
          console.warn('[app] No lobby zone found in zones list');
        }
      } else {
        console.error('[app] Failed to get zone list:', response);
      }
    });
  }, []);

  // Handle matchmaking battle start
  const handleMatchStarted = React.useCallback((data) => {
    console.log('='.repeat(60));
    console.log('[app] 🎮 MATCH STARTED - JOINING COMBAT');
    console.log('[app] Data received:', data);
    console.log('='.repeat(60));
    const { combatInstanceId, zone, position } = data;
    
    // Switch to combat scene
    setInCombatMatch(true);
    console.log('[app] inCombatMatch set to TRUE');
    setShowMatchmaking(false); // Close matchmaking modal
    
    if (combatInstanceId && socketRef.current) {
      // Join the matchmaking combat instance
      console.log('[app] Emitting combat:join-matchmaking with combatInstanceId:', combatInstanceId);
      socketRef.current.emit('combat:join-matchmaking', { combatInstanceId }, (response) => {
        if (response?.ok) {
          console.log('[app] ✅ Successfully joined matchmaking combat instance:', combatInstanceId);
          window.__inCombat = true;
        } else {
          console.error('[app] ❌ Failed to join matchmaking combat:', response?.error);
        }
      });
    } else {
      console.error('[app] ❌ Missing combatInstanceId or socket:', { combatInstanceId, hasSocket: !!socketRef.current });
    }
    
    // Update zone if provided
    if (zone) {
      setCurrentZone(zone);
    }
    
    // Update position if provided
    if (position) {
      playerPositionRef.current = [position.x, position.y, position.z];
    }
  }, []);
  
  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
    { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'run', keys: ['Shift'] },
  ]
  
  return (
    <>
    {/* Top Bar */}
    <div style={{ position: 'fixed', top: 12, left: 0, right: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', padding: '0 12px' }}>
    {/* Left side - Zone info and selector */}
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {player && socketReady && !inCombatMatch && (
        <>
          {currentZone && (
            <div style={{
              background: 'rgba(17, 24, 39, 0.9)',
              border: '1px solid #374151',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#e5e7eb',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ fontSize: 16 }}>🗺️</span>
              <div>
                <div style={{ fontWeight: 'bold' }}>{currentZone.name}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>{currentZone.type.toUpperCase()}</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowZoneSelector(true)}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: '2px solid #1e40af',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            {currentZone ? 'Change Zone' : '🗺️ Select Zone'}
          </button>
          <button
            onClick={() => setShowMatchmaking(true)}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: '2px solid #7f1d1d',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            ⚔️ Find Match
          </button>
        </>
      )}
    </div>
      
      {/* Right side - Player info */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {player ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#e5e7eb', fontSize: 12 }}>Hi, {player.name}</span>
            <button
              onClick={async () => { await playerLogout(); if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; } setPlayer(null); setAuthOpen(true); }}
              style={{ padding: '6px 10px', fontSize: 12, background: '#374151', color: '#e5e7eb', border: '1px solid #4b5563', borderRadius: 6 }}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            style={{ padding: '8px 12px', fontSize: 12, background: '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}
          >
            Login / Sign Up
          </button>
        )}
      </div>
    </div>
    <AuthOverlay
      open={authOpen}
      onClose={() => setAuthOpen(false)}
      onAuthenticated={(p) => { setPlayer(p); setAuthOpen(false); }}
    />
    {/* <GameInstructions /> */}
    {player && !socketReady && (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', zIndex: 50 }}>
        <div style={{ padding: '12px 16px', background: '#111827', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 8, fontSize: 13 }}>
          Connecting to game server...
        </div>
      </div>
    )}
    {player && socketReady && (
      <>
        {!player.active_hero_id ? (
          <HeroSelection
            player={player}
            playerHeroes={playerHeroes}
            availableHeroes={availableHeroes}
            socket={socketRef.current}
            onHeroSelected={(updatedPlayer) => {
              setPlayer(updatedPlayer);
            }}
            onHeroesUpdate={(updatedPlayerHeroes, updatedAvailableHeroes) => {
              setPlayerHeroes(updatedPlayerHeroes);
              setAvailableHeroes(updatedAvailableHeroes);
            }}
          />
        ) : (
          <>
            {inCombatMatch ? (
              <GameplayScene
                playerPositionRef={playerPositionRef}
                keyboardMap={keyboardMap}
                activeHero={
                  playerHeroes?.find(h => h.playerHeroId === player.active_hero_id) || null
                }
                player={player}
                socket={socketRef.current}
                currentZone={currentZone}
                onOpenHeroSelection={() => setShowHeroSelection(true)}
                onHeroStatsUpdate={(heroId, stats) => {
                  // Update hero stats in real-time during combat
                  setPlayerHeroes(prevHeroes => 
                    prevHeroes.map(h => 
                      h.playerHeroId === heroId ? { ...h, ...stats } : h
                    )
                  );
                }}
                skipAutoJoinCombat={true}
              />
            ) : (
              <LobbyScene
                playerPositionRef={playerPositionRef}
                keyboardMap={keyboardMap}
                activeHero={
                  playerHeroes?.find(h => h.playerHeroId === player.active_hero_id) || null
                }
                player={player}
                socket={socketRef.current}
                currentZone={currentZone}
              />
            )}
            {showHeroSelection && (
              <HeroSelection
                player={player}
                playerHeroes={playerHeroes}
                availableHeroes={availableHeroes}
                socket={socketRef.current}
                onHeroSelected={(updatedPlayer) => {
                  setPlayer(updatedPlayer);
                  setShowHeroSelection(false);
                }}
                onHeroesUpdate={(updatedPlayerHeroes, updatedAvailableHeroes) => {
                  setPlayerHeroes(updatedPlayerHeroes);
                  setAvailableHeroes(updatedAvailableHeroes);
                }}
                onClose={() => setShowHeroSelection(false)}
              />
            )}
          </>
        )}
      </>
    )}
    
    {/* Zone Selector Modal */}
    {player && socketReady && showZoneSelector && !inCombatMatch && (
      <ZoneSelector
        socket={socketRef.current}
        playerLevel={
          playerHeroes?.find(h => h.playerHeroId === player.active_hero_id)?.level || 1
        }
        onClose={() => setShowZoneSelector(false)}
      />
    )}
    
    {/* Matchmaking Modal */}
    {player && socketReady && showMatchmaking && !inCombatMatch && (
      <MatchmakingQueue
        socket={socketRef.current}
        onClose={() => setShowMatchmaking(false)}
        onMatchStarted={handleMatchStarted}
      />
    )}
    
    {/* Zone Transition Screen */}
    <ZoneTransition />
      </>
  )
}
