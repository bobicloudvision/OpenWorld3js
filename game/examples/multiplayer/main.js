import * as THREE from 'three';
import { 
  GameEngine, 
  Scene, 
  Actor, 
  ThirdPersonCamera,
  RoomManager 
} from '../../src/index.js';

/**
 * Multiplayer Game Scene
 */
class MultiplayerGameScene extends Scene {
  constructor(engine) {
    super(engine);
    this.name = 'MultiplayerGameScene';
    this.backgroundColor = 0x87CEEB;

    this.localPlayer = null;
    this.remotePlayers = new Map();
    this.cameraController = null;
    this.roomManager = null;
  }

  async initialize() {
    await super.initialize();

    this.ambientLight.intensity = 0.6;
    this.directionalLight.intensity = 0.8;
    this.directionalLight.position.set(10, 20, 10);

    this.setFog(0x87CEEB, 50, 200);
  }

  async load() {
    // Create environment
    this.createGround();
    this.createObstacles();

    // Create local player
    this.createLocalPlayer();

    // Setup camera
    this.setupCamera();

    // Setup input
    this.setupInput();

    // Setup networking
    this.setupNetworking();

    await super.load();
  }

  createGround() {
    const geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x3a8c3a,
      roughness: 0.8
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = Math.random() * 0.5;
      positions.setY(i, y);
    }
    geometry.computeVertexNormals();
    
    this.add(ground);
  }

  createObstacles() {
    const colors = [0xe74c3c, 0xf39c12, 0x9b59b6, 0x1abc9c];

    for (let i = 0; i < 15; i++) {
      const size = 1 + Math.random() * 2;
      const geometry = new THREE.BoxGeometry(size, size * 2, size);
      const material = new THREE.MeshStandardMaterial({ 
        color: colors[Math.floor(Math.random() * colors.length)]
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const angle = (i / 15) * Math.PI * 2;
      const radius = 10 + Math.random() * 30;
      
      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = size;
      mesh.position.z = Math.sin(angle) * radius;

      this.add(mesh);
    }
  }

  createLocalPlayer() {
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4a90e2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.position.y = 1;

    this.localPlayer = new Actor({
      name: 'LocalPlayer',
      speed: 8,
      isNetworked: true
    });

    this.localPlayer.mesh = mesh;
    this.localPlayer.setPosition(0, 1, 0);

    this.addEntity(this.localPlayer);

    // Note: For games needing health/combat, add components:
    // import { HealthComponent } from '../components/HealthComponent.js';
    // this.localPlayer.addComponent(new HealthComponent(100));
  }

  createRemotePlayer(playerId, data) {
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xe74c3c
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;

    const player = new Actor({
      name: data.name || `Player_${playerId}`,
      networkId: playerId,
      isNetworked: true
    });

    player.mesh = mesh;
    player.setPosition(data.position?.x || 0, data.position?.y || 1, data.position?.z || 0);

    this.addEntity(player);
    this.remotePlayers.set(playerId, player);

    console.log(`Remote player joined: ${playerId}`);
  }

  removeRemotePlayer(playerId) {
    const player = this.remotePlayers.get(playerId);
    if (player) {
      this.removeEntity(player);
      player.dispose();
      this.remotePlayers.delete(playerId);
      console.log(`Remote player left: ${playerId}`);
    }
  }

  setupCamera() {
    const camera = this.engine.cameraManager.getActiveCamera();
    
    this.cameraController = new ThirdPersonCamera(camera, this.localPlayer, {
      distance: 12,
      height: 6,
      smoothness: 0.15
    });

    this.cameraController.setInputManager(this.engine.inputManager);
  }

  setupInput() {
    const input = this.engine.inputManager;

    input.bindAction('forward', ['KeyW', 'ArrowUp']);
    input.bindAction('backward', ['KeyS', 'ArrowDown']);
    input.bindAction('left', ['KeyA', 'ArrowLeft']);
    input.bindAction('right', ['KeyD', 'ArrowRight']);
  }

  setupNetworking() {
    const network = this.engine.networkManager;
    
    if (!network) {
      console.warn('Networking not enabled');
      return;
    }

    this.roomManager = new RoomManager(network);

    // Listen to network events
    network.on('playerJoined', (data) => {
      this.createRemotePlayer(data.player.id, data.player);
    });

    network.on('playerLeft', (data) => {
      this.removeRemotePlayer(data.playerId);
    });

    network.on('playerUpdated', (data) => {
      const player = this.remotePlayers.get(data.playerId);
      if (player && data.state) {
        player.deserialize(data.state);
      }
    });

    network.on('latencyUpdate', (data) => {
      document.getElementById('latency').textContent = data.latency;
    });

    // Setup UI
    this.setupNetworkUI();
  }

  setupNetworkUI() {
    const network = this.engine.networkManager;

    // Connection status
    network.on('connected', () => {
      document.getElementById('status-dot').className = 'status-dot status-connected';
      document.getElementById('status-text').textContent = 'Connected';
    });

    network.on('disconnected', () => {
      document.getElementById('status-dot').className = 'status-dot status-disconnected';
      document.getElementById('status-text').textContent = 'Disconnected';
    });

    // Room UI
    document.getElementById('create-room-btn').addEventListener('click', async () => {
      try {
        const room = await this.roomManager.createRoom({
          name: `Room ${Date.now()}`,
          maxPlayers: 10
        });
        this.onRoomJoined(room);
      } catch (error) {
        console.error('Failed to create room:', error);
      }
    });

    document.getElementById('quick-match-btn').addEventListener('click', async () => {
      try {
        const room = await this.roomManager.quickMatch();
        this.onRoomJoined(room);
      } catch (error) {
        console.error('Failed to quick match:', error);
      }
    });

    this.roomManager.on('joined', (data) => {
      this.onRoomJoined(data.room);
    });
  }

  onRoomJoined(room) {
    document.getElementById('room-list').classList.add('hidden');
    document.getElementById('room-name').textContent = room.name || room.id;
    
    this.updatePlayersList();
  }

  updatePlayersList() {
    const players = this.engine.networkManager.getRoomPlayers();
    const container = document.getElementById('players-container');
    
    document.getElementById('player-count').textContent = players.length;
    
    container.innerHTML = players.map(player => 
      `<div class="player-item">${player.name || player.id}</div>`
    ).join('');
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    if (this.localPlayer && this.cameraController) {
      this.updatePlayerMovement(deltaTime);
      this.cameraController.update(deltaTime);
    }

    // Send player state to server
    if (this.engine.networkManager && this.engine.networkManager.isInRoom()) {
      this.syncLocalPlayer();
    }

    this.updateUI();
  }

  updatePlayerMovement(deltaTime) {
    const input = this.engine.inputManager;
    const moveDirection = new THREE.Vector3();

    const forward = this.cameraController.getForwardDirection();
    const right = this.cameraController.getRightDirection();

    if (input.isActionDown('forward')) moveDirection.add(forward);
    if (input.isActionDown('backward')) moveDirection.sub(forward);
    if (input.isActionDown('left')) moveDirection.sub(right);
    if (input.isActionDown('right')) moveDirection.add(right);

    if (moveDirection.lengthSq() > 0) {
      this.localPlayer.move(moveDirection, deltaTime);
      this.localPlayer.rotateTo(moveDirection, deltaTime);
    } else {
      this.localPlayer.stop();
    }

    if (this.localPlayer.position.y < 1) {
      this.localPlayer.position.y = 1;
    }
  }

  syncLocalPlayer() {
    // Throttle network updates (e.g., 20 times per second)
    if (!this.lastSyncTime) this.lastSyncTime = 0;
    const now = Date.now();
    
    if (now - this.lastSyncTime > 50) {
      this.engine.networkManager.send('player:update', {
        state: this.localPlayer.serialize()
      });
      this.lastSyncTime = now;
    }
  }

  updateUI() {
    document.getElementById('fps').textContent = Math.round(this.engine.stats.fps);
    document.getElementById('entities').textContent = this.entities.size;
  }
}

/**
 * Initialize and start the game
 */
function initGame() {
  const engine = new GameEngine({
    canvas: document.getElementById('game-canvas'),
    antialias: true,
    shadowMapEnabled: true,
    networking: true,
    networkConfig: {
      url: 'http://localhost:3000', // Your socket.io server URL
      autoConnect: true
    }
  });

  engine.loadScene(MultiplayerGameScene);
  engine.start();

  console.log('Multiplayer game started!');
}

window.addEventListener('DOMContentLoaded', initGame);

