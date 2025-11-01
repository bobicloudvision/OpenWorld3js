import React, { useRef, useEffect } from 'react'
import { io } from 'socket.io-client'
import { me as fetchMe, logout as playerLogout } from './services/authService'
import useGameStore from './stores/gameStore'
import './App.css'
import './components/GameUI.css'
import AuthOverlay from './components/AuthOverlay'
import HeroSelection from './components/HeroSelection'
import LobbyScene from './components/LobbyScene'
import GameplayScene from './components/GameplayScene'
import ZoneSelector from './components/ZoneSelector'
import ZoneTransition from './components/ZoneTransition'
import MatchmakingQueue from './components/MatchmakingQueue'
import CombatRejoinModal from './components/CombatRejoinModal'
import GameHeader from './components/GameHeader'

export default function GameApp({ onPlayerChange, socketRef: externalSocketRef }) {
  const playerPositionRef = React.useRef([0, 0, 0]);
  const [authOpen, setAuthOpen] = React.useState(false)
  const [player, setPlayer] = React.useState(null)
  const socketRef = externalSocketRef || React.useRef(null)
  const [socketReady, setSocketReady] = React.useState(false)
  const [playerHeroes, setPlayerHeroes] = React.useState([])
  const [availableHeroes, setAvailableHeroes] = React.useState([])
  const [loadingHeroes, setLoadingHeroes] = React.useState(false)
  const [showHeroSelection, setShowHeroSelection] = React.useState(false)
  const [currentZone, setCurrentZone] = React.useState(null)
  const [showZoneSelector, setShowZoneSelector] = React.useState(false)
  const [showMatchmaking, setShowMatchmaking] = React.useState(false)
  const [inCombatMatch, setInCombatMatch] = React.useState(false)
  const [isMatchmakingBattle, setIsMatchmakingBattle] = React.useState(false)
  const [showCombatRejoin, setShowCombatRejoin] = React.useState(false)
  const [activeCombatInfo, setActiveCombatInfo] = React.useState(null)
  const [showLeaderboard, setShowLeaderboard] = React.useState(false)
  const [showHeroSwitcher, setShowHeroSwitcher] = React.useState(false)

  // Handle zone change (both auto-join and manual selection)
  const handleZoneChange = React.useCallback((zone, position) => {
    console.log('[app] 🗺️ Zone changed:', zone.name);
    console.log('[app] Zone data:', { 
      id: zone.id, 
      name: zone.name, 
      map_file: zone.map_file,
      environment_file: zone.environment_file,
      is_combat_zone: zone.is_combat_zone, 
      is_safe_zone: zone.is_safe_zone 
    });
    
    // Update zone state
    setCurrentZone(zone);
    
    // Switch scenes based on zone type
    if (zone.is_combat_zone && !zone.is_safe_zone) {
      console.log('[app] Switching to GameplayScene (combat zone)');
      setInCombatMatch(true);
    } else {
      console.log('[app] Switching to LobbyScene (safe zone)');
      setInCombatMatch(false);
    }
    
    // Update player position if provided
    if (position) {
      playerPositionRef.current = [position.x, position.y, position.z];
    }
  }, []);

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
              handleZoneChange(joinResponse.zone, joinResponse.position);
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
  }, [handleZoneChange]);

  // Update parent when player changes
  React.useEffect(() => {
    if (onPlayerChange) {
      onPlayerChange(player)
    }
  }, [player, onPlayerChange])

  useEffect(() => {
    // Validate stored token on load (non-blocking, logs only)
    fetchMe().then((response) => {
      if (response && response.data) {
        console.log('Authenticated player:', response.data);
        setPlayer(response.data)
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
    const socketUrl = import.meta.env.SOCKET_URL || 'http://localhost:6060';

    const socket = io(socketUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('auth', { token });
    });

    socket.on('auth:ok', ({ player: socketPlayer }) => {
      // Keep frontend player snapshot in sync with backend-socket
      setPlayer(socketPlayer);
      if (onPlayerChange) {
        onPlayerChange(socketPlayer);
      }
      setSocketReady(true);
      socket.emit('get:player');
      // Fetch heroes when authenticated
      socket.emit('get:player:heroes');
      socket.emit('get:heroes:available');
      // Load current zone or default to lobby
      loadZoneData(socket);
      
      // Check for active combat (reconnect after refresh)
      socket.emit('combat:check-active', (response) => {
        if (response?.ok && response.hasActiveCombat && response.combat) {
          console.log('[app] 🔄 Active combat detected on reconnect:', response.combat);
          setActiveCombatInfo(response.combat);
          setShowCombatRejoin(true);
        }
      });
    });

    // Note: zone changes are handled via callbacks in handleZoneChange()
    // The backend doesn't emit a 'zone:joined' event to the joining player

    socket.on('player', (socketPlayer) => {
      if (socketPlayer) {
        setPlayer(socketPlayer);
        if (onPlayerChange) {
          onPlayerChange(socketPlayer);
        }
      }
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

    // Handle real-time hero stats updates (regeneration)
    socket.on('regen:tick', (data) => {

      const { newHealth, newPower, maxHealth, maxPower } = data;

      // Update the active hero's stats in real-time
      setPlayerHeroes(prevHeroes => 
        prevHeroes.map(hero => {
          // Update only the active hero
          if (hero.playerHeroId === player?.active_hero_id) {
            return {
              ...hero,
              health: newHealth,
              power: newPower,
              maxHealth: maxHealth || hero.maxHealth,
              maxPower: maxPower || hero.maxPower
            };
          }
          return hero;
        })
      );
    });

    // Handle consumable usage (instant)
    socket.on('consumable:used', (data) => {
      const { newHealth, newPower } = data;
      
      setPlayerHeroes(prevHeroes => 
        prevHeroes.map(hero => {
          if (hero.playerHeroId === player?.active_hero_id) {
            return {
              ...hero,
              health: newHealth,
              power: newPower
            };
          }
          return hero;
        })
      );
    });

    // Handle consumable channeling completed
    socket.on('consumable:channeling-completed', (data) => {
      const { newHealth, newPower } = data;
      
      setPlayerHeroes(prevHeroes => 
        prevHeroes.map(hero => {
          if (hero.playerHeroId === player?.active_hero_id) {
            return {
              ...hero,
              health: newHealth,
              power: newPower
            };
          }
          return hero;
        })
      );
    });

    // Handle hero level-up
    socket.on('hero:level-up', (data) => {
      console.log('[app] 🎉 Hero leveled up!', data);
      
      // Refresh hero data to get updated stats
      socket.emit('get:player:heroes');
    });

    // Handle player level-up
    socket.on('player:level-up', (data) => {
      console.log('[app] 🎉 Player leveled up!', data);
      
      // Refresh player data
      socket.emit('get:player');
    });

    // Handle enemy state updates from backend
    socket.on('enemy:state-update', (data) => {
      const { zoneId, enemies } = data;
      if (enemies && Array.isArray(enemies)) {
        useGameStore.getState().updateEnemyState(enemies);
      }
    });
    
    // Handle enemy spawn events
    socket.on('enemy:spawned', (data) => {
      const { enemies } = data;
      if (enemies && Array.isArray(enemies)) {
        useGameStore.getState().updateEnemyState(enemies);
      }
    });
    
    // Handle enemy destruction
    socket.on('enemy:destroyed', (data) => {
      const { enemyId } = data;
      useGameStore.getState().removeEnemy(enemyId);
    });
    
    // Handle enemy attacks on player
    socket.on('enemy:attack', (data) => {
      const { enemyId, enemyName, damage, type } = data;
      console.log(`[app] Enemy ${enemyName} (${enemyId}) attacked player for ${damage} ${type} damage`);
      // TODO: Apply damage to player - this should be handled by combat service
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
          
          // Clear matchmaking flag
          setIsMatchmakingBattle(false);
          
          // Return to lobby zone
          socket.emit('zone:list', {}, (response) => {
            if (response.ok && response.zones) {
              const lobby = response.zones.find(z => z.slug === 'starter-lobby' || z.is_safe_zone);
              if (lobby) {
                socket.emit('zone:join', { zoneId: lobby.id }, (joinResponse) => {
                  if (joinResponse.ok) {
                    console.log('[app] ✅ Returned to lobby zone:', joinResponse.zone.name);
                    handleZoneChange(joinResponse.zone, joinResponse.position);
                  }
                });
              }
            }
          });
        }, 7000); // Wait 7 seconds to let players see the results
      } else {
        // For non-matchmaking battles in regular combat zones, stay in the zone
        // The scene state is determined by the current zone type, so no need to change it
        console.log('[app] Non-matchmaking battle ended, staying in current zone');
      }
    });

    return () => {
      socket.off('combat:error');
      socket.off('combat:ended');
      socket.off('regen:tick');
      socket.off('consumable:used');
      socket.off('consumable:channeling-completed');
      socket.off('hero:level-up');
      socket.off('player:level-up');
      socket.disconnect();
      if (!externalSocketRef) {
        socketRef.current = null;
      }
    };
  }, [!!player, handleZoneChange, externalSocketRef]);

  // Load enemies when zone changes or socket connects
  // This must be a separate useEffect at the top level (not nested in socket setup)
  useEffect(() => {
    const socket = socketRef.current;
    if (socketReady && socket && socket.connected && currentZone?.id) {
      socket.emit('enemy:get-zone-enemies', {}, (response) => {
        if (response?.ok && response.enemies) {
          useGameStore.getState().setEnemies(response.enemies);
        }
      });
    }
  }, [socketReady, currentZone?.id]);

  // Keyboard shortcut: Press 'P' to open matchmaking
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.key === 'p' || e.key === 'P') && player && socketReady && !isMatchmakingBattle) {
        if (!currentZone) {
          alert('You must be in a zone to join matchmaking. Please select a zone first.');
          return;
        }
        setShowMatchmaking(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [player, socketReady, currentZone, isMatchmakingBattle])

  // Handle combat rejoin
  const handleCombatRejoin = React.useCallback(async (combatInfo) => {
    console.log('[app] 🔄 Rejoining combat:', combatInfo.combatInstanceId);
    console.log('[app] Combat zone:', combatInfo.zone?.name, '(ID:', combatInfo.zoneId, ')');
    console.log('[app] Current zone before rejoin:', currentZone?.name);
    
    if (!socketRef.current || !combatInfo) {
      console.error('[app] Cannot rejoin: missing socket or combat info');
      return;
    }
    
    // Switch to combat scene
    setInCombatMatch(true);
    setIsMatchmakingBattle(combatInfo.isMatchmaking || false);
    setShowCombatRejoin(false);
    
    // Update zone before joining combat if we have zone info
    if (combatInfo.zone) {
      console.log('[app] 🗺️ Updating zone for combat rejoin:', combatInfo.zone.name);
      setCurrentZone(combatInfo.zone);
    } else if (combatInfo.zoneId) {
      console.log('[app] ⚠️ Have zoneId but no zone object, fetching zone data...');
      // Fetch zone data if we only have the ID
      socketRef.current.emit('zone:get', { zoneId: combatInfo.zoneId }, (zoneResponse) => {
        if (zoneResponse?.ok && zoneResponse.zone) {
          setCurrentZone(zoneResponse.zone);
        }
      });
    }
    
    // Join the combat instance
    socketRef.current.emit('combat:join-matchmaking', 
      { combatInstanceId: combatInfo.combatInstanceId }, 
      (response) => {
        if (response?.ok) {
          console.log('[app] ✅ Successfully rejoined combat');
          console.log('[app] ✅ Fighting in zone:', combatInfo.zone?.name || combatInfo.zoneId);
          window.__inCombat = true;
        } else {
          console.error('[app] ❌ Failed to rejoin combat:', response?.error);
          setInCombatMatch(false);
          setIsMatchmakingBattle(false);
          setShowCombatRejoin(false);
        }
      }
    );
  }, [currentZone]);
  
  // Handle combat rejoin decline
  const handleCombatRejoinDecline = React.useCallback(() => {
    console.log('[app] 🚫 Player declined to rejoin combat');
    
    if (socketRef.current && activeCombatInfo) {
      // Decline combat rejoin (marks as abandoned)
      socketRef.current.emit('combat:decline-rejoin', (response) => {
        if (response?.ok) {
          console.log('[app] ✅ Combat declined successfully:', response.message);
        } else {
          console.error('[app] ❌ Failed to decline combat:', response?.error);
        }
      });
    }
    
    setShowCombatRejoin(false);
    setActiveCombatInfo(null);
  }, [activeCombatInfo]);

  // Handle matchmaking battle start
  const handleMatchStarted = React.useCallback((data) => {
    console.log('='.repeat(60));
    console.log('[app] 🎮 MATCH STARTED - JOINING COMBAT');
    console.log('[app] Data received:', data);
    console.log('[app] Previous zone:', currentZone?.name, currentZone?.id);
    console.log('[app] New zone (arena):', data.zone?.name, data.zone?.id);
    console.log('='.repeat(60));
    const { combatInstanceId, zone, position } = data;
    
    // Switch to combat scene and mark as matchmaking battle
    setInCombatMatch(true);
    setIsMatchmakingBattle(true);
    console.log('[app] inCombatMatch set to TRUE (matchmaking)');
    setShowMatchmaking(false); // Close matchmaking modal
    
    if (combatInstanceId && socketRef.current) {
      // Join the matchmaking combat instance
      console.log('[app] Emitting combat:join-matchmaking with combatInstanceId:', combatInstanceId);
      socketRef.current.emit('combat:join-matchmaking', { combatInstanceId }, (response) => {
        if (response?.ok) {
          console.log('[app] ✅ Successfully joined matchmaking combat instance:', combatInstanceId);
          console.log('[app] ✅ Combat will take place in zone:', zone?.name || 'unknown');
          window.__inCombat = true;
        } else {
          console.error('[app] ❌ Failed to join matchmaking combat:', response?.error);
        }
      });
    } else {
      console.error('[app] ❌ Missing combatInstanceId or socket:', { combatInstanceId, hasSocket: !!socketRef.current });
    }
    
    // Update zone to arena zone if provided
    if (zone) {
      console.log('[app] 🗺️ Updating current zone to arena:', zone.name);
      setCurrentZone(zone);
    }
    
    // Update position if provided
    if (position) {
      playerPositionRef.current = [position.x, position.y, position.z];
    }
  }, [currentZone]);
  
  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
    { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'run', keys: ['Shift'] },
  ]
  
  return (
    <div className="game-app-container">
    {/* Game Header */}
    {player && socketReady && (
      <GameHeader
        player={player}
        playerHeroes={playerHeroes}
        currentZone={currentZone}
        socketRef={socketRef}
        isMatchmakingBattle={isMatchmakingBattle}
        onShowZoneSelector={() => setShowZoneSelector(true)}
        onShowMatchmaking={() => {
          if (!currentZone) {
            alert('You must be in a zone to join matchmaking. Please select a zone first.');
            return;
          }
          setShowMatchmaking(true);
        }}
        onShowHeroSelection={() => setShowHeroSelection(true)}
        onShowLeaderboard={() => setShowLeaderboard(true)}
        onShowHeroSwitcher={() => setShowHeroSwitcher(true)}
        onLogout={() => {
          setPlayer(null);
          setSocketReady(false);
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
          }
        }}
      />
    )}
    <AuthOverlay
      open={authOpen}
      onClose={() => setAuthOpen(false)}
      onAuthenticated={(p) => { setPlayer(p); setAuthOpen(false); }}
    />
    {/* <GameInstructions /> */}
    {player && !socketReady && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/35 z-50">
        <div className="px-4 py-3 bg-gray-900 text-gray-200 border border-gray-700 rounded-lg text-[13px]">
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
                skipAutoJoinCombat={isMatchmakingBattle}
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
                showLeaderboard={showLeaderboard}
                onShowLeaderboardChange={setShowLeaderboard}
                showHeroSwitcher={showHeroSwitcher}
                onShowHeroSwitcherChange={setShowHeroSwitcher}
                onHeroSelected={(updatedPlayer) => {
                  setPlayer(updatedPlayer);
                }}
                onHeroesUpdate={(updatedHeroes) => {
                  setPlayerHeroes(updatedHeroes);
                }}
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
    {player && socketReady && showZoneSelector && !isMatchmakingBattle && (
      <ZoneSelector
        socket={socketRef.current}
        playerLevel={
          playerHeroes?.find(h => h.playerHeroId === player.active_hero_id)?.level || 1
        }
        onClose={() => setShowZoneSelector(false)}
        onZoneChange={handleZoneChange}
      />
    )}
    
    {/* Matchmaking Modal */}
    {player && socketReady && showMatchmaking && !isMatchmakingBattle && (
      <MatchmakingQueue
        socket={socketRef.current}
        onClose={() => setShowMatchmaking(false)}
        onMatchStarted={handleMatchStarted}
      />
    )}
    
    {/* Zone Transition Screen */}
    <ZoneTransition />
    
    {/* Combat Rejoin Modal */}
    {showCombatRejoin && activeCombatInfo && (
      <CombatRejoinModal
        combatInfo={activeCombatInfo}
        onRejoin={handleCombatRejoin}
        onDecline={handleCombatRejoinDecline}
      />
    )}
    </div>
  )
}
