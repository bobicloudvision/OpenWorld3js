import React, { useRef } from 'react'
import { useThree } from '@react-three/fiber'
import useGameStore from '../stores/gameStore'

export default function ClickToCast({ playerPosition }) {
  const { camera, raycaster, mouse } = useThree()
  const { 
    castingMode, 
    player, 
    castMagicAtPosition, 
    exitCastingMode, 
    healPlayer,
    attackEnemy,
    enemies
  } = useGameStore()
  
  const handleClick = (event) => {
    event.stopPropagation()
    
    console.log('ClickToCast: Click detected!')
    
    // Get the intersection point from the event (same as Ground component)
    const point = event.point
    const targetPosition = [point.x, 0, point.z]
    
    console.log(`ClickToCast: Click position: [${targetPosition[0].toFixed(2)}, ${targetPosition[2].toFixed(2)}]`)
    
    // Show click effect at clicked position
    if (window.addClickEffect) {
      window.addClickEffect(targetPosition)
    }
    
    if (castingMode) {
      // Cast the magic at player's location
      console.log(`Casting ${player.selectedMagic} at player position [${playerPosition[0].toFixed(2)}, ${playerPosition[2].toFixed(2)}]`)
      
      // Show magic effect at player location
      if (window.addMagicEffect) {
        // Different effect sizes for different spells
        const effectRadius = {
          fire: 3,
          ice: 2.5,
          lightning: 4,
          heal: 2,
          meteor: 5,
          shield: 1.5
        }
        
        window.addMagicEffect(playerPosition, player.selectedMagic, effectRadius[player.selectedMagic] || 3)
      }
      
      const result = castMagicAtPosition(player.selectedMagic, playerPosition, playerPosition)
      
      if (result.success) {
        console.log(`Magic cast successful! Damage: ${result.damage}`)
        if (player.selectedMagic === 'heal') {
          healPlayer(Math.abs(result.damage))
        } else {
          // Find enemies in range of the player
          const effectRadius = {
            fire: 3,
            ice: 2.5,
            lightning: 4,
            heal: 2,
            meteor: 5,
            shield: 1.5
          }
          
          const aoeRadius = effectRadius[player.selectedMagic] || 3
          
          const enemiesInRange = enemies.filter(enemy => {
            if (!enemy.alive) return false
            const distance = Math.sqrt(
              Math.pow(enemy.position[0] - playerPosition[0], 2) +
              Math.pow(enemy.position[2] - playerPosition[2], 2)
            )
            return distance <= aoeRadius
          })
          
          console.log(`Found ${enemiesInRange.length} enemies in range of player magic (radius: ${aoeRadius}m)`)
          
          // Damage all enemies in range
          enemiesInRange.forEach(enemy => {
            attackEnemy(enemy.id, result.damage)
          })
        }
        
        exitCastingMode()
      } else {
        console.log(`Magic cast failed: ${result.message}`)
      }
    }
  }
  
  // Handle ESC key to cancel casting
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && castingMode) {
        exitCastingMode()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [castingMode, exitCastingMode])
  
  return (
    <>
      {/* Visual cursor indicator - only show when casting */}
      {castingMode && (
        <mesh position={[0, 0.1, 0]}>
          <ringGeometry args={[0.5, 0.7, 16]} />
          <meshBasicMaterial 
            color="#ffff00" 
            transparent 
            opacity={0.8}
          />
        </mesh>
      )}
    </>
  )
}
