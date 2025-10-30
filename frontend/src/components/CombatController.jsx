import React, { useEffect, useRef } from 'react'
import { useKeyboardControls } from '@react-three/drei'
import useGameStore from '../stores/gameStore'

export default function CombatController({ playerPositionRef }) {
  const [, get] = useKeyboardControls()
  const { 
    player, 
    enemies, 
    attackEnemy, 
    enterCastingMode,
    exitCastingMode,
    castingMode
  } = useGameStore()
  
  const lastKeyStates = useRef({})
  
  useEffect(() => {
    const handleKeyPress = () => {
      const { attack, magic1, magic2, magic3, magic4 } = get()
      const currentStates = { attack, magic1, magic2, magic3, magic4 }
      
      // Only trigger on key press (not hold)
      Object.keys(currentStates).forEach(key => {
        if (currentStates[key] && !lastKeyStates.current[key]) {
          // Key was just pressed
          switch(key) {
            case 'attack':
              const aliveEnemies = enemies.filter(e => e.alive)
              if (aliveEnemies.length > 0) {
                // Find enemies in attack range (3m)
                const playerPosition = playerPositionRef.current
                const enemiesInRange = aliveEnemies.filter(enemy => {
                  const distance = Math.sqrt(
                    Math.pow(enemy.position[0] - playerPosition[0], 2) +
                    Math.pow(enemy.position[2] - playerPosition[2], 2)
                  )
                  return distance <= 3 // Attack range
                })
                
                if (enemiesInRange.length > 0) {
                  const nearestEnemy = enemiesInRange[0]
                  console.log(`Player attacking enemy ${nearestEnemy.id} with ${player.attack} damage`)
                  attackEnemy(nearestEnemy.id, player.attack)
                } else {
                  console.log('No enemies in attack range!')
                }
              }
              break
              
            case 'magic1':
              if (castingMode) {
                exitCastingMode()
              } else {
                enterCastingMode('fire')
              }
              break
              
            case 'magic2':
              if (castingMode) {
                exitCastingMode()
              } else {
                enterCastingMode('ice')
              }
              break
              
            case 'magic3':
              if (castingMode) {
                exitCastingMode()
              } else {
                enterCastingMode('lightning')
              }
              break
              
            case 'magic4':
              if (castingMode) {
                exitCastingMode()
              } else {
                enterCastingMode('heal')
              }
              break
          }
        }
      })
      
      lastKeyStates.current = currentStates
    }
    
    const interval = setInterval(handleKeyPress, 50) // Check every 50ms
    return () => clearInterval(interval)
  }, [get, enemies, player, attackEnemy, enterCastingMode, exitCastingMode, castingMode, playerPositionRef])
  
  return null // This component doesn't render anything
}
