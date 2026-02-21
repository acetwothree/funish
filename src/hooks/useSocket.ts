import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const [playerId] = useState(() => {
    const saved = sessionStorage.getItem('funish_player_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('funish_player_id', newId);
    return newId;
  });

  useEffect(() => {
    if (!socket) {
      // Connect to the same server in both dev and production
      socket = io('/', {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true
      });
    }

    const onConnect = () => {
      console.log('Socket connected:', socket?.id);
      setConnected(true);
    };
    
    const onDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    if (socket.connected) onConnect();

    return () => {
      socket?.off('connect', onConnect);
      socket?.off('disconnect', onDisconnect);
      socket?.off('connect_error', onConnectError);
    };
  }, []);

  return { socket, connected, playerId };
};
