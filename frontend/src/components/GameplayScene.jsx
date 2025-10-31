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
  onHeroStatsUpdate,
  socket,
  player,
  onReturnToLobby,
  currentZone,
  skipAutoJoinCombat
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
      console.log('[combat] Joining combat from battle scene')
      socket.emit('combat:join', {
        enemyIds: [],
        zoneCenter: [0, 0, 0],
        zoneRadius: 150
      })
    }

    // Initial join on mount (only when in battle scene and not a matchmaking battle)
    if (!skipAutoJoinCombat) {
      joinCombat()
    }

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
      
      // Update hero stats from combat state
      if (state?.participants?.players && player?.id && player?.active_hero_id && onHeroStatsUpdate) {
        const playerCombatState = state.participants.players.find(p => p.playerId === player.id)
        if (playerCombatState) {
          // Update the active hero's combat stats (health, power)
          onHeroStatsUpdate(player.active_hero_id, {
            health: playerCombatState.health,
            power: playerCombatState.power
          })
        }
      }
    }

    const onEnded = (data) => {
      console.log('[combat] ended', data)
      window.__inCombat = false
      setCombatInstanceId(null)
      
      // Refresh hero data to get updated experience and level
      if (socket && socket.connected) {
        socket.emit('get:player:heroes')
      }
    }

    // Rejoin on reconnect or after auth OK (e.g., server restart) - only for non-matchmaking battles
    const onSocketConnect = () => {
      if (player && !skipAutoJoinCombat) {
        joinCombat()
      }
    }
    const onAuthOk = () => {
      if (!skipAutoJoinCombat) {
        joinCombat()
      }
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
      // Only leave combat when unmounting for non-matchmaking battles
      // For matchmaking battles, combat leave is handled by App.jsx when combat ends
      if (!skipAutoJoinCombat) {
        console.log('[combat] Leaving combat (battle scene unmounted)')
        socket.emit('combat:leave')
        window.__inCombat = false
      }
    }
  }, [socket, player, onHeroStatsUpdate, skipAutoJoinCombat])

  return (
    <>
      {/* Return to Lobby Button */}
      {onReturnToLobby && (
        <button
          onClick={onReturnToLobby}
          style={{
            position: 'fixed',
            top: 80,
            right: 20,
            zIndex: 100,
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: 'white',
            border: '2px solid #1e40af',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)'
            e.target.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
            e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}
        >
          🏰 Return to Lobby
        </button>
      )}
      
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
            {/* <Enemies playerPositionRef={playerPositionRef} /> */} 
            <CombatController playerPositionRef={playerPositionRef} />

            <MagicEffectsManager />
            <ClickEffectsManager />
            
          </KeyboardControls>    
        
          
          <Ground 
            playerPositionRef={playerPositionRef} 
            socket={socket}
            mapFile={currentZone?.map_file ? `/models/${currentZone.map_file}` : '/models/world1.glb'}
          />
          <HiddenElementPlaceholders />
          <GameManager playerPositionRef={playerPositionRef} />
          
        </Physics>
      </Canvas>
    </>
  )
}

