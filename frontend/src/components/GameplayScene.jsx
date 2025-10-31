import React, { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, KeyboardControls } from '@react-three/drei'
import Ecctrl, { EcctrlJoystick } from 'ecctrl'
import Player from './Player'
import OtherPlayers from './OtherPlayers'
import Ground from './Ground'
import { Shapes } from './Shapes'
import Enemies from './Enemies'
import CombatController from './CombatController'
import MagicEffectsManager from './MagicEffectsManager'
import ClickEffectsManager from './ClickEffectsManager'
import HiddenElementPlaceholders from './HiddenElementPlaceholders'
import GameManager from './GameManager'
import GameUI from './GameUI'
import MagicPalette from './MagicPalette'
import { KeyboardShapeCreator } from './KeyboardShapeCreator'
import { MaterialPalette } from './MaterialPalette'
import Chat from './Chat'
import { addVfx } from '../stores/effectsStore'

export default function GameplayScene({ 
  playerPositionRef, 
  keyboardMap, 
  activeHero,
  onOpenHeroSelection,
  socket,
  player
}) {
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden)
  const [combatInstanceId, setCombatInstanceId] = useState(null)
  const [hasJoinedOnce, setHasJoinedOnce] = useState(false)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Encapsulate joining combat and listeners
  useEffect(() => {
    if (!socket || !player) return

    const joinCombat = () => {
      socket.emit('combat:join', {
        enemyIds: [],
        zoneCenter: [0, 0, 0],
        zoneRadius: 150
      })
    }

    // Initial join on mount
    joinCombat()

    const onJoined = (payload) => {
      setCombatInstanceId(payload?.combatInstanceId || null)
      setHasJoinedOnce(true)
      window.__inCombat = true
      console.log('[combat] joined', payload)

      // Flush any queued cast from Ground
      if (window.__queuedCast && socket && socket.connected) {
        const { spellKey, targetPosition } = window.__queuedCast
        delete window.__queuedCast
        socket.emit('combat:cast-spell', { spellKey, targetPosition })
      }
    }

    const onActionResolved = (result) => {
      console.log('[combat] action-resolved', result)
      const { targetPosition, spellKey, aoeRadius } = result || {}
      const isZeroRadius = typeof aoeRadius === 'number' && aoeRadius <= 0
      const vfxPos = isZeroRadius && Array.isArray(playerPositionRef.current)
        ? playerPositionRef.current
        : targetPosition
      const vfxRadius = typeof aoeRadius === 'number' ? Math.max(1.2, aoeRadius) : 2

      if (vfxPos && spellKey) {
        addVfx(vfxPos, spellKey, vfxRadius)
      } else {
        console.warn('[combat] VFX skipped:', { vfxPos, spellKey })
      }
    }

    const onError = (error) => {
      console.warn('[combat] error:', error.message)
    }

    const onStateUpdate = (state) => {
      // console.log('[combat] state-update', state)
    }

    const onEnded = (data) => {
      console.log('[combat] ended', data)
      window.__inCombat = false
      setCombatInstanceId(null)
    }

    // Rejoin on reconnect or after auth OK (e.g., server restart)
    const onSocketConnect = () => {
      if (player) {
        joinCombat()
      }
    }
    const onAuthOk = () => {
      joinCombat()
    }

    socket.on('combat:joined', onJoined)
    socket.on('combat:action-resolved', onActionResolved)
    socket.on('combat:error', onError)
    socket.on('combat:state-update', onStateUpdate)
    socket.on('combat:ended', onEnded)
    socket.on('connect', onSocketConnect)
    socket.on('auth:ok', onAuthOk)

    return () => {
      socket.off('combat:joined', onJoined)
      socket.off('combat:action-resolved', onActionResolved)
      socket.off('combat:error', onError)
      socket.off('combat:state-update', onStateUpdate)
      socket.off('combat:ended', onEnded)
      socket.off('connect', onSocketConnect)
      socket.off('auth:ok', onAuthOk)
      if (combatInstanceId) {
        socket.emit('combat:leave')
      }
    }
  }, [socket, player])

  return (
    <>
      <GameUI 
        playerPositionRef={playerPositionRef}
        onOpenHeroSelection={onOpenHeroSelection}
        activeHero={activeHero}
        socket={socket}
        playerId={player?.id}
      />
      <MagicPalette activeHero={activeHero} />
      
      {/* <KeyboardShapeCreator /> */}
      {/* <MaterialPalette /> */}

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
        <Environment files="models/night.hdr" ground={{ scale: 100 }} />
        
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
            {/* <Enemies playerPositionRef={playerPositionRef} /> */} 
            <CombatController playerPositionRef={playerPositionRef} />

            <MagicEffectsManager />
            <ClickEffectsManager />
            
          </KeyboardControls>    
        
          
          <Ground playerPositionRef={playerPositionRef} socket={socket} />
          <HiddenElementPlaceholders />
          <GameManager playerPositionRef={playerPositionRef} />
          
        </Physics>
      </Canvas>
    </>
  )
}

