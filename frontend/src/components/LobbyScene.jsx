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

  // Ensure we leave combat when entering lobby
  useEffect(() => {
    if (socket && socket.connected) {
      console.log('[lobby] Leaving combat and entering lobby')
      socket.emit('combat:leave')
      window.__inCombat = false
    }
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
      {/* Lobby UI */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100,
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{
          background: 'rgba(17, 24, 39, 0.9)',
          padding: '20px 30px',
          borderRadius: '12px',
          border: '2px solid #374151',
          pointerEvents: 'auto'
        }}>
          <h2 style={{ 
            color: '#e5e7eb', 
            margin: '0 0 15px 0',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            🏰 Lobby
          </h2>
          <p style={{ 
            color: '#9ca3af', 
            margin: '0 0 20px 0',
            fontSize: '14px'
          }}>
            Explore and chat with other players
          </p>
          <button
            onClick={onEnterBattle}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              border: '2px solid #7f1d1d',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)'
              e.target.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)'
              e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            ⚔️ Enter Battle Zone
          </button>
        </div>
      </div>

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
            disableCombat={true}
            mapFile={currentZone?.map_file ? `/models/${currentZone.map_file}` : '/models/world1.glb'}
          />
          <HiddenElementPlaceholders />
          <GameManager playerPositionRef={playerPositionRef} />
          
        </Physics>
      </Canvas>
    </>
  )
}

