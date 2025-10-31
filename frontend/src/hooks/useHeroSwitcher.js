import { useState, useEffect } from 'react'

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

  // Listen for socket events
  useEffect(() => {
    if (!socket) return

    const handlePlayerHeroes = (heroes) => {
      console.log('[useHeroSwitcher] Received player heroes:', heroes)
      setPlayerHeroes(heroes)
      if (onHeroesUpdate) {
        onHeroesUpdate(heroes)
      }
    }

    const handleHeroSetActiveOk = ({ player: updatedPlayer }) => {
      console.log('[useHeroSwitcher] Hero switched successfully:', updatedPlayer)
      setLoading(false)
      setError('')
      if (onHeroSelected) {
        onHeroSelected(updatedPlayer)
      }
      // Refresh hero list to get updated stats
      if (socket) {
        socket.emit('get:player:heroes')
      }
    }

    const handleHeroSetActiveError = ({ message }) => {
      console.error('[useHeroSwitcher] Failed to switch hero:', message)
      setLoading(false)
      setError(message || 'Failed to set active hero')
    }

    socket.on('player:heroes', handlePlayerHeroes)
    socket.on('hero:set:active:ok', handleHeroSetActiveOk)
    socket.on('hero:set:active:error', handleHeroSetActiveError)

    return () => {
      socket.off('player:heroes', handlePlayerHeroes)
      socket.off('hero:set:active:ok', handleHeroSetActiveOk)
      socket.off('hero:set:active:error', handleHeroSetActiveError)
    }
  }, [socket, onHeroSelected, onHeroesUpdate])

  // Request heroes list
  const fetchHeroes = () => {
    if (!socket) return
    socket.emit('get:player:heroes')
  }

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

