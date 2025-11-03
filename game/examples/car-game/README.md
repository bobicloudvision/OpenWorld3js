# 🚗 Car Physics Game

A complete car driving game using **Cannon.js RigidVehicle** physics system.

## Features

- ✅ **Full vehicle physics** using Cannon.js RigidVehicle
- ✅ **4-wheel vehicle** with front-wheel steering
- ✅ **Physics debug visualization** (toggle with P key)
- ✅ **Automatic mesh-physics sync** for wheels and chassis
- ✅ **Component-based architecture** using VehicleComponent

## Controls

- **W / Arrow Up**: Accelerate
- **S / Arrow Down**: Reverse
- **A / Arrow Left**: Steer left
- **D / Arrow Right**: Steer right
- **P**: Toggle physics debug visualization

## Architecture

### VehicleComponent

The `VehicleComponent` handles all vehicle physics:

```javascript
car.addComponent(VehicleComponent, {
  wheels: [
    { position: { x: -2, y: 0, z: 2.5 }, axis: { x: 0, y: 0, z: 1 } },
    { position: { x: -2, y: 0, z: -2.5 }, axis: { x: 0, y: 0, z: 1 } },
    { position: { x: 2, y: 0, z: 2.5 }, axis: { x: 0, y: 0, z: 1 } },
    { position: { x: 2, y: 0, z: -2.5 }, axis: { x: 0, y: 0, z: 1 } }
  ],
  maxForce: 10,
  maxSteer: Math.PI / 8
});
```

### PhysicsManager.createVehicle()

The engine's PhysicsManager now supports vehicle creation:

```javascript
const vehicle = physics.createVehicle({
  chassisBody: carBody,
  wheels: [
    { position: { x: -2, y: 0, z: 2.5 }, axis: { x: 0, y: 0, z: 1 } }
  ]
});
```

## How It Works

1. **Create GameObject** with physics body (chassis)
2. **Enable physics** on the GameObject
3. **Add VehicleComponent** with wheel configurations
4. **VehicleComponent** automatically:
   - Creates RigidVehicle from chassis body
   - Adds wheels to vehicle
   - Handles input for driving
   - Updates vehicle controls each frame

## Wheel Sync

The example demonstrates manual wheel mesh sync:

```javascript
// In scene update()
car.vehicle.wheelBodies.forEach((wheelBody, index) => {
  wheelMeshes[index].position.copy(wheelBody.position);
  wheelMeshes[index].quaternion.copy(wheelBody.quaternion);
});
```

## Physics Debug

Press **P** to toggle physics debug visualization:
- 🟢 **Green wireframes**: Static bodies (ground)
- 🟣 **Magenta wireframes**: Dynamic bodies (car, wheels)

## Customization

### Adjust Vehicle Properties

```javascript
car.addComponent(VehicleComponent, {
  maxForce: 15,        // More powerful
  maxSteer: Math.PI / 6, // More steering
  wheelRadius: 1.2,    // Bigger wheels
  wheelMass: 2         // Heavier wheels
});
```

### Custom Input Keys

```javascript
car.addComponent(VehicleComponent, {
  forwardKey: 'KeyW',
  backwardKey: 'KeyS',
  leftKey: 'KeyA',
  rightKey: 'KeyD'
});
```

## Comparison with Example Code

| Feature | React/Three.js Example | OpenWorld3D Engine |
|---------|----------------------|-------------------|
| Vehicle Creation | Manual CANNON.RigidVehicle | VehicleComponent |
| Input Handling | DOM events | InputManager |
| Mesh Sync | Manual copy() | Automatic + manual wheels |
| Debug Visualization | CannonDebugger library | Built-in toggle |
| Architecture | Monolithic | Component-based |

## Benefits

✅ **Less boilerplate**: No manual DOM event handling  
✅ **Automatic sync**: Chassis mesh syncs automatically  
✅ **Component-based**: Easy to reuse and extend  
✅ **Engine integration**: Works with all engine features  
✅ **Debug built-in**: No external libraries needed

## Running

```bash
# From project root
npm run dev

# Navigate to:
http://localhost:5173/examples/car-game/
```

## Next Steps

- Add multiple cars
- Create race tracks
- Add obstacles
- Implement lap timers
- Add multiplayer racing

