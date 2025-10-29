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
    enemies,
    applyStatusEffect,
    knockbackEnemy,
    magicTypes
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
      // Get player position from props
      const playerPos = props.playerPositionRef?.current || [0, 0, 0]
      
      // Ensure playerPos values are numbers
      const playerX = typeof playerPos[0] === 'number' ? playerPos[0] : parseFloat(playerPos[0])
      const playerZ = typeof playerPos[2] === 'number' ? playerPos[2] : parseFloat(playerPos[2])
      
      const distanceToPlayer = Math.sqrt(
        Math.pow(targetPosition[0] - playerX, 2) +
        Math.pow(targetPosition[2] - playerZ, 2)
      )
      
      const magicRange = 15 // Magic range from gameStore
      
      console.log(`Player position: [${playerX.toFixed(2)}, ${playerZ.toFixed(2)}]`)
      console.log(`Distance to player: ${distanceToPlayer.toFixed(2)}m, Magic range: ${magicRange}m`)
      
      if (distanceToPlayer <= magicRange) {
        // Cast the magic at clicked position
        console.log(`Casting ${player.selectedMagic} at clicked position [${targetPosition[0].toFixed(2)}, ${targetPosition[2].toFixed(2)}]`)
        
        // Show magic effect at clicked position
        if (window.addMagicEffect) {
          // Different effect sizes for different spells
          const effectRadius = {
            fire: 3,
            ice: 2.5,
            freeze: 2.5,
            lightning: 4,
            bomb: 4,
            poison: 3,
            chain: 3.5,
            drain: 2.5,
            slow: 3.5,
            heal: 2,
            meteor: 5,
            shield: 1.5
          }
          
          window.addMagicEffect(targetPosition, player.selectedMagic, effectRadius[player.selectedMagic] || 3)
        }
        
        const result = castMagicAtPosition(player.selectedMagic, targetPosition, [playerX, playerPos[1], playerZ])
        
        if (result.success) {
          console.log(`Magic cast successful! Damage: ${result.damage}`)
          if (player.selectedMagic === 'heal') {
            healPlayer(Math.abs(result.damage))
          } else {
            // Find enemies in range of the clicked position
            const effectRadius = {
              fire: 3,
              ice: 2.5,
              freeze: 2.5,
              lightning: 4,
              bomb: 4,
              poison: 3,
              chain: 3.5,
              drain: 2.5,
              slow: 3.5,
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
            
            // Get magic properties
            const magic = magicTypes[player.selectedMagic]
            
            // Damage all enemies in range and apply status effects
            enemiesInRange.forEach(enemy => {
              attackEnemy(enemy.id, result.damage)
              
              // Apply status effects if the magic has any
              if (magic.statusEffect) {
                const statusEffect = magic.statusEffect
                
                // Handle knockback effect (use player position as source)
                if (statusEffect.type === 'knockback') {
                  knockbackEnemy(enemy.id, [playerX, playerPos[1], playerZ], statusEffect.force)
                }
                
                // Apply status effect to enemy
                applyStatusEffect(enemy.id, statusEffect, player.selectedMagic)
                
                // Handle lifesteal effect
                if (statusEffect.type === 'lifesteal') {
                  const healAmount = Math.floor(result.damage * (statusEffect.healPercent / 100))
                  healPlayer(healAmount)
                }
              }
            })
          }
          
          exitCastingMode()
        } else {
          console.log(`Magic cast failed: ${result.message}`)
        }
      } else {
        console.log(`Target too far! Distance: ${distanceToPlayer.toFixed(2)}m, Range: ${magicRange}m`)
        // Still show click effect but don't cast magic
      }
    }
  }
  
  return (
    <RigidBody 
      {...props} 
      type="fixed"
      colliders="cuboid" 
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
        args={[1000, 0.4, 1000]} 
        position={[0, 0, 0]} 
      />
    </RigidBody>
  )
}
