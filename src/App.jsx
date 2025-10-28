import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, Fisheye, KeyboardControls, OrbitControls } from '@react-three/drei'
import Player from './components/Player'
import Ecctrl, { EcctrlJoystick } from 'ecctrl'
import Ground from './components/Ground'

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
    <>

    <EcctrlJoystick />
      <Canvas shadows>
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2}
          />
          <Environment files="/night.hdr" ground={{ scale: 100 }} />
          <directionalLight intensity={0.7} castShadow shadow-bias={-0.0004} position={[-20, 20, 20]}>
            <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
          </directionalLight>
          <ambientLight intensity={0.2} />
          <Physics timeStep="vary">
          

            <KeyboardControls map={keyboardMap}>
            <Ecctrl maxVelLimit={5.5} position={[0, 1, 0]}>
              <Player /> 
            </Ecctrl>
          </KeyboardControls>

            <Ground />
          </Physics>
      </Canvas>
      </>
  )
}
