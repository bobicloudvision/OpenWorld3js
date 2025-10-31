import React, { useState, useEffect } from 'react'
import useGameStore from '../stores/gameStore'
import HeroStatsPanel from './HeroStatsPanel'

export default function GameUI({ playerPositionRef, onOpenHeroSelection, activeHero, socket, playerId }) {
  const { 
    player, 
    enemies, 
    gameState, 
    combatLog, 
    resetGame,
    getExpForNextLevel 
  } = useGameStore()
  
  const [combatResult, setCombatResult] = useState(null)
  const [levelUpInfo, setLevelUpInfo] = useState(null)
  
  // Listen for combat:ended events
  useEffect(() => {
    if (!socket || !playerId) return
    
    const onCombatEnded = (data) => {
      console.log('[GameUI] Combat ended:', data)
      const { result, winners, losers } = data
      
      const isWinner = winners?.includes(playerId)
      const isLoser = losers?.includes(playerId)
      
      setCombatResult({
        type: isWinner ? 'victory' : isLoser ? 'defeat' : 'draw',
        winners,
        losers
      })
      
      // Auto-hide after 5 seconds
      setTimeout(() => setCombatResult(null), 5000)
    }
    
    socket.on('combat:ended', onCombatEnded)
    
    return () => {
      socket.off('combat:ended', onCombatEnded)
    }
  }, [socket, playerId])
  
  // Listen for level-up notifications (we'll need to emit this from backend)
  useEffect(() => {
    if (!socket) return
    
    const onLevelUp = (data) => {
      console.log('[GameUI] Level up!', data)
      setLevelUpInfo(data)
      
      // Auto-hide after 4 seconds
      setTimeout(() => setLevelUpInfo(null), 4000)
    }
    
    socket.on('hero:level-up', onLevelUp)
    
    return () => {
      socket.off('hero:level-up', onLevelUp)
    }
  }, [socket])
  
  
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
      {/* Combat Result Notification */}
      {combatResult && (
        <div className={`combat-result-notification ${combatResult.type}`}>
          <h2>
            {combatResult.type === 'victory' && '🏆 VICTORY!'}
            {combatResult.type === 'defeat' && '💀 DEFEATED!'}
            {combatResult.type === 'draw' && '🤝 DRAW!'}
          </h2>
          <p>
            {combatResult.type === 'victory' && 'You have won the battle!'}
            {combatResult.type === 'defeat' && 'You have been defeated!'}
            {combatResult.type === 'draw' && 'The battle ended in a draw!'}
          </p>
          <div className="combat-result-details">
            {combatResult.winners?.length > 0 && (
              <div>Winners: {combatResult.winners.join(', ')}</div>
            )}
            {combatResult.losers?.length > 0 && (
              <div>Losers: {combatResult.losers.join(', ')}</div>
            )}
          </div>
        </div>
      )}
      
      {/* Level Up Notification */}
      {levelUpInfo && (
        <div className="level-up-notification">
          <h2>⭐ LEVEL UP! ⭐</h2>
          <p className="level-text">Level {levelUpInfo.oldLevel} → {levelUpInfo.newLevel}</p>
          <p className="exp-text">+{levelUpInfo.experienceGained} Experience</p>
        </div>
      )}
      
      {/* Hero Stats Section */}
      <HeroStatsPanel 
        activeHero={activeHero} 
        onOpenHeroSelection={onOpenHeroSelection} 
      />

      {/* Player Account Stats (smaller, bottom left) */}
      {/* <div className="player-stats" style={{
        position: 'absolute',
        bottom: '180px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.75)',
        padding: '15px',
        borderRadius: '8px',
        minWidth: '280px',
        border: '1px solid rgba(156, 163, 175, 0.3)'
      }}>
        <h4 style={{ 
          margin: '0 0 10px 0', 
          color: '#9ca3af',
          fontSize: '0.9em',
          borderBottom: '1px solid rgba(156, 163, 175, 0.2)',
          paddingBottom: '6px'
        }}>
          Player Account
        </h4>
        <div className="stat-info" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '0.85em'
        }}>
          <span style={{ color: '#d1d5db' }}>Level: {player.level}</span>
          <span style={{ color: '#d1d5db' }}>Experience: {player.experience}/{getExpForNextLevel(player.level)}</span>
        </div>
      </div> */}
      
      
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
