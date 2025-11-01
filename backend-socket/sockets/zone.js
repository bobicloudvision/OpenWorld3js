import * as zoneService from '../services/zoneService.js';
import { getPlayerIdBySocket } from '../services/sessionService.js';
import { getSocketIdByPlayerId, getPlayerInGameSession } from '../services/multiplayerService.js';

/**
 * Zone Socket Handlers
 * Handles zone transitions, portal usage, and zone queries
 */

export function registerZoneHandlers(socket, io) {
  
  /**
   * Get all available zones
   */
  socket.on('zone:list', async (data, ack) => {
    try {
      console.log('[zone] zone:list request received');
      const zones = await zoneService.getActiveZones();
      console.log('[zone] Found zones:', zones.length);
      
      // Add real-time player counts
      const zonesWithStats = zones.map(zone => ({
        ...zone,
        stats: zoneService.getZoneStats(zone.id)
      }));
      
      if (ack) {
        ack({ ok: true, zones: zonesWithStats });
      } else {
        socket.emit('zone:list', zonesWithStats);
      }
    } catch (error) {
      console.error('[zone] Error listing zones:', error);
      if (ack) ack({ ok: false, error: error.message });
    }
  });

  /**
   * Get zone details
   */
  socket.on('zone:get', async ({ zoneId, slug }, ack) => {
    try {
      const zone = zoneId 
        ? await zoneService.getZoneById(zoneId)
        : await zoneService.getZoneBySlug(slug);
      
      if (!zone) {
        if (ack) return ack({ ok: false, error: 'Zone not found' });
        return;
      }

      const portals = await zoneService.getZonePortals(zone.id);
      const stats = zoneService.getZoneStats(zone.id);
      
      if (ack) {
        ack({ 
          ok: true, 
          zone: { ...zone, portals, stats }
        });
      }
    } catch (error) {
      console.error('[zone] Error getting zone:', error);
      if (ack) ack({ ok: false, error: error.message });
    }
  });

  /**
   * Join a zone
   */
  socket.on('zone:join', async ({ zoneId, position }, ack) => {
    try {
      const playerId = getPlayerIdBySocket(socket.id);
      
      if (!playerId) {
        console.error('[zone] No playerId for socket:', socket.id);
        if (ack) return ack({ ok: false, error: 'Not authenticated' });
        return;
      }

      console.log('[zone] Player', playerId, 'attempting to join zone', zoneId);

      // Get player data from database
      const [player] = await zoneService.getPlayerById(playerId);
      if (!player) {
        console.error('[zone] Player not found in database:', playerId);
        if (ack) return ack({ ok: false, error: 'Player not found' });
        return;
      }

      // Check if player can enter
      const check = await zoneService.canPlayerEnterZone(player, zoneId);
      if (!check.allowed) {
        console.log('[zone] Player cannot enter zone:', check.reason);
        if (ack) return ack({ ok: false, error: check.reason });
        return;
      }

      // Get current zone
      const currentZoneId = zoneService.getPlayerZone(playerId);
      
      // Leave current zone room
      if (currentZoneId) {
        socket.leave(`zone-${currentZoneId}`);
        await zoneService.removePlayerFromZone(playerId, currentZoneId);
        
        // Notify others in old zone
        io.to(`zone-${currentZoneId}`).emit('player:left', { 
          socketId: socket.id,
          playerId 
        });
      }

      // Join new zone
      const { zone, position: spawnPosition } = await zoneService.addPlayerToZone(
        playerId, 
        zoneId, 
        position
      );
      
      // Join socket room for this zone
      socket.join(`zone-${zoneId}`);
      
      // Notify socket about zone change (for position tracking reset)
      socket.emit('zone:changed', { zoneId, position: spawnPosition });
      
      // Get portals for this zone
      const portals = await zoneService.getZonePortals(zoneId);
      
      // Get other players in zone with their socket IDs
      const playersInZone = zoneService.getPlayersInZone(zoneId)
        .filter(p => p.playerId !== playerId)
        .map(p => {
          const playerSocketId = getSocketIdByPlayerId(p.playerId);
          const playerData = playerSocketId ? getPlayerInGameSession(playerSocketId) : null;
          return playerData || {
            socketId: null,
            playerId: p.playerId,
            position: p.position,
            rotation: [0, 0, 0],
            name: `Player ${p.playerId}`,
          };
        })
        .filter(p => p.socketId !== null); // Only include players with active connections
      
      // Notify others in new zone
      socket.to(`zone-${zoneId}`).emit('player:joined', {
        socketId: socket.id,
        playerId: player.id,
        name: player.name,
        position: spawnPosition,
        rotation: [0, 0, 0],
        heroModel: player.heroModel || null,
        heroModelScale: player.heroModelScale || null,
        heroModelRotation: player.heroModelRotation || null
      });
      
      console.log(`[zone] Player ${playerId} joined zone ${zoneId} (${zone.name})`);
      
      if (ack) {
        ack({ 
          ok: true, 
          zone: { ...zone, portals },
          position: spawnPosition,
          playersInZone
        });
      }
    } catch (error) {
      console.error('[zone] Error joining zone:', error);
      if (ack) ack({ ok: false, error: error.message });
    }
  });

  /**
   * Leave current zone
   */
  socket.on('zone:leave', async (data, ack) => {
    try {
      const playerId = getPlayerIdBySocket(socket.id);
      if (!playerId) {
        if (ack) return ack({ ok: false, error: 'Not authenticated' });
        return;
      }
      
      const currentZoneId = zoneService.getPlayerZone(playerId);
      
      if (currentZoneId) {
        socket.leave(`zone-${currentZoneId}`);
        await zoneService.removePlayerFromZone(playerId, currentZoneId);
        
        // Notify others
        io.to(`zone-${currentZoneId}`).emit('player:left', { 
          socketId: socket.id,
          playerId 
        });
        
        console.log(`[zone] Player ${playerId} left zone ${currentZoneId}`);
      }
      
      if (ack) ack({ ok: true });
    } catch (error) {
      console.error('[zone] Error leaving zone:', error);
      if (ack) ack({ ok: false, error: error.message });
    }
  });

  /**
   * Use a portal to travel to another zone
   */
  socket.on('zone:portal:use', async ({ portalId }, ack) => {
    try {
      const playerId = getPlayerIdBySocket(socket.id);
      
      if (!playerId) {
        if (ack) return ack({ ok: false, error: 'Not authenticated' });
        return;
      }

      const currentZoneId = zoneService.getPlayerZone(playerId);
      if (!currentZoneId) {
        if (ack) return ack({ ok: false, error: 'Not in any zone' });
        return;
      }

      // Get player data
      const [player] = await zoneService.getPlayerById(playerId);
      if (!player) {
        if (ack) return ack({ ok: false, error: 'Player not found' });
        return;
      }

      // Get portal details
      const portals = await zoneService.getZonePortals(currentZoneId);
      const portal = portals.find(p => p.id === portalId);
      
      if (!portal) {
        if (ack) return ack({ ok: false, error: 'Portal not found' });
        return;
      }

      // Check level requirement
      const playerLevel = player.active_hero?.level || 1;
      if (playerLevel < portal.min_level_required) {
        if (ack) return ack({ 
          ok: false, 
          error: `Level ${portal.min_level_required} required` 
        });
        return;
      }

      // Transfer to destination zone
      const destinationPosition = JSON.parse(portal.destination_position);
      const result = await zoneService.transferPlayerToZone(
        playerId,
        currentZoneId,
        portal.to_zone_id,
        destinationPosition
      );

      // Leave old zone room
      socket.leave(`zone-${currentZoneId}`);
      io.to(`zone-${currentZoneId}`).emit('player:left', { 
        socketId: socket.id,
        playerId 
      });
      
      // Join new zone room
      socket.join(`zone-${portal.to_zone_id}`);
      
      // Get portals for destination zone
      const destinationPortals = await zoneService.getZonePortals(portal.to_zone_id);
      
      // Notify players in new zone
      socket.to(`zone-${portal.to_zone_id}`).emit('player:joined', {
        socketId: socket.id,
        playerId: player.id,
        name: player.name,
        position: result.position,
        rotation: [0, 0, 0],
        heroModel: player.heroModel || null,
        heroModelScale: player.heroModelScale || null,
        heroModelRotation: player.heroModelRotation || null
      });
      
      console.log(`[zone] Player ${playerId} used portal ${portalId} to zone ${portal.to_zone_id}`);
      
      if (ack) {
        ack({ 
          ok: true, 
          zone: { ...result.zone, portals: destinationPortals },
          position: result.position
        });
      }
    } catch (error) {
      console.error('[zone] Error using portal:', error);
      if (ack) ack({ ok: false, error: error.message });
    }
  });

  /**
   * Get portals in current zone
   */
  socket.on('zone:portals', async (data, ack) => {
    try {
      const playerId = getPlayerIdBySocket(socket.id);
      if (!playerId) {
        if (ack) return ack({ ok: false, error: 'Not authenticated' });
        return;
      }
      
      const currentZoneId = zoneService.getPlayerZone(playerId);
      
      if (!currentZoneId) {
        if (ack) return ack({ ok: false, error: 'Not in any zone' });
        return;
      }

      const portals = await zoneService.getZonePortals(currentZoneId);
      
      if (ack) {
        ack({ ok: true, portals });
      }
    } catch (error) {
      console.error('[zone] Error getting portals:', error);
      if (ack) ack({ ok: false, error: error.message });
    }
  });

  /**
   * Get zone statistics
   */
  socket.on('zone:stats', (data, ack) => {
    try {
      const stats = zoneService.getAllZoneStats();
      
      if (ack) {
        ack({ ok: true, stats });
      }
    } catch (error) {
      console.error('[zone] Error getting stats:', error);
      if (ack) ack({ ok: false, error: error.message });
    }
  });

  /**
   * Cleanup when player disconnects
   */
  socket.on('disconnect', async () => {
    try {
      const playerId = getPlayerIdBySocket(socket.id);
      if (!playerId) return;
      
      const currentZoneId = zoneService.getPlayerZone(playerId);
      
      if (currentZoneId) {
        await zoneService.removePlayerFromZone(playerId, currentZoneId);
        io.to(`zone-${currentZoneId}`).emit('player:left', { 
          socketId: socket.id,
          playerId 
        });
        console.log(`[zone] Player ${playerId} removed from zone ${currentZoneId} (disconnect)`);
      }
    } catch (error) {
      console.error('[zone] Error on disconnect cleanup:', error);
    }
  });
}

