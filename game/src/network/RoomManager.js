import EventEmitter from 'eventemitter3';

/**
 * Room Manager
 * High-level room management with matchmaking support
 */
export class RoomManager extends EventEmitter {
  constructor(networkManager) {
    super();
    
    this.networkManager = networkManager;
    this.availableRooms = [];
    this.currentRoom = null;

    // Setup network event listeners
    this._setupNetworkListeners();
  }

  /**
   * Setup network event listeners
   */
  _setupNetworkListeners() {
    this.networkManager.on('roomJoined', (data) => {
      this.currentRoom = data.room;
      this.emit('joined', data);
    });

    this.networkManager.on('roomLeft', (data) => {
      this.currentRoom = null;
      this.emit('left', data);
    });

    this.networkManager.on('playerJoined', (data) => {
      this.emit('playerJoined', data);
    });

    this.networkManager.on('playerLeft', (data) => {
      this.emit('playerLeft', data);
    });
  }

  /**
   * Create a new room
   */
  async createRoom(config = {}) {
    const roomData = {
      name: config.name || `Room ${Date.now()}`,
      maxPlayers: config.maxPlayers || 10,
      isPrivate: config.isPrivate || false,
      password: config.password || null,
      gameMode: config.gameMode || 'default',
      map: config.map || 'default',
      metadata: config.metadata || {}
    };

    return new Promise((resolve, reject) => {
      this.networkManager.socket.emit('room:create', roomData, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          this.currentRoom = response.room;
          resolve(response.room);
        }
      });
    });
  }

  /**
   * Join a room by ID
   */
  async joinRoom(roomId, password = null) {
    return new Promise((resolve, reject) => {
      this.networkManager.socket.emit('room:join', { 
        roomId, 
        password 
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          this.currentRoom = response.room;
          resolve(response.room);
        }
      });
    });
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    if (!this.currentRoom) {
      console.warn('Not in a room');
      return;
    }

    this.networkManager.leaveRoom();
  }

  /**
   * Quick match - find and join an available room
   */
  async quickMatch(filters = {}) {
    const rooms = await this.networkManager.getRooms({
      isPrivate: false,
      hasSpace: true,
      ...filters
    });

    if (rooms.length === 0) {
      // No rooms available, create one
      return await this.createRoom({
        name: 'Quick Match Room',
        maxPlayers: filters.maxPlayers || 10,
        gameMode: filters.gameMode || 'default'
      });
    }

    // Join the first available room
    return await this.joinRoom(rooms[0].id);
  }

  /**
   * Get list of available rooms
   */
  async listRooms(filters = {}) {
    this.availableRooms = await this.networkManager.getRooms(filters);
    this.emit('roomListUpdated', this.availableRooms);
    return this.availableRooms;
  }

  /**
   * Refresh room list
   */
  async refreshRooms(filters = {}) {
    return await this.listRooms(filters);
  }

  /**
   * Get current room info
   */
  getCurrentRoom() {
    return this.currentRoom;
  }

  /**
   * Get room players
   */
  getRoomPlayers() {
    return this.networkManager.getRoomPlayers();
  }

  /**
   * Check if in a room
   */
  isInRoom() {
    return this.currentRoom !== null;
  }

  /**
   * Update room settings (host only)
   */
  updateRoomSettings(settings) {
    this.networkManager.send('room:updateSettings', settings);
  }

  /**
   * Kick player (host only)
   */
  kickPlayer(playerId) {
    this.networkManager.send('room:kickPlayer', { playerId });
  }

  /**
   * Transfer host (host only)
   */
  transferHost(playerId) {
    this.networkManager.send('room:transferHost', { playerId });
  }

  /**
   * Start game (host only)
   */
  startGame(gameConfig = {}) {
    this.networkManager.send('room:startGame', gameConfig);
  }

  /**
   * Dispose
   */
  dispose() {
    this.currentRoom = null;
    this.availableRooms = [];
    this.removeAllListeners();
  }
}

