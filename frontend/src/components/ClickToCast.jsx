import React, { useRef } from 'react'
import { useThree } from '@react-three/fiber'
import useGameStore from '../stores/gameStore'

export default function ClickToCast({ playerPositionRef }) {
  const { camera, raycaster, mouse } = useThree()
  const { 
    castingMode, 
    player, 
    performCastWithCenter,
    magicTypes,
    exitCastingMode
  } = useGameStore()
  
  const handleClick = (event) => {
    event.stopPropagation()
    
    console.log('ClickToCast: Click detected!')
    
    // Get the intersection point from the event (same as Ground component)
    const point = event.point
    // Use the actual intersection Y from the clicked surface (e.g., GLB terrain)
    const targetPosition = [point.x, point.y, point.z]
    
    console.log(`ClickToCast: Click position: [${targetPosition[0].toFixed(2)}, ${targetPosition[2].toFixed(2)}]`)
  
    // Show click effect at clicked position
    if (window.addClickEffect) {
      window.addClickEffect(targetPosition)
    }
    
    if (castingMode) {
      // Cast the magic at player's location
      const playerPosition = playerPositionRef.current
      console.log(`Casting ${player.selectedMagic} at player position [${playerPosition[0].toFixed(2)}, ${playerPosition[2].toFixed(2)}]`)
      
      // Get magic properties to use affectRange
      const magic = magicTypes[player.selectedMagic]
      const aoeRadius = magic.affectRange || 0
      
      // Show magic effect at player location
      if (window.addMagicEffect) {
        window.addMagicEffect(playerPosition, player.selectedMagic, aoeRadius)
      }

      const result = performCastWithCenter(player.selectedMagic, playerPosition, playerPosition)
      if (!result.success) {
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
