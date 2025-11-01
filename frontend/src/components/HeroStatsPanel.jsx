import React from 'react'
import { FantasyCard, FantasyButton, FantasyTooltip, FantasyCompactProgressBar } from './ui'

export default function HeroStatsPanel({ activeHero, onOpenHeroSelection }) {
  if (!activeHero) return null

  return (
    <div 
      className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-[1000] pointer-events-auto"
      style={{ maxHeight: '100px', minWidth: '600px', maxWidth: '1000px' }}
    >
      <FantasyCard className="p-2">
        <div className="flex items-center gap-3">
          {/* Hero Name & Level */}
          <FantasyTooltip content={`${activeHero.heroName} • Level ${activeHero.level}\n${activeHero.name}`}>
            <div className="flex-shrink-0">
              <div className="text-amber-300 text-sm font-bold leading-tight" style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                {activeHero.name}
              </div>
              <div className="text-amber-400/80 text-[10px] leading-tight" style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                Lv.{activeHero.level}
              </div>
            </div>
          </FantasyTooltip>

          <div className="h-8 w-px bg-amber-700/50"></div>

          {/* Progress Bars - Inline */}
          <div className="flex items-center gap-3 flex-1">
            <FantasyCompactProgressBar
              icon="❤️"
              current={activeHero.health}
              max={activeHero.maxHealth}
              variant="health"
              label={`${Math.round(activeHero.health)}/${activeHero.maxHealth}`}
              tooltipContent={`Health: ${Math.round(activeHero.health)}/${activeHero.maxHealth}${activeHero.health <= 0 ? ' (DEFEATED!)' : ''}`}
            />
            <FantasyCompactProgressBar
              icon="⚡"
              current={activeHero.power}
              max={activeHero.maxPower}
              variant="power"
              label={`${Math.round(activeHero.power)}/${activeHero.maxPower}`}
              tooltipContent={`Power: ${Math.round(activeHero.power)}/${activeHero.maxPower}`}
            />
            <FantasyCompactProgressBar
              icon="⭐"
              current={activeHero.experience}
              max={100 * activeHero.level}
              variant="experience"
              label={`${activeHero.experience}/${100 * activeHero.level}`}
              tooltipContent={`Experience: ${activeHero.experience}/${100 * activeHero.level}`}
            />
          </div>

          <div className="h-8 w-px bg-amber-700/50"></div>

          {/* Combat Stats - Compact */}
          <div className="flex gap-2 items-center">
            <FantasyTooltip content={`Attack: ${activeHero.attack}`}>
              <div className="bg-red-500/15 px-2 py-1 rounded border border-red-500/30 text-center cursor-help">
                <div className="text-[10px] text-amber-300/80 uppercase" style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>ATK</div>
                <div className="text-sm font-bold text-red-400 leading-none" style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                  ⚔️ {activeHero.attack}
                </div>
              </div>
            </FantasyTooltip>
            <FantasyTooltip content={`Defense: ${activeHero.defense}`}>
              <div className="bg-blue-500/15 px-2 py-1 rounded border border-blue-500/30 text-center cursor-help">
                <div className="text-[10px] text-amber-300/80 uppercase" style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>DEF</div>
                <div className="text-sm font-bold text-blue-400 leading-none" style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                  🛡️ {activeHero.defense}
                </div>
              </div>
            </FantasyTooltip>
          </div>

          {/* Spells - Compact Icons Only */}
          {activeHero.spells && activeHero.spells.length > 0 && (
            <>
              <div className="h-8 w-px bg-amber-700/50"></div>
              <FantasyTooltip content={`${activeHero.spells.length} Spells Available`}>
                <div className="flex items-center gap-1 cursor-help">
                  <span className="text-xs text-amber-300/80">📜</span>
                  <span className="text-xs text-amber-300/80 font-bold">{activeHero.spells.length}</span>
                </div>
              </FantasyTooltip>
              <div className="flex gap-1 max-w-[200px] overflow-x-auto">
                {activeHero.spells.slice(0, 5).map((spell, idx) => {
                  const r = parseInt(spell.color?.substring(1,3) || 'ff', 16);
                  const g = parseInt(spell.color?.substring(3,5) || 'ff', 16);
                  const b = parseInt(spell.color?.substring(5,7) || 'ff', 16);
                  return (
                    <FantasyTooltip 
                      key={idx}
                      content={`${spell.name}\nDamage: ${spell.damage}\nCost: ${spell.powerCost}\nCooldown: ${spell.cooldown}s`}
                    >
                      <div
                        className="w-6 h-6 rounded border cursor-help flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{
                          background: `rgba(${r}, ${g}, ${b}, 0.3)`,
                          borderColor: spell.color || '#ffffff'
                        }}
                        title={spell.name}
                      >
                        {spell.name.charAt(0).toUpperCase()}
                      </div>
                    </FantasyTooltip>
                  );
                })}
                {activeHero.spells.length > 5 && (
                  <FantasyTooltip content={`+${activeHero.spells.length - 5} more spells`}>
                    <div className="w-6 h-6 rounded border border-amber-700/50 bg-amber-900/30 flex items-center justify-center text-[8px] text-amber-300/80 cursor-help">
                      +{activeHero.spells.length - 5}
                    </div>
                  </FantasyTooltip>
                )}
              </div>
            </>
          )}

          {/* Change Hero Button */}
          {onOpenHeroSelection && (
            <>
              <div className="h-8 w-px bg-amber-700/50"></div>
              <FantasyButton
                onClick={onOpenHeroSelection} 
                size="sm"
                className="text-xs px-2 py-1"
              >
                Change
              </FantasyButton>
            </>
          )}
        </div>
      </FantasyCard>
    </div>
  )
}

