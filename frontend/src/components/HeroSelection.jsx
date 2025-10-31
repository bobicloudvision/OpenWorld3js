import React from 'react'
import HeroModelPreview from './HeroModelPreview'

export default function HeroSelection({ player, playerHeroes, availableHeroes, socket, onHeroSelected, onHeroesUpdate, onClose }) {
  const [loading, setLoading] = React.useState(false)
  const [purchasingHeroId, setPurchasingHeroId] = React.useState(null)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (!socket) return

    const handleHeroSetActiveOk = ({ player: updatedPlayer }) => {
      setLoading(false)
      if (onHeroSelected) {
        onHeroSelected(updatedPlayer)
      }
    }

    const handleHeroSetActiveError = ({ message }) => {
      setLoading(false)
      setError(message || 'Failed to set active hero')
    }

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

    socket.on('hero:set:active:ok', handleHeroSetActiveOk)
    socket.on('hero:set:active:error', handleHeroSetActiveError)
    socket.on('hero:purchase:ok', handleHeroPurchaseOk)
    socket.on('hero:purchase:error', handleHeroPurchaseError)

    return () => {
      socket.off('hero:set:active:ok', handleHeroSetActiveOk)
      socket.off('hero:set:active:error', handleHeroSetActiveError)
      socket.off('hero:purchase:ok', handleHeroPurchaseOk)
      socket.off('hero:purchase:error', handleHeroPurchaseError)
    }
  }, [socket, onHeroSelected, onHeroesUpdate])

  const handleSelectHero = (playerHeroId) => {
    if (loading) return
    setLoading(true)
    setError('')
    socket.emit('set:active:hero', { playerHeroId })
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
    <div style={styles.container}>
      <div style={styles.overlay}>
        <div style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.title}>Select Your Hero</h1>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {player && (
                <div style={styles.currencyDisplay}>
                  <span style={styles.currencyLabel}>Gold:</span>
                  <span style={styles.currencyValue}>{player.currency || 0}</span>
                </div>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  style={styles.closeButton}
                  title="Close"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          {error && <div style={styles.error}>{error}</div>}
          
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Your Heroes</h2>
            {playerHeroes && playerHeroes.length > 0 ? (
              <div style={styles.heroGrid}>
                {playerHeroes.map((hero) => (
                  <div
                    key={hero.playerHeroId}
                    style={{
                      ...styles.heroCard,
                      ...(player?.active_hero_id === hero.playerHeroId ? styles.heroCardActive : {})
                    }}
                  >
                    <HeroModelPreview
                      modelPath={hero.model}
                      modelScale={hero.modelScale ?? 1}
                      modelRotation={hero.modelRotation ?? [0, -1.5707963267948966, 0]}
                    />
                    <div style={styles.heroName}>{hero.name}</div>
                    <div style={styles.heroInfo}>
                      <div>Level {hero.level}</div>
                      <div>HP: {hero.health}/{hero.maxHealth}</div>
                      <div>Attack: {hero.attack} | Defense: {hero.defense}</div>
                    </div>
                    {player?.active_hero_id === hero.playerHeroId ? (
                      <div style={styles.activeBadge}>Active</div>
                    ) : (
                      <button
                        style={styles.selectButton}
                        onClick={() => handleSelectHero(hero.playerHeroId)}
                        disabled={loading}
                      >
                        {loading ? 'Selecting...' : 'Select Hero'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p>You don't have any heroes yet.</p>
                <p style={styles.emptyStateSubtext}>Purchase heroes from the shop below!</p>
              </div>
            )}
          </div>

          {availableHeroes && availableHeroes.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Available Heroes to Purchase</h2>
              <div style={styles.heroGrid}>
                {availableHeroes.map((hero) => {
                  const canAfford = player && player.currency >= (hero.price || 1000)
                  const isPurchasing = purchasingHeroId === hero.id
                  const price = hero.price || 1000
                  
                  return (
                    <div key={hero.id} style={styles.heroCard}>
                      <HeroModelPreview
                        modelPath={hero.model}
                        modelScale={hero.modelScale ?? 1}
                        modelRotation={hero.modelRotation ?? [0, -1.5707963267948966, 0]}
                      />
                      <div style={styles.heroName}>{hero.name}</div>
                      <div style={styles.heroInfo}>
                        <div>HP: {hero.maxHealth}</div>
                        <div>Attack: {hero.attack} | Defense: {hero.defense}</div>
                        <div style={styles.priceDisplay}>
                          Price: <span style={styles.priceValue}>{price}</span> gold
                        </div>
                      </div>
                      <button 
                        style={{
                          ...styles.buyButton,
                          ...(canAfford ? styles.buyButtonEnabled : {}),
                          ...(isPurchasing ? styles.buyButtonPurchasing : {})
                        }}
                        onClick={() => handlePurchaseHero(hero.id, price)}
                        disabled={!canAfford || isPurchasing || purchasingHeroId !== null}
                      >
                        {isPurchasing ? 'Purchasing...' : canAfford ? `Buy for ${price} gold` : `Need ${price - (player?.currency || 0)} more gold`}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1000,
  },
  overlay: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'auto',
    padding: '20px',
  },
  content: {
    width: '100%',
    maxWidth: '1200px',
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '16px',
    padding: '40px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  title: {
    color: '#fff',
    fontSize: '2.5em',
    margin: 0,
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
  },
  currencyDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(234, 179, 8, 0.2)',
    border: '2px solid rgba(234, 179, 8, 0.5)',
    borderRadius: '8px',
    padding: '10px 20px',
  },
  currencyLabel: {
    color: '#fbbf24',
    fontSize: '1em',
    fontWeight: 'bold',
  },
  currencyValue: {
    color: '#fcd34d',
    fontSize: '1.5em',
    fontWeight: 'bold',
  },
  priceDisplay: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  priceValue: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    color: '#fca5a5',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontSize: '1.5em',
    margin: '0 0 20px 0',
    borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
    paddingBottom: '10px',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  heroCard: {
    background: 'rgba(31, 41, 55, 0.8)',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  heroCardActive: {
    border: '2px solid rgba(34, 197, 94, 0.6)',
    background: 'rgba(34, 197, 94, 0.1)',
    boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
  },
  heroName: {
    color: '#fff',
    fontSize: '1.3em',
    fontWeight: 'bold',
    marginBottom: '12px',
    textAlign: 'center',
  },
  heroInfo: {
    color: '#d1d5db',
    fontSize: '0.9em',
    lineHeight: '1.6',
    marginBottom: '15px',
  },
  activeBadge: {
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#4ade80',
    padding: '8px 16px',
    borderRadius: '6px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '0.9em',
  },
  selectButton: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  buyButton: {
    width: '100%',
    padding: '12px',
    background: 'rgba(107, 114, 128, 0.5)',
    border: 'none',
    borderRadius: '8px',
    color: '#9ca3af',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'not-allowed',
    transition: 'all 0.3s ease',
  },
  buyButtonEnabled: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: '#fff',
    cursor: 'pointer',
  },
  buyButtonPurchasing: {
    background: 'rgba(107, 114, 128, 0.8)',
    color: '#fff',
    cursor: 'wait',
  },
  emptyState: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '40px 20px',
  },
  emptyStateSubtext: {
    marginTop: '10px',
    fontSize: '0.9em',
    color: '#6b7280',
  },
  closeButton: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '2px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '1.5em',
    fontWeight: 'bold',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
}

