import React from 'react'
import { FantasyCard, FantasyButton, FantasyProgressBar } from './ui'

export default function HeroStatsPanel({ activeHero, onOpenHeroSelection }) {
  if (!activeHero) return null

  return (
    <div 
      className="fixed top-20 left-5 z-[1000] pointer-events-auto"
      style={{ minWidth: '320px' }}
    >
      <FantasyCard className="p-5">
        {/* Hero Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-amber-700/50">
          <div>
            <h3 className="m-0 mb-1 text-amber-300 text-xl font-bold" style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 15px rgba(217, 119, 6, 0.6)',
              fontFamily: 'Georgia, serif'
            }}>
              {activeHero.name}
            </h3>
            <div className="text-amber-300 text-sm" style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              {activeHero.heroName} • Level {activeHero.level}
            </div>
          </div>
          {onOpenHeroSelection && (
            <FantasyButton
              onClick={onOpenHeroSelection}
              size="sm"
            >
              Change
            </FantasyButton>
          )}
        </div>

        {/* Hero Health Bar */}
        <FantasyProgressBar
          label={`❤️ Health: ${Math.round(activeHero.health)}/${activeHero.maxHealth}${activeHero.health <= 0 ? ' (DEFEATED!)' : ''}`}
          current={activeHero.health}
          max={activeHero.maxHealth}
          variant="health"
          height="h-6"
        />
        
        {/* Hero Power Bar */}
        <FantasyProgressBar
          label={`⚡ Power: ${Math.round(activeHero.power)}/${activeHero.maxPower}`}
          current={activeHero.power}
          max={activeHero.maxPower}
          variant="power"
          height="h-6"
        />
        
        {/* Hero Experience Bar */}
        <FantasyProgressBar
          label={`⭐ Experience: ${activeHero.experience}/${100 * activeHero.level}`}
          current={activeHero.experience}
          max={100 * activeHero.level}
          variant="experience"
          height="h-5"
        />
      
        {/* Hero Combat Stats */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-amber-700/50">
          <div className="bg-red-500/15 p-2 rounded border border-red-500/30 text-center">
            <div className="text-xs text-amber-300 mb-1 uppercase tracking-wider" style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>Attack</div>
            <div className="text-lg font-bold text-red-400" style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              ⚔️ {activeHero.attack}
            </div>
          </div>
          <div className="bg-blue-500/15 p-2 rounded border border-blue-500/30 text-center">
            <div className="text-xs text-amber-300 mb-1 uppercase tracking-wider" style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>Defense</div>
            <div className="text-lg font-bold text-blue-400" style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              🛡️ {activeHero.defense}
            </div>
          </div>
        </div>

        {/* Hero Spells */}
        {activeHero.spells && activeHero.spells.length > 0 && (
          <div className="mt-4 pt-3 border-t border-amber-700/50">
            <div className="text-sm text-amber-300 mb-2 font-bold uppercase tracking-wider" style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              📜 Spells ({activeHero.spells.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {activeHero.spells.map((spell, idx) => {
                const r = parseInt(spell.color?.substring(1,3) || 'ff', 16);
                const g = parseInt(spell.color?.substring(3,5) || 'ff', 16);
                const b = parseInt(spell.color?.substring(5,7) || 'ff', 16);
                return (
                  <div 
                    key={idx}
                    className="px-2 py-1 rounded text-xs text-white cursor-help border"
                    style={{
                      background: `rgba(${r}, ${g}, ${b}, 0.2)`,
                      borderColor: spell.color || '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                    }}
                    title={`${spell.name}\nDamage: ${spell.damage}\nCost: ${spell.powerCost}\nCooldown: ${spell.cooldown}s`}
                  >
                    {spell.name}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </FantasyCard>
    </div>
  )
}

