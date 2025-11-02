import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { me as fetchMe } from './services/authService'
import { useGameSocketManager } from './hooks/useGameSocketManager'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GameApp from './GameApp'
import LeaderboardPage from './pages/LeaderboardPage'
import AuthPage from './pages/AuthPage'

export default function App() {
  const [player, setPlayer] = React.useState(null)
  
  // Centralized socket manager - single source of truth for all socket connections
  const { socketRef, socketReady, connectionStatus, disconnect } = useGameSocketManager(
    player,
    // onAuthSuccess - called when socket authenticates (can be used for initial setup)
    (socket) => {
      console.log('[App] Socket authenticated, ID:', socket.id, 'socketReady:', true)
    },
    // onAuthError - called when authentication fails
    (error) => {
      console.error('[App] Socket authentication failed:', error)
      console.error('[App] Check if token is valid and player is authenticated')
    }
  )

  // Debug logging
  React.useEffect(() => {
    console.log('[App] Socket state:', {
      hasPlayer: !!player,
      playerId: player?.id,
      socketReady,
      connectionStatus,
      socketConnected: socketRef.current?.connected,
      socketId: socketRef.current?.id
    })
  }, [player, socketReady, connectionStatus, socketRef])

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

  const handleLogout = () => {
    setPlayer(null)
    disconnect()
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
              socketReady={socketReady}
              disconnect={disconnect}
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

