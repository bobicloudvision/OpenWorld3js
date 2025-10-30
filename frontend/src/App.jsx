import React, { useRef, useEffect } from 'react'
import { me as fetchMe, logout as playerLogout } from './services/authService'
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
import HiddenElementPlaceholders from './components/HiddenElementPlaceholders'
import './App.css'
import './components/GameUI.css'
import AuthModal from './components/AuthModal'

export default function App() {
  const playerPositionRef = React.useRef([0, 0, 0]);
  const [authOpen, setAuthOpen] = React.useState(false)
  const [player, setPlayer] = React.useState(null)
  useEffect(() => {
    // Validate stored token on load (non-blocking, logs only)
    fetchMe().then((me) => {
      if (me) {
        console.log('Authenticated player:', me);
        setPlayer(me)
      } else {
        console.log('No valid player session');
      }
    }).catch(() => console.log('Auth check failed'));
  }, []);
  
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
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 100 }}>
      {player ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#e5e7eb', fontSize: 12 }}>Hi, {player.name}</span>
          <button
            onClick={async () => { await playerLogout(); setPlayer(null); }}
            style={{ padding: '6px 10px', fontSize: 12, background: '#374151', color: '#e5e7eb', border: '1px solid #4b5563', borderRadius: 6 }}
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAuthOpen(true)}
          style={{ padding: '8px 12px', fontSize: 12, background: '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}
        >
          Login / Sign Up
        </button>
      )}
    </div>
    <AuthModal
      open={authOpen}
      onClose={() => setAuthOpen(false)}
      onAuthenticated={(p) => { setPlayer(p); setAuthOpen(false); }}
    />
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

          <directionalLight intensity={0.4} castShadow shadow-bias={-0.0004} position={[0, 300, 200]}>
        
          </directionalLight>
          <ambientLight intensity={0.7} />

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
          <HiddenElementPlaceholders />
          <GameManager playerPositionRef={playerPositionRef} />

          </Physics>
      

      </Canvas>
      </>
  )
}
