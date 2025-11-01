import React from 'react'
import { Link } from 'react-router-dom'
import FantasyButton from '../components/ui/FantasyButton'
import FantasyCard from '../components/ui/FantasyCard'

export default function HomePage() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/images/bg-login.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/70"></div>
      
      <div className="relative z-10 max-w-4xl w-full">
        <FantasyCard className="text-center p-12">
          <h1 
            className="text-amber-300 text-5xl font-bold mb-6"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 30px rgba(217, 119, 6, 0.8)',
              letterSpacing: '3px'
            }}
          >
            ⚔️ Welcome to OpenWorld3JS
          </h1>
          
          <p 
            className="text-amber-200 text-xl mb-8"
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}
          >
            Embark on an epic fantasy adventure in a 3D multiplayer world
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/game">
              <FantasyButton size="lg">
                🎮 Enter Game
              </FantasyButton>
            </Link>
            
            <Link to="/leaderboard">
              <FantasyButton variant="secondary" size="lg">
                🏆 View Leaderboard
              </FantasyButton>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FantasyCard>
              <h3 className="text-amber-200 text-xl font-bold mb-3">⚔️ Combat</h3>
              <p className="text-amber-300/80 text-sm">
                Engage in intense PvP battles and strategic combat
              </p>
            </FantasyCard>
            
            <FantasyCard>
              <h3 className="text-amber-200 text-xl font-bold mb-3">🌍 Exploration</h3>
              <p className="text-amber-300/80 text-sm">
                Discover vast zones and magical realms
              </p>
            </FantasyCard>
            
            <FantasyCard>
              <h3 className="text-amber-200 text-xl font-bold mb-3">🎭 Heroes</h3>
              <p className="text-amber-300/80 text-sm">
                Collect and level up powerful heroes
              </p>
            </FantasyCard>
          </div>
        </FantasyCard>
      </div>
    </div>
  )
}

