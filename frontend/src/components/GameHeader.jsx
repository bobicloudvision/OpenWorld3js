import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout as playerLogout } from '../services/authService';
import FantasyButton from './ui/FantasyButton';
import FantasyBadge from './ui/FantasyBadge';

export default function GameHeader({
  player,
  playerHeroes,
  currentZone,
  socketRef,
  isMatchmakingBattle,
  onShowZoneSelector,
  onShowMatchmaking,
  onShowHeroSelection,
  onShowLeaderboard,
  onShowHeroSwitcher,
  onLogout
}) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleLogout = async () => {
    await playerLogout();
    if (socketRef?.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };

  const activeHero = playerHeroes?.find(h => h.playerHeroId === player?.active_hero_id);

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-[100]"
    
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Player Info */}
          <div className="flex items-center gap-3">
            {player && (
              <>
                <FantasyBadge variant="primary" size="md">
                  <span className="font-bold">{player.name}</span>
                  {player.level && (
                    <span className="ml-2 text-xs">Lv.{player.level}</span>
                  )}
                </FantasyBadge>
                {player.currency !== undefined && (
                  <FantasyBadge variant="primary" size="sm">
                    💰 {player.currency}
                  </FantasyBadge>
                )}
                {activeHero && (
                  <FantasyBadge variant="success" size="sm">
                    ⚔️ {activeHero.heroName} Lv.{activeHero.level}
                  </FantasyBadge>
                )}
              </>
            )}
          </div>

          {/* Center - Zone Info */}
          <div className="flex items-center gap-2">
            {currentZone && !isMatchmakingBattle && (
              <div 
                className="bg-gray-900/90 border-2 border-amber-600/50 rounded-lg px-4 py-2 text-gray-200 flex items-center gap-3"
                style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(217, 119, 6, 0.2)'
                }}
              >
                <span className="text-xl">🗺️</span>
                <div>
                  <div className="font-bold text-amber-300" style={{
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}>
                    {currentZone.name}
                  </div>
                  <div className="text-[10px] text-amber-200/70 uppercase tracking-wider">
                    {currentZone.type || (currentZone.is_combat_zone ? 'Combat Zone' : 'Safe Zone')}
                  </div>
                </div>
              </div>
            )}
            {isMatchmakingBattle && (
              <div 
                className="bg-red-900/90 border-2 border-red-600/50 rounded-lg px-4 py-2 text-white flex items-center gap-2"
                style={{
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(239, 68, 68, 0.2)'
                }}
              >
                <span className="text-xl animate-pulse">⚔️</span>
                <div className="font-bold">IN COMBAT</div>
              </div>
            )}
          </div>

          {/* Right side - Actions Menu */}
          <div className="flex items-center gap-2 relative" ref={menuRef}>
            {!isMatchmakingBattle && currentZone && (
              <>
                <FantasyButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (onShowZoneSelector) {
                      onShowZoneSelector();
                    }
                  }}
                  className="mr-1"
                >
                  🗺️ Zones
                </FantasyButton>
                <FantasyButton
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (!currentZone) {
                      alert('You must be in a zone to join matchmaking. Please select a zone first.');
                      return;
                    }
                    if (onShowMatchmaking) {
                      onShowMatchmaking();
                    }
                  }}
                  disabled={!currentZone}
                  title={!currentZone ? 'You must be in a zone to find a match' : 'Find a PvP match (Press P)'}
                >
                  ⚔️ Find Match
                </FantasyButton>
              </>
            )}
            {onShowLeaderboard && (
              <FantasyButton
                variant="primary"
                size="sm"
                onClick={() => {
                  if (onShowLeaderboard) {
                    onShowLeaderboard();
                  }
                }}
              >
                🏆 Leaderboard
              </FantasyButton>
            )}
            {onShowHeroSwitcher && (
              <FantasyButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (onShowHeroSwitcher) {
                    onShowHeroSwitcher();
                  }
                }}
              >
                ⚔️ Switch Hero
              </FantasyButton>
            )}
            
            {/* Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="relative px-4 py-2 text-amber-300 border-2 border-amber-600/50 rounded-lg cursor-pointer font-bold transition-all duration-200 hover:bg-amber-700/30 hover:border-amber-500"
              style={{
                background: 'linear-gradient(to bottom, rgba(139, 69, 19, 0.3), rgba(101, 67, 33, 0.3))',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(217, 119, 6, 0.2)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}
            >
              ☰ Menu
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div 
                className="absolute top-full right-0 mt-2 w-56 bg-gradient-to-b from-amber-950/95 to-amber-900/95 border-4 border-amber-600 rounded-lg shadow-2xl z-[200]"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(139, 69, 19, 0.3), rgba(0, 0, 0, 0.85))',
                  boxShadow: '0 0 50px rgba(217, 119, 6, 0.5), inset 0 0 30px rgba(139, 69, 19, 0.3)'
                }}
              >
                {/* Decorative corners */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t-[2px] border-l-[2px] border-amber-500"></div>
                <div className="absolute top-2 right-2 w-6 h-6 border-t-[2px] border-r-[2px] border-amber-500"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-[2px] border-l-[2px] border-amber-500"></div>
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-[2px] border-r-[2px] border-amber-500"></div>

                <div className="p-3 space-y-2">
                  {onShowHeroSelection && (
                    <FantasyButton
                      fullWidth
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setShowMenu(false);
                        onShowHeroSelection();
                      }}
                    >
                      👤 Change Hero
                    </FantasyButton>
                  )}
                  
                  {onShowLeaderboard ? (
                    <FantasyButton
                      fullWidth
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setShowMenu(false);
                        if (onShowLeaderboard) {
                          onShowLeaderboard();
                        }
                      }}
                    >
                      🏆 Leaderboard
                    </FantasyButton>
                  ) : (
                    <FantasyButton
                      fullWidth
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setShowMenu(false);
                        navigate('/leaderboard');
                      }}
                    >
                      🏆 Leaderboard
                    </FantasyButton>
                  )}

                  <FantasyButton
                    fullWidth
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowMenu(false);
                      navigate('/');
                    }}
                  >
                    🏠 Home
                  </FantasyButton>

                  <div className="border-t border-amber-700/50 my-2"></div>

                  <FantasyButton
                    fullWidth
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setShowMenu(false);
                      handleLogout();
                    }}
                  >
                    🚪 Logout
                  </FantasyButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
