import React from 'react'
import useGameStore from '../stores/gameStore'

export default function GameUI({ playerPositionRef, onOpenHeroSelection, activeHero }) {
  const { 
    player, 
    enemies, 
    gameState, 
    combatLog, 
    resetGame,
    getExpForNextLevel 
  } = useGameStore()
  
  
  if (gameState === 'victory') {
    return (
      <div className="game-overlay">
        <div className="victory-screen">
          <h1>Victory!</h1>
          <p>All enemies defeated!</p>
          <button onClick={resetGame}>Play Again</button>
        </div>
      </div>
    )
  }
  
  if (gameState === 'defeat') {
    return (
      <div className="game-overlay">
        <div className="defeat-screen">
          <h1>Defeat!</h1>
          <p>You have been defeated!</p>
          <button onClick={resetGame}>Try Again</button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="game-ui">
      {/* Player Stats */}
      <div className="player-stats">
        {onOpenHeroSelection && (
          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.9em', color: '#9ca3af' }}>
              {activeHero ? `Hero: ${activeHero.name}` : 'No Hero Selected'}
            </div>
            <button
              onClick={onOpenHeroSelection}
              style={{
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.85em',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 0 10px rgba(102, 126, 234, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Change Hero
            </button>
          </div>
        )}
        <div className="stat-bar">
          <label>Health: {player.health}/{player.maxHealth} {player.health <= 0 ? '(DEFEATED!)' : ''}</label>
          <div className="bar health-bar">
            <div 
              className="bar-fill" 
              style={{ 
                width: `${Math.max(0, (player.health / player.maxHealth) * 100)}%`,
                backgroundColor: player.health <= 0 ? '#ff0000' : '#ff0000'
              }}
            />
          </div>
        </div>
        
        <div className="stat-bar">
          <label>Power: {player.power}/{player.maxPower}</label>
          <div className="bar power-bar">
            <div 
              className="bar-fill" 
              style={{ 
                width: `${(player.power / player.maxPower) * 100}%`,
                backgroundColor: '#4444ff'
              }}
            />
          </div>
        </div>
        
        <div className="stat-bar">
          <label>Experience: {player.experience}/{getExpForNextLevel(player.level)} (Level {player.level})</label>
          <div className="bar exp-bar">
            <div 
              className="bar-fill" 
              style={{ 
                width: `${(player.experience / getExpForNextLevel(player.level)) * 100}%`,
                backgroundColor: '#ffaa00'
              }}
            />
          </div>
        </div>
        
        <div className="stat-info">
          <span>Attack: {player.attack}</span>
          <span>Defense: {player.defense}</span>
          <span>Level: {player.level}</span>
        </div>
      </div>
      
      
      {/* Combat Log */}
      <div className="combat-log">
        <h3>Combat Log</h3>
        <div className="log-messages">
          {combatLog.slice(-5).map((entry, index) => (
            <div key={index} className={`log-message ${entry.type}`}>
              {entry.message}
            </div>
          ))}
        </div>
      </div>
      
      {/* Enemy Status */}
      <div className="enemy-status">
        <h3>Enemies</h3>
        {enemies.filter(e => e.alive).map(enemy => (
          <div key={enemy.id} className="enemy-info">
            <span className="enemy-name">{enemy.name}</span>
            <span className="enemy-health">{enemy.health}/{enemy.maxHealth} HP</span>
            <span className="enemy-type">{enemy.type}</span>
            <span className="enemy-position">Pos: [{Math.round(enemy.position[0])}, {Math.round(enemy.position[2])}]</span>
          </div>
        ))}
      </div>
      
      {/* Debug Info */}
      <div className="debug-info">
        <h3>Debug Info</h3>
        <div>Player Health: {player.health}</div>
        <div>Game State: {gameState}</div>
        <div>Alive Enemies: {enemies.filter(e => e.alive).length}</div>
        <div>Player Position: [{Math.round(playerPositionRef?.current?.[0] || 0)}, {Math.round(playerPositionRef?.current?.[2] || 0)}]</div>
        <div>Last Damage Source: {combatLog.slice(-1)[0]?.message || 'None'}</div>
      </div>
    </div>
  )
}
