import { useCallback, useRef, useState, useEffect } from "react"
import { useTexture } from "@react-three/drei"
import { RigidBody, CuboidCollider } from "@react-three/rapier"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import dirt from "/textures/Material.010_diffuse.png"

// This is a naive implementation and wouldn't allow for more than a few thousand boxes.
// In order to make this scale this has to be one instanced mesh, then it could easily be
// hundreds of thousands.

const useCubeStore = create(
  persist(
    (set, get) => ({
      // Each cube is an object with an id, position and mass
      defaultMass: 100000,
      cubes: [{ id: 0, position: [0, 0.5, 2], mass: 100000 }],
      nextId: 1,
      deleteMode: false,
      addCube: (x, y, z) =>
        set((state) => ({
          cubes: [
            ...state.cubes,
            { id: state.nextId, position: [x, y, z], mass: state.defaultMass },
          ],
          nextId: state.nextId + 1,
        })),
      removeCubeById: (id) =>
        set((state) => ({ cubes: state.cubes.filter((c) => c.id !== id) })),
      setDefaultMass: (mass) => set({ defaultMass: mass }),
      setDeleteMode: (mode) => set({ deleteMode: mode }),
      reset: () => set({ cubes: [], nextId: 0 }),
    }),
    {
      name: "ow3-cubes", // localStorage key
      partialize: (state) => ({ cubes: state.cubes, nextId: state.nextId, defaultMass: state.defaultMass }),
    }
  )
)

// Mode indicator component
export const ModeIndicator = () => {
  const deleteMode = useCubeStore((state) => state.deleteMode)
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        useCubeStore.getState().setDeleteMode(true)
      }
    }
    
    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        useCubeStore.getState().setDeleteMode(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      background: deleteMode ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)',
      color: 'white',
      padding: '10px 15px',
      borderRadius: '5px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      zIndex: 1000,
      pointerEvents: 'none'
    }}>
      Mode: {deleteMode ? 'DELETE' : 'ADD'}
      <br />
      <small>Hold Shift to delete</small>
    </div>
  )
}

export  const Cubes = ({ size = 0.5 }) => {
  const cubes = useCubeStore((state) => state.cubes)
  return cubes.map(({ id, position, mass }) => (
    <Cube key={id} id={id} position={position} mass={mass} size={size} />
  ))
}

export default function Cube({ id, mass = 1000, size = 0.5, ...props }) {
  const ref = useRef()
  const [hover, set] = useState(null)
  const addCube = useCubeStore((state) => state.addCube)
  const removeCubeById = useCubeStore((state) => state.removeCubeById)
  const texture = useTexture(dirt)
  const onMove = useCallback((e) => {
    e.stopPropagation()
    set(Math.floor(e.faceIndex / 2))
  }, [])
  const onOut = useCallback(() => set(null), [])
  const onClick = useCallback((e) => {
    e.stopPropagation()
    const { x, y, z } = ref.current.translation()
    
    // Check if Shift key is held for delete mode
    const isDeleteMode = e.nativeEvent.shiftKey
    
    if (isDeleteMode) {
      // Delete this cube by id
      removeCubeById(id)
    } else {
      // Add new cube in the direction of the clicked face
      const dir = [
        [x + size, y, z],
        [x - size, y, z],
        [x, y + size, z],
        [x, y - size, z],
        [x, y, z + size],
        [x, y, z - size],
      ]
      addCube(...dir[Math.floor(e.faceIndex / 2)])
    }
  }, [size, addCube, removeCubeById, id])
  return (
    <RigidBody
      {...props}
      type="dynamic"
      colliders={false}
      ref={ref}
      linearDamping={0.5}
      angularDamping={2.0}
      enabledTranslations={[false, true, false]}
      enabledRotations={[false, false, false]}
      canSleep
    >
      <mesh receiveShadow castShadow onPointerMove={onMove} onPointerOut={onOut} onClick={onClick}>
        {[...Array(6)].map((_, index) => (
          <meshStandardMaterial 
            attach={`material-${index}`} 
            key={index} 
            map={texture} 
            color={hover === index ? "hotpink" : "white"} 
          />
        ))}
        <boxGeometry args={[size, size, size]} />
      </mesh>
      <CuboidCollider args={[size / 2, size / 2, size / 2]} mass={mass} friction={1} restitution={0} />
    </RigidBody>
  )
}
