import React, { useState } from 'react'

export default function GameInstructions() {
  const [showInstructions, setShowInstructions] = useState(true)
  
  if (!showInstructions) {
    return (
      <button 
        className="instructions-toggle"
        onClick={() => setShowInstructions(true)}
      >
        ?
      </button>
    )
  }
  
  return (
    <div className="game-instructions">
      <div className="instructions-content">
        <h2>War Game Controls</h2>
        
        <div className="control-section">
          <h3>Movement</h3>
          <ul>
            <li><strong>WASD</strong> or <strong>Arrow Keys</strong> - Move</li>
            <li><strong>Space</strong> - Jump</li>
            <li><strong>Shift</strong> - Run</li>
          </ul>
        </div>
        
        <div className="control-section">
          <h3>Combat</h3>
          <ul>
            <li><strong>F</strong> - Basic Attack</li>
            <li><strong>1</strong> - Select Fireball Magic</li>
            <li><strong>2</strong> - Select Ice Shard Magic</li>
            <li><strong>3</strong> - Select Lightning Bolt Magic</li>
            <li><strong>4</strong> - Select Heal Magic</li>
            <li><strong>Click Ground</strong> - Cast selected magic</li>
            <li><strong>ESC</strong> - Cancel casting</li>
          </ul>
        </div>
        
        <div className="control-section">
          <h3>Gameplay</h3>
          <ul>
            <li>Defeat all enemies to win</li>
            <li>Select magic from bottom palette</li>
            <li>Click on ground to cast magic</li>
            <li>Magic has range limitations</li>
            <li>Heal when low on health</li>
            <li>Power regenerates over time</li>
          </ul>
        </div>
        
        <button 
          className="close-instructions"
          onClick={() => setShowInstructions(false)}
        >
          Close
        </button>
      </div>
    </div>
  )
}
