import io from "socket.io-client";

export let socket;

export function init() {
  console.log("Initializing socket connection...");
  socket = io("http://54.179.190.85:3001", {
    transports: ["websocket"],
  });
}

export function isConnected() {
  return socket && socket.connected;
}
