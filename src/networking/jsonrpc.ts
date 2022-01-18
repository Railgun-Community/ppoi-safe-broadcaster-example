/* eslint-disable no-param-reassign */
import { Client as WebSocket, Server as WebSocketServer } from 'rpc-websockets';

const { log } = console;
export const server = new WebSocketServer({ host: 'localhost', port: 8081 });
export const client = new WebSocket('ws://localhost:8081');

const greet = ({ name }) => `hello, ${name}`;
server.register('greet', greet);

server.on('socket-error', (socket, error) => {
  log('jsonrpc websocket server error', error.message);
});

server.on('listening', (event) => {
  log('jsonrpc websocket server listening');
});

client.on('error', (error) => {
  log(error.message);
});
client.on('open', async () => {
  log('jsonrpc websocket client connect');
  // @todo `this` is definitely WebSocket; how to let typescript know?
  // log(`jsonrpc websocket client connected to ${this.address}`);
});
