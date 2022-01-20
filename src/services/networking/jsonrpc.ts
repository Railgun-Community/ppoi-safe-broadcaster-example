/* eslint-disable no-param-reassign */
import debug from 'debug';
import { Client, Server } from 'rpc-websockets';

const dbg = debug('delayer:jsonrpc');

export const server = new Server({ host: 'localhost', port: 8081 });
export const client = new Client('ws://localhost:8081');

const greet = ({ name }) => `hello, ${name}`;
server.register('greet', greet);

server.on('socket-error', (socket, error) => {
  dbg('jsonrpc websocket server error', error.message);
});

server.on('listening', (event) => {
  dbg('jsonrpc websocket server listening');
});

client.on('error', (error) => {
  dbg(error.message);
});
client.on('open', (event) => {
  dbg('jsonrpc websocket client connected');
});
