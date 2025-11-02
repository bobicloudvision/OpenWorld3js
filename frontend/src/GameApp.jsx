import React, { useRef, useEffect } from 'react'
import { useEnemyManager } from './hooks/useEnemyManager'
import { useZoneManager } from './hooks/useZoneManager'
import { usePlayerHeroManager } from './hooks/usePlayerHeroManager'
import { useCombatManager } from './hooks/useCombatManager'
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

export default function GameApp({ onPlayerChange, socketRef, socketReady, disconnect }) {
  const playerPositionRef = React.useRef([0, 0, 0]);
  const [authOpen, setAuthOpen] = React.useState(false)
  const [showHeroSelection, setShowHeroSelection] = React.useState(false)
  const [showZoneSelector, setShowZoneSelector] = React.useState(false)
  const [showMatchmaking, setShowMatchmaking] = React.useState(false)
  const [showLeaderboard, setShowLeaderboard] = React.useState(false)
  const [showHeroSwitcher, setShowHeroSwitcher] = React.useState(false)

  // Create a ref to store the loadZoneData function so we can use it in the auth callback
  const loadZoneDataRef = React.useRef(null)
  const lastZoneLoadSocketIdRef = React.useRef(null)

  // Zone manager hook with callback to handle position updates
  const onZoneChangeCallback = React.useCallback((zone, position) => {
    // Update player position if provided
    if (position) {
      playerPositionRef.current = [position.x, position.y, position.z];
    }
  }, []);

  // Combat state change callback
  const onCombatStateChange = React.useCallback((inCombat, isMatchmaking) => {
    // Update window global for other scripts that might need it
    window.__inCombat = inCombat;
  }, []);

  // Memoize callbacks to prevent unnecessary re-renders
  const handlePlayerChange = React.useCallback((updatedPlayer) => {
    if (onPlayerChange) {
      onPlayerChange(updatedPlayer)
    }
  }, [onPlayerChange])

  const handleAuthCheckFailed = React.useCallback(() => {
    setAuthOpen(true)
  }, [])

  // Get player first from usePlayerHeroManager (it handles initial auth check)
  const {
    player,
    setPlayer,
    playerHeroes,
    setPlayerHeroes,
    availableHeroes,
    setAvailableHeroes,
    loadingHeroes,
    updateHeroStats,
    updateHeroes
  } = usePlayerHeroManager(socketRef, socketReady, handlePlayerChange, handleAuthCheckFailed)

  // Handle auth success - load zone data after socket is authenticated
  // This effect triggers when socket becomes ready and authenticated
  React.useEffect(() => {
    if (socketReady && socketRef?.current?.connected && loadZoneDataRef.current) {
      const socket = socketRef.current
      const socketId = socket.id
      
      // Check if we've already attempted to load zone for this socket ID
      const isReconnection = lastZoneLoadSocketIdRef.current && lastZoneLoadSocketIdRef.current !== socketId
      
      if (isReconnection || !lastZoneLoadSocketIdRef.current) {
        console.log('[GameApp] Socket authenticated, loading zone data...', {
          socketId,
          isReconnection,
          previousSocketId: lastZoneLoadSocketIdRef.current
        })
        lastZoneLoadSocketIdRef.current = socketId
        
        // Delay to ensure server has fully processed authentication binding
        setTimeout(() => {
          if (loadZoneDataRef.current && socket?.connected && socket.id === socketId) {
            console.log('[GameApp] Calling loadZoneData, socket ID:', socket.id)
            loadZoneDataRef.current(socket)
          }
        }, 600)
      }
    }
  }, [socketReady, socketRef])

  const {
    currentZone,
    handleZoneChange,
    loadZoneData,
    returnToLobby,
    getZoneById,
    updateZone
  } = useZoneManager(socketRef, socketReady, onZoneChangeCallback)

  // Combat manager hook
  const {
    inCombatMatch,
    isMatchmakingBattle,
    showCombatRejoin,
    activeCombatInfo,
    setInCombatMatch,
    handleCombatRejoin,
    handleCombatRejoinDecline,
    handleMatchStarted,
    setCombatState
  } = useCombatManager(socketRef, socketReady, onCombatStateChange, returnToLobby, updateZone, getZoneById)

  // Update combat state based on zone type
  React.useEffect(() => {
    if (currentZone) {
      if (currentZone.is_combat_zone && !currentZone.is_safe_zone) {
        console.log('[app] Switching to GameplayScene (combat zone)');
        setCombatState(true, false);
      } else {
        console.log('[app] Switching to LobbyScene (safe zone)');
        setCombatState(false, false);
      }
    }
  }, [currentZone, setCombatState]);

  // Store loadZoneData ref for use in auth success callback
  React.useEffect(() => {
    loadZoneDataRef.current = loadZoneData
  }, [loadZoneData])

  // Use enemy manager hook to handle all enemy-related logic
  useEnemyManager(socketRef, socketReady, currentZone);

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
          if (disconnect) {
            disconnect();
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
              updateHeroes(updatedPlayerHeroes, updatedAvailableHeroes);
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
                  updateHeroStats(heroId, stats);
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
                playerHeroes={playerHeroes}
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
                  updateHeroes(updatedPlayerHeroes, updatedAvailableHeroes);
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
        onMatchStarted={(data) => {
          setShowMatchmaking(false); // Close matchmaking modal
          const result = handleMatchStarted(data);
          // Update player position if provided
          if (result?.position) {
            playerPositionRef.current = [result.position.x, result.position.y, result.position.z];
          }
        }}
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
