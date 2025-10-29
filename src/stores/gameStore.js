import { create } from "zustand"
import { persist } from "zustand/middleware"

// Initial enemies configuration
const INITIAL_ENEMIES = [
  {
    id: 1,
    name: 'Goblin Warrior', 
    health: 60,
    maxHealth: 60,
    power: 50,
    maxPower: 50,
    attack: 12,
    defense: 3,
    position: [0, -10, 0],
    alive: true,
    type: 'melee',
    magicTypes: ['fire'],
    lastAttack: 0,
    attackCooldown: 2000,
    statusEffects: [],
    model: '/models/avatars/GanfaulMAure.glb',
    modelScale:1,
    modelRotation: [0, -Math.PI / 2, 0]
  }, 
  // {
  //   id: 2,
  //   name: 'Dark Mage',
  //   health: 40,
  //   maxHealth: 40,
  //   power: 80,
  //   maxPower: 80,
  //   attack: 8,
  //   defense: 2,
  //   position: [0, 0,0],
  //   alive: true,
  //   type: 'caster',
  //   magicTypes: ['ice', 'lightning'],
  //   lastAttack: 0,
  //   attackCooldown: 3000,
  //   statusEffects: [],
  //   model: '/models/avatars/NightshadeJFriedrich.glb',
  //   modelScale: 1,
  //   modelRotation: [0, -Math.PI / 2, 0]
  // },
  // {
  //   id: 3,
  //   name: 'Orc Berserker',
  //   health: 120,
  //   maxHealth: 120,
  //   power: 30,
  //   maxPower: 30,
  //   attack: 20,
  //   defense: 8,
  //   position: [0,0, 0],
  //   alive: true,
  //   type: 'tank',
  //   magicTypes: [],
  //   lastAttack: 0,
  //   attackCooldown: 1500,
  //   statusEffects: [],
  //   model: '/models/avatars/WarrokWKurniawan.glb',
  //   modelScale: 1,
  //   modelRotation: [0, -Math.PI / 2, 0]
  // },
  // {
  //   id: 4,
  //   name: 'Mutant',
  //   health: 50,
  //   maxHealth: 50,
  //   power: 30,
  //   maxPower: 30,
  //   attack: 5,
  //   defense: 1,
  //   position: [0, 0, 0],
  //   alive: true,
  //   type: 'melee',
  //   magicTypes: [],
  //   lastAttack: 0,
  //   attackCooldown: 2000,
  //   statusEffects: [],
  //   model: '/models/avatars/Mutant.glb',
  //   modelScale: 1,
  //   modelRotation: [0, -Math.PI / 2, 0]
  // }
]

// Helper function to create a deep copy of enemies
const getInitialEnemies = () => JSON.parse(JSON.stringify(INITIAL_ENEMIES))

// Magic types and their properties
const MAGIC_TYPES = {
  fire: {
    name: 'Fireball',
    damage: 25,
    powerCost: 20,
    cooldown: 2000, // 2 seconds
    color: '#ff4444',
    description: 'A powerful fire projectile',
    range: 15, // Maximum casting range
    affectRange: 2, // Area of effect radius
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
    affectRange: 1.5, // Small AoE
    icon: '❄️'
  },
  freeze: {
    name: 'Deep Freeze',
    damage: 10,
    powerCost: 25,
    cooldown: 10000, // 10 seconds
    color: '#00ffff',
    description: 'Freezes enemy in place',
    range: 10,
    affectRange: 3, // Freezes enemies in small area
    icon: '🧊',
    statusEffect: {
      type: 'freeze',
      duration: 10000 // 10 seconds frozen
    }
  },
  blizzard: {
    name: 'Blizzard',
    damage: 20,
    powerCost: 50,
    cooldown: 15000, // 15 seconds
    color: '#88ddff',
    description: 'Massive freeze storm',
    range: 25,
    affectRange: 8, // Large AoE storm
    icon: '❄️',
    statusEffect: {
      type: 'freeze',
      duration: 8000 // 8 seconds frozen
    }
  },
  lightning: {
    name: 'Lightning Bolt',
    damage: 30,
    powerCost: 25,
    cooldown: 3000, // 3 seconds
    color: '#ffff44',
    description: 'Fast lightning attack',
    range: 20,
    affectRange: 2, // Small shock radius
    icon: '⚡'
  },
  bomb: {
    name: 'Arcane Bomb',
    damage: 35,
    powerCost: 30,
    cooldown: 4000, // 4 seconds
    color: '#ff00ff',
    description: 'Explosive force that knocks back enemies',
    range: 12,
    affectRange: 6, // Large explosion radius
    icon: '💣',
    statusEffect: {
      type: 'knockback',
      force: 8 // Knockback distance
    }
  },
  poison: {
    name: 'Poison Cloud',
    damage: 15, // Initial damage
    powerCost: 20,
    cooldown: 3500,
    color: '#88ff00',
    description: 'Deals damage over time',
    range: 10,
    affectRange: 5, // Poison cloud spreads
    icon: '☠️',
    statusEffect: {
      type: 'poison',
      duration: 5000, // 5 seconds
      tickDamage: 5, // Damage per tick
      tickRate: 1000 // Every 1 second
    }
  },
  chain: {
    name: 'Chain Lightning',
    damage: 20,
    powerCost: 35,
    cooldown: 5000,
    color: '#4444ff',
    description: 'Bounces between nearby enemies',
    range: 15,
    affectRange: 2, // Initial hit area
    icon: '⚡️',
    statusEffect: {
      type: 'chain',
      bounces: 3, // Hits 3 additional targets
      chainRange: 8 // Range to next target
    }
  },
  drain: {
    name: 'Life Drain',
    damage: 25,
    powerCost: 20,
    cooldown: 4000,
    color: '#ff0088',
    description: 'Steal life from enemies',
    range: 12,
    affectRange: 1, // Single target focused
    icon: '🩸',
    statusEffect: {
      type: 'lifesteal',
      healPercent: 50 // Heal for 50% of damage dealt
    }
  },
  slow: {
    name: 'Time Warp',
    damage: 5,
    powerCost: 20,
    cooldown: 5000,
    color: '#8844ff',
    description: 'Slows enemy movement',
    range: 15,
    affectRange: 4, // Time warp field
    icon: '⏰',
    statusEffect: {
      type: 'slow',
      duration: 4000, // 4 seconds
      slowPercent: 50 // 50% movement speed reduction
    }
  },
  heal: {
    name: 'Heal',
    damage: -30, // Negative damage = healing
    powerCost: 30,
    cooldown: 4000, // 4 seconds
    color: '#44ff44',
    description: 'Restore health',
    range: 8, // Heal range
    affectRange: 0, // Self-heal only
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
    affectRange: 7, // Massive impact crater
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
    affectRange: 0, // Self-shield only
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
          freeze: 0,
          blizzard: 0,
          lightning: 0,
          bomb: 0,
          poison: 0,
          chain: 0,
          drain: 0,
          slow: 0,
          heal: 0,
          meteor: 0,
          shield: 0
        }
      },
      
      // Enemy stats
      enemies: getInitialEnemies(),
      
      // Game state
      gameState: 'playing', // 'playing', 'victory', 'defeat'
      combatLog: [],
      playerAttackingAt: 0, // timestamp used to signal player attack animation
      
      // Magic system
      magicTypes: MAGIC_TYPES,
      castingMode: false, // Whether player is in casting mode
      targetPosition: null, // Where magic will be cast

      // Trigger player attack animation
      triggerPlayerAttack: () => {
        set({ playerAttackingAt: Date.now() })
      },

      // Centralized cast resolution: applies damage, status effects, heals, visuals triggers
      performCastWithCenter: (magicType, centerPosition, playerPosition) => {
        const state = get()
        const result = state.castMagicAtPosition(magicType, centerPosition, playerPosition)
        if (!result.success) return result

        const magic = result.magic
        const damage = result.damage

        // Heal self-cast
        if (magicType === 'heal') {
          get().healPlayer(Math.abs(damage))
        } else {
          // Trigger player attack animation
          set({ playerAttackingAt: Date.now() })

          const aoeRadius = magic.affectRange || 0
          const enemiesInRange = get().enemies.filter(enemy => {
            if (!enemy.alive) return false
            const dx = enemy.position[0] - centerPosition[0]
            const dz = enemy.position[2] - centerPosition[2]
            const dist = Math.sqrt(dx * dx + dz * dz)
            return dist <= aoeRadius
          })

          enemiesInRange.forEach(enemy => {
            get().attackEnemy(enemy.id, damage)

            if (magic.statusEffect) {
              const statusEffect = magic.statusEffect

              if (statusEffect.type === 'knockback') {
                get().knockbackEnemy(enemy.id, playerPosition, statusEffect.force)
              }

              get().applyStatusEffect(enemy.id, statusEffect, magicType)

              if (statusEffect.type === 'lifesteal') {
                const healAmount = Math.floor(damage * (statusEffect.healPercent / 100))
                get().healPlayer(healAmount)
              }
            }
          })
        }

        // Exit casting mode
        set({ castingMode: false, targetPosition: null })

        return { success: true, magic, damage }
      },
      
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
      
      // Apply status effect to enemy
      applyStatusEffect: (enemyId, statusEffect, magicType) => {
        const now = Date.now()
        
        set((state) => ({
          enemies: state.enemies.map(enemy => {
            if (enemy.id !== enemyId) return enemy
            
            // Create the status effect object
            const newEffect = {
              ...statusEffect,
              appliedAt: now,
              expiresAt: now + (statusEffect.duration || 0)
            }
            
            return {
              ...enemy,
              statusEffects: [...(enemy.statusEffects || []), newEffect]
            }
          }),
          combatLog: [
            ...state.combatLog.slice(-9),
            { 
              type: 'status', 
              message: `Enemy ${enemyId} affected by ${statusEffect.type}!`,
              timestamp: now
            }
          ]
        }))
      },
      
      // Remove expired status effects
      updateStatusEffects: () => {
        const now = Date.now()
        
        set((state) => ({
          enemies: state.enemies.map(enemy => ({
            ...enemy,
            statusEffects: enemy.statusEffects.filter(effect => 
              !effect.expiresAt || effect.expiresAt > now
            )
          }))
        }))
      },
      
      // Knockback enemy
      knockbackEnemy: (enemyId, playerPosition, force) => {
        set((state) => ({
          enemies: state.enemies.map(enemy => {
            if (enemy.id !== enemyId) return enemy
            
            // Calculate knockback direction
            const dx = enemy.position[0] - playerPosition[0]
            const dz = enemy.position[2] - playerPosition[2]
            const distance = Math.sqrt(dx * dx + dz * dz)
            
            if (distance === 0) return enemy
            
            // Normalize and apply force
            const newX = enemy.position[0] + (dx / distance) * force
            const newZ = enemy.position[2] + (dz / distance) * force
            
            return {
              ...enemy,
              position: [newX, enemy.position[1], newZ]
            }
          })
        }))
      },
      
      // Attack enemy
      attackEnemy: (enemyId, damage) => {
        // Get enemy info before applying damage
        const enemyBefore = get().enemies.find(e => e.id === enemyId)
        const wasAlive = enemyBefore && enemyBefore.alive && enemyBefore.health > 0
        
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
        if (enemy && enemy.health <= 0 && wasAlive) {
          // Calculate XP reward based on enemy max health and level
          const expReward = Math.floor(enemy.maxHealth * 0.5 + enemy.attack * 2)
          
          set((state) => ({
            combatLog: [
              ...state.combatLog.slice(-9),
              { 
                type: 'victory', 
                message: `${enemy.name} defeated!`,
                timestamp: Date.now()
              }
            ]
          }))
          
          // Award experience
          get().gainExperience(expReward)
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
      
      // Calculate experience needed for next level
      getExpForNextLevel: (level) => {
        // Formula: 100 * level^1.5
        return Math.floor(100 * Math.pow(level, 1.5))
      },
      
      // Gain experience
      gainExperience: (amount) => {
        const state = get()
        const newExp = state.player.experience + amount
        const expNeeded = state.getExpForNextLevel(state.player.level)
        
        set((state) => ({
          player: {
            ...state.player,
            experience: newExp
          },
          combatLog: [
            ...state.combatLog.slice(-9),
            { 
              type: 'exp', 
              message: `Gained ${amount} XP!`,
              timestamp: Date.now()
            }
          ]
        }))
        
        // Check if player leveled up
        if (newExp >= expNeeded) {
          get().levelUp()
        }
      },
      
      // Level up
      levelUp: () => {
        set((state) => {
          const newLevel = state.player.level + 1
          const expNeeded = state.getExpForNextLevel(state.player.level)
          const remainingExp = state.player.experience - expNeeded
          
          // Stat increases per level
          const healthIncrease = 20
          const powerIncrease = 10
          const attackIncrease = 3
          const defenseIncrease = 2
          
          const newMaxHealth = state.player.maxHealth + healthIncrease
          const newMaxPower = state.player.maxPower + powerIncrease
          
          return {
            player: {
              ...state.player,
              level: newLevel,
              experience: remainingExp,
              maxHealth: newMaxHealth,
              health: newMaxHealth, // Heal to full on level up
              maxPower: newMaxPower,
              power: newMaxPower, // Restore power to full on level up
              attack: state.player.attack + attackIncrease,
              defense: state.player.defense + defenseIncrease
            },
            combatLog: [
              ...state.combatLog.slice(-9),
              { 
                type: 'levelup', 
                message: `🎉 LEVEL UP! Now level ${newLevel}! (+${healthIncrease} HP, +${powerIncrease} Power, +${attackIncrease} Attack, +${defenseIncrease} Defense)`,
                timestamp: Date.now()
              }
            ]
          }
        })
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
              freeze: 0,
              blizzard: 0,
              lightning: 0,
              bomb: 0,
              poison: 0,
              chain: 0,
              drain: 0,
              slow: 0,
              heal: 0,
              meteor: 0,
              shield: 0
            }
          },
          enemies: getInitialEnemies(),
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
      
      // Migration: Add statusEffects to enemies if they don't have it
      if (parsed.state?.enemies) {
        let needsUpdate = false
        const updatedEnemies = parsed.state.enemies.map(enemy => {
          if (!enemy.statusEffects) {
            needsUpdate = true
            return { ...enemy, statusEffects: [] }
          }
          return enemy
        })
        
        if (needsUpdate) {
          console.log('Migrating enemy data to include statusEffects')
          parsed.state.enemies = updatedEnemies
          localStorage.setItem('ow3-game', JSON.stringify(parsed))
        }
      }
    } catch (e) {
      console.log('Error parsing saved state, clearing localStorage')
      localStorage.removeItem('ow3-game') 
    }
  }
}
