import io from "socket.io-client";

export let socket;

export function init() {
  console.log("Initializing socket connection...");
  socket = io("http://192.168.100.194:3001", {
    transports: ["websocket"],
  });
}

export function isConnected() {
  return socket && socket.connected;
}
