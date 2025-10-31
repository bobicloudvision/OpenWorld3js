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
  onHeroSelected,
  onHeroesUpdate
}) {
  const mapFilePath = currentZone?.map_file ? `/models/${currentZone.map_file}` : '/models/world1.glb';
  console.log('[LobbyScene] Rendering with zone:', currentZone?.name, 'map_file:', currentZone?.map_file, 'computed mapPath:', mapFilePath);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden)
  const [inCombat, setInCombat] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showHeroSwitcher, setShowHeroSwitcher] = useState(false)
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
    if (switchInitiated && !heroSwitchError && !switchingHero && showHeroSwitcher) {
      // Small delay to let user see the success state
      const timer = setTimeout(() => {
        setShowHeroSwitcher(false)
        setSwitchInitiated(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [switchInitiated, heroSwitchError, switchingHero, showHeroSwitcher])

  const handleSwitchHero = (playerHeroId) => {
    setSwitchInitiated(true)
    switchHero(playerHeroId)
  }

  return (
    <>
      {/* Leaderboard Button */}
      <button
        onClick={() => setShowLeaderboard(true)}
        style={{
          position: 'fixed',
          top: 20,
          right: 200,
          zIndex: 1000,
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          border: '2px solid #fbbf24',
          borderRadius: '8px',
          padding: '10px 16px',
          color: '#000',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.2s',
          pointerEvents: 'auto'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        🏆 Leaderboard
      </button>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard 
          socket={socket} 
          player={player}
          onClose={() => setShowLeaderboard(false)} 
        />
      )}

      {/* Hero Switcher Button */}
      <button
        onClick={() => setShowHeroSwitcher(true)}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '2px solid #667eea',
          borderRadius: '8px',
          padding: '10px 16px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.2s',
          pointerEvents: 'auto'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        ⚔️ Switch Hero
      </button>

      {/* Hero Switcher Modal */}
      {showHeroSwitcher && (
        <HeroSwitcherModal
          player={player}
          playerHeroes={playerHeroes}
          loading={switchingHero}
          error={heroSwitchError}
          onSelectHero={handleSwitchHero}
          onClose={() => setShowHeroSwitcher(false)}
        />
      )}

      {/* Hero Info */}
      <HeroStatsPanel 
        activeHero={activeHero} 
        onOpenHeroSelection={() => setShowHeroSwitcher(true)}
      />

      <Chat socket={socket} currentPlayerId={player?.id} />
      
      <EcctrlJoystick />
      <Canvas 
        shadows
        style={{ pointerEvents: 'auto' }}
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

