import React from 'react'

export default function HeroStatsPanel({ activeHero, onOpenHeroSelection }) {
  if (!activeHero) return null

  return (
    <div className="hero-stats" style={{
      position: 'fixed',
      top: '80px',
      left: '20px',
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.85)',
      padding: '20px',
      borderRadius: '12px',
      minWidth: '320px',
      border: '2px solid rgba(102, 126, 234, 0.5)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      pointerEvents: 'auto',
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
  )
}

