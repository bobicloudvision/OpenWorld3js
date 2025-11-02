import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { useMemo } from "react"
import useGameStore from '../stores/gameStore'
import { addVfx } from '../stores/effectsStore'

export default function Ground(props) {
  const mapFile = props.mapFile || '/models/world1.glb'
  
  // Log when map file changes to debug zone transitions
  console.log('[Ground] Loading map file:', mapFile)
  
  const { scene } = useGLTF(mapFile)
  
  // Clone the scene to ensure we get a fresh instance
  const clonedScene = useMemo(() => {
    console.log('[Ground] Creating cloned scene from:', mapFile)
    return scene.clone()
  }, [scene, mapFile])
  
  const socket = props.socket
  const disableCombat = props.disableCombat || false
  
  const { 
    castingMode, 
    player, 
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
    
    // Show click effect at clicked position (visual cursor) - only if combat is enabled
    if (window.addClickEffect && !disableCombat) {
      const magicType = castingMode ? player.selectedMagic : null
      window.addClickEffect(targetPosition, magicType)
    }
    
    // Skip all combat logic if in lobby
    if (disableCombat) {
      return
    }
    
    if (castingMode && socket && socket.connected) {
      // Ensure we're in combat; if not, queue and join
      if (!window.__inCombat) {
        console.warn('[combat] Not in combat yet, queuing cast and joining...')
        window.__queuedCast = { spellKey: player.selectedMagic, targetPosition }
        socket.emit('combat:join', { enemyIds: [], zoneCenter: [0,0,0], zoneRadius: 150 })
        return
      }

      // Get player position from props
      const playerPos = props.playerPositionRef?.current || [0, 0, 0]
      
      const playerX = typeof playerPos[0] === 'number' ? playerPos[0] : parseFloat(playerPos[0])
      const playerZ = typeof playerPos[2] === 'number' ? playerPos[2] : parseFloat(playerPos[2])
      
      const distanceToPlayer = Math.sqrt(
        Math.pow(targetPosition[0] - playerX, 2) +
        Math.pow(targetPosition[2] - playerZ, 2)
      )
      
      const selectedMagicType = magicTypes[player.selectedMagic]
      const magicRange = selectedMagicType ? selectedMagicType.range : 15
      
      console.log(`Player position: [${playerX.toFixed(2)}, ${playerZ.toFixed(2)}]`)
      console.log(`Distance to player: ${distanceToPlayer.toFixed(2)}m, Magic range: ${magicRange}m`)
      
      if (distanceToPlayer <= magicRange) {
        console.log(`Casting ${player.selectedMagic} at clicked position [${targetPosition[0].toFixed(2)}, ${targetPosition[2].toFixed(2)}]`)
        
        socket.emit('combat:cast-spell', {
          spellKey: player.selectedMagic,
          targetPosition: targetPosition
        }, (ack) => {
          if (ack && ack.ok && ack.result) {
            const { targetPosition: tp, spellKey, aoeRadius } = ack.result
            const radius = typeof aoeRadius === 'number' ? Math.max(1.2, aoeRadius) : 2
            const isZeroRadius = typeof aoeRadius === 'number' && aoeRadius <= 0
            const vfxPos = isZeroRadius && Array.isArray(props.playerPositionRef?.current)
              ? props.playerPositionRef.current
              : tp
            if (vfxPos && spellKey) addVfx(vfxPos, spellKey, radius)
          } else if (ack && !ack.ok) {
            console.warn('[combat] ack error:', ack.error)
          }
        })
      } else {
        console.log(`Target too far! Distance: ${distanceToPlayer.toFixed(2)}m, Range: ${magicRange}m`)
      }
    } else if (castingMode && (!socket || !socket.connected)) {
      console.warn('Cannot cast: socket not connected')
    }
  }
  
  return (
    <RigidBody 
      {...props} 
      type="fixed"
      colliders="trimesh"
    >
      <primitive 
        object={clonedScene} 
        scale={1}
        metalness={0.1}
        roughness={0.8}
        position={[0, -10, 0]}
        onClick={handleGroundClick}
      />
    </RigidBody>
  )
}
