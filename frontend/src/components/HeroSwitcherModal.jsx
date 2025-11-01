import React from 'react'
import FantasyModal from './ui/FantasyModal'
import FantasyCard from './ui/FantasyCard'
import FantasyButton from './ui/FantasyButton'
import FantasyBadge from './ui/FantasyBadge'

export default function HeroSwitcherModal({ 
  player, 
  playerHeroes, 
  loading,
  error, 
  onSelectHero, 
  onClose 
}) {
  return (
    <FantasyModal
      isOpen={true}
      onClose={onClose}
      title="Select Your Hero"
      maxWidth="900px"
    >
      <div className="p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-5 p-4 bg-red-900/30 border-2 border-red-600/50 rounded-lg flex items-center gap-3 text-red-300">
            <span className="text-xl">⚠️</span>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Content */}
        {playerHeroes.length === 0 ? (
          <div className="text-center py-10 text-amber-300">
            <p>Loading heroes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playerHeroes.map((hero) => {
              const isActive = player?.active_hero_id === hero.playerHeroId;
              return (
                <FantasyCard
                  key={hero.playerHeroId}
                  onClick={() => !isActive && onSelectHero(hero.playerHeroId)}
                  hoverable={!isActive}
                  className={isActive ? 'border-green-500/60' : ''}
                  style={isActive ? {
                    background: 'linear-gradient(to bottom, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15))',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), 0 4px 15px rgba(0,0,0,0.6), 0 0 30px rgba(34, 197, 94, 0.4)'
                  } : {}}
                >
                  {/* Hero Name */}
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-amber-200 text-lg font-bold m-0" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      {hero.name || hero.heroName}
                    </h3>
                    {isActive && (
                      <FantasyBadge variant="success" size="sm">
                        Active
                      </FantasyBadge>
                    )}
                  </div>
                  
                  {/* Hero Class & Level */}
                  <div className="text-amber-300/80 text-sm mb-3" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {hero.heroName} • Level {hero.level}
                  </div>
                  
                  {/* Hero Stats */}
                  <div className="text-amber-200 text-sm space-y-1 mb-4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <div>❤️ HP: {hero.health}/{hero.maxHealth}</div>
                    <div>⚡ Power: {hero.power}/{hero.maxPower}</div>
                    <div>⚔️ ATK: {hero.attack} | 🛡️ DEF: {hero.defense}</div>
                  </div>
                  
                  {/* Select Button */}
                  {!isActive && (
                    <FantasyButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectHero(hero.playerHeroId);
                      }}
                      disabled={loading}
                      fullWidth
                      size="sm"
                    >
                      {loading ? 'Switching...' : 'Select Hero'}
                    </FantasyButton>
                  )}
                </FantasyCard>
              );
            })}
          </div>
        )}
      </div>
    </FantasyModal>
  )
}

