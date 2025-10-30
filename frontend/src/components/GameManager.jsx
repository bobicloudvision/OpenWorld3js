import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../stores/gameStore'

export default function GameManager({ playerPositionRef }) {
  const { 
    enemies, 
    player, 
    gameState, 
    checkGameState, 
    regeneratePower,
    enemies: currentEnemies 
  } = useGameStore()
  
  const lastPowerRegen = useRef(0)
  
  useFrame((state, delta) => {
    // Regenerate player power every second
    const now = Date.now()
    if (now - lastPowerRegen.current > 1000) {
      regeneratePower()
      lastPowerRegen.current = now
    }
    
    // Check game state
    if (player.health <= 0) {
      console.log(`Player defeated! Health: ${player.health}`)
    }
    checkGameState()
  })
  
  return null // This component doesn't render anything, just manages game logic
}
