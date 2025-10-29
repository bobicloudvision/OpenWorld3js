import React from 'react'
import Enemy from './Enemy'
import useGameStore from '../stores/gameStore'

export default function Enemies({ playerPositionRef }) {
  const { enemies } = useGameStore()
  
  return (
    <>
      {enemies.map(enemy => (
        <Enemy 
          key={enemy.id} 
          enemy={enemy} 
          playerPositionRef={playerPositionRef}
        />
      ))}
    </>
  )
}
