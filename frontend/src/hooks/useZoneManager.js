import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * Custom hook for managing zone state and zone-related operations
 * @param {Object} socketRef - Reference to the socket connection
 * @param {boolean} socketReady - Whether the socket is ready and authenticated
 * @param {Function} onZoneChange - Callback called when zone changes, receives (zone, position)
 * @returns {Object} - Zone state and helper functions
 */
export function useZoneManager(socketRef, socketReady, onZoneChange) {
  const [currentZone, setCurrentZone] = useState(null)
  const loadZoneAttemptedRef = useRef(false)
  const lastSocketIdRef = useRef(null)

  // Handle zone change (both auto-join and manual selection)
  const handleZoneChange = useCallback((zone, position) => {
    console.log('[useZoneManager] 🗺️ Zone changed:', zone.name)
    console.log('[useZoneManager] Zone data:', {
      id: zone.id,
      name: zone.name,
      map_file: zone.map_file,
      environment_file: zone.environment_file,
      is_combat_zone: zone.is_combat_zone, 
      is_safe_zone: zone.is_safe_zone
    })
 
    // Update zone state
    setCurrentZone(zone)

    // Call the parent callback if provided
    if (onZoneChange) {
      onZoneChange(zone, position)
    }
  }, [onZoneChange])

  // Track socket ID changes to detect reconnections
  useEffect(() => {
    const socket = socketRef?.current
    if (socket && socketReady && socket.id) {
      const currentSocketId = socket.id
      
      // If socket ID changed (reconnection), we need to reload zone
      if (lastSocketIdRef.current && lastSocketIdRef.current !== currentSocketId) {
        console.log('[useZoneManager] ⚠️ Socket ID changed (reconnection detected):', {
          old: lastSocketIdRef.current,
          new: currentSocketId
        })
        // Reset zone load attempt flag so we can reload after re-authentication
        loadZoneAttemptedRef.current = false
      }
      
      lastSocketIdRef.current = currentSocketId
    }
  }, [socketRef, socketReady])

  // Helper function to load zone data and auto-join lobby
  const loadZoneData = useCallback(async (socket) => {
    // Capture the socket instance at the start - use passed socket or socketRef.current
    // This ensures we use the same socket instance throughout the function
    const actualSocket = socket || socketRef?.current
    if (!actualSocket) {
      console.log('[useZoneManager] Cannot load zone data: no socket provided')
      return
    }

    if (!actualSocket.connected) {
      console.log('[useZoneManager] Cannot load zone data: socket not connected')
      return
    }

    // If socket is passed directly, assume it's authenticated (caller should ensure this)
    // Only check socketReady if we're using socketRef.current (not a passed socket)
    const isAuthenticated = socket ? true : socketReady
    if (!isAuthenticated) {
      console.log('[useZoneManager] Cannot load zone data: socket not ready or not authenticated')
      return
    }

    // Prevent duplicate zone load attempts for the same socket ID
    const socketId = actualSocket.id
    if (loadZoneAttemptedRef.current && lastSocketIdRef.current === socketId && currentZone) {
      console.log('[useZoneManager] Zone load already attempted for this socket ID, skipping')
      return
    }

    // Store the socket ID at the start for debugging
    const socketIdAtStart = socketId
    console.log('[useZoneManager] Loading zone data...')
    console.log('[useZoneManager] Socket ID (captured at start):', socketIdAtStart)
    console.log('[useZoneManager] Socket ready:', socketReady)
    console.log('[useZoneManager] Socket passed directly:', !!socket)
    
    // Mark that we've attempted to load zone for this socket ID
    loadZoneAttemptedRef.current = true
    lastSocketIdRef.current = socketIdAtStart
    
    try {
      // Small delay to ensure server has processed authentication
      await new Promise(resolve => setTimeout(resolve, 200))

      // Request list of zones to find default lobby
      const response = await new Promise(resolve => {
        actualSocket.emit('zone:list', {}, resolve)
      })

      console.log('[useZoneManager] Zone list response:', response)
      
      if (!response?.ok || !response.zones) {
        console.error('[useZoneManager] Failed to get zone list:', response?.error || 'Unknown error')
        return
      }

      const lobby = response.zones.find(z => z.slug === 'starter-lobby' || z.is_safe_zone)
      console.log('[useZoneManager] Found lobby zone:', lobby)
      
      if (!lobby) {
        console.warn('[useZoneManager] No lobby zone found in zones list')
        return
      }

      // Auto-join lobby zone with retry logic for authentication timing issues
      for (let retryCount = 0; retryCount < 4; retryCount++) {
        // Verify socket ID hasn't changed
        const currentSocketId = actualSocket.id
        if (currentSocketId !== socketIdAtStart) {
          console.warn('[useZoneManager] ⚠️ Socket ID changed! Was:', socketIdAtStart, 'Now:', currentSocketId)
        }
        
        console.log(`[useZoneManager] Attempting zone join (attempt ${retryCount + 1}/4)...`)
        console.log(`[useZoneManager] Socket ID at join attempt:`, currentSocketId)
        
        // Small delay before join attempt (progressive: 0ms, 300ms, 600ms, 900ms)
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 300 * retryCount))
        }

        const joinResponse = await new Promise(resolve => {
          actualSocket.emit('zone:join', { zoneId: lobby.id }, resolve)
        })

        console.log('[useZoneManager] Zone join response:', joinResponse)
        
        if (joinResponse?.ok && joinResponse.zone) {
          handleZoneChange(joinResponse.zone, joinResponse.position)
          console.log('[useZoneManager] ✅ Auto-joined zone:', joinResponse.zone.name)
          loadZoneAttemptedRef.current = true
          return // Success, exit the function
        }
        
        if (joinResponse?.error !== 'Not authenticated' || retryCount === 3) {
          const errorMsg = joinResponse?.error || 'Zone join response missing ok or zone'
          console.error('[useZoneManager] ❌ Failed to join zone:', errorMsg)
          console.error('[useZoneManager] Full response:', joinResponse)
          return // No point retrying non-auth errors
        }
        
        console.log(`[useZoneManager] ⏳ Retrying zone join (attempt ${retryCount + 2}/4)...`)
      }
    } catch (error) {
      console.error('[useZoneManager] Error loading zone data:', error)
    }
  }, [handleZoneChange, socketRef, socketReady, currentZone])

  // Helper function to return to lobby zone
  const returnToLobby = useCallback(async (socket) => {
    const actualSocket = socket || socketRef?.current
    if (!actualSocket || !socketReady) {
      console.log('[useZoneManager] Cannot return to lobby: socket not ready or not authenticated')
      return
    }

    if (!actualSocket.connected) {
      console.log('[useZoneManager] Cannot return to lobby: socket not connected')
      return
    }

    try {
      console.log('[useZoneManager] Returning to lobby zone...')
      
      const response = await new Promise(resolve => {
        actualSocket.emit('zone:list', {}, resolve)
      })

      if (!response?.ok || !response.zones) {
        console.error('[useZoneManager] Failed to get zone list')
        return
      }

      const lobby = response.zones.find(z => z.slug === 'starter-lobby' || z.is_safe_zone)
      if (!lobby) {
        console.error('[useZoneManager] No lobby zone found')
        return
      }

      const joinResponse = await new Promise(resolve => {
        actualSocket.emit('zone:join', { zoneId: lobby.id }, resolve)
      })

      if (joinResponse?.ok) {
        console.log('[useZoneManager] ✅ Returned to lobby zone:', joinResponse.zone.name)
        handleZoneChange(joinResponse.zone, joinResponse.position)
      } else {
        console.error('[useZoneManager] Failed to return to lobby:', joinResponse?.error)
      }
    } catch (error) {
      console.error('[useZoneManager] Error returning to lobby:', error)
    }
  }, [handleZoneChange, socketRef, socketReady])

  // Helper function to get zone by ID
  const getZoneById = useCallback((zoneId) => {
    const socket = socketRef?.current
    if (!socket || !socketReady) return Promise.resolve(null)

    return new Promise((resolve) => {
      socket.emit('zone:get', { zoneId }, (zoneResponse) => {
        if (zoneResponse?.ok && zoneResponse.zone) {
          resolve(zoneResponse.zone)
        } else {
          console.error('[useZoneManager] Failed to get zone:', zoneResponse?.error)
          resolve(null)
        }
      })
    })
  }, [socketRef, socketReady])

  // Helper function to update zone state directly (for cases like combat rejoin)
  const updateZone = useCallback((zone) => {
    if (zone) {
      console.log('[useZoneManager] Updating zone:', zone.name)
      setCurrentZone(zone)
    }
  }, [])

  return {
    currentZone,
    setCurrentZone,
    handleZoneChange,
    loadZoneData,
    returnToLobby,
    getZoneById,
    updateZone
  }
}

