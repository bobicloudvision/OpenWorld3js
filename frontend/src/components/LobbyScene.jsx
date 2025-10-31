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

export default function LobbyScene({ 
  playerPositionRef, 
  keyboardMap, 
  activeHero,
  socket,
  player,
  onEnterBattle,
  currentZone
}) {
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden)
  const [inCombat, setInCombat] = useState(false)

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

  return (
    <>

      {/* Hero Info */}
      <div style={{
        position: 'fixed',
        top: 80,
        left: 20,
        zIndex: 50,
        background: 'rgba(17, 24, 39, 0.85)',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #374151',
        color: '#e5e7eb',
        fontSize: '14px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          {activeHero?.heroName || 'No Hero'}
        </div>
        {activeHero && (
          <>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>
              Level {activeHero.level || 1}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>
              Class: {activeHero.className || 'Unknown'}
            </div>
          </>
        )}
      </div>

      <Chat socket={socket} currentPlayerId={player?.id} />
      
      <EcctrlJoystick />
      <Canvas 
        shadows
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
            playerPositionRef={playerPositionRef} 
            socket={socket} 
            disableCombat={!inCombat}
            mapFile={currentZone?.map_file ? `/models/${currentZone.map_file}` : '/models/world1.glb'}
          />
          <HiddenElementPlaceholders />
          <GameManager playerPositionRef={playerPositionRef} />
          
        </Physics>
      </Canvas>
    </>
  )
}

