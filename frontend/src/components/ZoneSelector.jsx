import React, { useState, useEffect } from 'react';
import useZoneStore from '../stores/zoneStore';

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
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{ 
          color: '#e5e7eb', 
          fontSize: '18px',
          textAlign: 'center'
        }}>
          <div>Loading zones...</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
            (Waiting for server response...)
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          background: '#1f2937',
          borderRadius: '16px',
          border: '2px solid #ef4444',
          padding: '32px',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#ef4444', margin: '0 0 16px 0', fontSize: '24px' }}>
            Zone System Not Set Up
          </h2>
          <p style={{ color: '#e5e7eb', margin: '0 0 24px 0', fontSize: '16px' }}>
            {error}
          </p>
          <div style={{
            background: '#111827',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'left',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#10b981'
          }}>
            <div>cd backend-php</div>
            <div>php artisan migrate</div>
            <div>php artisan db:seed --class=ZoneSeeder</div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                background: '#374151',
                color: '#e5e7eb',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#1f2937',
        borderRadius: '16px',
        border: '2px solid #374151',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#e5e7eb', fontSize: '24px' }}>
            🗺️ Select Zone
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Zone Grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '16px',
          alignContent: 'start'
        }}>
          {availableZones.map((zone) => {
            const isCurrentZone = currentZone?.id === zone.id;
            const canEnter = canEnterZone(zone, playerLevel);
            const isSelected = selectedZone?.id === zone.id;

            return (
              <div
                key={zone.id}
                onClick={() => canEnter && handleZoneSelect(zone)}
                style={{
                  background: isSelected ? '#374151' : '#111827',
                  border: `2px solid ${isSelected ? '#3b82f6' : '#374151'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: canEnter ? 'pointer' : 'not-allowed',
                  opacity: canEnter ? 1 : 0.5,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => canEnter && (e.target.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
              >
                {isCurrentZone && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#10b981',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    CURRENT
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: getZoneTypeColor(zone.type)
                  }} />
                  <h3 style={{
                    margin: 0,
                    color: '#e5e7eb',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    {zone.name}
                  </h3>
                </div>

                <p style={{
                  color: '#9ca3af',
                  fontSize: '13px',
                  margin: '0 0 12px 0',
                  minHeight: '40px'
                }}>
                  {zone.description}
                </p>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  <div>Level: {zone.min_level}{zone.max_level ? `-${zone.max_level}` : '+'}</div>
                  <div>Type: {zone.type.toUpperCase()}</div>
                  <div>Players: {zone.stats?.playerCount || 0}/{zone.max_players}</div>
                  {zone.is_safe_zone && (
                    <div style={{ color: '#10b981' }}>🛡️ Safe Zone</div>
                  )}
                  {zone.is_combat_zone && !zone.is_safe_zone && (
                    <div style={{ color: '#ef4444' }}>⚔️ Combat Zone</div>
                  )}
                </div>

                {!canEnter && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    background: '#7f1d1d',
                    borderRadius: '6px',
                    color: '#fca5a5',
                    fontSize: '11px',
                    textAlign: 'center'
                  }}>
                    Level {zone.min_level} Required
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer with Travel Button */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '14px' }}>
            {selectedZone ? (
              <>Selected: <strong style={{ color: '#e5e7eb' }}>{selectedZone.name}</strong></>
            ) : (
              'Select a zone to travel'
            )}
          </div>
          <button
            onClick={handleTravel}
            disabled={!selectedZone || selectedZone.id === currentZone?.id}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: selectedZone && selectedZone.id !== currentZone?.id
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : '#374151',
              color: selectedZone && selectedZone.id !== currentZone?.id ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedZone && selectedZone.id !== currentZone?.id ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            Travel
          </button>
        </div>
      </div>
    </div>
  );
}

