import React, { useState, useEffect } from 'react'
import useGameStore from '../stores/gameStore'
import HeroStatsPanel from './HeroStatsPanel'
import { FantasyPanel, FantasyCard, FantasyButton, FantasyBadge, FantasyTooltip } from './ui'

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
        <FantasyCard className="min-w-[400px]">
          <h1 className="text-4xl font-bold text-green-400 mb-4" style={{ textShadow: '0 0 20px rgba(34, 197, 94, 0.8)' }}>Victory!</h1>
          <p className="text-amber-200 mb-6">All enemies defeated!</p>
          <FantasyButton onClick={resetGame} variant="primary" size="lg" className="w-full">Play Again</FantasyButton>
        </FantasyCard>
      </div>
    )
  }
  
  if (gameState === 'defeat') {
    return (
      <div className="game-overlay">
        <FantasyCard className="min-w-[400px]">
          <h1 className="text-4xl font-bold text-red-400 mb-4" style={{ textShadow: '0 0 20px rgba(239, 68, 68, 0.8)' }}>Defeat!</h1>
          <p className="text-amber-200 mb-6">You have been defeated!</p>
          <FantasyButton onClick={resetGame} variant="danger" size="lg" className="w-full">Try Again</FantasyButton>
        </FantasyCard>
      </div>
    )
  }
  
  return (
    <div className="game-ui">
      {/* Combat Result Notification */}
      {combatResult && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-auto" style={{ animation: 'combatResultSlideIn 0.5s ease-out' }}>
          <FantasyCard className="min-w-[400px] text-center" style={{
            borderColor: combatResult.type === 'victory' ? '#ffd700' : combatResult.type === 'defeat' ? '#ff4444' : '#888',
            background: combatResult.type === 'victory' 
              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(0, 0, 0, 0.95) 50%)'
              : combatResult.type === 'defeat'
              ? 'linear-gradient(135deg, rgba(255, 68, 68, 0.2) 0%, rgba(0, 0, 0, 0.95) 50%)'
              : 'linear-gradient(135deg, rgba(136, 136, 136, 0.2) 0%, rgba(0, 0, 0, 0.95) 50%)'
          }}>
            <h2 className={`text-4xl font-bold mb-4 ${combatResult.type === 'victory' ? 'text-yellow-400' : combatResult.type === 'defeat' ? 'text-red-400' : 'text-gray-400'}`} style={{ 
              textShadow: '0 0 20px currentColor',
              animation: combatResult.type === 'victory' ? 'victoryPulse 1.5s ease-in-out infinite' : 'none'
            }}>
              {combatResult.type === 'victory' && '🏆 VICTORY!'}
              {combatResult.type === 'defeat' && '💀 DEFEATED!'}
              {combatResult.type === 'draw' && '🤝 DRAW!'}
            </h2>
            <p className="text-amber-200 text-lg mb-4">
              {combatResult.type === 'victory' && 'You have won the battle!'}
              {combatResult.type === 'defeat' && 'You have been defeated!'}
              {combatResult.type === 'draw' && 'The battle ended in a draw!'}
            </p>
            {(combatResult.winners?.length > 0 || combatResult.losers?.length > 0) && (
              <div className="mt-4 pt-4 border-t border-amber-700/30">
                {combatResult.winners?.length > 0 && (
                  <div className="mb-2">
                    <span className="text-amber-300/80">Winners: </span>
                    {combatResult.winners.map((winner, idx) => (
                      <FantasyBadge key={idx} variant="success" size="sm" className="mx-1">{winner}</FantasyBadge>
                    ))}
                  </div>
                )}
                {combatResult.losers?.length > 0 && (
                  <div>
                    <span className="text-amber-300/80">Losers: </span>
                    {combatResult.losers.map((loser, idx) => (
                      <FantasyBadge key={idx} variant="danger" size="sm" className="mx-1">{loser}</FantasyBadge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </FantasyCard>
        </div>
      )}
      
      {/* Level Up Notification */}
      {levelUpInfo && (
        <div className="fixed top-[20%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1001] pointer-events-auto" style={{ animation: 'levelUpBounce 0.6s ease-out' }}>
          <FantasyCard className="text-center min-w-[350px]" style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.95) 0%, rgba(255, 140, 0, 0.95) 100%)',
            borderColor: '#ffd700',
            boxShadow: '0 0 50px rgba(255, 215, 0, 0.8)'
          }}>
            <h2 className="text-3xl font-bold mb-3 text-white" style={{ textShadow: '0 0 20px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.8)' }}>
              ⭐ LEVEL UP! ⭐
            </h2>
            <p className="text-2xl font-bold mb-2 text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              Level {levelUpInfo.oldLevel} → {levelUpInfo.newLevel}
            </p>
            <p className="text-lg text-amber-50" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              +{levelUpInfo.experienceGained} Experience
            </p>
          </FantasyCard>
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
      <div className="fixed bottom-5 right-5 z-[1000] pointer-events-auto" style={{ maxWidth: '300px', maxHeight: '200px' }}>
        <FantasyPanel title="Combat Log" className="p-4">
          <div className="max-h-[150px] overflow-y-auto space-y-1">
            {combatLog.slice(-5).map((entry, index) => (
              <FantasyBadge 
                key={index} 
                variant={
                  entry.type === 'victory' ? 'success' :
                  entry.type === 'defeat' ? 'danger' :
                  entry.type === 'heal' ? 'success' :
                  entry.type === 'attack' || entry.type === 'damage' ? 'danger' :
                  entry.type === 'levelup' ? 'warning' :
                  'default'
                }
                size="sm"
                className="block w-full text-left py-2 px-2 text-xs"
              >
                {entry.message}
              </FantasyBadge>
            ))}
            {combatLog.length === 0 && (
              <div className="text-amber-300/60 text-sm italic">No combat activity yet...</div>
            )}
          </div>
        </FantasyPanel>
      </div>
      
      {/* Enemy Status */}
      {/* {enemies.filter(e => e.alive).length > 0 && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[1000] pointer-events-auto" style={{ minWidth: '300px' }}>
          <FantasyPanel title="Enemies" className="p-4">
            <div className="space-y-2">
              {enemies.filter(e => e.alive).map(enemy => (
                <FantasyCard key={enemy.id} className="p-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[150px]">
                      <FantasyBadge variant="danger" size="sm" className="mb-1">{enemy.name}</FantasyBadge>
                      <div className="text-xs text-amber-300/80 mt-1">
                        <span className="text-red-400 font-semibold">{Math.round(enemy.health)}/{enemy.maxHealth} HP</span>
                        {enemy.type && <span className="ml-2 text-amber-400/60">• {enemy.type}</span>}
                      </div>
                    </div>
                    {enemy.position && (
                      <FantasyTooltip content={`Position: [${Math.round(enemy.position[0])}, ${Math.round(enemy.position[2])}]`}>
                        <FantasyBadge variant="default" size="sm" className="text-xs">
                          [{Math.round(enemy.position[0])}, {Math.round(enemy.position[2])}]
                        </FantasyBadge>
                      </FantasyTooltip>
                    )}
                  </div>
                </FantasyCard>
              ))}
            </div>
          </FantasyPanel>
        </div>
      )} */}
      
      {/* Debug Info */}
      <div className="fixed bottom-5 left-5 z-[1000] pointer-events-auto" style={{ minWidth: '200px' }}>
        <FantasyPanel title="Debug Info" className="p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-amber-300/80">Player Health:</span>
              <FantasyBadge variant={player.health <= 0 ? 'danger' : 'success'} size="sm">
                {player.health}
              </FantasyBadge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-amber-300/80">Game State:</span>
              <FantasyBadge variant="default" size="sm">{gameState}</FantasyBadge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-amber-300/80">Alive Enemies:</span>
              <FantasyBadge variant={enemies.filter(e => e.alive).length > 0 ? 'warning' : 'success'} size="sm">
                {enemies.filter(e => e.alive).length}
              </FantasyBadge>
            </div>
            {playerPositionRef?.current && (
              <div className="flex justify-between items-center">
                <span className="text-amber-300/80">Position:</span>
                <FantasyBadge variant="default" size="sm">
                  [{Math.round(playerPositionRef.current[0])}, {Math.round(playerPositionRef.current[2])}]
                </FantasyBadge>
              </div>
            )}
            {combatLog.slice(-1)[0]?.message && (
              <div className="mt-2 pt-2 border-t border-amber-700/30">
                <div className="text-amber-300/60 text-xs">Last Action:</div>
                <div className="text-amber-200 text-xs mt-1">{combatLog.slice(-1)[0].message}</div>
              </div>
            )}
          </div>
        </FantasyPanel>
      </div>
    </div>
  )
}
