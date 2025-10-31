import React, { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, KeyboardControls } from '@react-three/drei'
import Ecctrl, { EcctrlJoystick } from 'ecctrl'
import Player from './Player'
import OtherPlayers from './OtherPlayers'
import Ground from './Ground'
import { Shapes } from './Shapes'
import Enemies from './Enemies'
import CombatController from './CombatController'
import ClickToCast from './ClickToCast'
import MagicEffectsManager from './MagicEffectsManager'
import ClickEffectsManager from './ClickEffectsManager'
import HiddenElementPlaceholders from './HiddenElementPlaceholders'
import GameManager from './GameManager'
import GameUI from './GameUI'
import MagicPalette from './MagicPalette'
import { KeyboardShapeCreator } from './KeyboardShapeCreator'
import { MaterialPalette } from './MaterialPalette'

export default function GameplayScene({ 
  playerPositionRef, 
  keyboardMap, 
  activeHero,
  onOpenHeroSelection,
  socket,
  player
}) {
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <>
      <GameUI 
        playerPositionRef={playerPositionRef}
        onOpenHeroSelection={onOpenHeroSelection}
        activeHero={activeHero}
      />
      <MagicPalette />
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
          timeStep={isTabVisible ? "vary" : 1/60}
          gravity={[0, -20, 0]}
          paused={!isTabVisible}
          debug={false}
        >
          <KeyboardControls map={keyboardMap}>
            <Ecctrl 
              maxVelLimit={6}
              camFollowDistance={4}
            >
              <Player 
                onPositionChange={function(position) {
                  playerPositionRef.current = position; 
                }}
                heroModel={activeHero?.model}
                heroModelScale={activeHero?.modelScale}
                heroModelRotation={activeHero?.modelRotation}
                socket={socket}
              />
              
            </Ecctrl>
            
            {/* Render other players */}
            <OtherPlayers socket={socket} currentPlayerId={player?.id} /> 
            
            <Shapes />
            {/* <Enemies playerPositionRef={playerPositionRef} /> */} 
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

