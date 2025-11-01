import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

/**
 * Custom hook for managing socket.io connection
 * @param {Object|null} player - The authenticated player object
 * @returns {Object} - Socket connection state and ref
 */
export function useSocketConnection(player) {
  const socketRef = useRef(null)
  const [socketReady, setSocketReady] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  const playerIdRef = useRef(null)

  useEffect(() => {
    if (!player) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setSocketReady(false)
      playerIdRef.current = null
      return
    }

    // Prevent reconnection loop: if socket exists for the same player, don't reconnect
    if (socketRef.current && playerIdRef.current === player.id) {
      // Socket already exists for this player (connected or connecting), don't create duplicate
      return
    }

    // If socket exists but for different player, disconnect it first
    if (socketRef.current && playerIdRef.current !== player.id) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    const token = localStorage.getItem('playerToken')
    const socketUrl = import.meta.env.SOCKET_URL || 'http://localhost:6060'

    // Configure socket with reconnection settings
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

    const handleConnect = () => {
      console.log('[useSocketConnection] Socket connected, authenticating...')
      setConnectionStatus('connected')
      socket.emit('auth', { token })
    }

    const handleConnectError = (error) => {
      console.error('[useSocketConnection] Connection error:', error)
      setConnectionStatus('disconnected')
      setSocketReady(false)
    }

    const handleReconnect = (attemptNumber) => {
      console.log('[useSocketConnection] Reconnected after', attemptNumber, 'attempt(s)')
      setConnectionStatus('connected')
      // Re-authenticate on reconnect
      socket.emit('auth', { token })
    }

    const handleReconnectAttempt = (attemptNumber) => {
      console.log('[useSocketConnection] Reconnection attempt:', attemptNumber)
      setConnectionStatus('reconnecting')
    }

    const handleReconnectError = (error) => {
      console.error('[useSocketConnection] Reconnection error:', error)
      setConnectionStatus('reconnecting')
    }

    const handleReconnectFailed = () => {
      console.error('[useSocketConnection] Reconnection failed')
      setConnectionStatus('disconnected')
      setSocketReady(false)
    }

    const handleAuthOk = ({ player: socketPlayer }) => {
      console.log('[useSocketConnection] Authentication successful')
      // Only update player if ID changed or if it's the first time
      if (!playerIdRef.current || playerIdRef.current !== socketPlayer.id) {
        playerIdRef.current = socketPlayer.id
      }
      setSocketReady(true)
      setConnectionStatus('connected')
    }

    const handleAuthError = () => {
      console.error('[useSocketConnection] Authentication failed')
      setSocketReady(false)
      setConnectionStatus('disconnected')
      playerIdRef.current = null
    }

    const handleDisconnect = (reason) => {
      console.log('[useSocketConnection] Disconnected:', reason)
      setSocketReady(false)
      // If it's an intentional disconnect, mark as disconnected
      // If it's an error, socket.io will try to reconnect automatically
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        setConnectionStatus('disconnected')
      } else {
        // Unexpected disconnect, will attempt to reconnect
        setConnectionStatus('reconnecting')
      }
    }

    socket.on('connect', handleConnect)
    socket.on('connect_error', handleConnectError)
    socket.on('reconnect', handleReconnect)
    socket.on('reconnect_attempt', handleReconnectAttempt)
    socket.on('reconnect_error', handleReconnectError)
    socket.on('reconnect_failed', handleReconnectFailed)
    socket.on('auth:ok', handleAuthOk)
    socket.on('auth:error', handleAuthError)
    socket.on('disconnect', handleDisconnect)

    return () => {
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
      
      // Only disconnect if this effect is cleaning up due to player becoming null
      // Don't disconnect if we're just preventing a reconnect loop
      if (!player) {
        socket.disconnect()
        socketRef.current = null
        playerIdRef.current = null
        setConnectionStatus('disconnected')
      }
    }
  }, [player])

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setSocketReady(false)
    setConnectionStatus('disconnected')
    playerIdRef.current = null
  }

  return {
    socketRef,
    socketReady,
    connectionStatus,
    disconnect
  }
}

