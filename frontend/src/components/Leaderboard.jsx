import React, { useState, useEffect } from 'react';
import { FantasyModal, FantasyButton, FantasyCard, FantasyPanel, FantasyBadge } from './ui';

export default function Leaderboard({ socket, player, onClose }) {
  const [activeTab, setActiveTab] = useState('players'); // 'players', 'heroes', 'myStats'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [heroLeaderboardData, setHeroLeaderboardData] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [sortBy, setSortBy] = useState('wins');
  const [loading, setLoading] = useState(false);

  // Fetch leaderboard data
  useEffect(() => {
    if (!socket || !player) return;

    const handleLeaderboardData = ({ leaderboard }) => {
      setLeaderboardData(leaderboard);
      setLoading(false);
    };

    const handleHeroLeaderboard = ({ heroes }) => {
      setHeroLeaderboardData(heroes);
      setLoading(false);
    };

    const handlePlayerStats = ({ stats }) => {
      setPlayerStats(stats);
      setLoading(false);
    };

    const handleRecentMatches = ({ matches }) => {
      setRecentMatches(matches);
      setLoading(false);
    };

    socket.on('leaderboard:data', handleLeaderboardData);
    socket.on('leaderboard:heroes', handleHeroLeaderboard);
    socket.on('leaderboard:player-stats', handlePlayerStats);
    socket.on('leaderboard:recent-matches', handleRecentMatches);

    // Initial fetch
    setLoading(true);
    socket.emit('leaderboard:get', { sortBy, limit: 100 });
    socket.emit('leaderboard:get:heroes', { limit: 50 });
    socket.emit('leaderboard:get:player-stats');
    socket.emit('leaderboard:get:recent-matches', { limit: 10 });

    return () => {
      socket.off('leaderboard:data', handleLeaderboardData);
      socket.off('leaderboard:heroes', handleHeroLeaderboard);
      socket.off('leaderboard:player-stats', handlePlayerStats);
      socket.off('leaderboard:recent-matches', handleRecentMatches);
    };
  }, [socket, player, sortBy]);

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setLoading(true);
    socket.emit('leaderboard:get', { sortBy: newSort, limit: 100 });
  };

  return (
    <FantasyModal isOpen={true} onClose={onClose} title="🏆 Leaderboard" maxWidth="1200px">
        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-amber-700/60">
          {['players', 'heroes', 'myStats'].map(tab => (
            <FantasyButton
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'primary' : 'secondary'}
              size="sm"
              className={activeTab === tab ? '' : 'opacity-70'}
            >
              {tab === 'players' && '👥 Players'}
              {tab === 'heroes' && '⚔️ Heroes'}
              {tab === 'myStats' && '📊 My Stats'}
            </FantasyButton>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="text-center text-amber-200 py-10" style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              fontFamily: 'Georgia, serif'
            }}>
              Loading...
            </div>
          )}

          {/* Players Tab */}
          {activeTab === 'players' && !loading && (
            <div>
              <div className="mb-4 flex gap-2 items-center flex-wrap">
                <span className="text-amber-200 text-sm" style={{
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
                    {leaderboardData.map((entry) => (
                      <tr 
                        key={entry.playerId}
                        className={`border-b border-amber-800/50 ${entry.playerId === player?.id ? 'bg-amber-700/20' : ''}`}
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
                            {entry.playerId === player?.id && (
                              <span className="text-amber-300 ml-2">(You)</span>
                            )}
                          </div>
                        </td>
                        <td className={tableCellStyle}>{entry.playerLevel}</td>
                        <td className={`${tableCellStyle} text-green-400`}>{entry.wins}</td>
                        <td className={`${tableCellStyle} text-red-400`}>{entry.losses}</td>
                        <td className={tableCellStyle}>
                          <span className={`font-bold ${entry.winRate >= 50 ? 'text-green-400' : 'text-amber-400'}`}>
                            {entry.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className={tableCellStyle}>{entry.totalMatches}</td>
                        <td className={tableCellStyle}>{entry.totalDamage?.toLocaleString() || 0}</td>
                        <td className={tableCellStyle}>{entry.totalKills}</td>
                      </tr>
                    ))}
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
                  {heroLeaderboardData.map((entry) => (
                    <tr 
                      key={entry.playerHeroId}
                      className={`border-b border-amber-800/50 ${entry.playerId === player?.id ? 'bg-amber-700/20' : ''}`}
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
                          {entry.playerId === player?.id && (
                            <span className="text-amber-200 ml-1">(You)</span>
                          )}
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
                          {entry.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className={tableCellStyle}>{entry.totalMatches}</td>
                      <td className={tableCellStyle}>{entry.totalDamage?.toLocaleString() || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* My Stats Tab */}
          {activeTab === 'myStats' && !loading && (
            <div className="flex flex-col gap-6">
              {playerStats && (
                <div>
                  <h3 className="text-amber-200 mb-4 text-xl font-bold" style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: 'Georgia, serif'
                  }}>Your Statistics</h3>
                  <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <StatCard label="Global Rank" value={`#${playerStats.rank}`} color="#fbbf24" />
                    <StatCard label="Total Wins" value={playerStats.wins} color="#10b981" />
                    <StatCard label="Total Losses" value={playerStats.losses} color="#ef4444" />
                    <StatCard label="Win Rate" value={`${playerStats.winRate.toFixed(1)}%`} color="#3b82f6" />
                    <StatCard label="Total Matches" value={playerStats.totalMatches} color="#8b5cf6" />
                    <StatCard label="Total Damage" value={playerStats.totalDamage?.toLocaleString()} color="#f59e0b" />
                    <StatCard label="Total Kills" value={playerStats.totalKills} color="#ef4444" />
                    <StatCard label="Total Deaths" value={playerStats.totalDeaths} color="#64748b" />
                  </div>
                </div>
              )}

              {recentMatches.length > 0 && (
                <div>
                  <h3 className="text-amber-200 mb-4 text-xl font-bold" style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: 'Georgia, serif'
                  }}>Recent Matches</h3>
                  <div className="flex flex-col gap-2">
                    {recentMatches.map((match, idx) => (
                      <FantasyCard
                        key={match.matchId}
                        className={`border-2 ${match.playerResult === 'won' ? 'border-green-500/60' : 'border-red-500/60'}`}
                        style={{
                          background: match.playerResult === 'won' 
                            ? 'linear-gradient(to bottom, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))' 
                            : 'linear-gradient(to bottom, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))'
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className={`font-bold mr-3 ${match.playerResult === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                              {match.playerResult === 'won' ? '✅ VICTORY' : '❌ DEFEAT'}
                            </span>
                            <span className="text-amber-300 text-sm">
                              {match.heroName} • {match.queueType || match.matchType}
                            </span>
                          </div>
                          <div className="flex gap-4 text-sm text-amber-200">
                            <span>DMG: {match.damageDealt}</span>
                            <span>Kills: {match.kills}</span>
                            <span>Deaths: {match.deaths}</span>
                            <span>{match.durationSeconds}s</span>
                          </div>
                        </div>
                      </FantasyCard>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
    </FantasyModal>
  );
}

function StatCard({ label, value, color }) {
  return (
    <FantasyCard className="text-center">
      <div className="text-amber-300 text-xs mb-2 uppercase tracking-wider" style={{
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
      }}>
        {label}
      </div>
      <div className="text-2xl font-bold" style={{ color, textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
        {value || 0}
      </div>
    </FantasyCard>
  );
}


const tableHeaderStyle = 'px-3 py-3 text-left text-amber-300 text-sm font-bold';
const tableCellStyle = 'px-3 py-3 text-amber-100 text-sm';

