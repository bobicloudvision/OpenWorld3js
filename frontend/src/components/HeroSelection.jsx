import React from 'react'
import HeroModelPreview from './HeroModelPreview'
import { useHeroSwitcher } from '../hooks/useHeroSwitcher'
import FantasyModal from './ui/FantasyModal'
import FantasyCard from './ui/FantasyCard'
import FantasyButton from './ui/FantasyButton'
import FantasyBadge from './ui/FantasyBadge'

export default function HeroSelection({ player, playerHeroes, availableHeroes, socket, onHeroSelected, onHeroesUpdate, onClose }) {
  const [purchasingHeroId, setPurchasingHeroId] = React.useState(null)
  
  // Use hero switcher hook for switching logic
  const { 
    loading, 
    error, 
    setError,
    switchHero 
  } = useHeroSwitcher(socket, onHeroSelected, onHeroesUpdate)

  // Handle hero purchase events
  React.useEffect(() => {
    if (!socket) return

    const handleHeroPurchaseOk = ({ player: updatedPlayer, playerHeroes: updatedHeroes, availableHeroes: updatedAvailable }) => {
      setPurchasingHeroId(null)
      setError('')
      if (onHeroSelected) {
        onHeroSelected(updatedPlayer)
      }
      if (onHeroesUpdate) {
        onHeroesUpdate(updatedHeroes, updatedAvailable)
      }
    }

    const handleHeroPurchaseError = ({ message }) => {
      setPurchasingHeroId(null)
      setError(message || 'Failed to purchase hero')
    }

    socket.on('hero:purchase:ok', handleHeroPurchaseOk)
    socket.on('hero:purchase:error', handleHeroPurchaseError)

    return () => {
      socket.off('hero:purchase:ok', handleHeroPurchaseOk)
      socket.off('hero:purchase:error', handleHeroPurchaseError)
    }
  }, [socket, onHeroSelected, onHeroesUpdate])

  const handleSelectHero = (playerHeroId) => {
    switchHero(playerHeroId)
  }

  const handlePurchaseHero = (heroId, price) => {
    if (purchasingHeroId || !player) return
    
    if (player.currency < price) {
      setError('Insufficient currency')
      return
    }
    
    setPurchasingHeroId(heroId)
    setError('')
    socket.emit('purchase:hero', { heroId })
  }

  return (
    <FantasyModal
      isOpen={true}
      onClose={onClose}
      title="Select Your Hero"
      maxWidth="1200px"
    >
      <div className="p-6">
        {/* Currency Display */}
        {player && (
          <div className="flex justify-end mb-4">
            <FantasyBadge variant="primary" size="lg">
              Gold: {player.currency || 0}
            </FantasyBadge>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border-2 border-red-600/50 rounded-lg flex items-center gap-3 text-red-300">
            <span className="text-xl">⚠️</span>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Your Heroes Section */}
        <div className="mb-10">
          <h2 className="text-amber-300 text-2xl font-bold mb-5 pb-3 border-b-2 border-amber-700/50" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            Your Heroes
          </h2>
          {playerHeroes && playerHeroes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {playerHeroes.map((hero) => {
                const isActive = player?.active_hero_id === hero.playerHeroId;
                return (
                  <FantasyCard
                    key={hero.playerHeroId}
                    hoverable={!isActive}
                    className={isActive ? 'border-green-500/60' : ''}
                    style={isActive ? {
                      background: 'linear-gradient(to bottom, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15))',
                      boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), 0 4px 15px rgba(0,0,0,0.6), 0 0 30px rgba(34, 197, 94, 0.4)'
                    } : {}}
                  >
                    <div className="flex justify-center mb-4">
                      {/* <HeroModelPreview
                        modelPath={hero.model}
                        modelScale={hero.modelScale ?? 1}
                        modelRotation={hero.modelRotation ?? [0, -1.5707963267948966, 0]}
                      /> */}
                    </div>
                    <h3 className="text-amber-200 text-xl font-bold mb-3 text-center" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      {hero.name}
                    </h3>
                    <div className="text-amber-200 text-sm space-y-2 mb-4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      <div>Level {hero.level}</div>
                      <div>❤️ HP: {hero.health}/{hero.maxHealth}</div>
                      <div>⚔️ Attack: {hero.attack} | 🛡️ Defense: {hero.defense}</div>
                    </div>
                    {isActive ? (
                      <FantasyBadge variant="success" size="md" className="w-full justify-center">
                        Active
                      </FantasyBadge>
                    ) : (
                      <FantasyButton
                        onClick={() => handleSelectHero(hero.playerHeroId)}
                        disabled={loading}
                        fullWidth
                      >
                        {loading ? 'Selecting...' : 'Select Hero'}
                      </FantasyButton>
                    )}
                  </FantasyCard>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-amber-300">
              <p className="text-lg mb-2">You don't have any heroes yet.</p>
              <p className="text-sm text-amber-400">Purchase heroes from the shop below!</p>
            </div>
          )}
        </div>

        {/* Available Heroes Section */}
        {availableHeroes && availableHeroes.length > 0 && (
          <div className="mb-10">
            <h2 className="text-amber-300 text-2xl font-bold mb-5 pb-3 border-b-2 border-amber-700/50" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              Available Heroes to Purchase
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {availableHeroes.map((hero) => {
                const canAfford = player && player.currency >= (hero.price || 1000)
                const isPurchasing = purchasingHeroId === hero.id
                const price = hero.price || 1000
                
                return (
                  <FantasyCard
                    key={hero.id}
                    hoverable={true}
                  >
                    <div className="flex justify-center mb-4">
                      {/* <HeroModelPreview
                        modelPath={hero.model}
                        modelScale={hero.modelScale ?? 1}
                        modelRotation={hero.modelRotation ?? [0, -1.5707963267948966, 0]}
                      /> */}
                    </div>
                    <h3 className="text-amber-200 text-xl font-bold mb-3 text-center" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      {hero.name}
                    </h3>
                    <div className="text-amber-200 text-sm space-y-2 mb-4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      <div>❤️ HP: {hero.maxHealth}</div>
                      <div>⚔️ Attack: {hero.attack} | 🛡️ Defense: {hero.defense}</div>
                      <div className="pt-2 border-t border-amber-700/30">
                        <span className="text-amber-300">Price: </span>
                        <span className="text-amber-200 font-bold">{price}</span>
                        <span className="text-amber-300"> gold</span>
                      </div>
                    </div>
                    <FantasyButton
                      onClick={() => handlePurchaseHero(hero.id, price)}
                      disabled={!canAfford || isPurchasing || purchasingHeroId !== null}
                      variant={canAfford ? 'primary' : 'secondary'}
                      fullWidth
                    >
                      {isPurchasing 
                        ? 'Purchasing...' 
                        : canAfford 
                          ? `Buy for ${price} gold` 
                          : `Need ${price - (player?.currency || 0)} more gold`}
                    </FantasyButton>
                  </FantasyCard>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </FantasyModal>
  )
}


