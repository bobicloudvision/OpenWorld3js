import React, { useRef, useEffect } from 'react'
import { io } from 'socket.io-client'
import { me as fetchMe, logout as playerLogout } from './services/authService'
import './App.css'
import './components/GameUI.css'
import AuthOverlay from './components/AuthOverlay'
import HeroSelection from './components/HeroSelection'
import GameplayScene from './components/GameplayScene'

export default function App() {
  const playerPositionRef = React.useRef([0, 0, 0]);
  const [authOpen, setAuthOpen] = React.useState(false)
  const [player, setPlayer] = React.useState(null)
  const socketRef = React.useRef(null)
  const [socketReady, setSocketReady] = React.useState(false)
  const [playerHeroes, setPlayerHeroes] = React.useState([])
  const [availableHeroes, setAvailableHeroes] = React.useState([])
  const [loadingHeroes, setLoadingHeroes] = React.useState(false)
  useEffect(() => {
    // Validate stored token on load (non-blocking, logs only)
    fetchMe().then((me) => {
      if (me) {
        console.log('Authenticated player:', me);
        setPlayer(me)
      } else {
        console.log('No valid player session');
        setAuthOpen(true)
      }
    }).catch(() => { console.log('Auth check failed'); setAuthOpen(true) });
  }, []);

  // Connect to socket server when authenticated
  useEffect(() => {
    if (!player) {
      // If logging out or not authenticated, ensure socket is closed
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketReady(false);
      return;
    }

    setSocketReady(false);
    const token = localStorage.getItem('playerToken');
    const socket = io('http://localhost:6060', { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('auth', { token });
    });

    socket.on('auth:ok', ({ player: socketPlayer }) => {
      // Keep frontend player snapshot in sync with backend-socket
      setPlayer(socketPlayer);
      setSocketReady(true);
      socket.emit('get:player');
      // Fetch heroes when authenticated
      socket.emit('get:player:heroes');
      socket.emit('get:heroes:available');
    });

    socket.on('player', (socketPlayer) => {
      if (socketPlayer) setPlayer(socketPlayer);
    });

    socket.on('player:heroes', (heroes) => {
      setPlayerHeroes(heroes || []);
      setLoadingHeroes(false);
    });

    socket.on('heroes:available', (heroes) => {
      setAvailableHeroes(heroes || []);
    });

    // Handle hero selection response
    socket.on('hero:set:active:ok', ({ player: updatedPlayer }) => {
      setPlayer(updatedPlayer);
      // Refresh heroes list
      socket.emit('get:player:heroes');
    });

    socket.on('auth:error', (err) => {
      console.error('Socket auth failed', err);
      setSocketReady(false);
    });

    socket.on('disconnect', () => {
      setSocketReady(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [!!player]);
  
  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
    { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'run', keys: ['Shift'] },
    { name: 'attack', keys: ['KeyF'] },
    { name: 'magic1', keys: ['Digit1'] },
    { name: 'magic2', keys: ['Digit2'] },
    { name: 'magic3', keys: ['Digit3'] },
    { name: 'magic4', keys: ['Digit4'] },
  ]
  return (
    <>
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 100 }}>
      {player ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#e5e7eb', fontSize: 12 }}>Hi, {player.name}</span>
          <button
            onClick={async () => { await playerLogout(); if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; } setPlayer(null); setAuthOpen(true); }}
            style={{ padding: '6px 10px', fontSize: 12, background: '#374151', color: '#e5e7eb', border: '1px solid #4b5563', borderRadius: 6 }}
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAuthOpen(true)}
          style={{ padding: '8px 12px', fontSize: 12, background: '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}
        >
          Login / Sign Up
        </button>
      )}
    </div>
    <AuthOverlay
      open={authOpen}
      onClose={() => setAuthOpen(false)}
      onAuthenticated={(p) => { setPlayer(p); setAuthOpen(false); }}
    />
    {/* <GameInstructions /> */}
    {player && !socketReady && (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', zIndex: 50 }}>
        <div style={{ padding: '12px 16px', background: '#111827', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 8, fontSize: 13 }}>
          Connecting to game server...
        </div>
      </div>
    )}
    {player && socketReady && (
      <>
        {!player.active_hero_id ? (
          <HeroSelection
            player={player}
            playerHeroes={playerHeroes}
            availableHeroes={availableHeroes}
            socket={socketRef.current}
            onHeroSelected={(updatedPlayer) => {
              setPlayer(updatedPlayer);
            }}
            onHeroesUpdate={(updatedPlayerHeroes, updatedAvailableHeroes) => {
              setPlayerHeroes(updatedPlayerHeroes);
              setAvailableHeroes(updatedAvailableHeroes);
            }}
          />
        ) : (
          <GameplayScene
            playerPositionRef={playerPositionRef}
            keyboardMap={keyboardMap}
          />
        )}
      </>
    )}
      </>
  )
}
