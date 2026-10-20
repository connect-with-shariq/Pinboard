import { io } from "socket.io-client";

// One shared connection for the whole app, created after login.
let socket = null;

export function connectSocket() {
  if (!socket) {
    socket = io({
      withCredentials: true,
      transports: ["websocket"], // no sticky sessions needed behind a load balancer
    });
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
