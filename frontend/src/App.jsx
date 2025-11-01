import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { me as fetchMe } from './services/authService'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GameApp from './GameApp'
import LeaderboardPage from './pages/LeaderboardPage'

export default function App() {
  const [player, setPlayer] = React.useState(null)
  const socketRef = React.useRef(null)
  const [socketReady, setSocketReady] = React.useState(false)

  // Check authentication on mount
  React.useEffect(() => {
    fetchMe().then((response) => {
      if (response && response.data) {
        setPlayer(response.data)
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
      return
    }

    const token = localStorage.getItem('playerToken')
    const socketUrl = import.meta.env.SOCKET_URL || 'http://localhost:6060'

    const socket = io(socketUrl, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('auth', { token })
    })

    socket.on('auth:ok', ({ player: socketPlayer }) => {
      setPlayer(socketPlayer)
      setSocketReady(true)
    })

    socket.on('auth:error', () => {
      setSocketReady(false)
    })

    socket.on('disconnect', () => {
      setSocketReady(false)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [player])

  const handleLogout = () => {
    setPlayer(null)
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setSocketReady(false)
  }

  return (
    <BrowserRouter>
      <Routes>
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
            path="game" 
            element={
              <GameApp 
                onPlayerChange={setPlayer}
                socketRef={socketRef}
              />
            } 
          />
          <Route 
            path="leaderboard" 
            element={
              <LeaderboardPage 
                socket={socketReady ? socketRef.current : null}
                player={player}
              />
            } 
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

