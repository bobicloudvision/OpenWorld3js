import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, Fisheye, KeyboardControls, OrbitControls, PointerLockControls, Sky } from '@react-three/drei'
import Player from './components/Player'
import Ecctrl, { EcctrlJoystick } from 'ecctrl'
import Ground from './components/Ground'
import { Shapes } from './components/Shapes'
import { ModeIndicator } from './components/ModeIndicator'
import { KeyboardShapeCreator } from './components/KeyboardShapeCreator'
import { MaterialPalette } from './components/MaterialPalette'
import GameUI from './components/GameUI'
import Enemies from './components/Enemies'
import GameManager from './components/GameManager'
import CombatController from './components/CombatController'
import GameInstructions from './components/GameInstructions'
import MagicPalette from './components/MagicPalette'
import ClickToCast from './components/ClickToCast'
import MagicEffectsManager from './components/MagicEffectsManager'
import ClickEffectsManager from './components/ClickEffectsManager'
import './App.css'
import './components/GameUI.css'

export default function App() {
  const playerPositionRef = React.useRef([0, 0, 0]);
  
  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
    { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'run', keys: ['Shift'] },
    { name: 'attack', keys: ['KeyF'] },
    { name: 'magic1', keys: ['Digit1'] },
    { name: 'magic2', keys: ['Digit2'] },
    { name: 'magic3', keys: ['Digit3'] },
    { name: 'magic4', keys: ['Digit4'] },
  ]
  return (
    <>
    {/* <GameInstructions /> */}
    <GameUI playerPositionRef={playerPositionRef} />
    <MagicPalette />
    {/* <ModeIndicator /> */}
    <KeyboardShapeCreator />
    <MaterialPalette />
    
    <EcctrlJoystick />
      <Canvas 
        shadows
        onClick={(event) => {
          // Handle click events globally
          console.log('Canvas click detected!')
        }}
      >
          
          <Environment files="models/night.hdr" ground={{ scale: 100 }} />

          <directionalLight intensity={0.6} castShadow shadow-bias={-0.0004} position={[0, 300, 200]}>
        
          </directionalLight>
          <ambientLight intensity={0.8} />

          <Physics 
            timeStep="vary" 
            gravity={[0, -20, 0]}
            paused={false}
            debug={false}
          >
          <KeyboardControls map={keyboardMap}>
            <Ecctrl 
              maxVelLimit={6}
            >
              <Player onPositionChange={function(position) {
                playerPositionRef.current = position; 
              }} />

            </Ecctrl> 

            <Shapes />
            <Enemies playerPositionRef={playerPositionRef} />
            <CombatController playerPositionRef={playerPositionRef} />
            <ClickToCast playerPositionRef={playerPositionRef} />
            <MagicEffectsManager />
            <ClickEffectsManager />

          </KeyboardControls>    
         

          <Ground playerPositionRef={playerPositionRef} />
          <GameManager playerPositionRef={playerPositionRef} />

          </Physics>
      

      </Canvas>
      </>
  )
}
