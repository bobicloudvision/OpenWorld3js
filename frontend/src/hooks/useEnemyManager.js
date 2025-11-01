import { useEffect } from 'react'
import useGameStore from '../stores/gameStore'

/**
 * Custom hook for managing enemy-related socket events and zone enemy loading
 * @param {Object} socketRef - Reference to the socket connection
 * @param {boolean} socketReady - Whether the socket is ready and authenticated
 * @param {Object|null} currentZone - The current zone object
 */
export function useEnemyManager(socketRef, socketReady, currentZone) {
  // Set up enemy-related socket event listeners
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket || !socketReady) return

    console.log('[useEnemyManager] Setting up enemy event listeners')

    // Handle enemy state updates from backend
    const handleEnemyStateUpdate = (data) => {
      const { zoneId, enemies } = data
      if (enemies && Array.isArray(enemies)) {
        useGameStore.getState().updateEnemyState(enemies)
      }
    }

    // Handle enemy spawn events
    const handleEnemySpawned = (data) => {
      const { enemies } = data
      if (enemies && Array.isArray(enemies)) {
        useGameStore.getState().updateEnemyState(enemies)
      }
    }

    // Handle enemy destruction
    const handleEnemyDestroyed = (data) => {
      const { enemyId } = data
      useGameStore.getState().removeEnemy(enemyId)
    }

    // Handle enemy attacks on player
    const handleEnemyAttack = (data) => {
      const { enemyId, enemyName, damage, type } = data
      console.log(`[useEnemyManager] Enemy ${enemyName} (${enemyId}) attacked player for ${damage} ${type} damage`)
      // TODO: Apply damage to player - this should be handled by combat service
    }

    // Register event listeners
    socket.on('enemy:state-update', handleEnemyStateUpdate)
    socket.on('enemy:spawned', handleEnemySpawned)
    socket.on('enemy:destroyed', handleEnemyDestroyed)
    socket.on('enemy:attack', handleEnemyAttack)

    // Cleanup: Remove event listeners
    return () => {
      socket.off('enemy:state-update', handleEnemyStateUpdate)
      socket.off('enemy:spawned', handleEnemySpawned)
      socket.off('enemy:destroyed', handleEnemyDestroyed)
      socket.off('enemy:attack', handleEnemyAttack)
    }
  }, [socketRef, socketReady])

  // Load enemies when zone changes or socket connects
  useEffect(() => {
    const socket = socketRef?.current
    if (socketReady && socket && socket.connected && currentZone?.id) {
      console.log('[useEnemyManager] Loading enemies for zone:', currentZone.id)
      socket.emit('enemy:get-zone-enemies', {}, (response) => {
        if (response?.ok && response.enemies) {
          useGameStore.getState().setEnemies(response.enemies)
          console.log('[useEnemyManager] Loaded', response.enemies.length, 'enemies')
        }
      })
    }
  }, [socketReady, currentZone?.id, socketRef])
}

