import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

/**
 * Centralized socket connection manager for the entire game
 * This is the single source of truth for all socket connections
 * 
 * @param {Object|null} player - The authenticated player object
 * @param {Function} onAuthSuccess - Callback when authentication succeeds, receives (socket)
 * @param {Function} onAuthError - Optional callback when authentication fails
 * @returns {Object} - Socket state and controls
 */
export function useGameSocketManager(player, onAuthSuccess, onAuthError) {
  const socketRef = useRef(null)
  const [socketReady, setSocketReady] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  const playerIdRef = useRef(null)
  const authCallbacksRef = useRef({ onAuthSuccess, onAuthError })

  // Update callbacks ref when they change
  useEffect(() => {
    authCallbacksRef.current = { onAuthSuccess, onAuthError }
  }, [onAuthSuccess, onAuthError])

  useEffect(() => {
    if (!player) {
      // Disconnect socket when player logs out
      if (socketRef.current) {
        console.log('[GameSocketManager] Player logged out, disconnecting socket')
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setSocketReady(false)
      setConnectionStatus('disconnected')
      playerIdRef.current = null
      return
    }

    // Prevent duplicate connections for the same player
    if (socketRef.current && playerIdRef.current === player.id) {
      // Socket already exists for this player
      if (socketRef.current.connected && socketReady) {
        console.log('[GameSocketManager] Socket already connected for player', player.id)
        return
      }
      // Socket exists but not connected - will reconnect automatically
      console.log('[GameSocketManager] Socket exists but not connected, waiting for reconnect...')
      return
    }

    // If socket exists for different player, disconnect it first
    if (socketRef.current && playerIdRef.current !== player.id) {
      console.log('[GameSocketManager] Different player detected, disconnecting old socket')
      socketRef.current.disconnect()
      socketRef.current = null
      playerIdRef.current = null
    }

    // Create new socket connection
    const token = localStorage.getItem('playerToken')
    const socketUrl = import.meta.env.SOCKET_URL || 'http://localhost:6060'

    console.log('[GameSocketManager] Creating new socket connection for player', player.id)
    const socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      autoConnect: true
    })

    socketRef.current = socket
    playerIdRef.current = player.id
    setConnectionStatus('connecting')

    // Connection handlers
    const handleConnect = () => {
      console.log('[GameSocketManager] Socket connected, authenticating...')
      setConnectionStatus('connected')
      socket.emit('auth', { token })
    }

    const handleConnectError = (error) => {
      console.error('[GameSocketManager] Connection error:', error)
      setConnectionStatus('disconnected')
      setSocketReady(false)
    }

    // Reconnection handlers
    const handleReconnect = (attemptNumber) => {
      console.log('[GameSocketManager] Socket reconnected after', attemptNumber, 'attempt(s), re-authenticating...')
      setConnectionStatus('connected')
      // Re-authenticate on reconnect (new socket ID needs to be bound)
      socket.emit('auth', { token })
    }

    const handleReconnectAttempt = (attemptNumber) => {
      console.log('[GameSocketManager] Reconnection attempt:', attemptNumber)
      setConnectionStatus('reconnecting')
    }

    const handleReconnectError = (error) => {
      console.error('[GameSocketManager] Reconnection error:', error)
      setConnectionStatus('reconnecting')
    }

    const handleReconnectFailed = () => {
      console.error('[GameSocketManager] Reconnection failed')
      setConnectionStatus('disconnected')
      setSocketReady(false)
    }

    // Authentication handlers
    const handleAuthOk = ({ player: socketPlayer }) => {
      console.log('[GameSocketManager] ✅ Authentication successful, socket ID:', socket.id)
      setSocketReady(true)
      setConnectionStatus('connected')
      
      // Ensure player ID is tracked
      if (!playerIdRef.current || playerIdRef.current !== socketPlayer.id) {
        playerIdRef.current = socketPlayer.id
      }

      // Call auth success callback
      if (authCallbacksRef.current.onAuthSuccess) {
        authCallbacksRef.current.onAuthSuccess(socket)
      }
    }

    const handleAuthError = (err) => {
      console.error('[GameSocketManager] ❌ Authentication failed:', err)
      setSocketReady(false)
      setConnectionStatus('disconnected')
      playerIdRef.current = null

      // Call auth error callback
      if (authCallbacksRef.current.onAuthError) {
        authCallbacksRef.current.onAuthError(err)
      }
    }

    // Disconnect handler
    const handleDisconnect = (reason) => {
      console.log('[GameSocketManager] Socket disconnected, reason:', reason)
      setSocketReady(false)

      // If intentional disconnect, mark as disconnected
      // Otherwise, mark as reconnecting (will auto-reconnect)
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        setConnectionStatus('disconnected')
      } else {
        // Unexpected disconnect - will attempt to reconnect
        setConnectionStatus('reconnecting')
      }
    }

    // Register all event listeners
    socket.on('connect', handleConnect)
    socket.on('connect_error', handleConnectError)
    socket.on('reconnect', handleReconnect)
    socket.on('reconnect_attempt', handleReconnectAttempt)
    socket.on('reconnect_error', handleReconnectError)
    socket.on('reconnect_failed', handleReconnectFailed)
    socket.on('auth:ok', handleAuthOk)
    socket.on('auth:error', handleAuthError)
    socket.on('disconnect', handleDisconnect)

    // Cleanup function
    return () => {
      console.log('[GameSocketManager] Cleaning up socket listeners')
      // Remove all event listeners
      socket.off('connect', handleConnect)
      socket.off('connect_error', handleConnectError)
      socket.off('reconnect', handleReconnect)
      socket.off('reconnect_attempt', handleReconnectAttempt)
      socket.off('reconnect_error', handleReconnectError)
      socket.off('reconnect_failed', handleReconnectFailed)
      socket.off('auth:ok', handleAuthOk)
      socket.off('auth:error', handleAuthError)
      socket.off('disconnect', handleDisconnect)

      // Only disconnect if player is null (logging out)
      // Otherwise, let socket.io handle reconnection automatically
      if (!player) {
        socket.disconnect()
        socketRef.current = null
        playerIdRef.current = null
      }
    }
  }, [player])

  // Manual disconnect function
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('[GameSocketManager] Manual disconnect requested')
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setSocketReady(false)
    setConnectionStatus('disconnected')
    playerIdRef.current = null
  }, [])

  // Get current socket ID for debugging
  const getSocketId = useCallback(() => {
    return socketRef.current?.id || null
  }, [])

  return {
    socketRef,
    socketReady,
    connectionStatus,
    disconnect,
    getSocketId,
    // Convenience: direct access to socket (read-only)
    get socket() {
      return socketRef.current
    }
  }
}

