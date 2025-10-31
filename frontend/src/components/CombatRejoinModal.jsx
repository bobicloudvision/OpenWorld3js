import React, { useState } from 'react';
import './CombatRejoinModal.css';

/**
 * Combat Rejoin Modal
 * Shows when player refreshes/reconnects and has an active combat session
 */
const CombatRejoinModal = ({ combatInfo, onRejoin, onDecline }) => {
  const [isRejoining, setIsRejoining] = useState(false);

  if (!combatInfo) return null;

  const handleRejoin = async () => {
    setIsRejoining(true);
    try {
      await onRejoin(combatInfo);
    } catch (error) {
      console.error('Error rejoining combat:', error);
      setIsRejoining(false);
    }
  };

  const handleDecline = () => {
    if (confirm('Are you sure? Declining will abandon the combat match.')) {
      onDecline();
    }
  };

  // Calculate combat duration
  const duration = Math.floor((Date.now() - combatInfo.startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  // Determine combat type label
  const getCombatTypeLabel = () => {
    if (combatInfo.isMatchmaking) {
      return 'Matchmaking Battle';
    }
    switch (combatInfo.combatType) {
      case 'pvp': return 'PvP Combat';
      case 'pve': return 'PvE Combat';
      case 'team_pvp': return 'Team PvP';
      case 'team_pve': return 'Team PvE';
      default: return 'Combat';
    }
  };

  return (
    <div className="combat-rejoin-overlay">
      <div className="combat-rejoin-modal">
        <div className="combat-rejoin-header">
          <h2>⚔️ Active Combat Detected</h2>
          <p className="combat-rejoin-subtitle">
            You have an ongoing combat session
          </p>
        </div>

        <div className="combat-rejoin-content">
          <div className="combat-info-card">
            <div className="combat-info-row">
              <span className="combat-info-label">Type:</span>
              <span className="combat-info-value">{getCombatTypeLabel()}</span>
            </div>

            <div className="combat-info-row">
              <span className="combat-info-label">Duration:</span>
              <span className="combat-info-value">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>

            <div className="combat-info-row">
              <span className="combat-info-label">Players:</span>
              <span className="combat-info-value">
                {combatInfo.participants?.players?.length || 0}
              </span>
            </div>

            {combatInfo.playerState && (
              <>
                <div className="combat-info-row">
                  <span className="combat-info-label">Health:</span>
                  <span className="combat-info-value health">
                    {combatInfo.playerState.health} / {combatInfo.playerState.maxHealth}
                  </span>
                </div>

                <div className="combat-info-row">
                  <span className="combat-info-label">Power:</span>
                  <span className="combat-info-value power">
                    {combatInfo.playerState.power} / {combatInfo.playerState.maxPower}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="combat-rejoin-warning">
            <p>
              ⚠️ You were disconnected from combat. You can rejoin within the grace period.
            </p>
          </div>
        </div>

        <div className="combat-rejoin-actions">
          <button
            className="combat-rejoin-btn combat-rejoin-btn-primary"
            onClick={handleRejoin}
            disabled={isRejoining}
          >
            {isRejoining ? '⏳ Rejoining...' : '✅ Rejoin Combat'}
          </button>
          <button
            className="combat-rejoin-btn combat-rejoin-btn-secondary"
            onClick={handleDecline}
            disabled={isRejoining}
          >
            ❌ Decline (Abandon)
          </button>
        </div>

        <div className="combat-rejoin-footer">
          <small>
            Declining will count as abandoning the match
          </small>
        </div>
      </div>
    </div>
  );
};

export default CombatRejoinModal;

