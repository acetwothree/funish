import { useState, useEffect } from 'react';

export const useSocket = () => {
  const [connected] = useState(false);
  const [playerId] = useState(() => {
    const saved = sessionStorage.getItem('funish_player_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('funish_player_id', newId);
    return newId;
  });

  // Mock socket object for now (no backend connection)
  const mockSocket = {
    emit: (event: string, data: any) => {
      console.log('Mock emit:', event, data);
    },
    on: (event: string, callback: Function) => {
      console.log('Mock on:', event);
    },
    once: (event: string, callback: Function) => {
      console.log('Mock once:', event);
      // Simulate immediate response for create-lobby
      if (event === 'lobby-created') {
        setTimeout(() => callback('TEST'), 100);
      }
    },
    connected: false,
    id: playerId
  };

  return { socket: mockSocket, connected, playerId };
};
