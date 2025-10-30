import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import useGameStore from '../stores/gameStore'

export default function Ground(props) {
  const { scene } = useGLTF('/models/world1.glb')
  
  const { 
    castingMode, 
    player, 
    performCastWithCenter,
    magicTypes
  } = useGameStore()
  
  const handleGroundClick = (event) => {
    event.stopPropagation()
    console.log('Ground clicked!')
    
    // Get the intersection point from the event
    const point = event.point
    // Use the actual intersection Y from the GLB surface instead of forcing 0
    const targetPosition = [point.x, point.y, point.z]
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
      
      // Get magic properties to check range
      const selectedMagicType = magicTypes[player.selectedMagic]
      const magicRange = selectedMagicType ? selectedMagicType.range : 15
      
      console.log(`Player position: [${playerX.toFixed(2)}, ${playerZ.toFixed(2)}]`)
      console.log(`Distance to player: ${distanceToPlayer.toFixed(2)}m, Magic range: ${magicRange}m`)
      
      if (distanceToPlayer <= magicRange) {
        // Cast the magic at clicked position
        console.log(`Casting ${player.selectedMagic} at clicked position [${targetPosition[0].toFixed(2)}, ${targetPosition[2].toFixed(2)}]`)
        
        // Get magic properties to use affectRange
        const magic = magicTypes[player.selectedMagic]
        const aoeRadius = magic.affectRange || 0
        
        // Show magic effect at clicked position
        if (window.addMagicEffect) {
          window.addMagicEffect(targetPosition, player.selectedMagic, aoeRadius)
        }
        const result = performCastWithCenter(
          player.selectedMagic,
          targetPosition,
          [playerX, playerPos[1], playerZ]
        )
        if (!result.success) {
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
      colliders="trimesh"
    >
      <primitive 
        object={scene} 
        scale={1}
        metalness={0.1}
        roughness={0.8}
        position={[0, -10, 0]}
        onClick={handleGroundClick}
      />
    </RigidBody>
  )
}
