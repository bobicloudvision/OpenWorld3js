import { getPlayerIdBySocket } from '../services/sessionService.js';
import { getPlayerHeroes, getAvailableHeroesToBuy, getHeroById, purchaseHero } from '../services/heroService.js';
import { setActiveHero, getPlayerById } from '../services/playerService.js';

export function registerHeroHandlers(socket) {
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

    const result = purchaseHero(playerId, heroId);
    
    if (result.success) {
      // Get updated player data and refresh heroes
      const player = getPlayerById(playerId);
      const playerHeroes = getPlayerHeroes(playerId);
      const availableHeroes = getAvailableHeroesToBuy(playerId);
      socket.emit('hero:purchase:ok', { 
        player, 
        playerHeroes,
        availableHeroes,
        playerHeroId: result.playerHeroId 
      });
    } else {
      socket.emit('hero:purchase:error', { message: result.error || 'Failed to purchase hero' });
    }
  });
}

