import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook for managing combat state and combat-related socket events
 * @param {Object} socketRef - Reference to the socket connection
 * @param {boolean} socketReady - Whether the socket is ready and authenticated
 * @param {Function} onCombatStateChange - Callback when combat state changes, receives (inCombat, isMatchmaking)
 * @param {Function} returnToLobby - Function to return to lobby zone
 * @param {Function} updateZone - Function to update current zone
 * @param {Function} getZoneById - Function to get zone by ID
 * @returns {Object} - Combat state and helper functions
 */
export function useCombatManager(
  socketRef,
  socketReady,
  onCombatStateChange,
  returnToLobby,
  updateZone,
  getZoneById
) {
  const [inCombatMatch, setInCombatMatch] = useState(false)
  const [isMatchmakingBattle, setIsMatchmakingBattle] = useState(false)
  const [showCombatRejoin, setShowCombatRejoin] = useState(false)
  const [activeCombatInfo, setActiveCombatInfo] = useState(null)
  const returnToLobbyRef = useRef(null)
  const inCombatMatchRef = useRef(false)
  const hasCheckedActiveCombatRef = useRef(false)

  // Store returnToLobby in ref for use in callbacks
  useEffect(() => {
    returnToLobbyRef.current = returnToLobby
  }, [returnToLobby])

  // Keep combat state ref in sync with state
  useEffect(() => {
    inCombatMatchRef.current = inCombatMatch
  }, [inCombatMatch])

  // Notify parent when combat state changes
  useEffect(() => {
    if (onCombatStateChange) {
      onCombatStateChange(inCombatMatch, isMatchmakingBattle)
    }
  }, [inCombatMatch, isMatchmakingBattle, onCombatStateChange])

  // Set up combat-related socket listeners
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket || !socketReady) return

    console.log('[useCombatManager] Setting up combat event listeners')

    // Handle combat errors
    const handleCombatError = (error) => {
      console.error('[useCombatManager] Combat error:', error)
    }

    // Handle combat end (matchmaking battles)
    const handleCombatEnded = (data) => {
      console.log('[useCombatManager] 🏆 Combat ended:', data)
      console.log('[useCombatManager] inCombatMatch is currently:', inCombatMatch)
      window.__inCombat = false

      // Refresh hero data to get updated experience and level
      socket.emit('get:player:heroes')

      // If this was a matchmaking battle, wait before returning to lobby
      if (data.isMatchmaking) {
        console.log('[useCombatManager] ⏱️ Matchmaking battle ended, waiting 7 seconds to show results...')

        // Wait 7 seconds to let players see the victory/defeat modal
        setTimeout(() => {
          console.log('[useCombatManager] 🔄 NOW switching back to lobby scene...')

          // Clear matchmaking flag
          setIsMatchmakingBattle(false)
          setInCombatMatch(false)

          // Return to lobby zone
          if (returnToLobbyRef.current) {
            returnToLobbyRef.current(socket)
          }
        }, 7000) // Wait 7 seconds to let players see the results
      } else {
        // For non-matchmaking battles in regular combat zones, stay in the zone
        // The scene state is determined by the current zone type, so no need to change it
        console.log('[useCombatManager] Non-matchmaking battle ended, staying in current zone')
        setInCombatMatch(false)
      }
    }

    // Check for active combat on reconnect
    const checkActiveCombat = () => {
      // Don't check if already in combat or if we've already checked this session
      if (inCombatMatchRef.current || hasCheckedActiveCombatRef.current) {
        console.log('[useCombatManager] Skipping active combat check', {
          inCombat: inCombatMatchRef.current,
          alreadyChecked: hasCheckedActiveCombatRef.current
        })
        return
      }
      
      hasCheckedActiveCombatRef.current = true
      console.log('[useCombatManager] Checking for active combat...')
      
      socket.emit('combat:check-active', (response) => {
        if (response?.ok && response.hasActiveCombat && response.combat) {
          console.log('[useCombatManager] 🔄 Active combat detected on reconnect:', response.combat)
          setActiveCombatInfo(response.combat)
          setShowCombatRejoin(true)
        } else {
          console.log('[useCombatManager] No active combat found')
        }
      })
    }

    // Check for active combat when socket becomes ready
    if (socketReady) {
      checkActiveCombat()
    }

    socket.on('combat:error', handleCombatError)
    socket.on('combat:ended', handleCombatEnded)

    return () => {
      socket.off('combat:error', handleCombatError)
      socket.off('combat:ended', handleCombatEnded)
    }
  }, [socketRef, socketReady])

  // Handle combat rejoin
  const handleCombatRejoin = useCallback(
    async (combatInfo) => {
      console.log('[useCombatManager] 🔄 Rejoining combat:', combatInfo.combatInstanceId)
      console.log('[useCombatManager] Full combat info:', combatInfo)
      console.log('[useCombatManager] Combat zone object:', combatInfo.zone)
      console.log('[useCombatManager] Combat zone ID:', combatInfo.zoneId)

      if (!socketRef.current || !combatInfo) {
        console.error('[useCombatManager] Cannot rejoin: missing socket or combat info')
        return
      }

      // Clear the modal and any stale info
      setShowCombatRejoin(false)
      setActiveCombatInfo(null)

      // Switch to combat scene
      setInCombatMatch(true)
      setIsMatchmakingBattle(combatInfo.isMatchmaking || false)

      // Update zone before joining combat
      // Always fetch zone data by ID to ensure we have complete zone information
      if (combatInfo.zoneId) {
        console.log('[useCombatManager] 📍 Fetching zone data for zone ID:', combatInfo.zoneId)
        try {
          const zone = await getZoneById(combatInfo.zoneId)
          if (zone) {
            console.log('[useCombatManager] 🗺️ Updating zone for combat rejoin:', zone.name)
            updateZone(zone)
            
          // IMPORTANT: Actually join the zone on the backend
          // Skip level check since player was already allowed into combat
          console.log('[useCombatManager] 🚀 Joining zone on backend (skipping level check for combat rejoin):', combatInfo.zoneId)
          const joinResponse = await new Promise(resolve => {
            socketRef.current.emit('zone:join', { 
              zoneId: combatInfo.zoneId, 
              skipLevelCheck: true // Skip level requirements for combat rejoin
            }, resolve)
          })

          if (!joinResponse?.ok) {
            console.error('[useCombatManager] ❌ Failed to join zone on backend:', joinResponse?.error)
            // Reset states on failure
            setInCombatMatch(false)
            setIsMatchmakingBattle(false)
            return
          }

          console.log('[useCombatManager] ✅ Successfully joined zone on backend')
          } else {
            console.error('[useCombatManager] ❌ Failed to fetch zone data for ID:', combatInfo.zoneId)
            // Reset states on failure
            setInCombatMatch(false)
            setIsMatchmakingBattle(false)
            return
          }
        } catch (error) {
          console.error('[useCombatManager] ❌ Error fetching zone:', error)
          // Reset states on failure
          setInCombatMatch(false)
          setIsMatchmakingBattle(false)
          return
        }
      } else {
        console.warn('[useCombatManager] ⚠️ No zone ID available in combat info')
      }

      // Small delay to ensure zone join completes
      await new Promise(resolve => setTimeout(resolve, 100))

      // Join the combat instance
      socketRef.current.emit('combat:join-matchmaking', { combatInstanceId: combatInfo.combatInstanceId }, (response) => {
        if (response?.ok) {
          console.log('[useCombatManager] ✅ Successfully rejoined combat')
          console.log('[useCombatManager] ✅ Combat instance:', combatInfo.combatInstanceId)
          window.__inCombat = true
        } else {
          console.error('[useCombatManager] ❌ Failed to rejoin combat:', response?.error)
          // Reset states on failure
          setInCombatMatch(false)
          setIsMatchmakingBattle(false)
        }
      })
    },
    [socketRef, updateZone, getZoneById]
  )

  // Handle combat rejoin decline
  const handleCombatRejoinDecline = useCallback(() => {
    console.log('[useCombatManager] 🚫 Player declined to rejoin combat')

    if (socketRef.current && activeCombatInfo) {
      // Decline combat rejoin (marks as abandoned)
      socketRef.current.emit('combat:decline-rejoin', (response) => {
        if (response?.ok) {
          console.log('[useCombatManager] ✅ Combat declined successfully:', response.message)
        } else {
          console.error('[useCombatManager] ❌ Failed to decline combat:', response?.error)
        }
      })
    }

    setShowCombatRejoin(false)
    setActiveCombatInfo(null)
  }, [socketRef, activeCombatInfo])

  // Handle matchmaking battle start
  const handleMatchStarted = useCallback(
    (data) => {
      console.log('='.repeat(60))
      console.log('[useCombatManager] 🎮 MATCH STARTED - JOINING COMBAT')
      console.log('[useCombatManager] Data received:', data)
      console.log('='.repeat(60))
      const { combatInstanceId, zone, position } = data

      // IMPORTANT: Set matchmaking flags FIRST before zone update
      // This ensures GameplayScene mounts with skipAutoJoinCombat=true
      setInCombatMatch(true)
      setIsMatchmakingBattle(true)
      console.log('[useCombatManager] inCombatMatch set to TRUE (matchmaking)')

      // Then update zone (after flags are set)
      // This ensures zone validation passes on the backend
      if (zone) {
        console.log('[useCombatManager] 🗺️ Updating current zone to arena:', zone.name)
        updateZone(zone)
      }

      if (combatInstanceId && socketRef.current) {
        // Small delay to ensure zone state propagates
        setTimeout(() => {
          // Join the matchmaking combat instance
          console.log('[useCombatManager] Emitting combat:join-matchmaking with combatInstanceId:', combatInstanceId)
          socketRef.current.emit('combat:join-matchmaking', { combatInstanceId }, (response) => {
            if (response?.ok) {
              console.log('[useCombatManager] ✅ Successfully joined matchmaking combat instance:', combatInstanceId)
              console.log('[useCombatManager] ✅ Combat will take place in zone:', zone?.name || 'unknown')
              window.__inCombat = true
            } else {
              console.error('[useCombatManager] ❌ Failed to join matchmaking combat:', response?.error)
            }
          })
        }, 100) // Small delay to let React state update
      } else {
        console.error('[useCombatManager] ❌ Missing combatInstanceId or socket:', {
          combatInstanceId,
          hasSocket: !!socketRef.current
        })
      }

      // Return position for potential use (for player position update)
      return { position }
    },
    [socketRef, updateZone]
  )

  // Helper to manually set combat state (for zone-based combat)
  const setCombatState = useCallback((inCombat, isMatchmaking = false) => {
    setInCombatMatch(inCombat)
    setIsMatchmakingBattle(isMatchmaking)
    if (!inCombat) {
      window.__inCombat = false
    }
  }, [])

  return {
    inCombatMatch,
    isMatchmakingBattle,
    showCombatRejoin,
    activeCombatInfo,
    setInCombatMatch,
    setIsMatchmakingBattle,
    handleCombatRejoin,
    handleCombatRejoinDecline,
    handleMatchStarted,
    setCombatState
  }
}

