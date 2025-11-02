# 🌟 Sky Platforms Game

A fun 3D platformer game built with the OpenWorld3js game engine. Jump between floating platforms in the sky, collect gems, and race against time!

## 🎮 Game Features

- **Dynamic Platforms**: Jump between floating platforms at various heights
- **Moving Platforms**: Some platforms move in circular patterns, adding challenge
- **Gem Collection**: Collect all 15 gems scattered across the platforms
- **Time Challenge**: Complete the game before the 60-second timer runs out
- **Double Jump**: Master the double-jump mechanic to reach distant platforms
- **Beautiful Sky World**: Atmospheric sky environment with clouds and fog
- **Smooth Controls**: Third-person camera with smooth player movement

## 🕹️ Controls

- **WASD / Arrow Keys**: Move the player
- **Space**: Jump (press twice for double jump!)
- **Mouse**: Rotate camera
- **Mouse Wheel**: Zoom in/out

## 🎯 Objective

Collect all 15 gems before time runs out! Each gem gives you 100 points, and you get bonus points based on remaining time when you collect all gems.

## ⚠️ Challenge

- Don't fall off the platforms!
- Some platforms move - time your jumps carefully
- Use double jump to reach far platforms
- The higher you go, the more difficult the jumps become

## 🏆 Scoring

- **Gem Collection**: 100 points per gem
- **Time Bonus**: 10 points per second remaining (if you collect all gems)
- **Maximum Score**: 2,100 points (if you collect all gems with full time remaining)

## 🚀 How to Run

1. Make sure you have the game engine installed
2. Serve the game directory with a local web server
3. Open `index.html` in your browser
4. Start jumping and collecting!

## 🛠️ Technical Features

This game demonstrates:
- Scene management with the game engine
- Actor and entity system
- Third-person camera controller
- Input management and binding
- MeshBuilder for creating 3D objects
- Color system and materials
- Physics simulation (gravity and collision)
- Timer and game state management
- UI overlay and game over screens

## 🎨 Code Highlights

- Uses only engine classes - no direct Three.js imports
- Clean scene-based architecture
- Smooth camera following player
- Animated gems with rotation and bobbing
- Moving platform mechanics
- Double jump implementation
- Collision detection with platforms

