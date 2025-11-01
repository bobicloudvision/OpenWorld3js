import React, { useState, useEffect } from 'react';
import useZoneStore from '../stores/zoneStore';
import { FantasyModal, FantasyButton, FantasyCard, FantasyBadge } from './ui';

/**
 * Zone Selector Component
 * Displays available zones and allows player to travel
 */
export default function ZoneSelector({ socket, playerLevel = 1, onClose, onZoneChange }) {
  const { availableZones, currentZone, setAvailableZones, canEnterZone } = useZoneStore();
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!socket) {
      setError('Socket not connected');
      setLoading(false);
      return;
    }

    console.log('[ZoneSelector] Requesting zone list...');
    
    // Set timeout in case server doesn't respond
    const timeout = setTimeout(() => {
      console.error('[ZoneSelector] Zone list request timed out');
      setError('Server not responding. Make sure zones are created in database.');
      setLoading(false);
    }, 5000);

    // Request zone list
    socket.emit('zone:list', {}, (response) => {
      clearTimeout(timeout);
      console.log('[ZoneSelector] Zone list response:', response);
      
      if (response && response.ok) {
        if (response.zones && response.zones.length > 0) {
          setAvailableZones(response.zones || []);
          setError(null);
        } else {
          setError('No zones found. Please run: php artisan db:seed --class=ZoneSeeder');
        }
      } else {
        setError(response?.error || 'Failed to load zones');
      }
      setLoading(false);
    });
  }, [socket, setAvailableZones]);

  const handleZoneSelect = (zone) => {
    setSelectedZone(zone);
  };

  const handleTravel = () => {
    if (!selectedZone || !socket) return;

    if (!canEnterZone(selectedZone, playerLevel)) {
      alert(`Cannot enter ${selectedZone.name}. Level ${selectedZone.min_level} required.`);
      return;
    }

    // Show transition screen
    useZoneStore.getState().startTransition(`Traveling to ${selectedZone.name}...`);
    
    // Emit zone join request
    socket.emit('zone:join', { zoneId: selectedZone.id }, (response) => {
      // End transition
      useZoneStore.getState().endTransition();
      
      if (response.ok) {
        console.log('[zone] Successfully joined zone:', response.zone.name);
        console.log('[zone] Zone data:', response.zone);
        
        // Notify parent component about zone change
        if (onZoneChange) {
          onZoneChange(response.zone, response.position);
        }
        
        if (onClose) onClose();
      } else {
        alert(`Cannot join zone: ${response.error}`);
      }
    });
  };

  const getZoneTypeColor = (type) => {
    switch (type) {
      case 'neutral': return '#9ca3af';
      case 'pvp': return '#ef4444';
      case 'pve': return '#10b981';
      case 'raid': return '#f59e0b';
      case 'dungeon': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000]">
        <div className="text-center">
          <div className="text-amber-300 text-lg font-bold mb-2" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 15px rgba(217, 119, 6, 0.6)',
          }}>
            Loading zones...
          </div>
          <div className="text-amber-200 text-xs" style={{
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}>
            (Waiting for server response...)
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <FantasyModal isOpen={true} onClose={onClose} maxWidth="600px" className="text-center">
        <div className="p-8">
          <div className="text-6xl mb-4 filter drop-shadow-lg">⚠️</div>
          <h2 className="text-red-400 m-0 mb-4 text-2xl font-bold" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 15px rgba(239, 68, 68, 0.6)',
          }}>
            Zone System Not Set Up
          </h2>
          <p className="text-amber-100 m-0 mb-6 text-base" style={{
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}>
            {error}
          </p>
      
          {onClose && (
            <FantasyButton onClick={onClose} variant="secondary">
              Close
            </FantasyButton>
          )}
        </div>
      </FantasyModal>
    );
  }

  return (
    <FantasyModal isOpen={true} onClose={onClose} title="🗺️ Select Zone" maxWidth="900px">

      {/* Zone Grid */}
      <div className="flex-1 overflow-auto p-6 grid gap-4 content-start" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {availableZones.map((zone) => {
          const isCurrentZone = currentZone?.id === zone.id;
          const canEnter = canEnterZone(zone, playerLevel);
          const isSelected = selectedZone?.id === zone.id;

          return (
            <FantasyCard
              key={zone.id}
              title={zone.name}
              hoverable={canEnter}
              onClick={() => canEnter && handleZoneSelect(zone)}
              className={`relative ${!canEnter ? 'opacity-50 cursor-not-allowed' : ''} ${isSelected ? 'ring-2 ring-amber-500' : ''}`}
            >
              {isCurrentZone && (
                <div className="absolute top-2 right-2 z-20">
                  <FantasyBadge variant="success" size="sm">
                    CURRENT
                  </FantasyBadge>
                </div>
              )}

              {/* Zone Type Indicator */}
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ background: getZoneTypeColor(zone.type) }}
                />
                <FantasyBadge 
                  variant={zone.type === 'pvp' ? 'danger' : zone.type === 'pve' ? 'success' : 'default'} 
                  size="sm"
                >
                  {zone.type.toUpperCase()}
                </FantasyBadge>
              </div>

              <p className="text-amber-200 text-sm mb-4 min-h-[40px]" style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                {zone.description}
              </p>

              <div className="flex flex-col gap-2 text-xs text-amber-300 mb-4">
                <div>Level: <span className="font-bold text-amber-200">{zone.min_level}{zone.max_level ? `-${zone.max_level}` : '+'}</span></div>
                <div>Players: <span className="font-bold text-amber-200">{zone.stats?.playerCount || 0}/{zone.max_players}</span></div>
                {zone.is_safe_zone && (
                  <FantasyBadge variant="success" size="sm" className="w-fit">
                    🛡️ Safe Zone
                  </FantasyBadge>
                )}
                {zone.is_combat_zone && !zone.is_safe_zone && (
                  <FantasyBadge variant="danger" size="sm" className="w-fit"> 
                    ⚔️ Combat Zone
                  </FantasyBadge>
                )}
              </div>

              {!canEnter && (
                <div className="bg-red-900/50 p-2 rounded border border-red-600/50 text-center">
                  <div className="text-red-300 text-xs font-bold" style={{
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}>
                    Level {zone.min_level} Required
                  </div>
                </div>
              )}
            </FantasyCard>
          );
        })}
      </div>

      {/* Footer with Travel Button */}
      <div className="p-5 border-t border-amber-700/60 flex justify-between items-center" style={{
        background: 'linear-gradient(to bottom, rgba(139, 69, 19, 0.2), rgba(101, 67, 33, 0.1))'
      }}>
        <div className="text-amber-200 text-sm" style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
        }}>
          {selectedZone ? (
            <>Selected: <strong className="text-amber-300">{selectedZone.name}</strong></>
          ) : (
            'Select a zone to travel'
          )}
        </div>
        <FantasyButton
          onClick={handleTravel}
          disabled={!selectedZone || selectedZone.id === currentZone?.id}
          variant={selectedZone && selectedZone.id !== currentZone?.id ? 'primary' : 'secondary'}
        >
          Travel
        </FantasyButton>
      </div>
    </FantasyModal>
  );
}

