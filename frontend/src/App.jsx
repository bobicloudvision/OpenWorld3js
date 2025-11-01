import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { me as fetchMe } from './services/authService'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GameApp from './GameApp'
import LeaderboardPage from './pages/LeaderboardPage'
import AuthPage from './pages/AuthPage'

export default function App() {
  const [player, setPlayer] = React.useState(null)
  const socketRef = React.useRef(null)
  const [socketReady, setSocketReady] = React.useState(false)
  const playerIdRef = React.useRef(null)

  // Check authentication on mount
  React.useEffect(() => {
    fetchMe().then((response) => {
      if (response && response.data) {
        setPlayer(response.data)
        playerIdRef.current = response.data.id
      }
    }).catch(() => {
      console.log('Auth check failed')
    })
  }, [])

  // Create socket connection when player is authenticated
  React.useEffect(() => {
    if (!player) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setSocketReady(false)
      playerIdRef.current = null
      return
    }

    // Prevent reconnection loop: if socket exists and is connected, don't reconnect
    if (socketRef.current && socketRef.current.connected) {
      // Only update if player ID changed (different user)
      if (playerIdRef.current !== player.id) {
        socketRef.current.disconnect()
        socketRef.current = null
      } else {
        return // Already connected with same player, skip reconnection
      }
    }

    const token = localStorage.getItem('playerToken')
    const socketUrl = import.meta.env.SOCKET_URL || 'http://localhost:6060'

    const socket = io(socketUrl, { transports: ['websocket'] })
    socketRef.current = socket
    playerIdRef.current = player.id

    const handleConnect = () => {
      socket.emit('auth', { token })
    }

    const handleAuthOk = ({ player: socketPlayer }) => {
      // Only update player if ID changed or if it's the first time
      if (!playerIdRef.current || playerIdRef.current !== socketPlayer.id) {
        setPlayer(socketPlayer)
        playerIdRef.current = socketPlayer.id
      }
      setSocketReady(true)
    }

    const handleAuthError = () => {
      setSocketReady(false)
      playerIdRef.current = null
    }

    const handleDisconnect = () => {
      setSocketReady(false)
    }

    socket.on('connect', handleConnect)
    socket.on('auth:ok', handleAuthOk)
    socket.on('auth:error', handleAuthError)
    socket.on('disconnect', handleDisconnect)

    return () => {
      // Remove all event listeners
      socket.off('connect', handleConnect)
      socket.off('auth:ok', handleAuthOk)
      socket.off('auth:error', handleAuthError)
      socket.off('disconnect', handleDisconnect)
      
      // Only disconnect if this effect is cleaning up due to player becoming null
      // Don't disconnect if we're just preventing a reconnect loop
      if (!player) {
        socket.disconnect()
        socketRef.current = null
        playerIdRef.current = null
      }
    }
  }, [player])

  const handleLogout = () => {
    setPlayer(null)
    playerIdRef.current = null
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setSocketReady(false)
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Game route without Layout */}
        <Route 
          path="/game" 
          element={
            <GameApp 
              onPlayerChange={setPlayer}
              socketRef={socketRef}
            />
          } 
        />
        {/* Website pages with Layout */}
        <Route 
          path="/" 
          element={
            <Layout 
              player={player} 
              socketRef={socketRef} 
              onLogout={handleLogout}
            />
          }
        >
          <Route index element={<HomePage />} />
          <Route 
            path="leaderboard" 
            element={
              <LeaderboardPage 
                socket={socketReady ? socketRef.current : null}
                player={player}
              />
            } 
          />
          <Route 
            path="login" 
            element={
              <AuthPage 
                onAuthenticated={setPlayer}
              />
            } 
          />
          <Route 
            path="register" 
            element={
              <AuthPage 
                onAuthenticated={setPlayer}
              />
            } 
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

