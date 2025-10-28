import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, Fisheye, KeyboardControls, OrbitControls, PointerLockControls, Sky } from '@react-three/drei'
import Player from './components/Player'
import Ecctrl, { EcctrlJoystick } from 'ecctrl'
import Ground from './components/Ground'
import { Shapes } from './components/Shapes'
import { ModeIndicator } from './components/ModeIndicator'
import { KeyboardShapeCreator } from './components/KeyboardShapeCreator'
import { MaterialPalette } from './components/MaterialPalette'
import './App.css'

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
    <ModeIndicator />
    <KeyboardShapeCreator />
    <MaterialPalette />
    <EcctrlJoystick />
      <Canvas shadows>
          
          <Sky sunPosition={[100, 20, 100]} />

          <directionalLight intensity={2.5} castShadow shadow-bias={-0.0004} position={[-20, 20, 20]}>
            <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
          </directionalLight>
          <ambientLight intensity={2} />

          <Physics timeStep="vary" gravity={[0, -30, 0]}>
          <KeyboardControls map={keyboardMap}>
            <Ecctrl maxVelLimit={2} position={[0, 1, 0]}>
              <Player />
            </Ecctrl>

            <Shapes />

          </KeyboardControls>    

          <Ground />

          </Physics>
      

      </Canvas>
      </>
  )
}
