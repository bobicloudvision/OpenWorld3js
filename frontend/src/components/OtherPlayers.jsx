import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAvatarAnimations } from '../hooks/useAvatarAnimations'
import * as THREE from 'three'
import PlayerNameBadge from './PlayerNameBadge'

/**
 * Component to render other players in the multiplayer game
 * @param {Object} otherPlayer - The other player's data from server
 */
function OtherPlayer({ otherPlayer }) {
  const group = useRef()
  const initialPos = otherPlayer.position && Array.isArray(otherPlayer.position) ? otherPlayer.position : [0, 0, 0]
  const initialRot = otherPlayer.rotation && Array.isArray(otherPlayer.rotation) ? otherPlayer.rotation : [0, 0, 0]
  const [position, setPosition] = useState(initialPos)
  const [targetPosition, setTargetPosition] = useState(initialPos)
  const [rotation, setRotation] = useState(initialRot)
  const [targetRotation, setTargetRotation] = useState(initialRot)
  
  // Use shared avatar animations hook with the player's hero model
  const modelPath = otherPlayer.heroModel
  
  // Always call hooks at the top level - never conditionally!
  // Pass undefined (not null) so the hook uses its default model path
  const { clone, animationActions, setAction, updateMixer } = useAvatarAnimations(modelPath || undefined)
  
  // Now handle the conditional rendering AFTER all hooks are called
  if (!modelPath) {
    // console.log('No hero model found for player', otherPlayer.socketId)
    return null
  }
  
  // Smooth interpolation for position and rotation updates
  useFrame((state, delta) => {
    // Don't return early - allow component to render even while model is loading
    if (!clone || animationActions.current.length === 0) return
    
    // Update the mixer
    updateMixer(delta)
    
    if (!group.current) return
    
    // Smoothly interpolate position
    if (Array.isArray(targetPosition) && targetPosition.length === 3) {
      const currentPos = new THREE.Vector3(...position)
      const targetPos = new THREE.Vector3(...targetPosition)
      const distance = currentPos.distanceTo(targetPos)
      
      if (distance > 0.01) {
        // Interpolate position
        currentPos.lerp(targetPos, Math.min(1, delta * 10)) // Adjust speed as needed
        const newPos = [currentPos.x, currentPos.y, currentPos.z]
        setPosition(newPos)
        group.current.position.set(currentPos.x, currentPos.y, currentPos.z)
        
        // Set walk animation when moving
        if (animationActions.current[1]) {
          setAction(animationActions.current[1], 0.5)
        }
      } else {
        // Set idle animation when not moving
        if (animationActions.current[0]) {
          setAction(animationActions.current[0], 0.5)
        }
      }
    }
    
    // Smoothly interpolate rotation
    if (Array.isArray(targetRotation) && targetRotation.length === 3) {
      const currentEuler = new THREE.Euler(...rotation, 'XYZ')
      const targetEuler = new THREE.Euler(...targetRotation, 'XYZ')
      
      // Create quaternions for smooth rotation interpolation
      const currentQuat = new THREE.Quaternion().setFromEuler(currentEuler)
      const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler)
      
      // Check if rotation changed significantly
      if (currentQuat.angleTo(targetQuat) > 0.01) {
        // Interpolate rotation
        currentQuat.slerp(targetQuat, Math.min(1, delta * 10))
        const newEuler = new THREE.Euler().setFromQuaternion(currentQuat, 'XYZ')
        const newRot = [newEuler.x, newEuler.y, newEuler.z]
        setRotation(newRot)
        group.current.rotation.set(newEuler.x, newEuler.y, newEuler.z)
      }
    }
  })
  
  // Update target position and rotation when they change from server
  useEffect(() => {
    if (otherPlayer.position && Array.isArray(otherPlayer.position) && otherPlayer.position.length === 3) {
      setTargetPosition(otherPlayer.position)
    }
    if (otherPlayer.rotation && Array.isArray(otherPlayer.rotation) && otherPlayer.rotation.length === 3) {
      setTargetRotation(otherPlayer.rotation)
    }
  }, [otherPlayer.position, otherPlayer.rotation])
  
  // Apply hero model scale and rotation offset (model-specific rotation)
  const modelScale = otherPlayer.heroModelScale ?? 1
  const modelRotationOffset = otherPlayer.heroModelRotation || [0, 0, 0]
  
  // Get player name for the badge
  const playerName = otherPlayer.name || `Player ${otherPlayer.socketId?.substring(0, 6) || 'Unknown'}`
  
  // Render even if clone is not ready - prevents disappearing during model loading
  // The clone will be added when available (react-three-fiber handles this)
  return (
    <group 
      ref={group} 
      position={[position[0], position[1], position[2]]}
      rotation={rotation}
    >
      <group rotation={modelRotationOffset}>
        {clone && (
          <primitive 
            object={clone} 
            castShadow 
            receiveShadow
            scale={modelScale} 
          />
        )}
      </group>
      
      {/* Player name badge - billboard style (always faces camera) */}
      <PlayerNameBadge 
        playerName={playerName} 
        height={2.2}
        modelScale={modelScale}
      />
    </group>
  )
}

/**
 * Main component that manages all other players
 * @param {Object} socket - The socket.io instance
 * @param {number} currentPlayerId - The current player's ID to exclude from rendering
 */
export default function OtherPlayers({ socket, currentPlayerId }) {
  const [otherPlayers, setOtherPlayers] = useState(new Map()) // socketId -> playerData
  const playerLastUpdateRef = useRef(new Map()) // Track last update time for each player
  
  useEffect(() => {
    if (!socket) return

    // Request current players list on mount (in case we missed the initial event)
    socket.emit('players:list:request')

    // Handle initial list of players when joining
    const handlePlayersJoined = (players) => {
      const playersMap = new Map()
      const now = Date.now()
      players.forEach(player => {
        if (player.playerId !== currentPlayerId) {
          playersMap.set(player.socketId, player)
          playerLastUpdateRef.current.set(player.socketId, now)
        }
      })
      setOtherPlayers(playersMap)
    }
    
    // Handle new player joining
    const handlePlayerJoined = (playerData) => {
      if (playerData.playerId === currentPlayerId) return
      setOtherPlayers(prev => {
        const updated = new Map(prev)
        updated.set(playerData.socketId, playerData)
        playerLastUpdateRef.current.set(playerData.socketId, Date.now())
        return updated
      })
    }
    
    // Handle player position updates
    const handlePositionChanged = ({ socketId, position, rotation }) => {
      const now = Date.now()
      setOtherPlayers(prev => {
        const updated = new Map(prev)
        const player = updated.get(socketId)
        if (player) {
          updated.set(socketId, {
            ...player,
            position: position || player.position,
            rotation: rotation || player.rotation,
          })
          playerLastUpdateRef.current.set(socketId, now)
        } else {
          // Player not in map yet - might have missed join event
          // Create a minimal player entry to prevent data loss
          // The full player data will come in a hero change or join event
          updated.set(socketId, {
            socketId,
            playerId: null, // Will be set when full data arrives
            position: position || [0, 0, 0],
            rotation: rotation || [0, 0, 0],
            name: `Player ${socketId.substring(0, 6)}`,
          })
          playerLastUpdateRef.current.set(socketId, now)
        }
        return updated
      })
    }
    
    // Handle player hero updates
    const handleHeroChanged = ({ socketId, ...heroData }) => {
      const now = Date.now()
      setOtherPlayers(prev => {
        const updated = new Map(prev)
        const player = updated.get(socketId)
        if (player) {
          updated.set(socketId, {
            ...player,
            ...heroData,
          })
          playerLastUpdateRef.current.set(socketId, now)
        } else {
          // Player not in map yet - create entry with hero data
          // Position will be set when it arrives
          updated.set(socketId, {
            socketId,
            ...heroData,
            position: heroData.position || [0, 0, 0],
            rotation: heroData.rotation || [0, 0, 0],
          })
          playerLastUpdateRef.current.set(socketId, now)
        }
        return updated
      })
    }
    
    // Handle player leaving
    const handlePlayerLeft = ({ socketId }) => {
      setOtherPlayers(prev => {
        const updated = new Map(prev)
        updated.delete(socketId)
        playerLastUpdateRef.current.delete(socketId)
        return updated
      })
    }
    
    socket.on('players:joined', handlePlayersJoined)
    socket.on('player:joined', handlePlayerJoined)
    socket.on('player:position:changed', handlePositionChanged)
    socket.on('player:hero:changed', handleHeroChanged)
    socket.on('player:left', handlePlayerLeft)
    
    return () => {
      socket.off('players:joined', handlePlayersJoined)
      socket.off('player:joined', handlePlayerJoined)
      socket.off('player:position:changed', handlePositionChanged)
      socket.off('player:hero:changed', handleHeroChanged)
      socket.off('player:left', handlePlayerLeft)
    }
  }, [socket, currentPlayerId])
  
  // Keep-alive mechanism: periodically check for stale players and refresh list
  useEffect(() => {
    if (!socket) return
    
    const KEEP_ALIVE_INTERVAL = 30000 // 30 seconds - check for stale players
    const REFRESH_INTERVAL = 60000 // 60 seconds - refresh full player list
    const STALE_THRESHOLD = 60000 // 60 seconds - consider player stale if no update
    
    // Check for stale players periodically
    const keepAliveInterval = setInterval(() => {
      const now = Date.now()
      setOtherPlayers(prev => {
        const updated = new Map(prev)
        let hasChanges = false
        
        // Remove stale players
        for (const [socketId, lastUpdate] of playerLastUpdateRef.current.entries()) {
          if (now - lastUpdate > STALE_THRESHOLD) {
            updated.delete(socketId)
            playerLastUpdateRef.current.delete(socketId)
            hasChanges = true
            console.log(`Removed stale player: ${socketId}`)
          }
        }
        
        return hasChanges ? updated : prev
      })
    }, KEEP_ALIVE_INTERVAL)
    
    // Periodically request fresh player list to sync with server
    const refreshInterval = setInterval(() => {
      socket.emit('players:list:request')
    }, REFRESH_INTERVAL)
    
    return () => {
      clearInterval(keepAliveInterval)
      clearInterval(refreshInterval)
    }
  }, [socket])
  
  return (
    <>
      {Array.from(otherPlayers.values()).map(player => (
        <OtherPlayer key={player.socketId} otherPlayer={player} />
      ))}
    </>
  )
}

