import React, { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import PublicLeaderboard from '../components/PublicLeaderboard'
import Leaderboard from '../components/Leaderboard'

export default function LeaderboardPage({ socket: externalSocket, player }) {
  const [socket, setSocket] = React.useState(externalSocket)
  const [socketReady, setSocketReady] = React.useState(!!externalSocket)
  const socketRef = useRef(null)

  // Create socket connection for public access if not provided
  useEffect(() => {
    // Use provided socket if available
    if (externalSocket) {
      setSocket(externalSocket)
      setSocketReady(true)
      return
    }

    // Create public socket connection (no auth required)
    const socketUrl = import.meta.env.SOCKET_URL || 'http://localhost:6060'
    const publicSocket = io(socketUrl, { transports: ['websocket'] })
    socketRef.current = publicSocket

    publicSocket.on('connect', () => {
      console.log('[LeaderboardPage] Public socket connected')
      setSocketReady(true)
      // Optionally try to authenticate if token exists, but don't require it
      const token = localStorage.getItem('playerToken')
      if (token) {
        publicSocket.emit('auth', { token })
      }
    })

    publicSocket.on('auth:ok', () => {
      console.log('[LeaderboardPage] Authenticated via token')
    })

    publicSocket.on('auth:error', () => {
      // This is fine - we can still use the socket for public data
      console.log('[LeaderboardPage] Auth failed, continuing as public user')
    })

    publicSocket.on('disconnect', () => {
      setSocketReady(false)
    })

    setSocket(publicSocket)

    return () => {
      if (!externalSocket && socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [externalSocket])

  return (
    <div 
      className="container mx-auto px-4 py-8 min-h-screen"
      style={{
        minHeight: '100vh'
      }}
    >
      <div className="max-w-6xl mx-auto">
        <h1 
          className="text-amber-300 text-4xl font-bold mb-8 text-center"
          style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(217, 119, 6, 0.6)',
            letterSpacing: '2px'
          }}
        >
          🏆 Leaderboard
        </h1>
        
        {socket && socketReady ? (
          // Show full leaderboard with stats if logged in, otherwise public version
          player ? (
            <Leaderboard socket={socket} player={player} onClose={null} />
          ) : (
            <PublicLeaderboard socket={socket} />
          )
        ) : (
          <div className="text-center py-20 text-amber-300">
            <p className="text-xl">Connecting to server...</p>
          </div>
        )}
      </div>
    </div>
  )
}

