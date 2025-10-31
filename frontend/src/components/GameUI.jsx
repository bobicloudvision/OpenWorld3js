import React, { useState, useEffect } from 'react'
import useGameStore from '../stores/gameStore'

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
      {activeHero && (
        <div className="hero-stats" style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.85)',
          padding: '20px',
          borderRadius: '12px',
          minWidth: '320px',
          border: '2px solid rgba(102, 126, 234, 0.5)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}>
          {/* Hero Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px',
            paddingBottom: '12px',
            borderBottom: '2px solid rgba(102, 126, 234, 0.3)'
          }}>
            <div>
              <h3 style={{ 
                margin: '0 0 4px 0', 
                color: '#667eea',
                fontSize: '1.3em',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(102, 126, 234, 0.5)'
              }}>
                {activeHero.name}
              </h3>
              <div style={{ fontSize: '0.85em', color: '#9ca3af' }}>
                {activeHero.heroName} • Level {activeHero.level}
              </div>
            </div>
            {onOpenHeroSelection && (
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
                Change
              </button>
            )}
          </div>

          {/* Hero Health Bar */}
          <div className="stat-bar" style={{ marginBottom: '12px' }}>
            <label style={{ 
              fontSize: '0.9em', 
              fontWeight: 'bold',
              color: activeHero.health <= 0 ? '#ff4444' : '#fff'
            }}>
              ❤️ Health: {Math.round(activeHero.health)}/{activeHero.maxHealth} 
              {activeHero.health <= 0 ? ' (DEFEATED!)' : ''}
            </label>
            <div className="bar health-bar" style={{ 
              background: 'rgba(255, 0, 0, 0.2)',
              height: '24px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 0, 0, 0.4)'
            }}>
              <div 
                className="bar-fill" 
                style={{ 
                  width: `${Math.max(0, (activeHero.health / activeHero.maxHealth) * 100)}%`,
                  background: activeHero.health <= 0 
                    ? 'linear-gradient(90deg, #ff0000 0%, #aa0000 100%)'
                    : 'linear-gradient(90deg, #ff4444 0%, #ff0000 100%)',
                  height: '100%',
                  transition: 'width 0.3s ease',
                  boxShadow: 'inset 0 0 10px rgba(255, 255, 255, 0.3)'
                }}
              />
            </div>
          </div>
          
          {/* Hero Power Bar */}
          <div className="stat-bar" style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.9em', fontWeight: 'bold' }}>
              ⚡ Power: {Math.round(activeHero.power)}/{activeHero.maxPower}
            </label>
            <div className="bar power-bar" style={{ 
              background: 'rgba(68, 68, 255, 0.2)',
              height: '24px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(68, 68, 255, 0.4)'
            }}>
              <div 
                className="bar-fill" 
                style={{ 
                  width: `${Math.max(0, (activeHero.power / activeHero.maxPower) * 100)}%`,
                  background: 'linear-gradient(90deg, #6666ff 0%, #4444ff 100%)',
                  height: '100%',
                  transition: 'width 0.3s ease',
                  boxShadow: 'inset 0 0 10px rgba(255, 255, 255, 0.3)'
                }}
              />
            </div>
          </div>
          
          {/* Hero Experience Bar */}
          <div className="stat-bar" style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.9em', fontWeight: 'bold' }}>
              ⭐ Experience: {activeHero.experience}/{100 * activeHero.level}
            </label>
            <div className="bar exp-bar" style={{ 
              background: 'rgba(255, 170, 0, 0.2)',
              height: '20px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 170, 0, 0.4)'
            }}>
              <div 
                className="bar-fill" 
                style={{ 
                  width: `${Math.max(0, (activeHero.experience / (100 * activeHero.level)) * 100)}%`,
                  background: 'linear-gradient(90deg, #ffcc00 0%, #ffaa00 100%)',
                  height: '100%',
                  transition: 'width 0.3s ease',
                  boxShadow: 'inset 0 0 10px rgba(255, 255, 255, 0.3)'
                }}
              />
            </div>
          </div>
          
          {/* Hero Combat Stats */}
          <div className="stat-info" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginTop: '15px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{ 
              background: 'rgba(255, 68, 68, 0.15)',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75em', color: '#9ca3af', marginBottom: '2px' }}>Attack</div>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#ff4444' }}>
                ⚔️ {activeHero.attack}
              </div>
            </div>
            <div style={{ 
              background: 'rgba(68, 136, 255, 0.15)',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(68, 136, 255, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75em', color: '#9ca3af', marginBottom: '2px' }}>Defense</div>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#4488ff' }}>
                🛡️ {activeHero.defense}
              </div>
            </div>
          </div>

          {/* Hero Spells */}
          {activeHero.spells && activeHero.spells.length > 0 && (
            <div style={{
              marginTop: '15px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(102, 126, 234, 0.3)'
            }}>
              <div style={{ 
                fontSize: '0.85em', 
                color: '#9ca3af', 
                marginBottom: '8px',
                fontWeight: 'bold'
              }}>
                📜 Spells ({activeHero.spells.length})
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                {activeHero.spells.map((spell, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: `rgba(${parseInt(spell.color?.substring(1,3) || 'ff', 16)}, ${parseInt(spell.color?.substring(3,5) || 'ff', 16)}, ${parseInt(spell.color?.substring(5,7) || 'ff', 16)}, 0.2)`,
                      border: `1px solid ${spell.color || '#ffffff'}`,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75em',
                      color: '#fff',
                      cursor: 'help',
                      title: `${spell.name}\nDamage: ${spell.damage}\nCost: ${spell.powerCost}\nCooldown: ${spell.cooldown}s`
                    }}
                  >
                    {spell.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
