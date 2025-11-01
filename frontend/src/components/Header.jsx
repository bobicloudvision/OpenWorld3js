import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { logout as playerLogout } from '../services/authService'
import FantasyButton from './ui/FantasyButton'
import FantasyBadge from './ui/FantasyBadge'

export default function Header({ player, socketRef, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await playerLogout()
    if (socketRef?.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    if (onLogout) {
      onLogout()
    }
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <header 
      className="sticky top-0 z-[100] w-full border-b-4 border-amber-700/60"
      style={{
        background: 'linear-gradient(to bottom, rgba(139, 69, 19, 0.95), rgba(101, 67, 33, 0.95))',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(217, 119, 6, 0.3)'
      }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <Link 
            to="/" 
            className="text-amber-300 text-2xl font-bold hover:text-amber-200 transition-colors"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(217, 119, 6, 0.6)',
              letterSpacing: '2px'
            }}
          >
            ⚔️ OpenWorld3JS
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className={`px-4 py-2 text-sm font-bold rounded transition-all duration-200 ${
                isActive('/')
                  ? 'text-amber-200 border-b-2 border-amber-400'
                  : 'text-amber-300/70 hover:text-amber-200'
              }`}
              style={{
                textShadow: isActive('/') ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
              }}
            >
              Game
            </Link>
            
            {player && (
              <>
                <Link
                  to="/leaderboard"
                  className={`px-4 py-2 text-sm font-bold rounded transition-all duration-200 ${
                    isActive('/leaderboard')
                      ? 'text-amber-200 border-b-2 border-amber-400'
                      : 'text-amber-300/70 hover:text-amber-200'
                  }`}
                  style={{
                    textShadow: isActive('/leaderboard') ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
                  }}
                >
                  Leaderboard
                </Link>
              </>
            )}
          </nav>

          {/* User Info / Auth */}
          <div className="flex items-center gap-3">
            {player ? (
              <>
                <FantasyBadge variant="primary" size="md">
                  {player.name}
                  {player.level && (
                    <span className="ml-2 text-xs">Lv.{player.level}</span>
                  )}
                </FantasyBadge>
                {player.currency !== undefined && (
                  <FantasyBadge variant="primary" size="sm">
                    💰 {player.currency}
                  </FantasyBadge>
                )}
                <FantasyButton
                  variant="danger"
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </FantasyButton>
              </>
            ) : (
              <Link to="/login">
                <FantasyButton variant="primary" size="sm">
                  Login / Sign Up
                </FantasyButton>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

