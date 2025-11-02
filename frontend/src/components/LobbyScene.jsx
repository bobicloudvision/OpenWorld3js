import React, { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, KeyboardControls } from '@react-three/drei'
import Ecctrl, { EcctrlJoystick } from 'ecctrl'
import Player from './Player'
import OtherPlayers from './OtherPlayers'
import Ground from './Ground'
import { Shapes } from './Shapes'
import HiddenElementPlaceholders from './HiddenElementPlaceholders'
import GameManager from './GameManager'
import Chat from './Chat'
import Leaderboard from './Leaderboard'
import HeroSwitcherModal from './HeroSwitcherModal'
import HeroStatsPanel from './HeroStatsPanel'

function LobbyScene({ 
  playerPositionRef, 
  keyboardMap, 
  activeHero,
  socket,
  player,
  playerHeroes,
  onEnterBattle,
  currentZone,
  showLeaderboard,
  onShowLeaderboardChange,
  showHeroSwitcher,
  onShowHeroSwitcherChange, 
  onHeroSelected,
  onHeroesUpdate
}) {
  const mapFilePath = React.useMemo(() => 
    currentZone?.map_file ? `/models/${currentZone.map_file}` : '/models/world1.glb',
    [currentZone?.map_file]
  );
  
  // Throttle render logging
  const lastRenderLogRef = React.useRef(0)
  const renderCount = React.useRef(0)
  renderCount.current++
  
  if (Date.now() - lastRenderLogRef.current > 1000) {
    console.log('[LobbyScene] Rendered', renderCount.current, 'times. Zone:', currentZone?.name, 'map_file:', currentZone?.map_file);
    renderCount.current = 0
    lastRenderLogRef.current = Date.now()
  }
  
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden)
  const [inCombat, setInCombat] = useState(false)

  // Memoize player position change handler
  const handlePositionChange = React.useCallback((position) => {
    playerPositionRef.current = position
  }, [playerPositionRef])

  // Log when zone changes
  useEffect(() => {
    console.log('[LobbyScene] Current zone changed:', {
      zoneId: currentZone?.id,
      zoneName: currentZone?.name,
      mapFile: currentZone?.map_file,
      environmentFile: currentZone?.environment_file,
      computedMapPath: mapFilePath
    });
  }, [currentZone, mapFilePath])

  // Listen for combat state changes
  useEffect(() => {
    if (!socket) return;

    const handleCombatJoined = () => {
      console.log('[lobby] Entered combat');
      setInCombat(true);
    };

    const handleCombatEnded = () => {
      console.log('[lobby] Combat ended');
      setInCombat(false);
      // Note: combat:leave is handled by GameplayScene cleanup
      // No need to emit here since combat has already ended server-side
    };

    socket.on('combat:joined', handleCombatJoined);
    socket.on('combat:ended', handleCombatEnded);

    return () => {
      socket.off('combat:joined', handleCombatJoined);
      socket.off('combat:ended', handleCombatEnded);
    };
  }, [socket])

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])


  return (
    <>
      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard 
          socket={socket} 
          player={player}
          onClose={() => onShowLeaderboardChange && onShowLeaderboardChange(false)} 
        />
      )}

      {/* Hero Switcher Modal */}
      {showHeroSwitcher && (
        <HeroSwitcherModal
          player={player}
          playerHeroes={playerHeroes}
          socket={socket}
          onHeroSelected={onHeroSelected}
          onHeroesUpdate={onHeroesUpdate}
          onClose={() => onShowHeroSwitcherChange && onShowHeroSwitcherChange(false)}
        />
      )}

      {/* Hero Info */}
      <HeroStatsPanel 
        activeHero={activeHero} 
        onOpenHeroSelection={() => onShowHeroSwitcherChange && onShowHeroSwitcherChange(true)}
      />

      <Chat socket={socket} currentPlayerId={player?.id} />
      
      {/* <EcctrlJoystick /> */}
      <Canvas 
        shadows
        style={{ 
          pointerEvents: 'auto',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1 // Keep Canvas behind UI elements (UI elements use z-[1000]+)
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            console.log('Canvas click detected (empty area)')
          }
        }}
      >
        <Environment 
          files={currentZone?.environment_file || "models/night.hdr"} 
          ground={{ scale: 100 }} 
        />
        
        <directionalLight intensity={0.4} castShadow shadow-bias={-0.0004} position={[0, 300, 200]}>
        </directionalLight>
        <ambientLight intensity={0.7} />
        
        <Physics 
          timeStep={isTabVisible ? "vary" : 1/60}
          gravity={[0, -20, 0]}
          paused={!isTabVisible}
          debug={false}
        >
          <KeyboardControls map={keyboardMap}>
            <Ecctrl 
              maxVelLimit={6}
              camFollowDistance={4}
            >
              <Player 
                onPositionChange={handlePositionChange}
                heroModel={activeHero?.model}
                heroModelScale={activeHero?.modelScale}
                heroModelRotation={activeHero?.modelRotation}
                socket={socket}
                playerName={player?.name}
              />
            </Ecctrl>
            
            {/* Render other players */} 
            <OtherPlayers socket={socket} currentPlayerId={player?.id} currentZoneId={currentZone?.id} /> 
            
            {/* <Shapes />
             */}
          </KeyboardControls>    
        
          <Ground 
            key={currentZone?.id || 'default'}
            playerPositionRef={playerPositionRef} 
            socket={socket} 
            disableCombat={!inCombat}
            mapFile={mapFilePath}
          />
          {/* <HiddenElementPlaceholders 
            key={`placeholders-${currentZone?.id || 'default'}`}
            mapFile={mapFilePath}
          /> */}
          <GameManager playerPositionRef={playerPositionRef} />
          
        </Physics>
      </Canvas>
    </>
  )
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(LobbyScene, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  // Return false if props are different (do re-render)
  
  // Always re-render if these critical props change
  if (
    prevProps.activeHero?.playerHeroId !== nextProps.activeHero?.playerHeroId ||
    prevProps.player?.id !== nextProps.player?.id ||
    prevProps.currentZone?.id !== nextProps.currentZone?.id ||
    prevProps.showLeaderboard !== nextProps.showLeaderboard ||
    prevProps.showHeroSwitcher !== nextProps.showHeroSwitcher ||
    prevProps.socket !== nextProps.socket
  ) {
    return false // Props changed, do re-render
  }
  
  // Skip re-render for playerHeroes if only stats changed (health/power)
  if (prevProps.playerHeroes !== nextProps.playerHeroes) {
    if (prevProps.playerHeroes?.length !== nextProps.playerHeroes?.length) {
      return false // Hero count changed, re-render
    }
    
    const prevIds = prevProps.playerHeroes?.map(h => h.playerHeroId).join(',') || ''
    const nextIds = nextProps.playerHeroes?.map(h => h.playerHeroId).join(',') || ''
    if (prevIds !== nextIds) {
      return false // Different heroes, re-render
    }
  }
  
  return true // Props effectively equal, skip re-render
})

