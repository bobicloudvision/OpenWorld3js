import EventEmitter from 'eventemitter3';
import { io } from 'socket.io-client';

/**
 * Network Manager
 * Handles all networking, socket connections, and multiplayer synchronization
 */
export class NetworkManager extends EventEmitter {
  constructor(engine, config = {}) {
    super();
    
    this.engine = engine;
    this.config = {
      url: config.url || 'http://localhost:3000',
      autoConnect: config.autoConnect !== undefined ? config.autoConnect : false,
      reconnection: config.reconnection !== undefined ? config.reconnection : true,
      reconnectionDelay: config.reconnectionDelay || 1000,
      reconnectionAttempts: config.reconnectionAttempts || 5,
      ...config
    };

    // Socket connection
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;

    // Client state
    this.clientId = null;
    this.playerId = null;
    this.token = null;

    // Room management
    this.currentRoom = null;
    this.roomPlayers = new Map();

    // Network entities
    this.networkEntities = new Map();

    // Pending messages queue
    this.messageQueue = [];

    // Latency tracking
    this.latency = 0;
    this.lastPingTime = 0;

    // Stats
    this.stats = {
      bytesSent: 0,
      bytesReceived: 0,
      messagesSent: 0,
      messagesReceived: 0
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to server
   */
  connect(url = null) {
    if (this.isConnected) {
      console.warn('Already connected to server');
      return;
    }

    const serverUrl = url || this.config.url;

    this.socket = io(serverUrl, {
      reconnection: this.config.reconnection,
      reconnectionDelay: this.config.reconnectionDelay,
      reconnectionAttempts: this.config.reconnectionAttempts,
      transports: ['websocket', 'polling'],
      auth: this.token ? { token: this.token } : undefined
    });

    this._setupSocketListeners();

    this.emit('connecting', { url: serverUrl });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (!this.socket) return;

    this.socket.disconnect();
    this.isConnected = false;
    this.isAuthenticated = false;
    this.currentRoom = null;
    this.roomPlayers.clear();
    this.networkEntities.clear();

    this.emit('disconnected');
  }

  /**
   * Setup socket event listeners
   */
  _setupSocketListeners() {
    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.clientId = this.socket.id;
      
      console.log(`Connected to server with ID: ${this.clientId}`);
      this.emit('connected', { clientId: this.clientId });

      // Process queued messages
      this._processMessageQueue();

      // Start ping interval
      this._startPingInterval();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`Disconnected from server: ${reason}`);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.emit('connectionError', { error });
    });

    // Authentication
    this.socket.on('auth:success', (data) => {
      this.isAuthenticated = true;
      this.playerId = data.playerId;
      
      console.log('Authentication successful');
      this.emit('authenticated', data);
    });

    this.socket.on('auth:failed', (data) => {
      this.isAuthenticated = false;
      console.error('Authentication failed:', data.message);
      this.emit('authenticationFailed', data);
    });

    // Room events
    this.socket.on('room:joined', (data) => {
      this.currentRoom = data.room;
      this.roomPlayers.clear();
      
      data.players.forEach(player => {
        this.roomPlayers.set(player.id, player);
      });

      console.log(`Joined room: ${data.room.id}`);
      this.emit('roomJoined', data);
    });

    this.socket.on('room:left', (data) => {
      this.currentRoom = null;
      this.roomPlayers.clear();
      
      console.log('Left room');
      this.emit('roomLeft', data);
    });

    this.socket.on('room:playerJoined', (data) => {
      this.roomPlayers.set(data.player.id, data.player);
      this.emit('playerJoined', data);
    });

    this.socket.on('room:playerLeft', (data) => {
      this.roomPlayers.delete(data.playerId);
      this.emit('playerLeft', data);
    });

    // Entity sync
    this.socket.on('entity:spawn', (data) => {
      this.emit('entitySpawned', data);
    });

    this.socket.on('entity:update', (data) => {
      this._handleEntityUpdate(data);
    });

    this.socket.on('entity:destroy', (data) => {
      this.networkEntities.delete(data.entityId);
      this.emit('entityDestroyed', data);
    });

    // Player state sync
    this.socket.on('player:update', (data) => {
      const player = this.roomPlayers.get(data.playerId);
      if (player) {
        Object.assign(player, data.state);
      }
      this.emit('playerUpdated', data);
    });

    // Latency tracking
    this.socket.on('pong', () => {
      this.latency = Date.now() - this.lastPingTime;
      this.emit('latencyUpdate', { latency: this.latency });
    });

    // Custom game events (pass through)
    this.socket.onAny((eventName, ...args) => {
      if (!eventName.startsWith('room:') && 
          !eventName.startsWith('entity:') && 
          !eventName.startsWith('player:') &&
          !eventName.startsWith('auth:')) {
        this.emit('gameEvent', { event: eventName, data: args });
        this.emit(eventName, ...args);
      }
    });
  }

  /**
   * Authenticate with server
   */
  authenticate(token) {
    this.token = token;
    
    if (this.isConnected) {
      this.send('auth:login', { token });
    }
  }

  /**
   * Join a room
   */
  joinRoom(roomId, data = {}) {
    if (!this.isConnected) {
      console.warn('Not connected to server');
      return;
    }

    this.send('room:join', { roomId, ...data });
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    if (!this.currentRoom) {
      console.warn('Not in a room');
      return;
    }

    this.send('room:leave', { roomId: this.currentRoom.id });
  }

  /**
   * Create a new room
   */
  createRoom(roomData = {}) {
    if (!this.isConnected) {
      console.warn('Not connected to server');
      return;
    }

    this.send('room:create', roomData);
  }

  /**
   * Get list of available rooms
   */
  getRooms(filters = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('room:list', filters, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.rooms);
        }
      });
    });
  }

  /**
   * Send message to server
   */
  send(event, data = {}) {
    if (!this.isConnected) {
      // Queue message for later
      this.messageQueue.push({ event, data });
      return;
    }

    this.socket.emit(event, data);
    this.stats.messagesSent++;
  }

  /**
   * Send message with callback
   */
  sendWithCallback(event, data = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit(event, data, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Register a network entity
   */
  registerNetworkEntity(entity) {
    if (!entity.networkId) {
      console.warn('Entity does not have a networkId');
      return;
    }

    this.networkEntities.set(entity.networkId, entity);
  }

  /**
   * Unregister a network entity
   */
  unregisterNetworkEntity(entity) {
    if (!entity.networkId) return;
    this.networkEntities.delete(entity.networkId);
  }

  /**
   * Handle entity update from server
   */
  _handleEntityUpdate(data) {
    const entity = this.networkEntities.get(data.entityId);
    
    if (entity && entity.deserialize) {
      entity.deserialize(data.state);
    }

    this.emit('entityUpdated', data);
  }

  /**
   * Process queued messages
   */
  _processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { event, data } = this.messageQueue.shift();
      this.send(event, data);
    }
  }

  /**
   * Start ping interval
   */
  _startPingInterval() {
    setInterval(() => {
      if (this.isConnected) {
        this.lastPingTime = Date.now();
        this.socket.emit('ping');
      }
    }, 5000);
  }

  /**
   * Update network manager
   */
  update(deltaTime) {
    // Update network-related logic
    this.emit('networkUpdate', { deltaTime });
  }

  /**
   * Get current latency
   */
  getLatency() {
    return this.latency;
  }

  /**
   * Get room players
   */
  getRoomPlayers() {
    return Array.from(this.roomPlayers.values());
  }

  /**
   * Get room player by ID
   */
  getRoomPlayer(playerId) {
    return this.roomPlayers.get(playerId);
  }

  /**
   * Check if in room
   */
  isInRoom() {
    return this.currentRoom !== null;
  }

  /**
   * Get current room
   */
  getCurrentRoom() {
    return this.currentRoom;
  }

  /**
   * Dispose and cleanup
   */
  dispose() {
    this.disconnect();
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket = null;
    }

    this.messageQueue = [];
    this.networkEntities.clear();
    this.roomPlayers.clear();
    
    this.removeAllListeners();
  }
}

