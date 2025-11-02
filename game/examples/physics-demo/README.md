# Physics Demo Example

This example demonstrates how to use the **PhysicsManager** to add realistic physics to your game using Cannon.js.

## What This Example Shows

✅ **PhysicsManager Integration**
- Separate physics class (not hardcoded in scenes)
- Easy to enable/disable physics
- Clean API for physics operations

✅ **Physics Features**
- Dynamic player with physics body
- Static ground plane
- Static obstacles
- Collision detection
- Gravity and jumping
- Spawning dynamic objects at runtime

✅ **Cannon.js Features**
- Rigid body physics
- Box colliders
- Impulses for jumping
- Velocity-based movement
- Mass and collision handling

## How It Works

### 1. Enable Physics in Engine

```javascript
const engine = new GameEngine({
  physics: true, // Enable physics!
  physicsConfig: {
    gravity: -9.82,
    iterations: 10
  }
});
```

### 2. Create Physics Bodies

```javascript
// Ground (static)
physics.createPlane({
  mass: 0, // Static (doesn't move)
  position: { x: 0, y: 0, z: 0 }
});

// Player (dynamic)
const playerBody = physics.addToEntity(this.player, {
  type: 'box',
  width: 1,
  height: 2,
  depth: 1,
  mass: 5 // Dynamic (affected by forces)
});

// Obstacles (static or dynamic)
const body = physics.createBox({
  width: 2,
  height: 2,
  depth: 2,
  mass: 0 // 0 = static, >0 = dynamic
});
```

### 3. Apply Forces

```javascript
// Jump
physics.applyImpulse(body, { x: 0, y: 50, z: 0 });

// Push
physics.applyForce(body, { x: 10, y: 0, z: 0 });
```

### 4. Sync Visual with Physics

```javascript
update(deltaTime) {
  // Physics updates automatically in engine
  
  // Sync your meshes
  this.player.position.copy(body.position);
  this.player.mesh.position.copy(body.position);
}
```

## PhysicsManager API

### Creating Bodies

```javascript
// Box
physics.createBox({ width, height, depth, mass, position });

// Sphere
physics.createSphere({ radius, mass, position });

// Cylinder
physics.createCylinder({ radiusTop, radiusBottom, height, mass });

// Plane (ground)
physics.createPlane({ mass: 0 });
```

### Adding Physics to Entities

```javascript
// Automatically creates and attaches physics body
physics.addToEntity(entity, {
  type: 'box', // 'box', 'sphere', 'cylinder'
  width: 1,
  height: 2,
  depth: 1,
  mass: 5
});

// Access via entity.physicsBody
entity.physicsBody.velocity.y = 10;
```

### Applying Forces

```javascript
// Impulse (instant force)
physics.applyImpulse(body, { x, y, z });

// Force (continuous)
physics.applyForce(body, { x, y, z });
```

### Raycasting

```javascript
const result = physics.raycast(
  { x: 0, y: 10, z: 0 },  // From
  { x: 0, y: -10, z: 0 }  // To
);

if (result.hit) {
  console.log('Hit:', result.body);
  console.log('Point:', result.point);
}
```

### Materials (Advanced)

```javascript
// Create materials
const playerMaterial = physics.createMaterial({
  friction: 0.3,
  restitution: 0.3
});

const groundMaterial = physics.createMaterial({
  friction: 0.8,
  restitution: 0.1
});

// Define interaction between materials
physics.createContactMaterial(playerMaterial, groundMaterial, {
  friction: 0.5,
  restitution: 0.2
});
```

## Controls

- **WASD** - Move player
- **Space** - Jump
- **E** - Spawn dynamic physics box
- **Mouse Movement** - Rotate camera
- **Scroll** - Zoom camera

## Differences from Basic Example

| Feature | Basic Example | Physics Demo |
|---------|--------------|--------------|
| Physics | Custom (simple) | Cannon.js (realistic) |
| Collision | None | Full collision detection |
| Jump | Manual velocity | Physics impulse |
| Objects | Static meshes | Dynamic rigid bodies |
| Complexity | Simple | More realistic |

## When to Use PhysicsManager

✅ **Use PhysicsManager when you need:**
- Realistic collision detection
- Objects that interact with each other
- Stacking, rolling, falling objects
- Complex physics simulations
- Vehicle physics
- Ragdoll physics

❌ **Don't use PhysicsManager for:**
- Very simple movement (basic example is fine)
- 2D games (use 2D physics engine)
- Extreme performance requirements (custom is faster)

## Performance Tips

1. **Use static bodies** (mass: 0) for objects that don't move
2. **Enable sleeping** - bodies automatically sleep when idle
3. **Simplify collision shapes** - use boxes/spheres instead of complex meshes
4. **Limit physics objects** - don't create thousands of bodies
5. **Adjust solver iterations** - lower = faster but less accurate

## Running This Example

```bash
# From /game directory
npm install  # Install cannon-es
npm run dev  # Start dev server

# Open browser to:
http://localhost:5173/examples/physics-demo/
```

## Next Steps

Try experimenting with:
- Different masses and forces
- Creating physics-based puzzles
- Adding springs and constraints
- Implementing vehicle physics
- Creating destructible objects

## Architecture Benefits

🎯 **Clean Separation**
- Physics logic is NOT in scenes
- PhysicsManager can be enabled/disabled
- Easy to switch physics engines later

🎯 **Game Agnostic**
- Works for any game type
- No hardcoded physics behavior
- Flexible API for any physics needs

🎯 **Optional**
- Physics is opt-in
- Games without physics don't load Cannon.js
- No performance cost if not used

Enjoy experimenting with physics! 🎮

