import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook for managing hero switching logic
 * @param {Object} socket - Socket.io instance
 * @param {Function} onHeroSelected - Callback when hero is selected
 * @param {Function} onHeroesUpdate - Callback when heroes list updates
 * @returns {Object} - Hook state and handlers
 */
export function useHeroSwitcher(socket, onHeroSelected, onHeroesUpdate) {
  const [playerHeroes, setPlayerHeroes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Use refs to store latest callbacks to avoid re-registering listeners
  const onHeroSelectedRef = useRef(onHeroSelected)
  const onHeroesUpdateRef = useRef(onHeroesUpdate)

  // Keep refs in sync with latest callbacks
  useEffect(() => {
    onHeroSelectedRef.current = onHeroSelected
    onHeroesUpdateRef.current = onHeroesUpdate
  }, [onHeroSelected, onHeroesUpdate])
  
  // Listen to player:heroes only if onHeroesUpdate is provided (for backward compatibility)
  // When heroes are passed as props, this listener should not trigger updates
  useEffect(() => {
    if (!socket || !onHeroesUpdate) return

    const handlePlayerHeroes = (heroes) => {
      console.log('[useHeroSwitcher] Received player heroes:', heroes)
      setPlayerHeroes(heroes)
      // Only call onHeroesUpdate if it's actually being used
      // In HeroSwitcherModal, we pass heroes as props, so this won't cause duplicate updates
      if (onHeroesUpdateRef.current) {
        onHeroesUpdateRef.current(heroes)
      }
    }

    socket.on('player:heroes', handlePlayerHeroes)

    return () => {
      socket.off('player:heroes', handlePlayerHeroes)
    }
    // Only depend on socket - callbacks are accessed via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, onHeroesUpdate])

  // Listen for socket events (only hero switching events, not player:heroes)
  // player:heroes is handled by usePlayerHeroManager to avoid duplicate updates
  useEffect(() => {
    if (!socket) return

    const handleHeroSetActiveOk = ({ player: updatedPlayer }) => {
      console.log('[useHeroSwitcher] Hero switched successfully:', updatedPlayer)
      setLoading(false)
      setError('')
      if (onHeroSelectedRef.current) {
        onHeroSelectedRef.current(updatedPlayer)
      }
      // Note: usePlayerHeroManager also listens to hero:set:active:ok and will refresh heroes
      // No need to emit get:player:heroes here to avoid duplicate requests
    }

    const handleHeroSetActiveError = ({ message }) => {
      console.error('[useHeroSwitcher] Failed to switch hero:', message)
      setLoading(false)
      setError(message || 'Failed to set active hero')
    }

    socket.on('hero:set:active:ok', handleHeroSetActiveOk)
    socket.on('hero:set:active:error', handleHeroSetActiveError)

    return () => {
      socket.off('hero:set:active:ok', handleHeroSetActiveOk)
      socket.off('hero:set:active:error', handleHeroSetActiveError)
    }
    // Only depend on socket - callbacks are accessed via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket])

  // Request heroes list
  const fetchHeroes = useCallback(() => {
    if (!socket) return
    socket.emit('get:player:heroes')
  }, [socket])

  // Switch to a different hero
  const switchHero = (playerHeroId) => {
    if (loading || !socket) return false
    setLoading(true)
    setError('')
    socket.emit('set:active:hero', { playerHeroId })
    return true
  }

  return {
    playerHeroes,
    loading,
    error,
    setError,
    fetchHeroes,
    switchHero
  }
}

