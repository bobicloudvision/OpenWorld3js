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
  const loadZoneData = useCallback((socket) => {
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
    
    // Since bindSocket happens synchronously before auth:ok on the backend,
    // if socketReady is true, the socket is already authenticated.
    // Small delay to ensure server has processed everything
    setTimeout(() => {
      // Request list of zones to find default lobby
      actualSocket.emit('zone:list', {}, (response) => {
        console.log('[useZoneManager] Zone list response:', response)
        if (response?.ok && response.zones) {
          const lobby = response.zones.find(z => z.slug === 'starter-lobby' || z.is_safe_zone)
          console.log('[useZoneManager] Found lobby zone:', lobby)
          if (lobby) {
            // Auto-join lobby zone with retry logic for authentication timing issues
            const attemptZoneJoin = (retryCount = 0) => {
              // Verify socket ID hasn't changed (shouldn't, but checking for debugging)
              const currentSocketId = actualSocket.id
              if (currentSocketId !== socketIdAtStart) {
                console.warn('[useZoneManager] ⚠️ Socket ID changed! Was:', socketIdAtStart, 'Now:', currentSocketId)
              }
              console.log(`[useZoneManager] Attempting zone join (attempt ${retryCount + 1}/4)...`)
              console.log(`[useZoneManager] Socket ID at join attempt:`, currentSocketId)
              console.log(`[useZoneManager] Socket connected:`, actualSocket.connected)
              console.log(`[useZoneManager] Socket ready state:`, socketReady)
              console.log('[useZoneManager] About to emit zone:join with socket ID:', currentSocketId)
              actualSocket.emit('zone:join', { zoneId: lobby.id }, (joinResponse) => {
                console.log('[useZoneManager] Zone join response:', joinResponse)
                console.log('[useZoneManager] Response socket ID check - expected:', actualSocket.id)
                if (joinResponse?.ok && joinResponse.zone) {
                  handleZoneChange(joinResponse.zone, joinResponse.position)
                  console.log('[useZoneManager] ✅ Auto-joined zone:', joinResponse.zone.name)
                  // Mark as successful so we don't retry unnecessarily
                  loadZoneAttemptedRef.current = true 
                } else if (joinResponse?.error === 'Not authenticated' && retryCount < 3) {
                  console.error('[useZoneManager] ❌ Not authenticated error - socket ID:', actualSocket.id, 'connected:', actualSocket.connected)
                  // Retry if not authenticated (server might need more time)
                  const delay = 300 * (retryCount + 1) // 300ms, 600ms, 900ms
                  console.log(`[useZoneManager] ⏳ Retrying zone join in ${delay}ms (attempt ${retryCount + 2}/4)...`)
                  setTimeout(() => attemptZoneJoin(retryCount + 1), delay)
                } else {
                  const errorMsg = joinResponse?.error || 'Zone join response missing ok or zone'
                  console.error('[useZoneManager] ❌ Failed to join zone after retries:', errorMsg)
                  console.error('[useZoneManager] Full response:', joinResponse)
                }
              })
            }
            
            // Small delay to ensure server has fully processed bindSocket
            setTimeout(() => attemptZoneJoin(), 300)
          } else {
            console.warn('[useZoneManager] No lobby zone found in zones list')
          }
        } else {
          console.error('[useZoneManager] Failed to get zone list:', response?.error || 'Unknown error')
        }
      })
    }, 200) // Small delay to ensure server bindSocket is fully processed
  }, [handleZoneChange, socketRef, socketReady])

  // Helper function to return to lobby zone
  const returnToLobby = useCallback((socket) => {
    const actualSocket = socket || socketRef?.current
    if (!actualSocket || !socketReady) {
      console.log('[useZoneManager] Cannot return to lobby: socket not ready or not authenticated')
      return
    }

    if (!actualSocket.connected) {
      console.log('[useZoneManager] Cannot return to lobby: socket not connected')
      return
    }

    console.log('[useZoneManager] Returning to lobby zone...')
    actualSocket.emit('zone:list', {}, (response) => {
      if (response.ok && response.zones) {
        const lobby = response.zones.find(z => z.slug === 'starter-lobby' || z.is_safe_zone)
        if (lobby) {
          actualSocket.emit('zone:join', { zoneId: lobby.id }, (joinResponse) => {
            if (joinResponse.ok) {
              console.log('[useZoneManager] ✅ Returned to lobby zone:', joinResponse.zone.name)
              handleZoneChange(joinResponse.zone, joinResponse.position)
            } else {
              console.error('[useZoneManager] Failed to return to lobby:', joinResponse.error)
            }
          })
        }
      }
    })
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

