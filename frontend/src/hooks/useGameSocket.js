import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

/**
 * Custom hook for managing game socket connection and authentication
 * @param {Object|null} player - The authenticated player object
 * @param {Object} externalSocketRef - Optional external socket ref to use instead of creating new socket
 * @param {Function} onAuthSuccess - Callback when authentication succeeds, receives (socket)
 * @param {Object} socketRef - Socket ref to use (if not provided, will create one)
 * @param {Function} setSocketReady - State setter for socket ready (if not provided, will create one)
 * @returns {Object} - Socket ref and ready state (only returned if socketRef/setSocketReady not provided)
 */
export function useGameSocket(player, externalSocketRef, onAuthSuccess, socketRef, setSocketReady) {
  // Priority: externalSocketRef > socketRef (param) > internal ref
  const internalSocketRef = useRef(null)
  const [internalSocketReady, setInternalSocketReady] = useState(false)
  
  // Use provided ref/setter or create internal ones
  // If externalSocketRef is provided, use it; otherwise use socketRef param or internal
  const actualSocketRef = externalSocketRef || socketRef || internalSocketRef
  const actualSetSocketReady = setSocketReady || setInternalSocketReady

  useEffect(() => {
    if (!player) {
      // If logging out or not authenticated, ensure socket is closed (only if we created it)
      if (!externalSocketRef && actualSocketRef.current) {
        actualSocketRef.current.disconnect()
        actualSocketRef.current = null
      }
      actualSetSocketReady(false)
      return
    }

    // If external socket is provided, use it instead of creating a new one
    if (externalSocketRef) {
      console.log('[useGameSocket] Using external socket connection - will set up listeners when socket is ready')
      // Just wait for socket to be ready, listeners will be set up below
      const checkSocketReady = setInterval(() => {
        if (externalSocketRef.current && externalSocketRef.current.connected) {
          clearInterval(checkSocketReady)
          actualSetSocketReady(true)
          console.log('[useGameSocket] External socket is ready')
          // Call auth success callback for external socket
          if (onAuthSuccess && externalSocketRef.current) {
            onAuthSuccess(externalSocketRef.current)
          }
        }
      }, 100)
      return () => clearInterval(checkSocketReady)
    }

    // Only create a new socket if no external socket is provided
    actualSetSocketReady(false)
    const token = localStorage.getItem('playerToken')
    const socketUrl = import.meta.env.SOCKET_URL || 'http://localhost:6060'

    const socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    })
    actualSocketRef.current = socket

    const handleConnect = () => {
      console.log('[useGameSocket] Socket connected, authenticating...')
      socket.emit('auth', { token })
    }

    const handleReconnect = (attemptNumber) => {
      console.log('[useGameSocket] Socket reconnected after', attemptNumber, 'attempt(s), re-authenticating...')
      // Re-authenticate on reconnect since the new socket ID needs to be bound
      socket.emit('auth', { token })
    }

    const handleAuthOk = () => {
      console.log('[useGameSocket] Authentication successful')
      // Player/hero updates are handled by usePlayerHeroManager hook
      actualSetSocketReady(true)
      
      // Call the auth success callback (for zone loading, combat check, etc.)
      // This will also be called on reconnect after re-authentication
      if (onAuthSuccess) {
        onAuthSuccess(socket)
      }
    }

    const handleAuthError = (err) => {
      console.error('[useGameSocket] Socket auth failed', err)
      actualSetSocketReady(false)
    }

    const handleDisconnect = (reason) => {
      console.log('[useGameSocket] Socket disconnected, reason:', reason)
      actualSetSocketReady(false)
    }

    // Register event listeners
    socket.on('connect', handleConnect)
    socket.on('reconnect', handleReconnect)
    socket.on('auth:ok', handleAuthOk)
    socket.on('auth:error', handleAuthError)
    socket.on('disconnect', handleDisconnect)

    // Cleanup
    return () => {
      socket.off('connect', handleConnect)
      socket.off('reconnect', handleReconnect)
      socket.off('auth:ok', handleAuthOk)
      socket.off('auth:error', handleAuthError)
      socket.off('disconnect', handleDisconnect)
      
      // Only disconnect if we created the socket (not external)
      if (!externalSocketRef && actualSocketRef.current) {
        actualSocketRef.current.disconnect()
        actualSocketRef.current = null
      }
    }
  }, [player, externalSocketRef, onAuthSuccess, actualSocketRef, actualSetSocketReady])

  // Only return values if using internal state
  if (!socketRef && !setSocketReady) {
    return {
      socketRef: internalSocketRef,
      socketReady: internalSocketReady
    }
  }
  
  // If using external ref/setter, don't return anything (they're updated directly)
  return {}
}

