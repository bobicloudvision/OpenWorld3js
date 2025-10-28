import { create } from "zustand"
import { persist } from "zustand/middleware"

// Magic types and their properties
const MAGIC_TYPES = {
  fire: {
    name: 'Fireball',
    damage: 25,
    powerCost: 20,
    cooldown: 2000, // 2 seconds
    color: '#ff4444',
    description: 'A powerful fire projectile',
    range: 15, // Maximum range
    icon: '🔥'
  },
  ice: {
    name: 'Ice Shard',
    damage: 20,
    powerCost: 15,
    cooldown: 1500, // 1.5 seconds
    color: '#44aaff',
    description: 'Freezing ice projectile',
    range: 12,
    icon: '❄️'
  },
  lightning: {
    name: 'Lightning Bolt',
    damage: 30,
    powerCost: 25,
    cooldown: 3000, // 3 seconds
    color: '#ffff44',
    description: 'Fast lightning attack',
    range: 20,
    icon: '⚡'
  },
  heal: {
    name: 'Heal',
    damage: -30, // Negative damage = healing
    powerCost: 30,
    cooldown: 4000, // 4 seconds
    color: '#44ff44',
    description: 'Restore health',
    range: 8, // Heal range
    icon: '💚'
  },
  meteor: {
    name: 'Meteor',
    damage: 50,
    powerCost: 40,
    cooldown: 5000, // 5 seconds
    color: '#ff8800',
    description: 'Devastating meteor strike',
    range: 25,
    icon: '☄️'
  },
  shield: {
    name: 'Magic Shield',
    damage: 0,
    powerCost: 25,
    cooldown: 3000,
    color: '#8888ff',
    description: 'Protective barrier',
    range: 5,
    icon: '🛡️'
  }
}

const useGameStore = create(
  persist(
    (set, get) => ({
      // Player stats
      player: {
        health: 100,
        maxHealth: 100,
        power: 100,
        maxPower: 100,
        attack: 15,
        defense: 5,
        level: 1,
        experience: 0,
        selectedMagic: 'fire',
        magicCooldowns: {
          fire: 0,
          ice: 0,
          lightning: 0,
          heal: 0,
          meteor: 0,
          shield: 0
        }
      },
      
      // Enemy stats
      enemies: [
        {
          id: 1,
          name: 'Goblin Warrior',
          health: 60,
          maxHealth: 60,
          power: 50,
          maxPower: 50,
          attack: 12,
          defense: 3,
          position: [30, 1, 30],
          alive: true,
          type: 'melee',
          magicTypes: ['fire'],
          lastAttack: 0,
          attackCooldown: 2000
        },
        {
          id: 2,
          name: 'Dark Mage',
          health: 40,
          maxHealth: 40,
          power: 80,
          maxPower: 80,
          attack: 8,
          defense: 2,
          position: [-30, 1, -30],
          alive: true,
          type: 'caster',
          magicTypes: ['ice', 'lightning'],
          lastAttack: 0,
          attackCooldown: 3000
        },
        {
          id: 3,
          name: 'Orc Berserker',
          health: 120,
          maxHealth: 120,
          power: 30,
          maxPower: 30,
          attack: 20,
          defense: 8,
          position: [0, 1, 40],
          alive: true,
          type: 'tank',
          magicTypes: [],
          lastAttack: 0,
          attackCooldown: 1500
        },
        {
          id: 4,
          name: 'Test Enemy',
          health: 50,
          maxHealth: 50,
          power: 30,
          maxPower: 30,
          attack: 5,
          defense: 1,
          position: [25, 1, 25],
          alive: true,
          type: 'melee',
          magicTypes: [],
          lastAttack: 0,
          attackCooldown: 2000
        }
      ],
      
      // Game state
      gameState: 'playing', // 'playing', 'victory', 'defeat'
      combatLog: [],
      
      // Magic system
      magicTypes: MAGIC_TYPES,
      castingMode: false, // Whether player is in casting mode
      targetPosition: null, // Where magic will be cast
      
      // Player actions
      castMagic: (magicType, targetId = null) => {
        const state = get()
        const player = state.player
        const magic = MAGIC_TYPES[magicType]
        const now = Date.now()
        
        // Check cooldown
        if (now - player.magicCooldowns[magicType] < magic.cooldown) {
          return { success: false, message: `${magic.name} is on cooldown` }
        }
        
        // Check power
        if (player.power < magic.powerCost) {
          return { success: false, message: 'Not enough power' }
        }
        
        // Cast magic
        set((state) => ({
          player: {
            ...state.player,
            power: Math.max(0, state.player.power - magic.powerCost),
            magicCooldowns: {
              ...state.player.magicCooldowns,
              [magicType]: now
            }
          }
        }))
        
        return { success: true, magic, damage: magic.damage }
      },
      
      // New click-to-cast system
      castMagicAtPosition: (magicType, targetPosition, playerPosition) => {
        const state = get()
        const player = state.player
        const magic = MAGIC_TYPES[magicType]
        const now = Date.now()
        
        // Check cooldown
        if (now - player.magicCooldowns[magicType] < magic.cooldown) {
          return { success: false, message: `${magic.name} is on cooldown` }
        }
        
        // Check power
        if (player.power < magic.powerCost) {
          return { success: false, message: 'Not enough power' }
        }
        
        // Check range
        const distance = Math.sqrt(
          Math.pow(targetPosition[0] - playerPosition[0], 2) +
          Math.pow(targetPosition[2] - playerPosition[2], 2)
        )
        
        if (distance > magic.range) {
          return { success: false, message: `Target is too far! Range: ${magic.range}m` }
        }
        
        // Cast magic
        set((state) => ({
          player: {
            ...state.player,
            power: Math.max(0, state.player.power - magic.powerCost),
            magicCooldowns: {
              ...state.player.magicCooldowns,
              [magicType]: now
            }
          }
        }))
        
        return { 
          success: true, 
          magic, 
          damage: magic.damage, 
          targetPosition,
          range: magic.range 
        }
      },
      
      // Enter casting mode
      enterCastingMode: (magicType) => {
        set({ 
          castingMode: true,
          player: { ...get().player, selectedMagic: magicType }
        })
      },
      
      // Exit casting mode
      exitCastingMode: () => {
        set({ 
          castingMode: false,
          targetPosition: null
        })
      },
      
      // Set target position for casting
      setTargetPosition: (position) => {
        set({ targetPosition: position })
      },
      
      // Attack enemy
      attackEnemy: (enemyId, damage) => {
        set((state) => ({
          enemies: state.enemies.map(enemy => 
            enemy.id === enemyId 
              ? { 
                  ...enemy, 
                  health: Math.max(0, enemy.health - damage),
                  alive: enemy.health - damage > 0
                }
              : enemy
          ),
          combatLog: [
            ...state.combatLog.slice(-9), // Keep last 10 messages
            { 
              type: 'attack', 
              message: `Player deals ${damage} damage to enemy ${enemyId}`,
              timestamp: Date.now()
            }
          ]
        }))
        
        // Check if enemy died
        const enemy = get().enemies.find(e => e.id === enemyId)
        if (enemy && enemy.health - damage <= 0) {
          set((state) => ({
            combatLog: [
              ...state.combatLog.slice(-9),
              { 
                type: 'victory', 
                message: `Enemy ${enemyId} defeated!`,
                timestamp: Date.now()
              }
            ]
          }))
        }
      },
      
      // Enemy attack player
      enemyAttackPlayer: (enemyId, damage) => {
        console.log(`enemyAttackPlayer called: Enemy ${enemyId} dealing ${damage} damage`)
        set((state) => ({
          player: {
            ...state.player,
            health: Math.max(0, state.player.health - damage)
          },
          combatLog: [
            ...state.combatLog.slice(-9),
            { 
              type: 'damage', 
              message: `Enemy ${enemyId} deals ${damage} damage to player`,
              timestamp: Date.now()
            }
          ]
        }))
      },
      
      // Heal player
      healPlayer: (amount) => {
        set((state) => ({
          player: {
            ...state.player,
            health: Math.min(state.player.maxHealth, state.player.health + amount)
          },
          combatLog: [
            ...state.combatLog.slice(-9),
            { 
              type: 'heal', 
              message: `Player heals for ${amount} HP`,
              timestamp: Date.now()
            }
          ]
        }))
      },
      
      // Regenerate power over time
      regeneratePower: () => {
        set((state) => ({
          player: {
            ...state.player,
            power: Math.min(state.player.maxPower, state.player.power + 1)
          }
        }))
      },
      
      // Set selected magic
      setSelectedMagic: (magicType) => {
        set({ player: { ...get().player, selectedMagic: magicType } })
      },
      
      // Check game state
      checkGameState: () => {
        const state = get()
        const aliveEnemies = state.enemies.filter(e => e.alive)
        
        if (state.player.health <= 0) {
          set({ gameState: 'defeat' })
        } else if (aliveEnemies.length === 0) {
          set({ gameState: 'victory' })
        }
      },
      
      // Reset game
      resetGame: () => {
        set({
          player: {
            health: 100,
            maxHealth: 100,
            power: 100,
            maxPower: 100,
            attack: 15,
            defense: 5,
            level: 1,
            experience: 0,
            selectedMagic: 'fire',
            magicCooldowns: {
              fire: 0,
              ice: 0,
              lightning: 0,
              heal: 0
            }
          },
          enemies: [
            {
              id: 1,
              name: 'Goblin Warrior',
              health: 60,
              maxHealth: 60,
              power: 50,
              maxPower: 50,
              attack: 12,
              defense: 3,
              position: [30, 1, 30],
              alive: true,
              type: 'melee',
              magicTypes: ['fire'],
              lastAttack: 0,
              attackCooldown: 2000
            },
            {
              id: 2,
              name: 'Dark Mage',
              health: 40,
              maxHealth: 40,
              power: 80,
              maxPower: 80,
              attack: 8,
              defense: 2,
              position: [-30, 1, -30],
              alive: true,
              type: 'caster',
              magicTypes: ['ice', 'lightning'],
              lastAttack: 0,
              attackCooldown: 3000
            },
            {
              id: 3,
              name: 'Orc Berserker',
              health: 120,
              maxHealth: 120,
              power: 30,
              maxPower: 30,
              attack: 20,
              defense: 8,
              position: [0, 1, 40],
              alive: true,
              type: 'tank',
              magicTypes: [],
              lastAttack: 0,
              attackCooldown: 1500
            },
            {
              id: 4,
              name: 'Test Enemy',
              health: 50,
              maxHealth: 50,
              power: 30,
              maxPower: 30,
              attack: 5,
              defense: 1,
              position: [25, 1, 25],
              alive: true,
              type: 'melee',
              magicTypes: [],
              lastAttack: 0,
              attackCooldown: 2000
            }
          ],
          gameState: 'playing',
          combatLog: []
        })
      }
    }),
    {
      name: "ow3-game", // localStorage key
      partialize: (state) => ({ 
        player: state.player,
        enemies: state.enemies,
        gameState: state.gameState
      }),
    }
  )
)

export default useGameStore

// Clear localStorage if player is defeated (for debugging)
if (typeof window !== 'undefined') {
  const savedState = localStorage.getItem('ow3-game')
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      if (parsed.state?.player?.health <= 0) {
        console.log('Clearing defeated game state from localStorage')
        localStorage.removeItem('ow3-game')
      }
    } catch (e) {
      console.log('Error parsing saved state, clearing localStorage')
      localStorage.removeItem('ow3-game')
    }
  }
}
