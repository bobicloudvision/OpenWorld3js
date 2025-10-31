import { getPlayerIdBySocket } from '../services/sessionService.js';
import { getPlayerHeroes, getAvailableHeroesToBuy, getHeroById, purchaseHero } from '../services/heroService.js';
import { setActiveHero, getPlayerById } from '../services/playerService.js';
import { updatePlayerHeroInGameSession } from '../services/multiplayerService.js';
import { getPlayerCombatState } from '../services/combatService.js';

export function registerHeroHandlers(socket, io) {
  /**
   * Get all heroes owned by the authenticated player
   * Emits: 'player:heroes' with array of player hero objects
   */
  socket.on('get:player:heroes', () => {
    const playerId = getPlayerIdBySocket(socket.id);
    if (!playerId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }
    const heroes = getPlayerHeroes(playerId);
    socket.emit('player:heroes', heroes);
  });

  /**
   * Get all heroes available to purchase for the authenticated player
   * Emits: 'heroes:available' with array of hero objects
   */
  socket.on('get:heroes:available', () => {
    const playerId = getPlayerIdBySocket(socket.id);
    if (!playerId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }
    const heroes = getAvailableHeroesToBuy(playerId);
    socket.emit('heroes:available', heroes);
  });

  /**
   * Get a specific hero by ID
   * Payload: { heroId: number }
   * Emits: 'hero' with hero object or null
   */
  socket.on('get:hero', (payload) => {
    const heroId = payload?.heroId;
    if (!heroId || typeof heroId !== 'number') {
      socket.emit('error', { message: 'Invalid heroId' });
      return;
    }
    const hero = getHeroById(heroId);
    socket.emit('hero', hero || null);
  });

  /**
   * Set active hero for the authenticated player
   * Payload: { playerHeroId: number }
   * Emits: 'hero:set:active:ok' or 'hero:set:active:error'
   */
  socket.on('set:active:hero', (payload) => {
    const playerId = getPlayerIdBySocket(socket.id);
    if (!playerId) {
      socket.emit('hero:set:active:error', { message: 'Not authenticated' });
      return;
    }
    
    // Check if player is in active combat
    const combatState = getPlayerCombatState(playerId);
    if (combatState && combatState.combatInstanceId) {
      socket.emit('hero:set:active:error', { message: 'Cannot change hero during active combat' });
      return;
    }
    
    const playerHeroId = payload?.playerHeroId;
    if (!playerHeroId || typeof playerHeroId !== 'number') {
      socket.emit('hero:set:active:error', { message: 'Invalid playerHeroId' });
      return;
    }

    const success = setActiveHero(playerId, playerHeroId);
    
    if (success) {
      // Get updated player data
      const player = getPlayerById(playerId);
      socket.emit('hero:set:active:ok', { player });
      
      // Get player's hero data to send multiplayer update
      const playerHeroes = getPlayerHeroes(playerId);
      const activeHero = player.active_hero_id
        ? playerHeroes.find(ph => ph.playerHeroId === player.active_hero_id)
        : null;
      
      // Update multiplayer session and notify other players
      if (activeHero) {
        const heroData = {
          activeHeroId: player.active_hero_id,
          heroModel: activeHero.model || null,
          heroModelScale: activeHero.modelScale || 1,
          heroModelRotation: activeHero.modelRotation || [0, 0, 0],
        };
        
        // Update in multiplayer session
        updatePlayerHeroInGameSession(socket.id, heroData);
        
        // Broadcast to all other players
        socket.broadcast.emit('player:hero:changed', {
          socketId: socket.id,
          ...heroData,
        });
      }
    } else {
      socket.emit('hero:set:active:error', { message: 'Failed to set active hero' });
    }
  });

  /**
   * Purchase a hero for the authenticated player
   * Payload: { heroId: number }
   * Emits: 'hero:purchase:ok' or 'hero:purchase:error'
   */
  socket.on('purchase:hero', (payload) => {
    const playerId = getPlayerIdBySocket(socket.id);
    if (!playerId) {
      socket.emit('hero:purchase:error', { message: 'Not authenticated' });
      return;
    }
    
    const heroId = payload?.heroId;
    if (!heroId || typeof heroId !== 'number') {
      socket.emit('hero:purchase:error', { message: 'Invalid heroId' });
      return;
    }

    // Get player data before purchase to check if they had an active hero
    const playerBeforePurchase = getPlayerById(playerId);
    const hadActiveHero = !!playerBeforePurchase?.active_hero_id;
    
    const result = purchaseHero(playerId, heroId);
    
    if (result.success) {
      // Get updated player data and refresh heroes
      const player = getPlayerById(playerId);
      const playerHeroes = getPlayerHeroes(playerId);
      const availableHeroes = getAvailableHeroesToBuy(playerId);
      
      // If player had no active hero and just purchased their first hero, set it as active
      if (!hadActiveHero && result.playerHeroId) {
        setActiveHero(playerId, result.playerHeroId);
        // Refresh player data after setting active hero
        const updatedPlayer = getPlayerById(playerId);
        if (updatedPlayer) {
          player.active_hero_id = updatedPlayer.active_hero_id;
        }
      }
      
      socket.emit('hero:purchase:ok', { 
        player, 
        playerHeroes,
        availableHeroes,
        playerHeroId: result.playerHeroId 
      });
      
      // If hero was set as active (first hero or explicit selection), notify other players
      if (player.active_hero_id) {
        const activeHero = playerHeroes.find(ph => ph.playerHeroId === player.active_hero_id);
        if (activeHero) {
          const heroData = {
            activeHeroId: player.active_hero_id,
            heroModel: activeHero.model || null,
            heroModelScale: activeHero.modelScale || 1,
            heroModelRotation: activeHero.modelRotation || [0, 0, 0],
          };
          
          // Update in multiplayer session
          updatePlayerHeroInGameSession(socket.id, heroData);
          
          // Broadcast to all other players
          socket.broadcast.emit('player:hero:changed', {
            socketId: socket.id,
            ...heroData,
          });
        }
      }
    } else {
      socket.emit('hero:purchase:error', { message: result.error || 'Failed to purchase hero' });
    }
  });
}

