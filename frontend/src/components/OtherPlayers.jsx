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
  
  // Smooth interpolation for position and rotation updates
  // IMPORTANT: This hook MUST be called on every render (Rules of Hooks)
  useFrame((state, delta) => {
    // Early return inside the callback is fine - but the hook itself must always be called
    if (!modelPath) return
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
  // Use JSON.stringify to detect actual value changes, not just reference changes
  // This ensures the effect triggers even if the array reference is the same but values changed
  const positionKey = JSON.stringify(otherPlayer.position)
  const rotationKey = JSON.stringify(otherPlayer.rotation)
  
  useEffect(() => {
    if (otherPlayer.position && Array.isArray(otherPlayer.position) && otherPlayer.position.length === 3) {
      // Always create a new array to ensure state update is triggered
      setTargetPosition([...otherPlayer.position])
    }
    if (otherPlayer.rotation && Array.isArray(otherPlayer.rotation) && otherPlayer.rotation.length === 3) {
      // Always create a new array to ensure state update is triggered
      setTargetRotation([...otherPlayer.rotation])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionKey, rotationKey])
  
  // Apply hero model scale and rotation offset (model-specific rotation)
  const modelScale = otherPlayer.heroModelScale ?? 1
  const modelRotationOffset = otherPlayer.heroModelRotation || [0, 0, 0]
  
  // Get player name for the badge
  const playerName = otherPlayer.name || `Player ${otherPlayer.socketId?.substring(0, 6) || 'Unknown'}`
  
  // Don't render anything if no model path (but still call all hooks above!)
  if (!modelPath) {
    return null
  }
  
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
  const [otherPlayers, setOtherPlayers] = useState(new Map()) // playerId -> playerData (includes socketId)
  const playerLastUpdateRef = useRef(new Map()) // Track last update time for each player (by playerId)
  
  useEffect(() => {
    if (!socket) return

    // Request current players list on mount (in case we missed the initial event)
    socket.emit('players:list:request')

    // Handle initial list of players when joining
    const handlePlayersJoined = (players) => {
      console.log('[OtherPlayers] Received players list:', players.length, 'players')
      const playersMap = new Map()
      const now = Date.now()
      const seenPlayerIds = new Set()
      
      players.forEach(player => {
        // Skip current player and prevent duplicates (use playerId as unique key)
        if (player.playerId !== currentPlayerId && player.playerId && !seenPlayerIds.has(player.playerId)) {
          seenPlayerIds.add(player.playerId)
          playersMap.set(player.playerId, player) // Use playerId as Map key
          playerLastUpdateRef.current.set(player.playerId, now)
          console.log(`[OtherPlayers] Added player ${player.playerId} (${player.name || 'Unknown'})`)
        }
      })
      console.log(`[OtherPlayers] Total other players in map: ${playersMap.size}`)
      setOtherPlayers(playersMap)
    }
    
    // Handle new player joining
    const handlePlayerJoined = (playerData) => {
      if (playerData.playerId === currentPlayerId || !playerData.playerId) return
      console.log(`[OtherPlayers] Player joined: ${playerData.playerId} (${playerData.name || 'Unknown'})`)
      setOtherPlayers(prev => {
        // If player already exists, merge data and update socketId (for reconnections)
        // If not, add as new player
        const updated = new Map(prev)
        if (prev.has(playerData.playerId)) {
          // Player reconnected! Update their socketId and merge data
          console.log(`[OtherPlayers] Player ${playerData.playerId} reconnected (updating socketId)`)
          const existing = prev.get(playerData.playerId)
          updated.set(playerData.playerId, {
            ...existing,
            ...playerData,
            socketId: playerData.socketId, // Update socketId for reconnection
            // Preserve position/rotation if not in new data
            position: playerData.position || existing.position,
            rotation: playerData.rotation || existing.rotation,
          })
        } else {
          // New player joining
          console.log(`[OtherPlayers] Added new player ${playerData.playerId}`)
          updated.set(playerData.playerId, playerData)
        }
        playerLastUpdateRef.current.set(playerData.playerId, Date.now())
        return updated
      })
    }
    
    // Handle player position updates
    const handlePositionChanged = ({ socketId, playerId: incomingPlayerId, position, rotation }) => {
      // Log first position update for debugging (throttled)
      if (!handlePositionChanged._lastLog || Date.now() - handlePositionChanged._lastLog > 5000) {
        console.log(`[OtherPlayers] Position update - playerId: ${incomingPlayerId}, socketId: ${socketId?.substring(0, 6)}`)
        handlePositionChanged._lastLog = Date.now()
      }
      
      const now = Date.now()
      setOtherPlayers(prev => {
        const updated = new Map(prev)
        
        // Find player by playerId (preferred) or by socketId (fallback for older events)
        let player = null
        let playerIdKey = null
        
        if (incomingPlayerId) {
          // Use playerId from event (best case)
          player = updated.get(incomingPlayerId)
          playerIdKey = incomingPlayerId
        } else {
          // Fallback: find player by socketId (for backward compatibility)
          for (const [pid, p] of updated.entries()) {
            if (p.socketId === socketId) {
              player = p
              playerIdKey = pid
              break
            }
          }
        }
        
        if (player && playerIdKey) {
          // Player found - update their position
          const newPosition = position && Array.isArray(position) && position.length === 3 
            ? [...position] 
            : player.position ? [...player.position] : [0, 0, 0]
          const newRotation = rotation && Array.isArray(rotation) && rotation.length === 3 
            ? [...rotation] 
            : player.rotation ? [...player.rotation] : [0, 0, 0]
          
          updated.set(playerIdKey, {
            ...player,
            socketId, // Update socketId in case it changed (reconnection)
            position: newPosition,
            rotation: newRotation,
          })
          playerLastUpdateRef.current.set(playerIdKey, now)
        } else if (incomingPlayerId) {
          // Player not found but we have playerId - create minimal entry
          // This handles case where position update arrives before join event
          updated.set(incomingPlayerId, {
            socketId,
            playerId: incomingPlayerId,
            position: position && Array.isArray(position) && position.length === 3 ? [...position] : [0, 0, 0],
            rotation: rotation && Array.isArray(rotation) && rotation.length === 3 ? [...rotation] : [0, 0, 0],
            name: `Player ${incomingPlayerId}`,
            heroModel: null, // Will be set when full data arrives
          })
          playerLastUpdateRef.current.set(incomingPlayerId, now)
          console.log(`[OtherPlayers] Created minimal entry for player ${incomingPlayerId} from position update`)
        }
        // If no playerId available, ignore the update (can't create stable entry)
        
        return updated
      })
    }
    
    // Handle player hero updates
    const handleHeroChanged = ({ socketId, playerId: incomingPlayerId, ...heroData }) => {
      const now = Date.now()
      setOtherPlayers(prev => {
        const updated = new Map(prev)
        
        // Find player by playerId (preferred) or by socketId (fallback)
        let player = null
        let playerIdKey = null
        
        if (incomingPlayerId) {
          // Use playerId from event (best case)
          player = updated.get(incomingPlayerId)
          playerIdKey = incomingPlayerId
        } else {
          // Fallback: find player by socketId
          for (const [pid, p] of updated.entries()) {
            if (p.socketId === socketId) {
              player = p
              playerIdKey = pid
              break
            }
          }
        }
        
        if (player && playerIdKey) {
          // Player found - update their hero data
          updated.set(playerIdKey, {
            ...player,
            ...heroData,
            socketId, // Update socketId in case it changed (reconnection)
          })
          playerLastUpdateRef.current.set(playerIdKey, now)
        } else if (incomingPlayerId) {
          // Player not found but we have playerId - create minimal entry
          // This handles case where hero change arrives before join event
          updated.set(incomingPlayerId, {
            socketId,
            playerId: incomingPlayerId,
            ...heroData,
            position: heroData.position || [0, 0, 0],
            rotation: heroData.rotation || [0, 0, 0],
          })
          playerLastUpdateRef.current.set(incomingPlayerId, now)
          console.log(`[OtherPlayers] Created minimal entry for player ${incomingPlayerId} from hero update`)
        }
        // If no playerId available, ignore the update (can't create stable entry)
        
        return updated
      })
    }
    
    // Handle player leaving
    const handlePlayerLeft = ({ socketId, playerId: incomingPlayerId }) => {
      setOtherPlayers(prev => {
        const updated = new Map(prev)
        
        // Find and remove player by playerId (preferred) or socketId (fallback)
        if (incomingPlayerId) {
          updated.delete(incomingPlayerId)
          playerLastUpdateRef.current.delete(incomingPlayerId)
        } else {
          // Fallback: find player by socketId and remove
          for (const [pid, p] of updated.entries()) {
            if (p.socketId === socketId) {
              updated.delete(pid)
              playerLastUpdateRef.current.delete(pid)
              break
            }
          }
        }
        
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
        
        // Remove stale players (by playerId)
        for (const [playerId, lastUpdate] of playerLastUpdateRef.current.entries()) {
          if (now - lastUpdate > STALE_THRESHOLD) {
            updated.delete(playerId)
            playerLastUpdateRef.current.delete(playerId)
            hasChanges = true
            console.log(`Removed stale player: ${playerId}`)
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
  
  // Convert Map to array (already unique by playerId since Map uses playerId as key)
  // Still filter to ensure player has required data
  const players = Array.from(otherPlayers.values()).filter((player) => 
    player.playerId && player.socketId
  )
  
  // Log player count changes (throttled)
  useEffect(() => {
    console.log(`[OtherPlayers] Rendering ${players.length} other players`)
    players.forEach(p => {
      console.log(`  - Player ${p.playerId} (${p.name}): model=${p.heroModel || 'none'}, pos=${JSON.stringify(p.position)}`)
    })
  }, [players.length])
  
  return (
    <>
      {players.map(player => (
        <OtherPlayer key={player.playerId} otherPlayer={player} />
      ))}
    </>
  )
}

