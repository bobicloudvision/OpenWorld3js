import React, { useState, useEffect } from 'react';
import { FantasyModal, FantasyButton, FantasyCard, FantasyPanel } from './ui';

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
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
              Loading...
            </div>
          )}

          {/* Players Tab */}
          {activeTab === 'players' && !loading && (
            <div>
              <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Sort by:</span>
                {['wins', 'winRate', 'matches', 'damage', 'kills'].map(sort => (
                  <button
                    key={sort}
                    onClick={() => handleSortChange(sort)}
                    style={{
                      padding: '6px 12px',
                      background: sortBy === sort ? '#3b82f6' : '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {sort === 'wins' && 'Wins'}
                    {sort === 'winRate' && 'Win Rate'}
                    {sort === 'matches' && 'Matches'}
                    {sort === 'damage' && 'Damage'}
                    {sort === 'kills' && 'Kills'}
                  </button>
                ))}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #334155' }}>
                    <th style={tableHeaderStyle}>Rank</th>
                    <th style={tableHeaderStyle}>Player</th>
                    <th style={tableHeaderStyle}>Level</th>
                    <th style={tableHeaderStyle}>Wins</th>
                    <th style={tableHeaderStyle}>Losses</th>
                    <th style={tableHeaderStyle}>Win Rate</th>
                    <th style={tableHeaderStyle}>Matches</th>
                    <th style={tableHeaderStyle}>Damage</th>
                    <th style={tableHeaderStyle}>Kills</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((entry) => (
                    <tr 
                      key={entry.playerId}
                      style={{
                        borderBottom: '1px solid #334155',
                        background: entry.playerId === player?.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                      }}
                    >
                      <td style={tableCellStyle}>
                        <span style={{
                          ...getRankStyle(entry.rank),
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: 'bold'
                        }}>
                          #{entry.rank}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ fontWeight: 'bold', color: '#e2e8f0' }}>
                          {entry.playerName}
                          {entry.playerId === player?.id && (
                            <span style={{ color: '#3b82f6', marginLeft: '8px' }}>(You)</span>
                          )}
                        </div>
                      </td>
                      <td style={tableCellStyle}>{entry.playerLevel}</td>
                      <td style={{...tableCellStyle, color: '#10b981'}}>{entry.wins}</td>
                      <td style={{...tableCellStyle, color: '#ef4444'}}>{entry.losses}</td>
                      <td style={tableCellStyle}>
                        <span style={{
                          color: entry.winRate >= 50 ? '#10b981' : '#f59e0b',
                          fontWeight: 'bold'
                        }}>
                          {entry.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td style={tableCellStyle}>{entry.totalMatches}</td>
                      <td style={tableCellStyle}>{entry.totalDamage?.toLocaleString() || 0}</td>
                      <td style={tableCellStyle}>{entry.totalKills}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Heroes Tab */}
          {activeTab === 'heroes' && !loading && (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #334155' }}>
                    <th style={tableHeaderStyle}>Rank</th>
                    <th style={tableHeaderStyle}>Owner</th>
                    <th style={tableHeaderStyle}>Hero</th>
                    <th style={tableHeaderStyle}>Level</th>
                    <th style={tableHeaderStyle}>HP</th>
                    <th style={tableHeaderStyle}>Wins</th>
                    <th style={tableHeaderStyle}>Losses</th>
                    <th style={tableHeaderStyle}>Win Rate</th>
                    <th style={tableHeaderStyle}>Matches</th>
                    <th style={tableHeaderStyle}>Damage</th>
                  </tr>
                </thead>
                <tbody>
                  {heroLeaderboardData.map((entry) => (
                    <tr 
                      key={entry.playerHeroId} 
                      style={{ 
                        borderBottom: '1px solid #334155',
                        background: entry.playerId === player?.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                      }}
                    >
                      <td style={tableCellStyle}>
                        <span style={{
                          ...getRankStyle(entry.rank),
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}>
                          #{entry.rank}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                          {entry.playerName}
                          {entry.playerId === player?.id && (
                            <span style={{ color: '#3b82f6', marginLeft: '4px' }}>(You)</span>
                          )}
                        </div>
                      </td>
                      <td style={{...tableCellStyle, fontWeight: 'bold', color: '#e2e8f0'}}>
                        {entry.displayName !== entry.heroName ? (
                          <div>
                            <div>{entry.displayName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>({entry.heroName})</div>
                          </div>
                        ) : (
                          entry.heroName
                        )}
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          color: '#000',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}>
                          {entry.heroLevel}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ 
                          color: entry.currentHealth <= 0 ? '#ef4444' : '#10b981',
                          fontSize: '13px'
                        }}>
                          {entry.currentHealth}/{entry.maxHealth}
                        </span>
                      </td>
                      <td style={{...tableCellStyle, color: '#10b981', fontWeight: 'bold'}}>{entry.wins}</td>
                      <td style={{...tableCellStyle, color: '#ef4444'}}>{entry.losses}</td>
                      <td style={tableCellStyle}>
                        <span style={{
                          color: entry.winRate >= 50 ? '#10b981' : '#f59e0b',
                          fontWeight: 'bold'
                        }}>
                          {entry.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td style={tableCellStyle}>{entry.totalMatches}</td>
                      <td style={tableCellStyle}>{entry.totalDamage?.toLocaleString() || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* My Stats Tab */}
          {activeTab === 'myStats' && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {playerStats && (
                <div>
                  <h3 style={{ color: '#e2e8f0', marginBottom: '16px' }}>Your Statistics</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
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
                  <h3 style={{ color: '#e2e8f0', marginBottom: '16px' }}>Recent Matches</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {recentMatches.map((match, idx) => (
                      <div
                        key={match.matchId}
                        style={{
                          background: match.playerResult === 'won' 
                            ? 'rgba(16, 185, 129, 0.1)' 
                            : 'rgba(239, 68, 68, 0.1)',
                          border: `2px solid ${match.playerResult === 'won' ? '#10b981' : '#ef4444'}`,
                          borderRadius: '8px',
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <span style={{
                            fontWeight: 'bold',
                            color: match.playerResult === 'won' ? '#10b981' : '#ef4444',
                            marginRight: '12px'
                          }}>
                            {match.playerResult === 'won' ? '✅ VICTORY' : '❌ DEFEAT'}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                            {match.heroName} • {match.queueType || match.matchType}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#cbd5e1' }}>
                          <span>DMG: {match.damageDealt}</span>
                          <span>Kills: {match.kills}</span>
                          <span>Deaths: {match.deaths}</span>
                          <span>{match.durationSeconds}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#1e293b',
      border: `2px solid ${color}`,
      borderRadius: '12px',
      padding: '16px',
      textAlign: 'center'
    }}>
      <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ color, fontSize: '24px', fontWeight: 'bold' }}>
        {value || 0}
      </div>
    </div>
  );
}

function getRankStyle(rank) {
  if (rank === 1) return { background: '#fbbf24', color: '#000' };
  if (rank === 2) return { background: '#94a3b8', color: '#000' };
  if (rank === 3) return { background: '#cd7f32', color: '#000' };
  return { background: '#1e293b', color: '#94a3b8' };
}

const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  color: '#94a3b8',
  fontSize: '14px',
  fontWeight: 'bold'
};

const tableCellStyle = {
  padding: '12px',
  color: '#cbd5e1',
  fontSize: '14px'
};

