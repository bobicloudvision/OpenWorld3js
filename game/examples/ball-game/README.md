# ⚽ Ball Game - Simple Physics Demo

A fun, simple ball rolling game that demonstrates the game engine's physics capabilities!

## 🎮 Gameplay

- **Roll a red ball** around the arena
- **Collect yellow goals** (cylinders)
- **Avoid falling off** the arena
- **Score points** for each goal collected
- **All goals collected?** New ones spawn automatically!

## 🎯 Controls

- **WASD** - Push the ball in different directions
- **Mouse Movement** - Rotate camera around ball
- **Mouse Wheel** - Zoom in/out
- **R** - Reset ball to center

## ✨ Features

### Physics
- ✅ Sphere physics body
- ✅ Rolling friction and damping
- ✅ Force-based movement (push the ball)
- ✅ Collision detection with walls
- ✅ Realistic ball rolling

### Game Mechanics
- ✅ Goal collection system
- ✅ Score tracking
- ✅ Auto-respawn goals when all collected
- ✅ Visual feedback on goal collection
- ✅ Ball reset functionality

### Visuals
- ✅ Smooth third-person camera following ball
- ✅ Glowing goals with emissive materials
- ✅ Grid pattern ground
- ✅ Walls keeping ball in arena
- ✅ Shadows and lighting

## 🏗️ Code Highlights

### Ball Physics Setup

```javascript
// Create sphere physics body
const ballBody = physics.addToEntity(this.ball, {
  type: 'sphere',
  radius: 1,
  mass: 1
});

// Add damping for realistic rolling
ballBody.linearDamping = 0.3;  // Friction
ballBody.angularDamping = 0.1; // Spin friction
```

### Force-Based Movement

```javascript
// Push ball based on camera direction
const force = { x: 0, y: 0, z: 0 };

if (input.isActionDown('forward')) {
  force.x += forward.x * pushForce;
  force.z += forward.z * pushForce;
}

physics.applyForce(body, force);
```

### Goal Collection

```javascript
// Distance-based collision detection
const distance = Math.sqrt(dx * dx + dz * dz);

if (distance < 3) {
  collectGoal(goal);
  score += 10;
}
```

## 🎓 What This Demonstrates

### Engine Features Used:
1. **PhysicsManager** - Sphere bodies, forces, damping
2. **MeshBuilder** - Sphere, cylinder, plane, box creation
3. **ThirdPersonCamera** - Following the ball smoothly
4. **InputManager** - WASD controls and key bindings
5. **Scene System** - Clean scene structure
6. **Color System** - Built-in color constants

### Physics Concepts:
1. **Sphere collision** - Different from box collision
2. **Force application** - Pushing vs velocity
3. **Damping** - Simulating friction
4. **Trigger volumes** - Goals don't block, just detect
5. **Reset mechanics** - Resetting physics state

## 🚀 Running the Game

```bash
# From /game directory
npm run dev

# Open browser to:
http://localhost:5173/examples/ball-game/
```

## 🎯 Game Tips

1. **Don't hold keys continuously** - Tap to push gently
2. **Use camera angles** - Rotate to see where you're going
3. **Watch your speed** - Too fast = hard to control
4. **Plan your route** - Collect goals efficiently
5. **Use walls** - Bounce off them to change direction!

## 🔧 Customization Ideas

Try changing these values in `main.js`:

### Ball Properties
```javascript
// Make ball heavier/lighter
mass: 5  // Heavier = harder to push

// Change size
radius: 2  // Bigger ball

// More/less friction
linearDamping: 0.5  // More friction = stops faster
```

### Push Force
```javascript
// Make it easier/harder to push
this.pushForce = 30;  // Stronger push
```

### Gravity
```javascript
// Change physics feel
physicsConfig: {
  gravity: -50  // Stronger gravity
}
```

### Goal Count
```javascript
// More goals to collect
const positions = [
  { x: 10, z: 10 },
  { x: -10, z: 10 },
  // Add more positions...
];
```

## 📊 Comparison to Other Examples

| Feature | Basic Example | Physics Demo | Ball Game |
|---------|---------------|--------------|-----------|
| Physics Body | Box | Box | **Sphere** |
| Movement | Velocity | Velocity | **Forces** |
| Game Goal | Explore | Test physics | **Collect goals** |
| Difficulty | Easy | Medium | Easy |

## 🏆 Challenges

Try implementing these features:

1. **Timer** - Race against the clock
2. **Obstacles** - Add moving obstacles
3. **Power-ups** - Speed boost, jump ability
4. **Multiplayer** - Two balls competing
5. **Levels** - Different arena layouts
6. **Ball trail** - Visual effect behind ball
7. **Sound effects** - Goal collection sounds
8. **Leaderboard** - Save high scores

## 💡 Learning Points

This simple game teaches:

1. **Sphere physics** - Different collision shape
2. **Force-based movement** - More realistic than setting velocity
3. **Trigger volumes** - Detection without blocking
4. **Game loop** - Score, goals, win conditions
5. **Visual feedback** - Scaling, glowing, messages
6. **State management** - Tracking collected goals

## 🎮 Game Feel Tips

The game feels good because of:

- **Smooth camera** - Follows ball naturally
- **Damping values** - Ball doesn't slide forever
- **Force magnitude** - Not too fast, not too slow
- **Visual feedback** - Goals pulse when collected
- **Reset button** - Easy to retry

Perfect example of how good physics + simple mechanics = fun game! 🎮

Enjoy rolling! ⚽

