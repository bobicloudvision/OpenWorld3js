import * as THREE from "three"
import { useTexture } from "@react-three/drei"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import useGameStore from '../stores/gameStore'
import grass from "/textures/grass.png"

export default function Ground(props) {
  const texture = useTexture(grass)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  
  const { 
    castingMode, 
    player, 
    castMagicAtPosition, 
    exitCastingMode, 
    healPlayer,
    attackEnemy,
    enemies
  } = useGameStore()
  
  const handleGroundClick = (event) => {
    event.stopPropagation()
    console.log('Ground clicked!')
    
    // Get the intersection point from the event
    const point = event.point
    const targetPosition = [point.x, 0, point.z]
    console.log('Ground click position:', targetPosition)
    
    // Show click effect at clicked position
    if (window.addClickEffect) {
      // Pass magic type if in casting mode, otherwise null for regular click
      const magicType = castingMode ? player.selectedMagic : null
      window.addClickEffect(targetPosition, magicType)
    }
    
    if (castingMode) {
      // Cast the magic at clicked position
      console.log(`Casting ${player.selectedMagic} at clicked position [${targetPosition[0].toFixed(2)}, ${targetPosition[2].toFixed(2)}]`)
      
      // Show magic effect at clicked position
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
        
        window.addMagicEffect(targetPosition, player.selectedMagic, effectRadius[player.selectedMagic] || 3)
      }
      
      const result = castMagicAtPosition(player.selectedMagic, targetPosition, [0, 0, 0])
      
      if (result.success) {
        console.log(`Magic cast successful! Damage: ${result.damage}`)
        if (player.selectedMagic === 'heal') {
          healPlayer(Math.abs(result.damage))
        } else {
          // Find enemies in range of the clicked position
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
              Math.pow(enemy.position[0] - targetPosition[0], 2) +
              Math.pow(enemy.position[2] - targetPosition[2], 2)
            )
            return distance <= aoeRadius
          })
          
          console.log(`Found ${enemiesInRange.length} enemies in range of clicked magic (radius: ${aoeRadius}m)`)
          
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
  
  return (
    <RigidBody 
      {...props} 
      type="fixed" 
      colliders={false}
    >
      <mesh 
        receiveShadow 
        position={[0, 0, 0]} 
        rotation-x={-Math.PI / 2}
        onClick={handleGroundClick}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial map={texture} map-repeat={[240, 240]} color="green" />
      </mesh>
      <CuboidCollider 
        args={[1000, 2, 1000]} 
        position={[0, -2, 0]}
      />
    </RigidBody>
  )
}
