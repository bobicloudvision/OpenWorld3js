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
import { useHeroSwitcher } from '../hooks/useHeroSwitcher'

export default function LobbyScene({ 
  playerPositionRef, 
  keyboardMap, 
  activeHero,
  socket,
  player,
  onEnterBattle,
  currentZone,
  showLeaderboard,
  onShowLeaderboardChange,
  showHeroSwitcher,
  onShowHeroSwitcherChange,
  onHeroSelected,
  onHeroesUpdate
}) {
  const mapFilePath = currentZone?.map_file ? `/models/${currentZone.map_file}` : '/models/world1.glb';
  console.log('[LobbyScene] Rendering with zone:', currentZone?.name, 'map_file:', currentZone?.map_file, 'computed mapPath:', mapFilePath);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden)
  const [inCombat, setInCombat] = useState(false)
  const [switchInitiated, setSwitchInitiated] = useState(false)
  
  // Use hero switcher hook
  const { 
    playerHeroes, 
    loading: switchingHero, 
    error: heroSwitchError,
    setError: setHeroSwitchError,
    fetchHeroes, 
    switchHero 
  } = useHeroSwitcher(socket, onHeroSelected, onHeroesUpdate)

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
      socket.emit('combat:leave');
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

  // Fetch player heroes when hero switcher is opened
  useEffect(() => {
    if (!socket || !showHeroSwitcher) return
    // Clear any previous errors and switch state when opening modal
    setHeroSwitchError('')
    setSwitchInitiated(false)
    fetchHeroes()
  }, [socket, showHeroSwitcher, fetchHeroes, setHeroSwitchError])

  // Close modal on successful hero switch
  useEffect(() => {
    if (switchInitiated && !heroSwitchError && !switchingHero && showHeroSwitcher && onShowHeroSwitcherChange) {
      // Small delay to let user see the success state
      const timer = setTimeout(() => {
        onShowHeroSwitcherChange(false)
        setSwitchInitiated(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [switchInitiated, heroSwitchError, switchingHero, showHeroSwitcher, onShowHeroSwitcherChange])

  const handleSwitchHero = (playerHeroId) => {
    setSwitchInitiated(true)
    switchHero(playerHeroId)
  }

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
          loading={switchingHero}
          error={heroSwitchError}
          onSelectHero={handleSwitchHero}
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
                onPositionChange={function(position) {
                  playerPositionRef.current = position; 
                }}
                heroModel={activeHero?.model}
                heroModelScale={activeHero?.modelScale}
                heroModelRotation={activeHero?.modelRotation}
                socket={socket}
                playerName={player?.name}
              />
            </Ecctrl>
            
            {/* Render other players */}
            <OtherPlayers socket={socket} currentPlayerId={player?.id} /> 
            
            <Shapes />
            
          </KeyboardControls>    
        
          <Ground 
            key={currentZone?.id || 'default'}
            playerPositionRef={playerPositionRef} 
            socket={socket} 
            disableCombat={!inCombat}
            mapFile={mapFilePath}
          />
          <HiddenElementPlaceholders 
            key={`placeholders-${currentZone?.id || 'default'}`}
            mapFile={mapFilePath}
          />
          <GameManager playerPositionRef={playerPositionRef} />
          
        </Physics>
      </Canvas>
    </>
  )
}

