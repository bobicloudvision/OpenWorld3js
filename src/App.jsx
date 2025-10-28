import { Canvas } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { Environment, Fisheye, KeyboardControls } from '@react-three/drei'
import Player from './components/Player'

export default function App() {
  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
    { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'run', keys: ['Shift'] },
  ]
  return (
      <Canvas shadows onPointerDown={(e) => e.target.requestPointerLock()}>
          <Environment files="/night.hdr" ground={{ scale: 100 }} />
          <directionalLight intensity={0.7} castShadow shadow-bias={-0.0004} position={[-20, 20, 20]}>
            <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
          </directionalLight>
          <ambientLight intensity={0.2} />
          <Physics timeStep="vary">
            <KeyboardControls map={keyboardMap}>
              <Player />
            </KeyboardControls>
            <RigidBody type="fixed">
              <mesh position={[0, -1.5, 0]} receiveShadow>
                <boxGeometry args={[200, 1, 200]} />
                <meshStandardMaterial color="#4a4a4a" />
              </mesh>
              <CuboidCollider args={[100, 0.5, 100]} />
            </RigidBody>
          </Physics>
      </Canvas>
  )
}
