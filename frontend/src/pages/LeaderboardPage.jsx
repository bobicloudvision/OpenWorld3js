import React from 'react'
import Leaderboard from '../components/Leaderboard'

export default function LeaderboardPage({ socket, player }) {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
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
        {socket && player ? (
          <Leaderboard socket={socket} />
        ) : (
          <div className="text-center py-20 text-amber-300">
            <p className="text-xl">
              {!player ? 'Please log in to view the leaderboard' : 'Connecting to server...'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

