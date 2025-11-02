import { Component } from '../../src/entities/Component.js';

/**
 * Health Component
 * Example component for games that need health/damage systems
 * 
 * This is NOT part of the engine - it's an example for YOUR game
 */
export class HealthComponent extends Component {
  constructor(maxHealth = 100) {
    super();
    
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.isDead = false;
    this.isInvulnerable = false;
    this.invulnerabilityDuration = 0;
  }

  /**
   * Take damage
   */
  takeDamage(amount, source = null) {
    if (this.isDead || this.isInvulnerable) return 0;

    const actualDamage = Math.max(0, amount);
    this.health = Math.max(0, this.health - actualDamage);

    this.emit('damaged', { 
      amount: actualDamage, 
      source, 
      currentHealth: this.health 
    });

    if (this.health <= 0) {
      this.die(source);
    }

    return actualDamage;
  }

  /**
   * Heal
   */
  heal(amount) {
    if (this.isDead) return 0;

    const healAmount = Math.min(amount, this.maxHealth - this.health);
    this.health += healAmount;

    this.emit('healed', { 
      amount: healAmount, 
      currentHealth: this.health 
    });

    return healAmount;
  }

  /**
   * Die
   */
  die(source = null) {
    if (this.isDead) return;

    this.isDead = true;
    this.health = 0;

    this.emit('died', { source });
  }

  /**
   * Respawn
   */
  respawn(healthPercent = 1.0) {
    this.isDead = false;
    this.health = this.maxHealth * healthPercent;
    this.emit('respawned', { health: this.health });
  }

  /**
   * Set invulnerability
   */
  setInvulnerable(duration = 0) {
    this.isInvulnerable = true;
    this.invulnerabilityDuration = duration;
  }

  /**
   * Update
   */
  update(deltaTime) {
    // Invulnerability timer
    if (this.isInvulnerable && this.invulnerabilityDuration > 0) {
      this.invulnerabilityDuration -= deltaTime;
      
      if (this.invulnerabilityDuration <= 0) {
        this.isInvulnerable = false;
        this.emit('vulnerableAgain');
      }
    }
  }

  /**
   * Get health percentage
   */
  getHealthPercent() {
    return this.maxHealth > 0 ? this.health / this.maxHealth : 0;
  }

  /**
   * Is alive?
   */
  isAlive() {
    return !this.isDead && this.health > 0;
  }
}

