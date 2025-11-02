import { useState, useEffect, useCallback } from 'react'
import { me as fetchMe } from '../services/authService'

/**
 * Custom hook for managing player and hero state and socket events
 * @param {Object} socketRef - Reference to the socket connection
 * @param {boolean} socketReady - Whether the socket is ready and authenticated
 * @param {Function} onPlayerChange - Callback when player changes (for parent component)
 * @param {Function} onAuthCheckFailed - Callback when initial auth check fails
 * @returns {Object} - Player and hero state and helper functions
 */
export function usePlayerHeroManager(socketRef, socketReady, onPlayerChange, onAuthCheckFailed) {
  const [player, setPlayer] = useState(null)
  const [playerHeroes, setPlayerHeroes] = useState([])
  const [availableHeroes, setAvailableHeroes] = useState([])
  const [loadingHeroes, setLoadingHeroes] = useState(false)

  // Initial auth check on mount (only run once)
  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        const response = await fetchMe()
        
        if (!isMounted) return
        
        if (response && response.data) {
          console.log('[usePlayerHeroManager] Authenticated player:', response.data)
          setPlayer(response.data)
        } else {
          console.log('[usePlayerHeroManager] No valid player session')
          if (onAuthCheckFailed) {
            onAuthCheckFailed()
          }
        }
      } catch (error) {
        if (!isMounted) return
        
        console.log('[usePlayerHeroManager] Auth check failed')
        if (onAuthCheckFailed) {
          onAuthCheckFailed()
        }
      }
    }
    
    checkAuth()
    
    return () => {
      isMounted = false
    }
    // Only run once on mount - onAuthCheckFailed is stable due to useCallback in parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update parent when player changes
  useEffect(() => {
    if (onPlayerChange && player) {
      onPlayerChange(player)
    }
  }, [player, onPlayerChange])

  // Fetch heroes when socket becomes ready and player is already authenticated
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket || !socketReady || !player) return

    console.log('[usePlayerHeroManager] Socket ready and player authenticated, fetching heroes')
    
    // Fetch heroes if we don't have them yet
    if (playerHeroes.length === 0) {
      setLoadingHeroes(true)
      socket.emit('get:player:heroes')
      socket.emit('get:heroes:available')
    }
  }, [socketReady, player, socketRef, playerHeroes.length])

  // Set up socket event listeners for player and hero updates
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket || !socketReady) return

    console.log('[usePlayerHeroManager] Setting up player and hero event listeners')

    // Handle player updates
    const handlePlayer = (socketPlayer) => {
      if (socketPlayer) {
        console.log('[usePlayerHeroManager] Player updated:', socketPlayer)
        setPlayer(socketPlayer)
        if (onPlayerChange) {
          onPlayerChange(socketPlayer)
        }
      }
    }

    // Handle auth success - sync player state
    const handleAuthOk = ({ player: socketPlayer }) => {
      console.log('[usePlayerHeroManager] Auth successful, syncing player:', socketPlayer)
      setPlayer(socketPlayer)
      if (onPlayerChange) {
        onPlayerChange(socketPlayer)
      }
      // Fetch player data and heroes
      socket.emit('get:player')
      socket.emit('get:player:heroes')
      socket.emit('get:heroes:available')
    }

    // Handle available heroes update
    const handleAvailableHeroes = (heroes) => {
      console.log('[usePlayerHeroManager] Available heroes updated:', heroes)
      setAvailableHeroes(heroes || [])
    }

    // Handle player heroes update
    const handlePlayerHeroes = (heroes) => {
      console.log('[usePlayerHeroManager] Player heroes updated:', heroes)
      // Debug: Check if model field exists
      if (heroes && heroes.length > 0) {
        console.log('[usePlayerHeroManager] First hero model:', heroes[0].model)
        console.log('[usePlayerHeroManager] First hero full data:', heroes[0])
      }
      setPlayerHeroes(heroes || [])
      setLoadingHeroes(false)

      // Notify other players about hero change if we have an active hero
      const currentPlayer = player
      if (currentPlayer?.active_hero_id && heroes) {
        const activeHeroData = heroes.find(h => h.playerHeroId === currentPlayer.active_hero_id)
        if (activeHeroData && socket) {
          socket.emit('player:hero:update', {
            activeHeroId: currentPlayer.active_hero_id,
            heroModel: activeHeroData.model,
            heroModelScale: activeHeroData.modelScale,
            heroModelRotation: activeHeroData.modelRotation,
          })
          console.log('[usePlayerHeroManager] Notified other players about hero change')
        }
      }
    }

    // Handle hero selection response
    const handleHeroSetActiveOk = ({ player: updatedPlayer }) => {
      console.log('[usePlayerHeroManager] Hero activated:', updatedPlayer)
      setPlayer(updatedPlayer)
      if (onPlayerChange) {
        onPlayerChange(updatedPlayer)
      }
      // Refresh heroes list - the handler above will notify about hero change
      socket.emit('get:player:heroes')
    }

    // Handle real-time hero stats updates (regeneration)
    const handleRegenTick = (data) => {
      const { newHealth, newPower, maxHealth, maxPower } = data

      setPlayerHeroes(prevHeroes =>
        (prevHeroes || []).map(hero => {
          // Update only the active hero
          if (hero.playerHeroId === player?.active_hero_id) {
            return {
              ...hero,
              health: newHealth,
              power: newPower,
              maxHealth: maxHealth || hero.maxHealth,
              maxPower: maxPower || hero.maxPower
            }
          }
          return hero
        })
      )
    }

    // Handle consumable usage (instant)
    const handleConsumableUsed = (data) => {
      const { newHealth, newPower } = data

      setPlayerHeroes(prevHeroes =>
        (prevHeroes || []).map(hero => {
          if (hero.playerHeroId === player?.active_hero_id) {
            return {
              ...hero,
              health: newHealth,
              power: newPower
            }
          }
          return hero
        })
      )
    }

    // Handle consumable channeling completed
    const handleConsumableChannelingCompleted = (data) => {
      const { newHealth, newPower } = data

      setPlayerHeroes(prevHeroes =>
        (prevHeroes || []).map(hero => {
          if (hero.playerHeroId === player?.active_hero_id) {
            return {
              ...hero,
              health: newHealth,
              power: newPower
            }
          }
          return hero
        })
      )
    }

    // Handle hero level-up
    const handleHeroLevelUp = (data) => {
      console.log('[usePlayerHeroManager] 🎉 Hero leveled up!', data)
      // Refresh hero data to get updated stats
      socket.emit('get:player:heroes')
    }

    // Handle player level-up
    const handlePlayerLevelUp = (data) => {
      console.log('[usePlayerHeroManager] 🎉 Player leveled up!', data)
      // Refresh player data
      socket.emit('get:player')
    }

    // Register event listeners
    socket.on('player', handlePlayer)
    socket.on('auth:ok', handleAuthOk)
    socket.on('heroes:available', handleAvailableHeroes)
    socket.on('player:heroes', handlePlayerHeroes)
    socket.on('hero:set:active:ok', handleHeroSetActiveOk)
    socket.on('regen:tick', handleRegenTick)
    socket.on('consumable:used', handleConsumableUsed)
    socket.on('consumable:channeling-completed', handleConsumableChannelingCompleted)
    socket.on('hero:level-up', handleHeroLevelUp)
    socket.on('player:level-up', handlePlayerLevelUp)

    // Cleanup: Remove event listeners
    return () => {
      socket.off('player', handlePlayer)
      socket.off('auth:ok', handleAuthOk)
      socket.off('heroes:available', handleAvailableHeroes)
      socket.off('player:heroes', handlePlayerHeroes)
      socket.off('hero:set:active:ok', handleHeroSetActiveOk)
      socket.off('regen:tick', handleRegenTick)
      socket.off('consumable:used', handleConsumableUsed)
      socket.off('consumable:channeling-completed', handleConsumableChannelingCompleted)
      socket.off('hero:level-up', handleHeroLevelUp)
      socket.off('player:level-up', handlePlayerLevelUp)
    }
  }, [socketRef, socketReady, player, onPlayerChange])

  // Helper function to update hero stats (for external updates during combat)
  const updateHeroStats = useCallback((heroId, stats) => {
    setPlayerHeroes(prevHeroes =>
      (prevHeroes || []).map(h =>
        h.playerHeroId === heroId ? { ...h, ...stats } : h
      )
    )
  }, [])

  // Helper function to update heroes list
  const updateHeroes = useCallback((updatedPlayerHeroes, updatedAvailableHeroes) => {
    if (updatedPlayerHeroes) {
      setPlayerHeroes(updatedPlayerHeroes || [])
    }
    if (updatedAvailableHeroes) {
      setAvailableHeroes(updatedAvailableHeroes || [])
    }
  }, [])

  // Helper function to refresh player data
  const refreshPlayer = useCallback(() => {
    const socket = socketRef?.current
    if (socket && socketReady) {
      socket.emit('get:player')
    }
  }, [socketRef, socketReady])

  // Helper function to refresh heroes data
  const refreshHeroes = useCallback(() => {
    const socket = socketRef?.current
    if (socket && socketReady) {
      setLoadingHeroes(true)
      socket.emit('get:player:heroes')
      socket.emit('get:heroes:available')
    }
  }, [socketRef, socketReady])

  return {
    player,
    setPlayer,
    playerHeroes,
    setPlayerHeroes,
    availableHeroes,
    setAvailableHeroes,
    loadingHeroes,
    setLoadingHeroes,
    updateHeroStats,
    updateHeroes,
    refreshPlayer,
    refreshHeroes
  }
}

