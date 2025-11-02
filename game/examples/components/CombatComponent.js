import { Component } from '../../src/entities/Component.js';

/**
 * Combat Component
 * Example component for games with combat systems
 * 
 * This is NOT part of the engine - it's an example for YOUR game
 */
export class CombatComponent extends Component {
  constructor(config = {}) {
    super();
    
    this.attackPower = config.attackPower || 10;
    this.defense = config.defense || 5;
    this.attackRange = config.attackRange || 2;
    this.attackCooldown = config.attackCooldown || 1.0;
    
    this.isInCombat = false;
    this.currentTarget = null;
    this.lastAttackTime = 0;
    this.combatTimeout = 5; // Seconds out of combat
    this.lastCombatTime = 0;
  }

  /**
   * Attack a target
   */
  attack(target) {
    const now = Date.now() / 1000;
    
    // Check cooldown
    if (now - this.lastAttackTime < this.attackCooldown) {
      return false;
    }

    // Check range
    if (this.entity && target) {
      const distance = this.entity.distanceTo(target);
      if (distance > this.attackRange) {
        return false;
      }
    }

    this.lastAttackTime = now;
    this.lastCombatTime = now;
    this.isInCombat = true;
    this.currentTarget = target;

    // Calculate damage
    const damage = this.calculateDamage(target);

    this.emit('attacking', { target, damage });

    // Apply damage if target has health component
    const healthComponent = target.getComponent('HealthComponent');
    if (healthComponent) {
      const actualDamage = healthComponent.takeDamage(damage, this.entity);
      this.emit('attacked', { target, actualDamage });
    }

    return true;
  }

  /**
   * Calculate damage (override for complex damage formulas)
   */
  calculateDamage(target) {
    let damage = this.attackPower;

    // Apply target defense if it has combat component
    const targetCombat = target.getComponent ? target.getComponent('CombatComponent') : null;
    if (targetCombat) {
      damage = Math.max(1, damage - targetCombat.defense);
    }

    return damage;
  }

  /**
   * Can attack?
   */
  canAttack() {
    const now = Date.now() / 1000;
    return now - this.lastAttackTime >= this.attackCooldown;
  }

  /**
   * Get cooldown remaining
   */
  getCooldownRemaining() {
    const now = Date.now() / 1000;
    return Math.max(0, this.attackCooldown - (now - this.lastAttackTime));
  }

  /**
   * Set target
   */
  setTarget(target) {
    this.currentTarget = target;
  }

  /**
   * Clear target
   */
  clearTarget() {
    this.currentTarget = null;
  }

  /**
   * Enter combat
   */
  enterCombat() {
    if (!this.isInCombat) {
      this.isInCombat = true;
      this.lastCombatTime = Date.now() / 1000;
      this.emit('enteredCombat');
    }
  }

  /**
   * Leave combat
   */
  leaveCombat() {
    if (this.isInCombat) {
      this.isInCombat = false;
      this.currentTarget = null;
      this.emit('leftCombat');
    }
  }

  /**
   * Update
   */
  update(deltaTime) {
    const now = Date.now() / 1000;

    // Auto-leave combat after timeout
    if (this.isInCombat && now - this.lastCombatTime > this.combatTimeout) {
      this.leaveCombat();
    }
  }
}

