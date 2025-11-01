import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { me as fetchMe } from './services/authService'
import { useSocketConnection } from './hooks/useSocketConnection'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GameApp from './GameApp'
import LeaderboardPage from './pages/LeaderboardPage'
import AuthPage from './pages/AuthPage'

export default function App() {
  const [player, setPlayer] = React.useState(null)
  const { socketRef, socketReady, disconnect } = useSocketConnection(player)

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

