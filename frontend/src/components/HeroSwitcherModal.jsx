import React from 'react'

export default function HeroSwitcherModal({ 
  player, 
  playerHeroes, 
  loading,
  error, 
  onSelectHero, 
  onClose 
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 2000,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      pointerEvents: 'auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(31, 41, 55, 0.98) 100%)',
        padding: '30px',
        borderRadius: '16px',
        border: '2px solid rgba(102, 126, 234, 0.5)',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            margin: 0,
            color: '#667eea',
            fontSize: '1.8em',
            textShadow: '0 2px 10px rgba(102, 126, 234, 0.5)'
          }}>
            Select Your Hero
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '1.5em',
              fontWeight: 'bold',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)'
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.8)'
              e.currentTarget.style.color = '#fee2e2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
              e.currentTarget.style.color = '#fca5a5'
            }}
          >
            ✕
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '15px',
            color: '#fca5a5',
            fontSize: '0.95em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.2em' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        {playerHeroes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#9ca3af'
          }}>
            <p>Loading heroes...</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            {playerHeroes.map((hero) => {
              const isActive = player?.active_hero_id === hero.playerHeroId;
              return (
                <div
                  key={hero.playerHeroId}
                  style={{
                    background: isActive 
                      ? 'rgba(34, 197, 94, 0.15)' 
                      : 'rgba(31, 41, 55, 0.8)',
                    border: isActive 
                      ? '2px solid rgba(34, 197, 94, 0.6)' 
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '20px',
                    transition: 'all 0.3s ease',
                    cursor: isActive ? 'default' : 'pointer',
                    boxShadow: isActive 
                      ? '0 0 20px rgba(34, 197, 94, 0.3)' 
                      : 'none'
                  }}
                  onClick={() => !isActive && onSelectHero(hero.playerHeroId)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'scale(1.02)'
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.6)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {/* Hero Name */}
                  <div style={{
                    fontSize: '1.2em',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{hero.name || hero.heroName}</span>
                    {isActive && (
                      <span style={{
                        fontSize: '0.7em',
                        color: '#4ade80',
                        background: 'rgba(34, 197, 94, 0.2)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        Active
                      </span>
                    )}
                  </div>
                  
                  {/* Hero Class & Level */}
                  <div style={{
                    fontSize: '0.85em',
                    color: '#9ca3af',
                    marginBottom: '12px'
                  }}>
                    {hero.heroName} • Level {hero.level}
                  </div>
                  
                  {/* Hero Stats */}
                  <div style={{
                    fontSize: '0.85em',
                    color: '#d1d5db',
                    lineHeight: '1.5'
                  }}>
                    <div>❤️ HP: {hero.health}/{hero.maxHealth}</div>
                    <div>⚡ Power: {hero.power}/{hero.maxPower}</div>
                    <div>⚔️ ATK: {hero.attack} | 🛡️ DEF: {hero.defense}</div>
                  </div>
                  
                  {/* Select Button */}
                  {!isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectHero(hero.playerHeroId);
                      }}
                      disabled={loading}
                      style={{
                        marginTop: '12px',
                        width: '100%',
                        padding: '8px',
                        background: loading 
                          ? 'rgba(102, 126, 234, 0.3)' 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.9em',
                        fontWeight: 'bold',
                        cursor: loading ? 'wait' : 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.boxShadow = '0 0 10px rgba(102, 126, 234, 0.5)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      {loading ? 'Switching...' : 'Select Hero'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

