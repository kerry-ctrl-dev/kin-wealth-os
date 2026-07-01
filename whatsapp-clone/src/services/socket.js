import io from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const on = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

export const off = (event) => {
  if (socket) {
    socket.off(event);
  }
};

export const emit = (event, data) => {
  if (socket) {
    socket.emit(event, data);
  }
};
