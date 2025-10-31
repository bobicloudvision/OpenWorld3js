import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAvatarAnimations } from '../hooks/useAvatarAnimations'
import * as THREE from 'three'

/**
 * Component to render other players in the multiplayer game
 * @param {Object} otherPlayer - The other player's data from server
 */
function OtherPlayer({ otherPlayer }) {
  const group = useRef()
  const initialPos = otherPlayer.position && Array.isArray(otherPlayer.position) ? otherPlayer.position : [0, 0, 0]
  const [position, setPosition] = useState(initialPos)
  const [targetPosition, setTargetPosition] = useState(initialPos)
  
  // Use shared avatar animations hook with the player's hero model
  const defaultModel = '/models/avatars/NightshadeJFriedrich.glb'
  const modelPath = otherPlayer.heroModel || defaultModel
  const { clone, animationActions, setAction, updateMixer } = useAvatarAnimations(modelPath)
  
  // Smooth interpolation for position updates
  useFrame((state, delta) => {
    if (!clone || animationActions.current.length === 0) return
    
    // Update the mixer
    updateMixer(delta)
    
    // Smoothly interpolate position
    if (group.current && Array.isArray(targetPosition) && targetPosition.length === 3) {
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
  })
  
  // Update target position when it changes from server
  useEffect(() => {
    if (otherPlayer.position && Array.isArray(otherPlayer.position) && otherPlayer.position.length === 3) {
      setTargetPosition(otherPlayer.position)
    }
  }, [otherPlayer.position])
  
  // Apply hero model scale and rotation
  const modelScale = otherPlayer.heroModelScale ?? 1
  const rotation = otherPlayer.heroModelRotation || [0, 0, 0]
  
  if (!clone) return null
  
  return (
    <group 
      ref={group} 
      position={[position[0], position[1], position[2]]}
      rotation={rotation}
    >
      <primitive 
        object={clone} 
        castShadow 
        receiveShadow
        scale={modelScale} 
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
  
  useEffect(() => {
    if (!socket) return
    
    // Handle initial list of players when joining
    const handlePlayersJoined = (players) => {
      const playersMap = new Map()
      players.forEach(player => {
        if (player.playerId !== currentPlayerId) {
          playersMap.set(player.socketId, player)
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
        return updated
      })
    }
    
    // Handle player position updates
    const handlePositionChanged = ({ socketId, position, rotation }) => {
      setOtherPlayers(prev => {
        const updated = new Map(prev)
        const player = updated.get(socketId)
        if (player) {
          updated.set(socketId, {
            ...player,
            position: position || player.position,
            rotation: rotation || player.rotation,
          })
        }
        return updated
      })
    }
    
    // Handle player hero updates
    const handleHeroChanged = ({ socketId, ...heroData }) => {
      setOtherPlayers(prev => {
        const updated = new Map(prev)
        const player = updated.get(socketId)
        if (player) {
          updated.set(socketId, {
            ...player,
            ...heroData,
          })
        }
        return updated
      })
    }
    
    // Handle player leaving
    const handlePlayerLeft = ({ socketId }) => {
      setOtherPlayers(prev => {
        const updated = new Map(prev)
        updated.delete(socketId)
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
  
  return (
    <>
      {Array.from(otherPlayers.values()).map(player => (
        <OtherPlayer key={player.socketId} otherPlayer={player} />
      ))}
    </>
  )
}

