/**
 * Consumable Socket Handlers
 * Handles food, potions, and other consumable items
 */

import { getPlayerIdBySocket } from '../services/sessionService.js';
import {
  getAllConsumables,
  useConsumable,
  completeChanneling,
  cancelChanneling,
  getConsumableState
} from '../services/consumableService.js';

/**
 * Register consumable socket handlers
 * @param {Socket} socket - The socket instance
 * @param {Server} io - The Socket.IO server instance
 */
export function registerConsumableHandlers(socket, io) {
  const playerId = getPlayerIdBySocket(socket.id);
  if (!playerId) {
    return; // Player not authenticated
  }

  /**
   * Get list of all consumables
   */
  socket.on('consumable:list', () => {
    const consumables = getAllConsumables();
    socket.emit('consumable:list', consumables);
  });

  /**
   * Use a consumable
   */
  socket.on('consumable:use', (data) => {
    const { consumableId } = data;
    
    if (!consumableId) {
      socket.emit('consumable:error', { message: 'Consumable ID required' });
      return;
    }
    
    const result = useConsumable(playerId, consumableId);
    
    if (!result.success) {
      socket.emit('consumable:error', { message: result.error });
      return;
    }
    
    // Instant consumable
    if (result.instant) {
      socket.emit('consumable:used', result);
      console.log(`[consumable] Player ${playerId} used ${result.consumableName}: +${result.healthRestored} HP, +${result.powerRestored} Power`);
      return;
    }
    
    // Channeled consumable - start channeling
    socket.emit('consumable:channeling-started', result);
    console.log(`[consumable] Player ${playerId} started channeling ${result.consumableName} (${result.castTime}ms)`);
    
    // Auto-complete after cast time (client should also track this)
    setTimeout(() => {
      const completeResult = completeChanneling(playerId);
      if (completeResult.success) {
        socket.emit('consumable:channeling-completed', completeResult);
        console.log(`[consumable] Player ${playerId} completed ${completeResult.consumableName}: +${completeResult.healthRestored} HP, +${completeResult.powerRestored} Power`);
      }
    }, result.castTime);
  });

  /**
   * Cancel channeling
   */
  socket.on('consumable:cancel', () => {
    const result = cancelChanneling(playerId);
    
    if (result.success) {
      socket.emit('consumable:channeling-cancelled', result);
      console.log(`[consumable] Player ${playerId} cancelled channeling ${result.consumableId}`);
    } else {
      socket.emit('consumable:error', { message: result.error });
    }
  });

  /**
   * Get current consumable state
   */
  socket.on('consumable:get-state', () => {
    const state = getConsumableState(playerId);
    socket.emit('consumable:state', state);
  });
}

