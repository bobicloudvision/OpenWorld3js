import React, { useState, useEffect } from 'react';
import { FantasyButton, FantasyCard, FantasyBadge } from './ui';

/**
 * Public Leaderboard Component
 * Works without authentication - only shows public leaderboard data
 */
export default function PublicLeaderboard({ socket }) {
  const [activeTab, setActiveTab] = useState('players'); // 'players', 'heroes'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [heroLeaderboardData, setHeroLeaderboardData] = useState([]);
  const [sortBy, setSortBy] = useState('wins');
  const [loading, setLoading] = useState(false);

  // Fetch leaderboard data
  useEffect(() => {
    if (!socket) return;

    const handleLeaderboardData = ({ leaderboard }) => {
      setLeaderboardData(leaderboard);
      setLoading(false);
    };

    const handleHeroLeaderboard = ({ heroes }) => {
      setHeroLeaderboardData(heroes);
      setLoading(false);
    };

    socket.on('leaderboard:data', handleLeaderboardData);
    socket.on('leaderboard:heroes', handleHeroLeaderboard);

    // Initial fetch
    setLoading(true);
    socket.emit('leaderboard:get', { sortBy, limit: 100 });
    socket.emit('leaderboard:get:heroes', { limit: 50 });

    return () => {
      socket.off('leaderboard:data', handleLeaderboardData);
      socket.off('leaderboard:heroes', handleHeroLeaderboard);
    };
  }, [socket, sortBy]);

  // Re-fetch when sort changes
  useEffect(() => {
    if (!socket || loading) return;
    setLoading(true);
    socket.emit('leaderboard:get', { sortBy, limit: 100 });
  }, [sortBy, socket]);

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
  };

  const tableHeaderStyle = 'px-3 py-3 text-left text-amber-300 text-sm font-bold';
  const tableCellStyle = 'px-3 py-3 text-amber-100 text-sm';

  return (
    <FantasyCard className="w-full bg-amber-950/90 border-4 border-amber-700/60 p-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b-2 border-amber-700/60 pb-4">
        {['players', 'heroes'].map(tab => (
          <FantasyButton
            key={tab}
            onClick={() => setActiveTab(tab)}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            size="md"
            className={activeTab === tab ? '' : 'opacity-70'}
          >
            {tab === 'players' && '👥 Players Leaderboard'}
            {tab === 'heroes' && '⚔️ Heroes Leaderboard'}
          </FantasyButton>
        ))}
      </div>

      {/* Content */}
      <div className="w-full">
        {loading && (
          <div className="text-center text-amber-200 py-20" style={{
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          }}>
            <p className="text-xl">Loading leaderboard...</p>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && !loading && (
          <div>
            <div className="mb-4 flex gap-2 items-center flex-wrap">
              <span className="text-amber-200 text-sm font-semibold" style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>Sort by:</span>
              {['wins', 'winRate', 'matches', 'damage', 'kills'].map(sort => (
                <FantasyButton
                  key={sort}
                  onClick={() => handleSortChange(sort)}
                  variant={sortBy === sort ? 'primary' : 'secondary'}
                  size="sm"
                  className="text-xs"
                >
                  {sort === 'wins' && 'Wins'}
                  {sort === 'winRate' && 'Win Rate'}
                  {sort === 'matches' && 'Matches'}
                  {sort === 'damage' && 'Damage'}
                  {sort === 'kills' && 'Kills'}
                </FantasyButton>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-amber-700/60">
                    <th className={tableHeaderStyle}>Rank</th>
                    <th className={tableHeaderStyle}>Player</th>
                    <th className={tableHeaderStyle}>Level</th>
                    <th className={tableHeaderStyle}>Wins</th>
                    <th className={tableHeaderStyle}>Losses</th>
                    <th className={tableHeaderStyle}>Win Rate</th>
                    <th className={tableHeaderStyle}>Matches</th>
                    <th className={tableHeaderStyle}>Damage</th>
                    <th className={tableHeaderStyle}>Kills</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.length === 0 ? (
                    <tr>
                      <td colSpan="9" className={`${tableCellStyle} text-center text-amber-300/70 py-10`}>
                        No players found in leaderboard yet
                      </td>
                    </tr>
                  ) : (
                    leaderboardData.map((entry) => (
                      <tr 
                        key={entry.playerId}
                        className="border-b border-amber-800/50 hover:bg-amber-800/20 transition-colors"
                      >
                        <td className={tableCellStyle}>
                          <FantasyBadge
                            variant={entry.rank === 1 ? 'rank-1' : entry.rank === 2 ? 'rank-2' : entry.rank === 3 ? 'rank-3' : 'default'}
                            size="sm"
                          >
                            #{entry.rank}
                          </FantasyBadge>
                        </td>
                        <td className={tableCellStyle}>
                          <div className="font-bold text-amber-100">
                            {entry.playerName}
                          </div>
                        </td>
                        <td className={tableCellStyle}>{entry.playerLevel}</td>
                        <td className={`${tableCellStyle} text-green-400`}>{entry.wins}</td>
                        <td className={`${tableCellStyle} text-red-400`}>{entry.losses}</td>
                        <td className={tableCellStyle}>
                          <span className={`font-bold ${entry.winRate >= 50 ? 'text-green-400' : 'text-amber-400'}`}>
                            {entry.winRate?.toFixed(1) || 0}%
                          </span>
                        </td>
                        <td className={tableCellStyle}>{entry.totalMatches}</td>
                        <td className={tableCellStyle}>{entry.totalDamage?.toLocaleString() || 0}</td>
                        <td className={tableCellStyle}>{entry.totalKills || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Heroes Tab */}
        {activeTab === 'heroes' && !loading && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-amber-700/60">
                  <th className={tableHeaderStyle}>Rank</th>
                  <th className={tableHeaderStyle}>Owner</th>
                  <th className={tableHeaderStyle}>Hero</th>
                  <th className={tableHeaderStyle}>Level</th>
                  <th className={tableHeaderStyle}>HP</th>
                  <th className={tableHeaderStyle}>Wins</th>
                  <th className={tableHeaderStyle}>Losses</th>
                  <th className={tableHeaderStyle}>Win Rate</th>
                  <th className={tableHeaderStyle}>Matches</th>
                  <th className={tableHeaderStyle}>Damage</th>
                </tr>
              </thead>
              <tbody>
                {heroLeaderboardData.length === 0 ? (
                  <tr>
                    <td colSpan="10" className={`${tableCellStyle} text-center text-amber-300/70 py-10`}>
                      No heroes found in leaderboard yet
                    </td>
                  </tr>
                ) : (
                  heroLeaderboardData.map((entry) => (
                    <tr 
                      key={entry.playerHeroId}
                      className="border-b border-amber-800/50 hover:bg-amber-800/20 transition-colors"
                    >
                      <td className={tableCellStyle}>
                        <FantasyBadge
                          variant={entry.rank === 1 ? 'rank-1' : entry.rank === 2 ? 'rank-2' : entry.rank === 3 ? 'rank-3' : 'default'}
                          size="sm"
                        >
                          #{entry.rank}
                        </FantasyBadge>
                      </td>
                      <td className={tableCellStyle}>
                        <div className="text-amber-300 text-xs">
                          {entry.playerName}
                        </div>
                      </td>
                      <td className={`${tableCellStyle} font-bold text-amber-100`}>
                        {entry.displayName !== entry.heroName ? (
                          <div>
                            <div>{entry.displayName}</div>
                            <div className="text-xs text-amber-400">({entry.heroName})</div>
                          </div>
                        ) : (
                          entry.heroName
                        )}
                      </td>
                      <td className={tableCellStyle}>
                        <span className="px-2 py-1 rounded font-bold text-xs text-black" style={{
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                        }}>
                          {entry.heroLevel}
                        </span>
                      </td>
                      <td className={tableCellStyle}>
                        <span className={`text-xs ${entry.currentHealth <= 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {entry.currentHealth}/{entry.maxHealth}
                        </span>
                      </td>
                      <td className={`${tableCellStyle} text-green-400 font-bold`}>{entry.wins}</td>
                      <td className={`${tableCellStyle} text-red-400`}>{entry.losses}</td>
                      <td className={tableCellStyle}>
                        <span className={`font-bold ${entry.winRate >= 50 ? 'text-green-400' : 'text-amber-400'}`}>
                          {entry.winRate?.toFixed(1) || 0}%
                        </span>
                      </td>
                      <td className={tableCellStyle}>{entry.totalMatches}</td>
                      <td className={tableCellStyle}>{entry.totalDamage?.toLocaleString() || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FantasyCard>
  );
}

